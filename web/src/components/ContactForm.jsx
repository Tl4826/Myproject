'use client';

import { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOPICS = [
    ['feedback', '💡 Góp ý tính năng & giao diện'],
    ['bug', '🐛 Báo lỗi hệ thống'],
    ['dish', '🍜 Đề xuất thêm món ăn Việt mới'],
    ['other', '🤝 Hợp tác & Liên hệ khác'],
];

export default function ContactForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [topic, setTopic] = useState('feedback');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(null);

    const handleSubmit = e => {
        e.preventDefault();
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        const cleanMessage = message.trim();

        if (cleanName.length < 2) {
            setError('Vui lòng nhập họ và tên (ít nhất 2 ký tự).');
            return;
        }
        if (!EMAIL_RE.test(cleanEmail)) {
            setError('Vui lòng nhập địa chỉ email hợp lệ.');
            return;
        }
        if (cleanMessage.length < 10) {
            setError('Nội dung tin nhắn cần tối thiểu 10 ký tự để chúng tôi hỗ trợ chính xác hơn.');
            return;
        }

        setError('');
        const topicLabel = TOPICS.find(([k]) => k === topic)?.[1] || topic;
        setSubmitted({
            name: cleanName,
            email: cleanEmail,
            topicLabel,
            sentAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        });
        setName('');
        setEmail('');
        setMessage('');
    };

    const inputCls =
        'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400';

    if (submitted) {
        return (
            <div
                role="status"
                className="rounded-3xl bg-white border border-emerald-200 p-6 sm:p-8 shadow-sm text-center space-y-4"
            >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 text-3xl flex items-center justify-center">
                    ✅
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900">Đã tiếp nhận tin nhắn!</h2>
                    <p className="text-xs text-slate-600">
                        Cảm ơn <span className="font-bold text-slate-900">{submitted.name}</span>. Đội ngũ NutriVN đã ghi nhận yêu cầu lúc {submitted.sentAt} và sẽ phản hồi qua{' '}
                        <span className="font-bold text-emerald-700">{submitted.email}</span>.
                    </p>
                </div>
                <div className="inline-block rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800">
                    Chủ đề: {submitted.topicLabel}
                </div>
                <div>
                    <button
                        type="button"
                        onClick={() => setSubmitted(null)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                    >
                        Gửi tin nhắn khác
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
        >
            <div>
                <h2 className="text-lg font-black text-slate-900">✉️ Gửi tin nhắn cho NutriVN</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Mọi góp ý về trải nghiệm, dữ liệu dinh dưỡng hoặc lỗi kỹ thuật đều được đội ngũ phản hồi trong 24 giờ.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label htmlFor="contact-name" className="block text-xs font-bold text-slate-700">
                        Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        required
                        className={inputCls}
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="contact-email" className="block text-xs font-bold text-slate-700">
                        Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ban@example.com"
                        required
                        className={inputCls}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor="contact-topic" className="block text-xs font-bold text-slate-700">
                    Chủ đề liên hệ
                </label>
                <select
                    id="contact-topic"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className={inputCls}
                >
                    {TOPICS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label htmlFor="contact-message" className="block text-xs font-bold text-slate-700">
                        Nội dung tin nhắn <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">{message.length}/1000</span>
                </div>
                <textarea
                    id="contact-message"
                    rows={5}
                    maxLength={1000}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Chia sẻ câu hỏi, góp ý hoặc mô tả lỗi bạn gặp phải..."
                    required
                    className={inputCls + ' resize-y'}
                />
            </div>

            {error && (
                <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-bold text-rose-700">
                    ⚠️ {error}
                </p>
            )}

            <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-sm"
            >
                GỬI LIÊN HỆ
            </button>
        </form>
    );
}
