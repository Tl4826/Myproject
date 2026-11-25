'use client';

import { useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function NotFound() {
    const { navigate } = useApp();

    useEffect(() => {
        navigate('/', { replace: true });
    }, [navigate]);

    return null;
}
