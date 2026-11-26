'use client';

import { MEAL_TYPES } from '../../../lib/data.js';
import MealDiaryItem from '../../../components/MealDiaryItem.jsx';
import { useApp } from '../../../context/AppContext.jsx';

export default function DiaryPage() {
    const {
        todayMeals, sum, totalCal, targetCal, remainingCal, progress, calorieStatus, updateMealCategory, removeMeal,
    } = useApp();
    const incompleteMeals = todayMeals.filter(m => !Number.isFinite(m.calories)).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
                <div className={`p-3.5 border rounded-2xl flex items-center justify-between gap-2 text-xs ${calorieStatus.bg}`}>
                    <span className={`font-bold ${calorieStatus.tone === 'rose' ? 'text-rose-900' : 'text-emerald-900'}`}>
                        {totalCal > targetCal
                            ? `🔴 Bạn đã vượt mục tiêu ${totalCal - targetCal} kcal`
                            : totalCal === targetCal
                                ? '🟢 Bạn đã đạt đúng mục tiêu calo hôm nay'
                                : `🟢 Đạt chuẩn calo ngày hôm nay (còn ${targetCal - totalCal} kcal)`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${calorieStatus.tone === 'rose' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {progress}%
                    </span>
                </div>

                <section className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase border-b pb-2">⚡ Tổng Quan Hôm Nay</h3>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-2.5">
                            <div className="text-[10px] font-bold text-slate-500">Đã nạp</div>
                            <div className="text-lg font-black text-slate-900">{totalCal} <span className="text-[10px] text-slate-500">kcal</span></div>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-2.5">
                            <div className="text-[10px] font-bold text-emerald-700">{totalCal > targetCal ? 'Vượt mức' : 'Còn lại'}</div>
                            <div className={`text-lg font-black ${calorieStatus.text}`}>{Math.abs(remainingCal)} <span className="text-[10px] text-slate-500">kcal</span></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[['Protein', 'protein', 'bg-sky-100 text-sky-700'], ['Carbs', 'carbs', 'bg-amber-100 text-amber-700'], ['Fat', 'fat', 'bg-rose-100 text-rose-700']].map(([name, k, cls]) => (
                            <div key={k} className={`rounded-xl py-1.5 ${cls}`}>
                                <div className="text-[10px] font-bold">{name}</div>
                                <div className="text-xs font-black">{sum(k)}g</div>
                            </div>
                        ))}
                    </div>
                </section>

                {incompleteMeals > 0 && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-900">
                        {incompleteMeals} món chưa có dữ liệu dinh dưỡng, nên tổng kcal chỉ tính các món đã có số liệu.
                    </p>
                )}
            </aside>

            <div className="lg:col-span-8 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase">📖 Nhật Ký Bữa Ăn Hôm Nay</h3>
                    <span className="text-[10px] text-emerald-600 font-bold">{todayMeals.length} món đã lưu</span>
                </div>
                <div className="space-y-2">
                    {todayMeals.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                            <p className="text-[11px] font-black text-slate-600">Chưa có món nào hôm nay</p>
                            <p className="mt-1 text-[10px] text-slate-500">
                                Bấm vào <span className="font-bold text-emerald-600">Quét món ăn</span> để bắt đầu ghi nhật ký.
                            </p>
                        </div>
                    )}
                    {MEAL_TYPES.map(([k, label]) => {
                        const list = todayMeals.filter(m => m.category === k);
                        return list.length > 0 && (
                            <div key={k} className="space-y-2">
                                <div className="text-[10px] font-black text-slate-500 uppercase">{label}</div>
                                {list.map(meal => (
                                    <MealDiaryItem
                                        key={meal.id}
                                        meal={meal}
                                        onCategoryChange={updateMealCategory}
                                        onRemove={removeMeal}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
