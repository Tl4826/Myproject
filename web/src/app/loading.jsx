export default function Loading() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center"
        >
            <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <p className="text-xs font-extrabold text-slate-600">Đang tải giao diện NutriVN...</p>
        </div>
    );
}
