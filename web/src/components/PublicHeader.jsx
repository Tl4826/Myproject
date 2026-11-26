'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext.jsx';

export default function PublicHeader() {
    const pathname = usePathname();
    const { isLoggedIn } = useApp();
    const homeHref = isLoggedIn ? '/home' : '/';

    const linkCls = active =>
        `px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
            active
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
        }`;

    return (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <Link href={homeHref} className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 overflow-hidden rounded-xl bg-emerald-600 shadow-sm shrink-0">
                        <img
                            src="https://i.pinimg.com/originals/ab/9e/c8/ab9ec8e1b0a77576fa6f5f377b2038a3.jpg"
                            alt="Logo NutriVN"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <span className="block font-black text-slate-900 text-base leading-tight">NutriVN</span>
                        <span className="block text-[10px] text-emerald-600 font-bold">Web Platform AI Việt Nam</span>
                    </div>
                </Link>

                <nav aria-label="Điều hướng chính" className="flex items-center gap-1 sm:gap-2">
                    <Link href={homeHref} className={linkCls(pathname === '/')}>
                        Trang chủ
                    </Link>
                    <Link
                        href="/about"
                        aria-current={pathname === '/about' ? 'page' : undefined}
                        className={linkCls(pathname === '/about')}
                    >
                        Giới thiệu
                    </Link>
                    <Link
                        href="/contact"
                        aria-current={pathname === '/contact' ? 'page' : undefined}
                        className={linkCls(pathname === '/contact')}
                    >
                        Liên hệ
                    </Link>
                </nav>

                <Link
                    href={isLoggedIn ? '/home' : '/login'}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                    {isLoggedIn ? '🏠 Vào ứng dụng' : '👤 Đăng nhập'}
                </Link>
            </div>
        </header>
    );
}
