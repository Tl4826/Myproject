import { MEAL_TYPES } from '../lib/data.js';

const MealDiaryItem = ({ meal, onCategoryChange, onRemove }) => (
    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 min-w-0">
            {meal.thumb
                ? <img src={meal.thumb} alt={meal.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                : <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">🍽️</div>}
            <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate">{meal.name}</div>
                <div className="text-[10px] text-slate-500">{meal.time} • P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</div>
            </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
            <span className="font-black text-emerald-600 text-xs">{meal.calories} kcal</span>
            <select
                value={meal.category}
                onChange={e => onCategoryChange(meal.id, e.target.value)}
                className="text-[10px] bg-white border border-slate-200 rounded-lg p-1 font-bold"
            >
                {MEAL_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button onClick={() => onRemove(meal.id)} aria-label="Xoá món" className="text-rose-500 hover:bg-rose-50 rounded-lg px-1.5 font-black">✕</button>
        </div>
    </div>
);

export default MealDiaryItem;
