import { tilt } from '../lib/data.js';
import FruitScene from '../components/FruitScene.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function LandingPage() {
    const { navigate } = useApp();

    return (
        <section onMouseMove={tilt} className="relative min-h-screen overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-400 text-white">
            <div className="landing-scene absolute inset-y-0 right-0 w-full md:w-3/5 opacity-50 md:opacity-100"><FruitScene /></div>
            <div className="relative z-10 flex items-center justify-between px-6 py-5">
                <span className="text-xl font-black tracking-tight">NutriVN</span>
                <button onClick={() => navigate('/login')} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 text-sm font-bold">👤 Đăng nhập</button>
            </div>
            <div className="relative z-10 flex items-center px-6 md:px-16 min-h-[calc(100vh-76px)]">
                <div className="max-w-xl space-y-6">
                    <h1 className="text-4xl md:text-6xl font-black leading-tight">
                        Ứng dụng theo dõi<br />
                        <span className="inline-block bg-white text-emerald-700 px-3 py-1 rounded-2xl my-1">dinh dưỡng</span><br />
                        bằng ảnh món ăn
                    </h1>
                    <p className="text-base md:text-lg text-white/90 max-w-md">Chụp một bức ảnh, NutriVN nhận diện món ăn và tính calo, protein, carbs, fat giúp bạn ăn uống tốt hơn mỗi ngày.</p>
                    <button onClick={() => navigate('/dangki')} className="bg-white text-emerald-700 font-black text-sm md:text-base px-8 py-4 rounded-full shadow-xl hover:bg-emerald-50 flex items-center gap-2">BẮT ĐẦU MIỄN PHÍ <span>›</span></button>
                    <p className="text-xs text-white/80">Đã có tài khoản? <button onClick={() => navigate('/login')} className="font-black underline">Đăng nhập</button></p>
                </div>
            </div>
        </section>
    );
}
