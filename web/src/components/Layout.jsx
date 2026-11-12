import { NavLink, Outlet, useLocation } from 'react-router-dom';
import TeamMembersModal from './TeamMembersModal.jsx';
import { useApp } from '../context/AppContext.jsx';

const tabCls = ({ isActive }) => `px-3 py-1.5 rounded-xl transition-all active:scale-[.97] ${isActive ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`;

export default function Layout() {
    const { pathname } = useLocation();
    const { navigate, isLoggedIn, userEmail, isTeamOpen, setIsTeamOpen, logout } = useApp();

    return (
        <>
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-sm">
                <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                            <div className="w-9 h-9 overflow-hidden rounded-xl bg-emerald-600 shadow-sm">
                                <img
                                    src="https://i.pinimg.com/originals/ab/9e/c8/ab9ec8e1b0a77576fa6f5f377b2038a3.jpg"
                                    alt="Logo NutriVN"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div>
                                <h1 className="font-extrabold text-slate-900 text-base leading-tight">NutriVN</h1>
                                <p className="text-[10px] text-emerald-600 font-bold">Web Platform AI Việt Nam</p>
                            </div>
                        </div>
                        <button onClick={isLoggedIn ? logout : () => navigate('/login')} className="sm:hidden px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
                            {isLoggedIn ? '⏻ Đăng xuất' : '🔑 Đăng Nhập'}
                        </button>
                    </div>

                    <nav className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl text-xs font-extrabold w-full sm:w-auto justify-between sm:justify-start">
                        <NavLink to="/home" className={tabCls}>🏠 Trang chủ</NavLink>
                        <NavLink to="/diary" className={tabCls}>📖 Nhật ký</NavLink>
                        <NavLink to="/baocao" className={tabCls}>📊 Báo cáo</NavLink>
                    </nav>

                    <button onClick={isLoggedIn ? logout : () => navigate('/login')} className="hidden sm:block px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all">
                        {isLoggedIn ? `👤 ${userEmail || 'Tài khoản'} · Đăng xuất` : '🔑 Đăng Nhập / Đăng Ký'}
                    </button>
                </div>
            </header>

            <section className="bg-slate-900 text-white py-4 px-4 text-center">
                <div className="max-w-xl mx-auto space-y-1">
                    <span className="inline-block bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-0.5 rounded-full text-[10px] font-bold">⚡ Nền Tảng Web Dinh Dưỡng</span>
                    <h2 className="text-lg font-black leading-tight">Chụp Ảnh Món Ăn - Tính Calo Tức Thì</h2>
                    <p className="text-[11px] text-slate-300">Nhận diện chính xác khẩu phần & dinh dưỡng món ăn Việt</p>
                </div>
            </section>

            <main key={pathname} className="fade max-w-xl mx-auto px-3 pt-4 space-y-4">
                <Outlet />
            </main>

            <footer className="max-w-xl mx-auto mt-8 px-4 py-4 border-t border-slate-200 text-center space-y-2 text-xs">
                <div className="flex justify-center space-x-4 text-slate-500 font-bold">
                    <a href="https://www.facebook.com/huy.vo.59895?locale=vi_VN" target="_blank" rel="noreferrer" className="hover:text-emerald-600">Facebook</a>
                    <a href="https://zalo.me/0905467532" target="_blank" rel="noreferrer" className="hover:text-emerald-600">Zalo</a>
                    <a href="https://github.com/Huysadboy2610" target="_blank" rel="noreferrer" className="hover:text-emerald-600">GitHub</a>
                    <button onClick={() => setIsTeamOpen(true)} className="hover:text-emerald-600 cursor-pointer">Ban Lãnh Đạo</button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">© 2026 NutriVN FoodTech AI. All rights reserved.</p>
            </footer>

            {isTeamOpen && (
                <TeamMembersModal onClose={() => setIsTeamOpen(false)} />
            )}
        </>
    );
}
