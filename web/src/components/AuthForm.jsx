'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID, tilt, glassInput } from '../lib/data.js';
import FruitScene from './FruitScene.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function AuthForm({ mode }) {
    const {
        navigate, socialLogin, showPw, setShowPw, rememberMe, setRememberMe,
        authName, setAuthName, userEmail, setUserEmail, handleAuthSubmit, fbLogin,
        authPassword, setAuthPassword,
    } = useApp();

    const [showForgotHelp, setShowForgotHelp] = useState(false);
    const [googleLoadFailed, setGoogleLoadFailed] = useState(false);

    const hasGoogle = Boolean(GOOGLE_CLIENT_ID);
    const hasFacebook = Boolean(FACEBOOK_APP_ID);
    const hasSocial = hasGoogle || hasFacebook;

    useEffect(() => {
        setShowForgotHelp(false);
    }, [mode]);

    // Esc: quay về trang giới thiệu
    useEffect(() => {
        const h = e => { if (e.key === 'Escape') navigate('/'); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [navigate]);

    // Google trả ID token cho server kiểm tra chữ ký; frontend không tự xác thực JWT.
    useEffect(() => {
        if (!hasGoogle) return;
        let attempts = 0;
        let timeout;
        setGoogleLoadFailed(false);
        const start = () => {
            if (!window.google?.accounts?.id) {
                if (attempts++ < 30) {
                    timeout = setTimeout(start, 250);
                } else {
                    setGoogleLoadFailed(true);
                }
                return;
            }
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: r => { if (r?.credential) socialLogin('google', r.credential); }
            });
            const node = document.getElementById('g-btn');
            if (node) {
                window.google.accounts.id.renderButton(node, {
                    theme: 'outline', size: 'large', width: 280, text: 'continue_with'
                });
            }
        };
        start();
        return () => clearTimeout(timeout);
    }, [hasGoogle]);

    return (
        <div onMouseMove={tilt} className="fade fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-500">
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -top-24 -left-24 w-80 h-80 bg-lime-300/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 -right-24 w-96 h-96 bg-teal-300/40 rounded-full blur-3xl"></div>
            </div>
            <FruitScene />
            <button type="button" onClick={() => navigate('/')} className="absolute top-4 left-4 z-10 text-white/90 hover:text-white font-bold text-sm">← Trang chủ</button>
            <div className="relative min-h-full flex items-center justify-center p-5 pt-14">
                <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/30 rounded-[2rem] shadow-2xl p-7 space-y-5 text-white">
                    <div className="text-center space-y-1">
                        <h2 className="text-3xl font-black">{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h2>
                        <p className="text-sm text-white/80">{mode === 'login' ? 'Đăng nhập để tiếp tục với NutriVN' : 'Đăng ký để theo dõi dinh dưỡng mỗi ngày'}</p>
                    </div>

                    <form onSubmit={e => handleAuthSubmit(e, mode)} className="space-y-3.5 text-sm">
                        {mode === 'register' && (
                            <div className="space-y-1">
                                <label htmlFor="auth-name" className="block text-xs font-bold text-white/95">
                                    Họ và tên <span className="text-emerald-200" aria-hidden="true">*</span>
                                </label>
                                <input
                                    id="auth-name"
                                    type="text"
                                    value={authName}
                                    onChange={e => setAuthName(e.target.value)}
                                    placeholder="Họ và tên"
                                    autoComplete="name"
                                    required
                                    className={glassInput}
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="auth-email" className="block text-xs font-bold text-white/95">
                                Email <span className="text-emerald-200" aria-hidden="true">*</span>
                            </label>
                            <input
                                id="auth-email"
                                type="email"
                                value={userEmail}
                                onChange={e => setUserEmail(e.target.value)}
                                placeholder="Email"
                                autoComplete="email"
                                required
                                className={glassInput}
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="auth-password" className="block text-xs font-bold text-white/95">
                                    Mật khẩu <span className="text-emerald-200" aria-hidden="true">*</span>
                                </label>
                                {mode === 'register' && (
                                    <span id="auth-password-hint" className="text-[11px] font-semibold text-white/80">
                                        Tối thiểu 6 ký tự
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    id="auth-password"
                                    type={showPw ? 'text' : 'password'}
                                    value={authPassword}
                                    onChange={e => setAuthPassword(e.target.value)}
                                    placeholder="Mật khẩu"
                                    required
                                    minLength={6}
                                    aria-describedby={mode === 'register' ? 'auth-password-hint' : undefined}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    className={glassInput + ' pr-11'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    aria-label="Hiện/ẩn mật khẩu"
                                    aria-pressed={showPw}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    {showPw ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {mode === 'login' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 accent-white" />
                                        Ghi nhớ đăng nhập
                                    </label>
                                    <button
                                        type="button"
                                        aria-expanded={showForgotHelp}
                                        aria-controls="forgot-password-help"
                                        onClick={() => setShowForgotHelp(open => !open)}
                                        className="hover:underline font-bold"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                </div>

                                {showForgotHelp && (
                                    <div
                                        id="forgot-password-help"
                                        role="region"
                                        aria-label="Hướng dẫn khôi phục mật khẩu"
                                        className="fade rounded-2xl bg-slate-900/45 border border-white/25 p-3.5 text-xs space-y-2"
                                    >
                                        <div className="font-extrabold text-white">🔐 Hỗ trợ khôi phục mật khẩu</div>
                                        <p className="text-white/90 leading-relaxed">
                                            Tính năng tự đặt lại mật khẩu qua email đang được phát triển. Nếu bạn quên mật khẩu, hãy gửi yêu cầu kèm email đã đăng ký qua trang Liên hệ để đội ngũ NutriVN hỗ trợ.
                                        </p>
                                        <div className="flex items-center justify-between gap-2 pt-0.5">
                                            <Link
                                                href="/contact"
                                                className="inline-flex items-center gap-1 rounded-xl bg-white text-emerald-800 px-3 py-1.5 font-extrabold hover:bg-emerald-50"
                                            >
                                                Đến trang Liên hệ →
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setShowForgotHelp(false)}
                                                className="text-white/80 hover:text-white font-bold px-2 py-1"
                                            >
                                                Đóng
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button type="submit" className="w-full py-3.5 bg-white/90 hover:bg-white text-slate-900 font-black rounded-2xl shadow-lg">
                            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                        </button>
                    </form>

                    {hasSocial ? (
                        <div className="space-y-2.5 text-sm">
                            <div className="flex items-center text-[11px] text-white/70 font-bold">
                                <span className="flex-1 border-t border-white/30"></span>
                                <span className="px-3">HOẶC</span>
                                <span className="flex-1 border-t border-white/30"></span>
                            </div>
                            {hasGoogle && (
                                googleLoadFailed ? (
                                    <p role="status" className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-center text-[11px] text-white/90">
                                        Đăng nhập Google tạm thời không khả dụng. Vui lòng tiếp tục bằng Email ở trên.
                                    </p>
                                ) : (
                                    <div id="g-btn" className="flex justify-center"></div>
                                )
                            )}
                            {hasFacebook && (
                                <button type="button" onClick={fbLogin} className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe0] text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
                                    Tiếp tục với Facebook
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-[11px] text-white/85 leading-relaxed">
                            Tài khoản email được xác minh bảo mật trên máy chủ. Đăng nhập nhanh bằng Google/Facebook sẽ mở khi hoàn tất cấu hình OAuth.
                        </p>
                    )}

                    <p className="text-center text-xs text-white/80">
                        {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                        <button type="button" onClick={() => navigate(mode === 'login' ? '/dangki' : '/login')} className="font-black text-white hover:underline">{mode === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
