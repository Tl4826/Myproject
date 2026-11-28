'use client';

import { useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function GuestLayout({ children }) {
    const { isLoggedIn, navigate } = useApp();

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/home', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    if (isLoggedIn) return null;

    return children;
}
