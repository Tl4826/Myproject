'use client';

import Link from 'next/link';

export default function Error({ reset }) {
    return (
        <div
            role="alert"
            className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
        >
            <div className="max-w-md w-full rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-3xl">
                    ⚠️
                </div>
                <div className="space-y-1">
                    <h1 className="text-lg font-black text-slate-900">Đã có lỗi xảy ra</h1>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Ứng dụng gặp sự cố tạm thời khi hiển thị trang này. Bạn có thể thử tải lại hoặc quay về trang chủ.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                    >
                        Thử tải lại
                    </button>
                    <Link
                        href="/"
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
