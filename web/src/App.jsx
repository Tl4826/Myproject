import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import OnboardModal from './components/OnboardModal.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import DiaryPage from './pages/DiaryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';

// Mỗi màn hình = 1 URL (HashRouter), ví dụ: /#/login, /#/home
function AppRoutes() {
    const { toast, isLoggedIn, isOnboardOpen } = useApp();
    const guestOnly = page => isLoggedIn ? <Navigate to="/home" replace /> : page;   // đã đăng nhập thì vào thẳng /home

    return (
        <div className={`min-h-screen bg-slate-50 ${isLoggedIn ? 'pb-12' : ''}`}>
            <Routes>
                <Route path="/" element={guestOnly(<LandingPage />)} />
                <Route path="/login" element={guestOnly(<LoginPage />)} />
                <Route path="/dangki" element={guestOnly(<RegisterPage />)} />
                <Route element={isLoggedIn ? <Layout /> : <Navigate to="/login" replace />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/diary" element={<DiaryPage />} />
                    <Route path="/baocao" element={<ReportsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {isLoggedIn && isOnboardOpen && <OnboardModal />}

            {toast && (
                <div className="fixed bottom-24 inset-x-0 flex justify-center z-[60] pointer-events-none">
                    <div className="fade bg-slate-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg">{toast}</div>
                </div>
            )}
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppRoutes />
        </AppProvider>
    );
}
