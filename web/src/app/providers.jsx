'use client';

import OnboardModal from '../components/OnboardModal.jsx';
import { AppProvider, useApp } from '../context/AppContext.jsx';

function AppShell({ children }) {
    const { toast, isLoggedIn, isOnboardOpen, authChecking } = useApp();

    if (authChecking) {
        return (
            <div role="status" className="min-h-screen flex items-center justify-center">
                Đang xác minh phiên đăng nhập...
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isLoggedIn ? 'pb-12' : 'bg-slate-50'}`}>
            {children}

            {isLoggedIn && isOnboardOpen && <OnboardModal />}

            {toast && (
                <div className="fixed bottom-24 inset-x-0 flex justify-center z-[60] pointer-events-none">
                    <div className="fade bg-slate-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg">
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Providers({ children }) {
    return (
        <AppProvider>
            <AppShell>{children}</AppShell>
        </AppProvider>
    );
}
