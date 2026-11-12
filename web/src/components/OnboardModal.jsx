import { GOALS, suggestGoal, bmiInfo } from '../lib/data.js';
import { useApp } from '../context/AppContext.jsx';

export default function OnboardModal() {
    const {
        setIsOnboardOpen, obName, setObName, obAge, setObAge, obGender, setObGender, obHeight,
        setObHeight, obWeight, setObWeight, obActivity, setObActivity, obGoal, setObGoal, obErr,
        saveProfile,
    } = useApp();

        const bmi = bmiInfo(Number(obWeight), Number(obHeight));
        const fld = 'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm';
        return (
            <div className="fixed inset-0 z-[55] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <form onSubmit={saveProfile} className="fade bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
                    <div className="text-center space-y-1">
                        <div className="text-4xl">👋</div>
                        <h3 className="font-black text-lg text-slate-900">Chào mừng đến NutriVN!</h3>
                        <p className="text-xs text-slate-500 font-medium">Cho mình biết một chút về bạn để tính BMI, gợi ý mục tiêu và lượng calo phù hợp.</p>
                    </div>
                    <div className="space-y-3 text-xs">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500">Họ và tên</label>
                            <input type="text" value={obName} onChange={e => setObName(e.target.value)} placeholder="Nguyễn Văn A" className={fld} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500">Tuổi</label>
                                <input type="number" inputMode="numeric" value={obAge} onChange={e => setObAge(e.target.value)} placeholder="20" className={fld} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500">Giới tính</label>
                                <select value={obGender} onChange={e => setObGender(e.target.value)} className={fld}>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500">Chiều cao (cm)</label>
                                <input type="number" inputMode="decimal" value={obHeight} onChange={e => setObHeight(e.target.value)} placeholder="170" className={fld} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500">Cân nặng (kg)</label>
                                <input type="number" inputMode="decimal" value={obWeight} onChange={e => setObWeight(e.target.value)} placeholder="65" className={fld} />
                            </div>
                        </div>
                        {bmi ? (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                                <div className="text-[10px] font-bold text-slate-500">Chỉ số BMI của bạn</div>
                                <div className="text-2xl font-black text-slate-900">{bmi.value} <span className={'text-sm ' + bmi.color}>{bmi.label}</span></div>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 font-bold text-center italic">Nhập chiều cao và cân nặng để xem BMI</p>
                        )}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500">Mục tiêu của bạn{bmi ? ' (đã gợi ý theo BMI)' : ''}</label>
                            <div className="grid grid-cols-2 gap-1.5 mt-1">
                                {GOALS.map(([k, label]) => {
                                    const sel = (obGoal || (bmi ? suggestGoal(bmi.value) : '')) === k;
                                    const sug = bmi && suggestGoal(bmi.value) === k;
                                    return (
                                        <button key={k} type="button" onClick={() => setObGoal(k)} className={`p-2 rounded-xl border font-bold relative ${sel ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            {label}
                                            {sug && <span className="absolute -top-1.5 right-1.5 text-[9px] bg-emerald-600 text-white rounded-full px-1.5">Gợi ý</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500">Mức vận động</label>
                            <select value={obActivity} onChange={e => setObActivity(e.target.value)} className={fld}>
                                <option value={1.2}>Ít vận động</option>
                                <option value={1.375}>Nhẹ (1-3 buổi/tuần)</option>
                                <option value={1.55}>Vừa (3-5 buổi/tuần)</option>
                                <option value={1.725}>Nhiều (6-7 buổi/tuần)</option>
                            </select>
                        </div>
                        {obErr && <p className="text-[11px] font-bold text-rose-600 text-center">{obErr}</p>}
                    </div>
                    <div className="space-y-2">
                        <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-sm">LƯU & BẮT ĐẦU</button>
                        <button type="button" onClick={() => setIsOnboardOpen(false)} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600">Để sau</button>
                    </div>
                </form>
            </div>
        );
}
