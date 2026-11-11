import { MEAL_TYPES } from '../lib/data.js';
import MealDiaryItem from '../components/MealDiaryItem.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function DiaryPage() {
    const {
        todayMeals, totalCal, targetCal, progress, calorieStatus, updateMealCategory, removeMeal,
    } = useApp();

    return (
        <div className="space-y-4">
            <div className={`p-3 border rounded-2xl flex items-center justify-between text-xs ${calorieStatus.bg}`}>
                <span className={`font-bold ${calorieStatus.tone === 'rose' ? 'text-rose-900' : 'text-emerald-900'}`}>
                    {totalCal > targetCal
                        ? `🔴 Bạn đã vượt mục tiêu ${totalCal - targetCal} kcal`
                        : totalCal === targetCal
                            ? '🟢 Bạn đã đạt đúng mục tiêu calo hôm nay'
                            : `🟢 Đạt chuẩn calo ngày hôm nay (còn ${targetCal - totalCal} kcal)`}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${calorieStatus.tone === 'rose' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {progress}%
                </span>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
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
