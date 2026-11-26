import Link from 'next/link';
import PublicHeader from '../../components/PublicHeader.jsx';
import PublicFooter from '../../components/PublicFooter.jsx';
import ContactForm from '../../components/ContactForm.jsx';

export const metadata = {
    title: 'Liên hệ',
    description:
        'Liên hệ đội ngũ NutriVN để góp ý tính năng, báo lỗi hệ thống hoặc đề xuất món ăn Việt mới qua form trực tuyến, Zalo, Facebook và GitHub.',
};

const CHANNELS = [
    {
        icon: '💬',
        label: 'Zalo hỗ trợ nhanh',
        value: '0905 467 532',
        href: 'https://zalo.me/0905467532',
        external: true,
    },
    {
        icon: '📘',
        label: 'Facebook Fanpage / Admin',
        value: 'facebook.com/huy.vo.59895',
        href: 'https://www.facebook.com/huy.vo.59895?locale=vi_VN',
        external: true,
    },
    {
        icon: '💻',
        label: 'GitHub Repository (Báo lỗi & Issue)',
        value: 'github.com/Tl4826/Myproject',
        href: 'https://github.com/Tl4826/Myproject/issues',
        external: true,
    },
    {
        icon: '📧',
        label: 'Email hỗ trợ',
        value: 'support@nutrivn.vn',
        href: 'mailto:support@nutrivn.vn',
        external: false,
    },
];

export default function ContactPage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <PublicHeader />

            <main className="flex-1">
                <section className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white">
                    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14 space-y-3">
                        <span className="inline-block bg-white/15 border border-white/25 px-3 py-1 rounded-full text-xs font-extrabold">
                            📬 Liên hệ NutriVN
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                            Chúng tôi luôn sẵn sàng lắng nghe bạn
                        </h1>
                        <p className="text-sm text-emerald-50/95 max-w-2xl">
                            Có câu hỏi về dữ liệu dinh dưỡng, muốn đề xuất món ăn Việt mới hay góp ý cải thiện giao diện? Hãy gửi tin nhắn trực tiếp hoặc kết nối qua các kênh bên dưới.
                        </p>
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-4 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <aside className="lg:col-span-5 space-y-4">
                            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                                <h2 className="text-base font-black text-slate-900">📞 Kênh liên hệ chính thức</h2>
                                <div className="space-y-3">
                                    {CHANNELS.map(ch => (
                                        <a
                                            key={ch.label}
                                            href={ch.href}
                                            target={ch.external ? '_blank' : undefined}
                                            rel={ch.external ? 'noreferrer' : undefined}
                                            className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors"
                                        >
                                            <span className="text-xl leading-none mt-0.5">{ch.icon}</span>
                                            <div className="min-w-0">
                                                <div className="text-xs font-extrabold text-slate-900">{ch.label}</div>
                                                <div className="text-xs font-semibold text-emerald-700 truncate">{ch.value}</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 space-y-2 text-xs">
                                <div className="font-black text-emerald-900">⏰ Thời gian phản hồi</div>
                                <p className="text-emerald-800 leading-relaxed">
                                    Thứ 2 – Chủ nhật (08:00 – 21:00). Các vấn đề kỹ thuật có thể mở trực tiếp Issue trên GitHub để theo dõi tiến độ xử lý.
                                </p>
                                <div className="pt-1">
                                    <Link href="/about" className="font-extrabold text-emerald-700 underline hover:text-emerald-900">
                                        Tìm hiểu thêm về đội ngũ NutriVN →
                                    </Link>
                                </div>
                            </div>
                        </aside>

                        <div className="lg:col-span-7">
                            <ContactForm />
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
}
