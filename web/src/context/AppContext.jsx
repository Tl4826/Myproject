import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    USE_DEMO, API_URL, UPLOAD_FIELD, FACEBOOK_APP_ID, NUTRITION, load, dayKey,
    getUser, mealByHour, toThumb, suggestGoal, GOAL_LABEL, suggestDishes, computePlan,
    workoutToday, bmiInfo, INITIAL_MEALS,
} from '../lib/data.js';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// Toàn bộ state + hàm xử lý dùng chung của ứng dụng (trước đây nằm trong NutriApp)
export function AppProvider({ children }) {
    const [meals, setMeals] = useState(() => load('nv_meals', INITIAL_MEALS).filter(m => !m.name.includes('Cà Phê')).map(m => ({ date: dayKey(new Date()), ...m })));
    const navigate = useNavigate();
    const [heroScanState, setHeroScanState] = useState('idle');
    const [heroScannedDish, setHeroScannedDish] = useState(null);
    const [scanErr, setScanErr] = useState('');
    const [scanCandidates, setScanCandidates] = useState([]);
    const [scanOriginalPrediction, setScanOriginalPrediction] = useState(null);
    const [scanCorrectionSaved, setScanCorrectionSaved] = useState(false);
    // Only save labels and probabilities; photos are never stored as corrections.
    const [scanCorrections, setScanCorrections] = useState(() => {
        const records = load('nv_scan_corrections', []);
        return Array.isArray(records) ? records : [];
    });

    const today = dayKey(new Date());
    const todayMeals = meals.filter(m => m.date === today);
    const sum = k => todayMeals.reduce((a, m) => a + (m[k] || 0), 0);
    const totalCal = todayMeals.reduce((acc, curr) => acc + curr.calories, 0);
    const [targetCal, setTargetCal] = useState(() => load('nv_target', 1600));
    const remainingCal = targetCal - totalCal;
    const progress = targetCal > 0
        ? Math.min(Math.round((totalCal / targetCal) * 100), 100)
        : totalCal > 0 ? 100 : 0;
    const calorieStatus = totalCal > targetCal
        ? { label: `Vượt ${totalCal - targetCal} kcal`, tone: 'rose', text: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' }
        : totalCal === targetCal
            ? { label: 'Đạt mục tiêu', tone: 'emerald', text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
            : { label: `Còn ${targetCal - totalCal} kcal`, tone: 'emerald', text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };

    const [showPw, setShowPw] = useState(false);
    const [toast, setToast] = useState('');
    const notify = m => { setToast(m); setTimeout(() => setToast(''), 2500); };
    const [rememberMe, setRememberMe] = useState(true);
    const [authName, setAuthName] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!getUser());
    const [userEmail, setUserEmail] = useState(() => getUser()?.name || getUser()?.email || '');
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);


    // Khung hỏi thông tin lần đầu đăng ký
    const [isOnboardOpen, setIsOnboardOpen] = useState(false);
    const [obEmail, setObEmail] = useState('');
    const [obName, setObName] = useState('');
    const [obAge, setObAge] = useState('');
    const [obGender, setObGender] = useState('male');
    const [obHeight, setObHeight] = useState('');
    const [obWeight, setObWeight] = useState('');
    const [obActivity, setObActivity] = useState(1.375);
    const [obGoal, setObGoal] = useState(''); // rỗng = dùng gợi ý theo BMI

    // Hồ sơ + lộ trình
    const [profile, setProfile] = useState(() => load('nv_profile', null));
    const [plan, setPlan] = useState(() => load('nv_plan', null)); // {targetWeight, weeks, startDate, startWeight}
    const [planTw, setPlanTw] = useState(() => { const pl = load('nv_plan', null); return pl ? String(pl.targetWeight) : ''; });
    const [planWk, setPlanWk] = useState(() => { const pl = load('nv_plan', null); return pl ? String(pl.weeks) : ''; });
    const [planErr, setPlanErr] = useState('');
    const [editPlan, setEditPlan] = useState(false);
    const [water, setWater] = useState(() => { const w = load('nv_water', null); return w && w.date === dayKey(new Date()) ? w.n : 0; });
    const [workoutDone, setWorkoutDone] = useState(() => { const w = load('nv_workout', null); return !!(w && w.date === dayKey(new Date()) && w.done); });
    const [obErr, setObErr] = useState('');

    const weeklyHistory = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const key = dayKey(d);
        return {
            day: i === 6 ? 'Hôm nay' : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
            date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            calories: meals.filter(m => m.date === key).reduce((a, m) => a + m.calories, 0)
        };
    });
    const loggedDays = weeklyHistory.filter(d => d.calories > 0);
    const weekAvg = loggedDays.length ? Math.round(loggedDays.reduce((a, d) => a + d.calories, 0) / loggedDays.length) : 0;
    const chartMax = Math.max(targetCal * 1.4, ...weeklyHistory.map(d => d.calories * 1.15));

    const [savedWeeklyLogs, setSavedWeeklyLogs] = useState(() => load('nv_weeks', []).filter(l => l.week !== 'Tuần 44 (20/10 - 26/10)'));

    const [isWeeklySaved, setIsWeeklySaved] = useState(false);

            useEffect(() => {
        try { localStorage.setItem('nv_meals', JSON.stringify(meals)); localStorage.setItem('nv_target', targetCal); localStorage.setItem('nv_weeks', JSON.stringify(savedWeeklyLogs)); } catch {}
    }, [meals, targetCal, savedWeeklyLogs]);

    const rp = profile ? computePlan(profile, plan) : null;
    const pbmi = profile ? bmiInfo(profile.weight, profile.height) : null;
    const todayWorkout = profile ? workoutToday(profile) : null;
    const dishes = rp ? suggestDishes(profile.goal, Math.max(rp.targetCal - totalCal, 0), rp.targetCal) : [];
    const daysIn = plan ? Math.floor((new Date(today) - new Date(plan.startDate)) / 864e5) : 0;
    const totalDays = rp && plan ? rp.weeks * 7 : 0;
    const planPct = totalDays ? Math.min(100, Math.round((daysIn + 1) / totalDays * 100)) : 0;
    const expectedW = totalDays ? (plan.startWeight + (plan.targetWeight - plan.startWeight) * Math.min(daysIn / totalDays, 1)).toFixed(1) : null;

    useEffect(() => { if (rp) setTargetCal(rp.targetCal); }, [rp && rp.targetCal]);
    useEffect(() => {
        try {
            localStorage.setItem('nv_water', JSON.stringify({ date: today, n: water }));
            localStorage.setItem('nv_workout', JSON.stringify({ date: today, done: workoutDone }));
            if (plan) localStorage.setItem('nv_plan', JSON.stringify(plan)); else localStorage.removeItem('nv_plan');
        } catch {}
    }, [water, workoutDone, plan]);

    useEffect(() => {
        const h = e => { if (e.key === 'Escape') setIsTeamOpen(false); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    useEffect(() => {
        if (!FACEBOOK_APP_ID) return;
        const sc = document.createElement('script');
        sc.src = 'https://connect.facebook.net/vi_VN/sdk.js'; sc.async = true;
        sc.onload = () => FB.init({ appId: FACEBOOK_APP_ID, version: 'v23.0', cookie: false, xfbml: false });
        document.body.appendChild(sc);
    }, []);

    const handleSaveWeekToDevice = () => {
        if (!loggedDays.length) return;
        const record = { key: today, week: `7 ngày (${weeklyHistory[0].date} - ${weeklyHistory[6].date})`, avgCal: weekAvg, daysRecorded: loggedDays.length, status: weekAvg <= targetCal ? 'Đạt mục tiêu' : 'Vượt calo' };
        setSavedWeeklyLogs(prev => [record, ...prev.filter(l => l.key !== today)]);
        setIsWeeklySaved(true);
        setTimeout(() => setIsWeeklySaved(false), 3000);
    };

    const login = (u, msg = 'Đăng nhập thành công') => {
        setIsLoggedIn(true); setUserEmail(u.name || u.email || '');
        notify(msg);
        try { (rememberMe ? localStorage : sessionStorage).setItem('nv_user', JSON.stringify(u)); } catch {} // không lưu mật khẩu/token
        const prof = load('nv_profile', null);
        if (!prof || prof.email !== u.email) { setObEmail(u.email || ''); setObName(u.name || ''); setObErr(''); setObGoal(''); setObAge(''); setObHeight(''); setObWeight(''); setIsOnboardOpen(true); }
    };
    const logout = () => {
        try { localStorage.removeItem('nv_user'); sessionStorage.removeItem('nv_user'); } catch {}
        setIsLoggedIn(false); setUserEmail(''); notify('Đã đăng xuất'); navigate('/');
    };
    const handleAuthSubmit = (e, mode) => {
        e.preventDefault();
        login({ email: userEmail, name: authName, provider: 'email' }, mode === 'register' ? 'Tạo tài khoản thành công 🎉' : undefined);
        setAuthName('');
    };
    const fbLogin = () => {
        if (!FACEBOOK_APP_ID || !window.FB) return notify('Chưa điền FACEBOOK_APP_ID (hoặc SDK chưa tải xong)');
        FB.login(r => { if (r.authResponse) FB.api('/me', { fields: 'name,email' }, u => login({ email: u.email || u.name, name: u.name, provider: 'facebook' })); }, { scope: 'public_profile,email' });
    };

    const openProfile = () => {
        const u = getUser();
        setObEmail(profile?.email || u?.email || ''); setObName(profile?.name || u?.name || '');
        setObAge(profile ? String(profile.age) : ''); setObGender(profile?.gender || 'male');
        setObHeight(profile ? String(profile.height) : ''); setObWeight(profile ? String(profile.weight) : '');
        setObActivity(profile?.activity ?? 1.375); setObGoal(profile?.goal || ''); setObErr(''); setIsOnboardOpen(true);
    };

    const saveProfile = (e) => {
        e.preventDefault();
        const a = Number(obAge), h = Number(obHeight), w = Number(obWeight);
        if (!obName.trim()) return setObErr('Vui lòng nhập họ tên');
        if (!(a >= 10 && a <= 100)) return setObErr('Tuổi phải từ 10 đến 100');
        if (!(h >= 100 && h <= 250)) return setObErr('Chiều cao phải từ 100 đến 250 cm');
        if (!(w >= 20 && w <= 300)) return setObErr('Cân nặng phải từ 20 đến 300 kg');
        const b = bmiInfo(w, h);
        const goal = obGoal || suggestGoal(b.value);
        const name = obName.trim();
        const prof = { email: obEmail, name, age: a, gender: obGender, height: h, weight: w, bmi: b.value, activity: Number(obActivity), goal };
        try { localStorage.setItem('nv_profile', JSON.stringify(prof)); } catch {}
        try { const st = localStorage.getItem('nv_user') ? localStorage : sessionStorage; const u = JSON.parse(st.getItem('nv_user')); if (u) st.setItem('nv_user', JSON.stringify({ ...u, name })); } catch {}
        if (!profile || profile.email !== obEmail || profile.weight !== w || profile.goal !== goal) { setPlan(null); setPlanTw(''); setPlanWk(''); setEditPlan(false); setPlanErr(''); } // đổi cân nặng/mục tiêu -> lập lại lộ trình
        setProfile(prof); setUserEmail(name);
        setIsOnboardOpen(false); setObErr('');
        notify(`BMI ${b.value} · ${b.label}`);
    };

    const savePlan = () => {
        const tw = Number(planTw), wk = Number(planWk), w = profile.weight, dir = profile.goal === 'lose' ? -1 : 1;
        if (!(tw >= 20 && tw <= 300)) return setPlanErr('Cân nặng mục tiêu phải từ 20 đến 300 kg');
        if (!Number.isInteger(wk) || wk < 1 || wk > 104) return setPlanErr('Số tuần phải là số nguyên từ 1 đến 104');
        if ((tw - w) * dir <= 0) return setPlanErr(`Với mục tiêu ${GOAL_LABEL[profile.goal]}, cân nặng mục tiêu phải ${dir < 0 ? 'thấp' : 'cao'} hơn hiện tại (${w} kg)`);
        const tb = bmiInfo(tw, profile.height);
        if (dir < 0 && tb.value < 18.5) return setPlanErr(`Với ${tw} kg, BMI chỉ còn ${tb.value} (thiếu cân). Hãy chọn mức cao hơn.`);
        setPlan({ targetWeight: tw, weeks: wk, startDate: today, startWeight: w });
        setPlanErr(''); setEditPlan(false); notify('Đã lập lộ trình');
    };

    const chooseScannedDish = (label) => {
        const n = NUTRITION[label];
        const candidate = scanCandidates.find(item => item.mon === label);
        setHeroScannedDish(prev => prev ? ({
            ...prev,
            label,
            name: n ? n[0] : label.replace(/_/g, ' '),
            calories: n ? n[1] : null,
            protein: n ? n[2] : null,
            carbs: n ? n[3] : null,
            fat: n ? n[4] : null,
            hasNutrition: Boolean(n),
            conf: candidate ? Math.round(Number(candidate.do_tin_cay) * 100) : null,
            sure: candidate ? Number(candidate.do_tin_cay) >= 0.5 : false,
            manuallySelected: label !== scanOriginalPrediction
        }) : null);
        setScanCorrectionSaved(false);
    };

    const saveScanCorrection = () => {
        if (!heroScannedDish?.manuallySelected || !scanOriginalPrediction || scanCorrectionSaved) return;
        const record = {
            timestamp: new Date().toISOString(),
            predicted: scanOriginalPrediction,
            corrected: heroScannedDish.label,
            top3: scanCandidates.map(({ mon, do_tin_cay }) => ({ mon, do_tin_cay }))
        };
        try {
            const updated = [...scanCorrections, record].slice(-500);
            localStorage.setItem('nv_scan_corrections', JSON.stringify(updated));
            setScanCorrections(updated);
            setScanCorrectionSaved(true);
            notify('Đã lưu phản hồi trên trình duyệt');
        } catch {
            notify('Không lưu được phản hồi trên thiết bị này');
        }
    };

    const exportScanCorrections = () => {
        const blob = new Blob([JSON.stringify(scanCorrections, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'nutrivn-ai-corrections.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const clearScanCorrections = () => {
        if (!window.confirm('Xóa toàn bộ phản hồi AI trên trình duyệt này?')) return;
        localStorage.removeItem('nv_scan_corrections');
        setScanCorrections([]);
        setScanCorrectionSaved(false);
    };

    // The same prediction flow handles both gallery uploads and camera snapshots.
    const scanImage = async (f) => {
        if (!f) return;
        navigate('/home');
        if (!f.type.startsWith('image/') || f.size > 8e6) { setScanErr('Chỉ nhận file ảnh dưới 8MB'); return; }
        setScanErr(''); setHeroScanState('scanning');
        setScanCandidates([]); setScanOriginalPrediction(null); setScanCorrectionSaved(false);
        const thumb = await toThumb(f);
        try {
            let d;
            if (USE_DEMO) {
                await new Promise(r => setTimeout(r, 1200));
                d = { mon: 'phobo', do_tin_cay: 0.92, chac_chan: true };
            } else {
                const fd = new FormData(); fd.append(UPLOAD_FIELD, f);
                const response = await fetch(API_URL + '/predict', { method: 'POST', body: fd });
                if (!response.ok) throw new Error('HTTP ' + response.status);
                d = await response.json();
            }
            if (typeof d?.mon !== 'string' || !d.mon) throw new Error('API trả về tên món không hợp lệ');
            const candidates = (Array.isArray(d.top3) ? d.top3 : [])
                .filter(x => x && typeof x.mon === 'string' && Number.isFinite(Number(x.do_tin_cay)))
                .map(x => ({ mon: x.mon, do_tin_cay: Number(x.do_tin_cay) }))
                .slice(0, 3);
            if (!candidates.length) candidates.push({ mon: d.mon, do_tin_cay: Number(d.do_tin_cay) || 0 });
            setScanCandidates(candidates);
            setScanOriginalPrediction(d.mon);
            const n = NUTRITION[d.mon];
            setHeroScannedDish({
                label: d.mon,
                name: n ? n[0] : d.mon.replace(/_/g, ' '),
                calories: n ? n[1] : null,
                protein: n ? n[2] : null,
                carbs: n ? n[3] : null,
                fat: n ? n[4] : null,
                hasNutrition: Boolean(n),
                thumb,
                conf: Math.round((Number(d.do_tin_cay) || 0) * 100),
                sure: Boolean(d.chac_chan),
                manuallySelected: false
            });
            setHeroScanState('result');
        } catch (err) {
            setScanErr('Không thể nhận diện ảnh: ' + err.message + '. Kiểm tra API tại ' + API_URL + '.');
            setHeroScanState('idle');
        }
    };

    const handleFile = (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        return scanImage(file);
    };

    const addMeal = (dish) => {
        if (!dish?.hasNutrition || !Number.isFinite(dish.calories)) {
            notify('Chưa có dữ liệu dinh dưỡng cho món này');
            return;
        }
        const newM = {
            id: Date.now().toString(),
            date: dayKey(new Date()),
            name: dish.name,
            category: mealByHour(),
            calories: dish.calories,
            protein: dish.protein,
            carbs: dish.carbs,
            fat: dish.fat,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            thumb: dish.thumb || null
        };
        setMeals(prev => [...prev, newM]);
        navigate('/diary');
    };

    const updateMealCategory = (id, category) => {
        setMeals(prev => prev.map(meal => meal.id === id ? { ...meal, category } : meal));
    };

    const removeMeal = id => {
        setMeals(prev => prev.filter(meal => meal.id !== id));
    };

    const value = {
        navigate, heroScanState, setHeroScanState, heroScannedDish, scanErr, todayMeals, sum,
        scanCandidates, scanCorrections, scanCorrectionSaved, chooseScannedDish,
        saveScanCorrection, exportScanCorrections, clearScanCorrections,
        totalCal, targetCal, remainingCal, progress, calorieStatus, showPw, setShowPw, toast,
        notify, rememberMe, setRememberMe, authName, setAuthName, isLoggedIn, userEmail,
        setUserEmail, isTeamOpen, setIsTeamOpen, isGuideOpen, setIsGuideOpen, isOnboardOpen,
        setIsOnboardOpen, obName, setObName, obAge, setObAge, obGender, setObGender, obHeight,
        setObHeight, obWeight, setObWeight, obActivity, setObActivity, obGoal, setObGoal, profile,
        plan, planTw, setPlanTw, planWk, setPlanWk, planErr, setPlanErr, editPlan, setEditPlan,
        water, setWater, workoutDone, setWorkoutDone, obErr, weeklyHistory, loggedDays, weekAvg,
        chartMax, savedWeeklyLogs, isWeeklySaved, rp, pbmi, todayWorkout, dishes, daysIn,
        totalDays, planPct, expectedW, handleSaveWeekToDevice, login, logout, handleAuthSubmit,
        fbLogin, openProfile, saveProfile, savePlan, handleFile, scanImage, addMeal, updateMealCategory,
        removeMeal,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
