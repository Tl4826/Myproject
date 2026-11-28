'use client';

import { useEffect } from 'react';
import Layout from '../../components/Layout.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function ProtectedShell({ children }) {
    const { isLoggedIn, navigate } = useApp();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    if (!isLoggedIn) return null;

    return <Layout>{children}</Layout>;
}
