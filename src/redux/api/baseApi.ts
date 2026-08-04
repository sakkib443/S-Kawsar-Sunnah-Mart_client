import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { RootState } from '../store';
import { logout, setToken } from '../slices/authSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

// ── Silent token refresh ──────────────────────────────────────────────
// The access token is short-lived (24h); the refresh token (stored at login)
// lasts longer. Instead of hard-logging-out on the first 401 — which dropped
// admins out of the panel mid-session and forced a re-login — we exchange the
// refresh token for a fresh access token and retry the request. Only if the
// refresh itself fails do we actually sign out.
//
// Single-flight: when many requests 401 at once (a dashboard fires several),
// only ONE refresh call runs; the rest await the same promise.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // also send the httpOnly refresh cookie if present
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        const newToken = json?.data?.accessToken;
        if (!newToken) return null;
        localStorage.setItem('token', newToken);
        return newToken;
    } catch {
        return null;
    }
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Access token likely expired — try a shared silent refresh, then retry.
        if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
        }
        const newToken = await refreshPromise;

        if (newToken) {
            api.dispatch(setToken(newToken));                 // so prepareHeaders uses it
            result = await rawBaseQuery(args, api, extraOptions); // retry original request
        }

        // Refresh unavailable/failed, or the retry still 401s → real sign-out.
        if (!newToken || (result.error && result.error.status === 401)) {
            api.dispatch(logout());
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/login')) {
                    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&expired=true`;
                }
            }
        }
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Stats', 'Orders', 'Products', 'Users', 'Analytics', 'PageContent', 'SiteContent', 'Categories', 'Payments', 'Shipping', 'Coupons', 'Reviews', 'Offers', 'Roles', 'Invoices', 'Returns', 'Notifications', 'Newsletter'],
    endpoints: () => ({}),
});
