"use client";

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { hydrateCart } from './slices/cartSlice';
import { hydrateWishlist } from './slices/wishlistSlice';
import { loginSuccess, logout, sessionRestoreFinished } from './slices/authSlice';

interface ReduxProviderProps {
    children: React.ReactNode;
}

/**
 * Restore the signed-in user after a refresh.
 *
 * Redux state is gone on every page load, but the access token survives in
 * localStorage — so without this the app looked logged-out on refresh and
 * bounced the user to /login. Exchange the saved token for the user once on
 * mount; if the token is stale the session is cleared properly instead.
 */
const restoreSession = async () => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('token');
    if (!token) {
        store.dispatch(sessionRestoreFinished());
        return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Try /auth/me with the current access token; if it's expired (401), silently
    // refresh once using the stored refresh token and retry — so a reload after the
    // 24h access token expires keeps the admin signed in instead of bouncing to login.
    const fetchMe = (t: string) => fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });

    try {
        let activeToken = token;
        let res = await fetchMe(activeToken);

        if (res.status === 401) {
            const refreshToken = window.localStorage.getItem('refreshToken');
            if (refreshToken) {
                const rf = await fetch(`${apiUrl}/auth/refresh-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ refreshToken }),
                });
                if (rf.ok) {
                    const newToken = (await rf.json())?.data?.accessToken;
                    if (newToken) {
                        activeToken = newToken;
                        window.localStorage.setItem('token', newToken);
                        res = await fetchMe(activeToken);
                    }
                }
            }
        }
        if (!res.ok) throw new Error('session expired');

        const json = await res.json();
        const u = json?.data;
        if (!u?._id) throw new Error('malformed profile');

        store.dispatch(loginSuccess({
            user: {
                id: u._id,
                name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                email: u.email,
                phone: u.phone || '',
                role: u.role || 'user',
                avatar: u.avatar || '',
            },
            token: activeToken,
        }));
    } catch {
        // Expired / revoked / unreachable — drop the dead tokens so the user gets
        // a clean login rather than a half-signed-in state.
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('refreshToken');
        store.dispatch(logout());
    }
};

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
    useEffect(() => {
        store.dispatch(hydrateCart());
        store.dispatch(hydrateWishlist());
        restoreSession();
    }, []);

    return <Provider store={store}>{children}</Provider>;
};
