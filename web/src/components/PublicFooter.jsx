import Link from 'next/link';

export default function PublicFooter() {
    return (
        <footer className="border-t border-slate-200 bg-white mt-12">
            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="text-center sm:text-left">
                    <div className="font-black text-slate-900">NutriVN FoodTech AI</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Nền tảng theo dõi dinh dưỡng & nhận diện món ăn Việt bằng AI.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 text-slate-600 font-bold">
                    <Link href="/" className="hover:text-emerald-600">Trang chủ</Link>
                    <Link href="/about" className="hover:text-emerald-600">Giới thiệu</Link>
                    <Link href="/contact" className="hover:text-emerald-600">Liên hệ</Link>
                    <a href="https://www.facebook.com/huy.vo.59895?locale=vi_VN" target="_blank" rel="noreferrer" className="hover:text-emerald-600">Facebook</a>
                    <a href="https://github.com/Tl4826/Myproject" target="_blank" rel="noreferrer" className="hover:text-emerald-600">GitHub</a>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">© 2026 NutriVN. All rights reserved.</p>
            </div>
        </footer>
    );
}
