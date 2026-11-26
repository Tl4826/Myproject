import Link from 'next/link';
import PublicHeader from '../../components/PublicHeader.jsx';
import PublicFooter from '../../components/PublicFooter.jsx';
import TeamGrid from '../../components/TeamGrid.jsx';

const HIGHLIGHTS = [
    {
        icon: '📸',
        title: 'Nhận diện AI 100 món ăn',
        desc: 'Mô hình Deep Learning (ONNX Food100) hỗ trợ nhận diện món ăn Việt Nam đặc trưng cùng món quốc tế phổ biến, hiển thị Top 3 dự đoán và cho phép người dùng xác nhận nhanh.',
    },
    {
        icon: '🧮',
        title: 'Lộ trình Calo & Macro cá nhân hóa',
        desc: 'Tính toán BMI theo chuẩn WHO châu Á - Thái Bình Dương, BMR/TDEE, phân bổ Protein, Carbs, Fat, mục tiêu nước uống và gợi ý vận động hằng ngày.',
    },
    {
        icon: '📊',
        title: 'Nhật ký & Báo cáo trực quan',
        desc: 'Ghi chép bữa sáng, trưa, xế, tối, ăn vặt kèm biểu đồ xu hướng 7 ngày để kiểm soát tiến độ tăng/giảm/giữ cân khoa học.',
    },
];

const STEPS = [
    ['01', 'Chụp hoặc tải ảnh món ăn', 'Mở camera ngay trên trình duyệt hoặc chọn ảnh sẵn có trong thư viện.'],
    ['02', 'AI phân tích & ước tính dinh dưỡng', 'Hệ thống trả về tên món, độ tin cậy, Top 3 gợi ý cùng thông số calo và macro.'],
    ['03', 'Lưu nhật ký & theo dõi mục tiêu', 'Cập nhật ngân sách calo trong ngày và xem báo cáo 7 ngày để điều chỉnh thực đơn.'],
];

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <PublicHeader />

            <main className="flex-1">
                <section className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white">
                    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-5">
                        <span className="inline-block bg-white/15 border border-white/25 px-3 py-1 rounded-full text-xs font-extrabold">
                            🌱 Về NutriVN
                        </span>
                        <h1 className="text-3xl sm:text-5xl font-black leading-tight max-w-3xl">
                            Theo dõi dinh dưỡng món ăn Việt thông minh hơn bằng AI
                        </h1>
                        <p className="text-sm sm:text-base text-emerald-50/95 max-w-2xl leading-relaxed">
                            NutriVN là nền tảng web dinh dưỡng được xây dựng cho người dùng Việt Nam, giúp ước tính năng lượng và thành phần dinh dưỡng từ ảnh chụp món ăn chỉ trong vài giây.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                href="/dangki"
                                className="px-6 py-3 rounded-2xl bg-white text-emerald-700 font-black text-xs sm:text-sm shadow-md hover:bg-emerald-50"
                            >
                                Bắt đầu miễn phí ›
                            </Link>
                            <Link
                                href="/contact"
                                className="px-6 py-3 rounded-2xl bg-white/15 border border-white/30 text-white font-extrabold text-xs sm:text-sm hover:bg-white/25"
                            >
                                Liên hệ đội ngũ
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-4 py-10 sm:py-12 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Giá trị cốt lõi của NutriVN</h2>
                        <p className="text-xs sm:text-sm text-slate-600">
                            Kết hợp thị giác máy tính (AI Vision) với bảng dinh dưỡng tham khảo và giao diện Next.js hiện đại.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {HIGHLIGHTS.map(item => (
                            <div
                                key={item.title}
                                className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-3"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl">
                                    {item.icon}
                                </div>
                                <h3 className="font-black text-base text-slate-900">{item.title}</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white border-y border-slate-200">
                    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Cách hoạt động chỉ với 3 bước</h2>
                            <p className="text-xs sm:text-sm text-slate-600">
                                Đơn giản hóa việc ghi nhật ký ăn uống để ai cũng có thể duy trì mỗi ngày.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {STEPS.map(([num, title, desc]) => (
                                <div key={num} className="rounded-3xl bg-slate-50 border border-slate-200 p-5 space-y-2">
                                    <span className="inline-block text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                        Bước {num}
                                    </span>
                                    <h3 className="font-extrabold text-sm text-slate-900">{title}</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-4 py-10 sm:py-12 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">👥 Đội ngũ phát triển</h2>
                        <p className="text-xs sm:text-sm text-slate-600">
                            Nhóm 1 — Web Design and Development (CSB25022), cùng xây dựng hệ sinh thái NutriVN.
                        </p>
                    </div>
                    <TeamGrid />
                </section>
            </main>

            <PublicFooter />
        </div>
    );
}
