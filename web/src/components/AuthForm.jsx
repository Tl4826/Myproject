import { useEffect } from 'react';
import { GOOGLE_CLIENT_ID, tilt, glassInput } from '../lib/data.js';
import FruitScene from './FruitScene.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function AuthForm({ mode }) {
    const {
        navigate, login, showPw, setShowPw, notify, rememberMe, setRememberMe,
        authName, setAuthName, userEmail, setUserEmail, handleAuthSubmit, fbLogin,
    } = useApp();

    // Esc: quay về trang giới thiệu
    useEffect(() => {
        const h = e => { if (e.key === 'Escape') navigate('/'); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    // Nút Google (chỉ vẽ khi đã điền GOOGLE_CLIENT_ID)
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !window.google) return;
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: r => {
            const p = JSON.parse(decodeURIComponent(escape(atob(r.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))));
            login({ email: p.email, name: p.name, provider: 'google' });
        } });
        google.accounts.id.renderButton(document.getElementById('g-btn'), { theme: 'outline', size: 'large', width: 280, text: 'continue_with' });
    }, []);

    return (
        <div onMouseMove={tilt} className="fade fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-500">
            <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-lime-300/40 rounded-full blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-0 -right-24 w-96 h-96 bg-teal-300/40 rounded-full blur-3xl"></div>
            <FruitScene />
            <button onClick={() => navigate('/')} className="absolute top-4 left-4 z-10 text-white/90 hover:text-white font-bold text-sm">← Trang chủ</button>
            <div className="relative min-h-full flex items-center justify-center p-5 pt-14">
                <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/30 rounded-[2rem] shadow-2xl p-7 space-y-5 text-white">
                    <div className="text-center space-y-1">
                        <h2 className="text-3xl font-black">{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h2>
                        <p className="text-sm text-white/80">{mode === 'login' ? 'Đăng nhập để tiếp tục với NutriVN' : 'Đăng ký để theo dõi dinh dưỡng mỗi ngày'}</p>
                    </div>

                    <form onSubmit={e => handleAuthSubmit(e, mode)} className="space-y-3 text-sm">
                        {mode === 'register' && <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Họ và tên" required className={glassInput} />}
                        <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="Email" required className={glassInput} />
                        <div className="relative">
                            <input type={showPw ? 'text' : 'password'} placeholder="Mật khẩu" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={glassInput + ' pr-11'} />
                            <button type="button" onClick={() => setShowPw(!showPw)} aria-label="Hiện/ẩn mật khẩu" className="absolute right-3 top-1/2 -translate-y-1/2">{showPw ? '🙈' : '👁️'}</button>
                        </div>
                        {mode === 'login' && (
                            <div className="flex items-center justify-between text-xs font-semibold">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 accent-white" />
                                    Ghi nhớ đăng nhập
                                </label>
                                <a href="#" onClick={e => e.preventDefault()} className="hover:underline">Quên mật khẩu?</a>
                            </div>
                        )}
                        <button type="submit" className="w-full py-3.5 bg-white/90 hover:bg-white text-slate-900 font-black rounded-2xl shadow-lg">
                            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                        </button>
                    </form>

                    <div className="space-y-2.5 text-sm">
                        <div className="flex items-center text-[11px] text-white/70 font-bold"><span className="flex-1 border-t border-white/30"></span><span className="px-3">HOẶC</span><span className="flex-1 border-t border-white/30"></span></div>
                        {GOOGLE_CLIENT_ID
                            ? <div id="g-btn" className="flex justify-center"></div>
                            : <button type="button" onClick={() => notify('Chưa điền GOOGLE_CLIENT_ID')} className="w-full py-3 bg-white/90 hover:bg-white text-slate-800 rounded-2xl font-bold flex items-center justify-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
                                Tiếp tục với Google
                            </button>}
                        <button type="button" onClick={fbLogin} className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe0] text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
                            Tiếp tục với Facebook
                        </button>
                    </div>

                    <p className="text-center text-xs text-white/80">
                        {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                        <button type="button" onClick={() => navigate(mode === 'login' ? '/dangki' : '/login')} className="font-black text-white hover:underline">{mode === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
