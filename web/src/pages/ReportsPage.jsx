import { useApp } from '../context/AppContext.jsx';

export default function ReportsPage() {
    const {
        navigate, targetCal, weeklyHistory, loggedDays, weekAvg, chartMax, savedWeeklyLogs,
        isWeeklySaved, handleSaveWeekToDevice,
    } = useApp();

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">📊 Biểu Đồ Xu Hướng Calo 7 Ngày</h3>
                        <p className="text-[10px] text-slate-500 font-bold">Hiển thị chuẩn lượng calo từng ngày</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full">
                        {loggedDays.length > 0 ? `TB: ${weekAvg} kcal/ngày` : 'Chưa có dữ liệu'}
                    </span>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">🎯 Mục tiêu {targetCal} kcal/ngày</span>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                            <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></i>Đạt</span>
                            <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-rose-400"></i>Vượt</span>
                        </div>
                    </div>
                    {loggedDays.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                            <div className="text-3xl" aria-hidden="true">📊</div>
                            <p className="mt-2 text-sm font-bold text-slate-700">
                                Chưa có dữ liệu trong 7 ngày gần nhất
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                Ghi lại món ăn để xem biểu đồ calo và mức trung bình của bạn.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/home')}
                                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                                📸 Đến trang quét món ăn
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative h-44">
                                <div
                                    className="absolute inset-x-0 z-10 border-t-2 border-dashed border-emerald-500 pointer-events-none"
                                    style={{ bottom: `${Math.min(targetCal / chartMax * 100, 100)}%` }}
                                ></div>

                                <div className="grid h-full grid-cols-7 items-end gap-2">
                                    {weeklyHistory.map((d, i) => {
                                        const hasData = d.calories > 0;
                                        const barHeight = hasData ? `${Math.max((d.calories / chartMax) * 100, 8)}%` : '8%';
                                        return (
                                            <div key={i} className="flex h-full flex-col items-center justify-end">
                                                <span
                                                    className={`mb-1 text-[10px] font-black ${
                                                        hasData
                                                            ? d.calories > targetCal
                                                                ? 'text-rose-600'
                                                                : 'text-emerald-700'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {hasData ? d.calories : '—'}
                                                </span>

                                                <div
                                                    title={hasData ? `${d.day}: ${d.calories} kcal` : `${d.day}: chưa có dữ liệu`}
                                                    style={{ height: barHeight }}
                                                    className={`w-full rounded-t-lg transition-all duration-500 ${
                                                        !hasData
                                                            ? 'bg-slate-200'
                                                            : d.calories > targetCal
                                                                ? 'bg-rose-400'
                                                                : 'bg-emerald-500'
                                                    }`}
                                                ></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 text-center">
                                {weeklyHistory.map((d, i) => (
                                    <span
                                        key={i}
                                        className={`text-[10px] font-extrabold ${i === 6 ? 'text-emerald-700' : 'text-slate-500'}`}
                                    >
                                        {d.day}
                                    </span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {weeklyHistory.map((d, i) => {
                                    const status = d.calories === 0
                                        ? { label: 'Chưa ghi', className: 'text-slate-400' }
                                        : d.calories > targetCal
                                            ? { label: 'Vượt mục tiêu', className: 'text-rose-600' }
                                            : { label: 'Đã ghi', className: 'text-emerald-600' };
                                    return (
                                        <span key={i} className={`text-[8px] font-bold leading-tight ${status.className}`}>
                                            {status.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="pt-2">
                    <button 
                        onClick={handleSaveWeekToDevice} disabled={!loggedDays.length}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <span>💾 LƯU BÁO CÁO 7 NGÀY TRÊN THIẾT BỊ</span>
                    </button>
                    {isWeeklySaved && (
                        <p className="text-[10px] text-emerald-600 font-bold text-center mt-1">
                            ✓ Đã lưu báo cáo tuần này trên thiết bị.
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">📂 Lịch Sử Báo Cáo Đã Lưu Trên Thiết Bị</h3>
                    <p className="text-[10px] text-slate-500 font-bold">Danh sách báo cáo 7 ngày được lưu trên thiết bị này</p>
                </div>

                <div className="space-y-2">
                    {savedWeeklyLogs.length === 0 && <p className="text-center text-[10px] text-slate-400 font-bold py-3">Chưa có báo cáo tuần nào được lưu</p>}
                    {savedWeeklyLogs.map((log, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                                <div className="font-black text-slate-900">{log.week}</div>
                                <div className="text-[10px] text-slate-500 font-bold">Trung bình: {log.avgCal} kcal/ngày • {log.daysRecorded} ngày ghi chép</div>
                            </div>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black">
                                {log.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
