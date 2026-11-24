import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    USE_DEMO, API_URL, UPLOAD_FIELD, FACEBOOK_APP_ID, NUTRITION, FOOD_CLASSES, load, dayKey,
    getUser, mealByHour, toThumb, suggestGoal, GOAL_LABEL, suggestDishes, computePlan,
    workoutToday, bmiInfo, INITIAL_MEALS,
    idOf, userId, ukey, uload, migrateLegacy,
} from '../lib/data.js';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// Toàn bộ state + hàm xử lý dùng chung của ứng dụng (trước đây nằm trong NutriApp)
export function AppProvider({ children }) {
    // Browser storage is only a UI cache; a server-verified cookie gates access.
    const [uid, setUid] = useState('');
    const [today, setToday] = useState(() => dayKey(new Date()));

    const readMeals = id =>
        uload('nv_meals', [], id)
            .filter(m => m && typeof m.name === 'string' && !m.name.includes('Cà Phê'))
            .map(m => ({ date: dayKey(new Date()), ...m }));

    const [meals, setMeals] = useState(() => (uid ? readMeals(uid) : []));
    const [socialAccount, setSocialAccount] = useState(null);
    const navigate = useNavigate();
    const [heroScanState, setHeroScanState] = useState('idle');
    const [heroScannedDish, setHeroScannedDish] = useState(null);
    const [scanErr, setScanErr] = useState('');
    const [scanCandidates, setScanCandidates] = useState([]);
    const [scanOriginalPrediction, setScanOriginalPrediction] = useState(null);
    const [scanCorrectionSaved, setScanCorrectionSaved] = useState(false);
    // Only save labels and probabilities; photos are never stored as corrections.
    const [scanCorrections, setScanCorrections] = useState(() => {
        const records = uid
            ? uload('nv_scan_corrections', [], uid)
            : load('nv_scan_corrections', []);
        return Array.isArray(records) ? records : [];
    });

    const todayMeals = meals.filter(m => m.date === today);
    const sum = k => todayMeals.reduce((a, m) => a + (m[k] || 0), 0);
    const totalCal = todayMeals.reduce((acc, curr) => acc + curr.calories, 0);
    const [targetCal, setTargetCal] = useState(() => uload('nv_target', 1600, uid));
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
    const [authPassword, setAuthPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const [userEmail, setUserEmail] = useState('');
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
    const [profile, setProfile] = useState(() => uload('nv_profile', null, uid));
    const [plan, setPlan] = useState(() => uload('nv_plan', null, uid)); // {targetWeight, weeks, startDate, startWeight}
    const [planTw, setPlanTw] = useState(() => { const pl = uload('nv_plan', null, uid); return pl ? String(pl.targetWeight) : ''; });
    const [planWk, setPlanWk] = useState(() => { const pl = uload('nv_plan', null, uid); return pl ? String(pl.weeks) : ''; });
    const [planErr, setPlanErr] = useState('');
    const [editPlan, setEditPlan] = useState(false);
    const [water, setWater] = useState(() => { const w = uload('nv_water', null, uid); return w && w.date === dayKey(new Date()) ? w.n : 0; });
    const [workoutDone, setWorkoutDone] = useState(() => { const w = uload('nv_workout', null, uid); return !!(w && w.date === dayKey(new Date()) && w.done); });

    // Tự cập nhật ngày mới, kể cả khi ứng dụng vẫn đang mở
    useEffect(() => {
        const checkDate = () => {
            const currentDate = dayKey(new Date());

            if (currentDate === today) return;

            const savedWater = uid ? uload('nv_water', null, uid) : null;
            const savedWorkout = uid ? uload('nv_workout', null, uid) : null;

            setWater(
                savedWater && savedWater.date === currentDate
                    ? savedWater.n
                    : 0
            );

            setWorkoutDone(
                !!(
                    savedWorkout &&
                    savedWorkout.date === currentDate &&
                    savedWorkout.done
                )
            );

            setToday(currentDate);
        };

        const timer = setInterval(checkDate, 60000);

        return () => clearInterval(timer);
    }, [uid, today]);

    const [obErr, setObErr] = useState('');

    // Lấy ngày thứ Hai đầu tuần
    const getWeekStart = date => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return d;
    };

    const weekStart = getWeekStart(new Date(`${today}T00:00:00`));

    // Thống kê từ thứ Hai đến Chủ nhật
    const weeklyHistory = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);

        const key = dayKey(d);

        return {
            day: key === today
                ? 'Hôm nay'
                : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
            date: d.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit'
            }),
            calories: meals
                .filter(m => m.date === key)
                .reduce((a, m) => a + (Number(m.calories) || 0), 0)
        };
    });

    const loggedDays = weeklyHistory.filter(d => d.calories > 0);

    const weekAvg = loggedDays.length
        ? Math.round(
            loggedDays.reduce((a, d) => a + d.calories, 0) / loggedDays.length
        )
        : 0;

    const chartMax = Math.max(
        targetCal * 1.4,
        ...weeklyHistory.map(d => d.calories * 1.15)
    );

    const [savedWeeklyLogs, setSavedWeeklyLogs] = useState(() =>
        uload('nv_weeks', [], uid)
    );

    // Tự động lưu các tuần đã kết thúc
    useEffect(() => {
        if (!uid) return;

        const completedWeeks = new Map();

        meals.forEach(meal => {
            if (!meal?.date) return;

            const mealDate = new Date(`${meal.date}T00:00:00`);

            if (Number.isNaN(mealDate.getTime())) return;

            const start = getWeekStart(mealDate);

            // Không lưu tuần hiện tại hoặc tuần tương lai
            if (start.getTime() >= weekStart.getTime()) return;

            const key = dayKey(start);

            if (!completedWeeks.has(key)) {
                completedWeeks.set(key, {
                    start,
                    daily: new Map()
                });
            }

            const group = completedWeeks.get(key);
            const calories = Number(meal.calories) || 0;

            group.daily.set(
                meal.date,
                (group.daily.get(meal.date) || 0) + calories
            );
        });

        const records = Array.from(completedWeeks.entries())
            .map(([key, group]) => {
                const dailyCalories = Array.from(group.daily.values())
                    .filter(value => value > 0);

                if (!dailyCalories.length) return null;

                const end = new Date(group.start);
                end.setDate(end.getDate() + 6);

                const avgCal = Math.round(
                    dailyCalories.reduce((a, b) => a + b, 0)
                    / dailyCalories.length
                );

                return {
                    key,
                    week: `Tuần ${group.start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`,
                    avgCal,
                    daysRecorded: dailyCalories.length,
                    targetCal,
                    status: avgCal <= targetCal
                        ? 'Đạt mục tiêu'
                        : 'Vượt calo',
                    isCompleted: true
                };
            })
            .filter(Boolean);

        if (!records.length) return;

        setSavedWeeklyLogs(prev => {
            const history = new Map(
                prev
                    .filter(record => record?.key)
                    .map(record => [record.key, record])
            );

            const legacyRecords = prev.filter(record => !record?.key);

            records.forEach(record => {
                const existing = history.get(record.key);

                // Không ghi đè báo cáo tuần đã chốt
                if (existing?.isCompleted) return;

                history.set(record.key, record);
            });

            return [
                ...Array.from(history.values()).sort(
                    (a, b) => b.key.localeCompare(a.key)
                ),
                ...legacyRecords
            ];
        });

    }, [uid, meals, targetCal, today]);

    const [isWeeklySaved, setIsWeeklySaved] = useState(false); 

    useEffect(() => {
        if (!uid) return;

        try {
            if (!socialAccount) {
                localStorage.setItem(ukey('nv_meals', uid), JSON.stringify(meals));
            }
            localStorage.setItem(ukey('nv_target', uid), JSON.stringify(targetCal));
            localStorage.setItem(ukey('nv_weeks', uid), JSON.stringify(savedWeeklyLogs));
        } catch {}
    }, [uid, meals, targetCal, savedWeeklyLogs, socialAccount]);

    const rp = profile ? computePlan(profile, plan) : null;
    const pbmi = profile ? bmiInfo(profile.weight, profile.height) : null;
    const todayWorkout = profile ? workoutToday(profile) : null;
    const dishes = rp ? suggestDishes(Math.max(rp.targetCal - totalCal, 0), today) : [];
    const daysIn = plan ? Math.floor((new Date(today) - new Date(plan.startDate)) / 864e5) : 0;
    const totalDays = rp && plan ? rp.weeks * 7 : 0;
    const planPct = totalDays ? Math.min(100, Math.round((daysIn + 1) / totalDays * 100)) : 0;
    const expectedW = totalDays ? (plan.startWeight + (plan.targetWeight - plan.startWeight) * Math.min(daysIn / totalDays, 1)).toFixed(1) : null;

    useEffect(() => { if (rp) setTargetCal(rp.targetCal); }, [rp && rp.targetCal]);
    useEffect(() => {
        if (!uid) return;

        try {
            localStorage.setItem(
                ukey('nv_water', uid),
                JSON.stringify({ date: today, n: water })
            );

            localStorage.setItem(
                ukey('nv_workout', uid),
                JSON.stringify({ date: today, done: workoutDone })
            );

            if (plan) {
                localStorage.setItem(ukey('nv_plan', uid), JSON.stringify(plan));
            } else {
                localStorage.removeItem(ukey('nv_plan', uid));
            }

            if (profile) {
                localStorage.setItem(ukey('nv_profile', uid), JSON.stringify(profile));
            } else {
                localStorage.removeItem(ukey('nv_profile', uid));
            }
        } catch {}
    }, [uid, water, workoutDone, plan, profile, today]);

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

        const end = new Date(weekStart);
        end.setDate(end.getDate() + 6);

        const record = {
            key: dayKey(weekStart),
            week: `Tuần ${weekStart.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`,
            avgCal: weekAvg,
            daysRecorded: loggedDays.length,
            targetCal,
            status: weekAvg <= targetCal
                ? 'Đạt mục tiêu'
                : 'Vượt calo',
            isCompleted: false
        };

        setSavedWeeklyLogs(prev => [
            record,
            ...prev.filter(l => l.key !== record.key)
        ]);

        setIsWeeklySaved(true);
        setTimeout(() => setIsWeeklySaved(false), 3000);
    };

    // Chuyển dữ liệu theo tài khoản đăng nhập
    const switchUser = id => {
        setUid(id);

        setHeroScanState('idle');
        setHeroScannedDish(null);
        setScanCandidates([]);
        setScanOriginalPrediction(null);
        setScanCorrectionSaved(false);
        setScanErr('');

        setEditPlan(false);
        setPlanErr('');
        setObErr('');

        setMeals(id ? readMeals(id) : []);
        setTargetCal(id ? uload('nv_target', 1600, id) : 1600);

        const newProfile = id ? uload('nv_profile', null, id) : null;
        const newPlan = id ? uload('nv_plan', null, id) : null;

        setProfile(newProfile);
        setPlan(newPlan);
        setPlanTw(newPlan ? String(newPlan.targetWeight) : '');
        setPlanWk(newPlan ? String(newPlan.weeks) : '');

        const newWater = id ? uload('nv_water', null, id) : null;
        setWater(
            newWater && newWater.date === dayKey(new Date())
                ? newWater.n : 0
        );

        const newWorkout = id ? uload('nv_workout', null, id) : null;
        setWorkoutDone(
            !!(newWorkout &&
            newWorkout.date === dayKey(new Date()) &&
            newWorkout.done)
        );

        const newWeeks = id ? uload('nv_weeks', [], id) : [];

        setSavedWeeklyLogs(
            Array.isArray(newWeeks) ? newWeeks : []
        );

        const newCorrections = id
            ? uload('nv_scan_corrections', [], id)
            : [];

        setScanCorrections(
            Array.isArray(newCorrections) ? newCorrections : []
        );

        setScanCorrectionSaved(false);
    };

    // Tài khoản chỉ được chấp nhận sau khi backend xác minh Google/Facebook.
    const fetchSocialDiary = async () => {
        const res = await fetch('/api/diary', { credentials: 'same-origin' });
        if (!res.ok) throw new Error('Không thể tải nhật ký của tài khoản');
        const data = await res.json();
        return Array.isArray(data.meals) ? data.meals : [];
    };

    const activateSocialAccount = async user => {
        const cloudMeals = await fetchSocialDiary();
        const nid = idOf(user);
        setUid(nid);
        setHeroScanState('idle');
        setHeroScannedDish(null);
        setScanCandidates([]);
        setScanOriginalPrediction(null);
        setScanCorrectionSaved(false);
        setScanErr('');
        setEditPlan(false);
        setPlanErr('');
        setObErr('');
        setMeals(cloudMeals);
        setSocialAccount(user);
        const savedProfile = nid ? uload('nv_profile', null, nid) : null;
        setProfile(savedProfile);
        setPlan(null); setPlanTw(''); setPlanWk('');
        setSavedWeeklyLogs([]);
        setUserEmail(user.name || user.email || '');
        try {
            localStorage.setItem('nv_user', JSON.stringify(user));
            sessionStorage.removeItem('nv_user');
        } catch {}
        setIsLoggedIn(true);
        if (!savedProfile) {
            setObEmail(user.email || ''); setObName(user.name || '');
            setObErr(''); setObGoal(''); setObAge(''); setObHeight(''); setObWeight('');
            setIsOnboardOpen(true);
        }
    };

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                // Revalidate the HttpOnly cookie on every fresh page load.
                const res = await fetch('/api/social-auth', { credentials: 'same-origin' });
                if (!res.ok) throw new Error('Session not verified');
                const data = await res.json();
                if (!active || !data.user) return;
                if (data.user.provider === 'email') {
                    const u = data.user;
                    const nid = idOf(u);
                    const cached = getUser();
                    const name = cached?.provider === 'email' && cached.email === u.email
                        ? cached.name || u.name : u.name;
                    const verified = { ...u, name };
                    const storage = localStorage.getItem('nv_user') ? localStorage : sessionStorage;
                    try {
                        localStorage.removeItem('nv_user');
                        sessionStorage.removeItem('nv_user');
                        storage.setItem('nv_user', JSON.stringify(verified));
                    } catch {}
                    migrateLegacy(nid);
                    switchUser(nid);
                    setSocialAccount(null);
                    setUserEmail(name || u.email);
                    setIsLoggedIn(true);
                } else if (['google', 'facebook'].includes(data.user.provider)) {
                    await activateSocialAccount(data.user);
                }
            } catch {
                if (!active) return;
                try {
                    localStorage.removeItem('nv_user');
                    sessionStorage.removeItem('nv_user');
                } catch {}
                setSocialAccount(null);
                switchUser('');
                setIsLoggedIn(false);
            } finally {
                if (active) setAuthChecking(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const socialLogin = async (provider, credential) => {
        try {
            const response = await fetch('/api/social-auth', {
                method: 'POST', credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, credential })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.user)
                throw new Error(data.error || 'Đăng nhập không thành công');
            await activateSocialAccount(data.user);
            notify('Đăng nhập thành công');
        } catch (err) { notify(err.message || 'Lỗi đăng nhập'); }
    };

    const login = (u, msg = 'Đăng nhập thành công') => {
        const nid = idOf(u);

        try {
            // Xóa tài khoản cũ ở cả hai nơi để tránh lấy nhầm tài khoản.
            localStorage.removeItem('nv_user');
            sessionStorage.removeItem('nv_user');

            // Lưu tài khoản hiện tại theo lựa chọn ghi nhớ.
            (rememberMe ? localStorage : sessionStorage)
                .setItem('nv_user', JSON.stringify(u));
        } catch {}

        migrateLegacy(nid);
        switchUser(nid);
        setSocialAccount(null);

        setIsLoggedIn(true);
        setUserEmail(u.name || u.email || '');
        notify(msg);

        const prof = uload('nv_profile', null, nid);

        if (!prof || prof.email !== u.email) {
            setObEmail(u.email || '');
            setObName(u.name || '');
            setObErr('');
            setObGoal('');
            setObAge('');
            setObHeight('');
            setObWeight('');
            setIsOnboardOpen(true);
        } else {
            setIsOnboardOpen(false);
        }
    };

    const logout = async () => {
        try {
            const res = await fetch('/api/social-auth', {
                method: 'DELETE', credentials: 'same-origin'
            });
            if (!res.ok && res.status !== 401) throw new Error('Logout failed');
        } catch {
            notify('Không thể đăng xuất trên máy chủ. Vui lòng thử lại.');
            return;
        }
        try {
            localStorage.removeItem('nv_user');
            sessionStorage.removeItem('nv_user');
            [
                'nv_meals',
                'nv_target',
                'nv_weeks',
                'nv_water',
                'nv_workout',
                'nv_plan',
                'nv_profile',
                'nv_scan_corrections'
            ].forEach(k => localStorage.removeItem(k));
        } catch {}

        setSocialAccount(null);
        switchUser('');

        setIsLoggedIn(false);
        setUserEmail('');
        setAuthName('');
        setIsOnboardOpen(false);

        notify('Đã đăng xuất');
        navigate('/');
    };
    const handleAuthSubmit = async (e, mode) => {
        e.preventDefault();
        try {
            const r = await fetch('/api/email-auth', {
                method: 'POST', credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: mode === 'register' ? 'register' : 'login',
                    email: userEmail.trim().toLowerCase(),
                    password: authPassword,
                    name: mode === 'register' ? authName : undefined,
                    remember: rememberMe
                })
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok || !data.user) throw new Error(data.error || 'Đăng nhập không thành công');
            // Only a verified server response can activate the UI session.
            login(data.user, mode === 'register' ? 'Tạo tài khoản thành công 🎉' : undefined);
            setAuthName('');
            setAuthPassword('');
        } catch (err) {
            notify(err.message || 'Không kết nối được máy chủ');
        }
    };
    const fbLogin = () => {
        if (!FACEBOOK_APP_ID || !window.FB)
            return notify('Facebook Login chưa được cấu hình hoặc SDK chưa tải xong');
        FB.login(r => {
            if (r.authResponse?.accessToken) socialLogin('facebook', r.authResponse.accessToken);
            else notify('Bạn chưa cấp quyền đăng nhập Facebook');
        }, { scope: 'public_profile,email' });
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
        try {
            if (uid) {
                localStorage.setItem(
                    ukey('nv_profile', uid),
                    JSON.stringify(prof)
                );
            }
        } catch {}
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

            const storageKey = uid
                ? ukey('nv_scan_corrections', uid)
                : 'nv_scan_corrections';

            localStorage.setItem(storageKey, JSON.stringify(updated));
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
        if (!window.confirm('Xóa toàn bộ phản hồi AI của tài khoản hiện tại trên trình duyệt này?')) return;

        const storageKey = uid
            ? ukey('nv_scan_corrections', uid)
            : 'nv_scan_corrections';

        localStorage.removeItem(storageKey);

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

    const addMeal = async (dish) => {
        if (typeof dish?.name !== 'string' || !dish.name.trim()) {
            notify('Chưa có món ăn hợp lệ để lưu');
            return false;
        }
        // Món chưa có bảng dinh dưỡng vẫn được ghi nhật ký, không tự tạo kcal.
        const hasNutrition = Number.isFinite(dish.calories);
        const newM = {
            id: Date.now().toString(),
            date: dayKey(new Date()),
            name: dish.name,
            category: mealByHour(),
            calories: hasNutrition ? dish.calories : null,
            protein: hasNutrition ? dish.protein : null,
            carbs: hasNutrition ? dish.carbs : null,
            fat: hasNutrition ? dish.fat : null,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            thumb: dish.thumb || null
        };
        if (socialAccount) {
            try {
                const response = await fetch('/api/diary', {
                    method: 'POST', credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newM)
                });
                const data = await response.json();
                if (!response.ok || !data.meal)
                    throw new Error(data.error || 'Không lưu được món ăn');
                setMeals(prev => [...prev, data.meal]);
            } catch (err) { notify(err.message || 'Lỗi database'); return false; }
        } else setMeals(prev => [...prev, newM]);
        navigate('/diary');
        return true;
    };

    const updateMealCategory = async (id, category) => {
        if (socialAccount) {
            try {
                const response = await fetch('/api/diary', {
                    method: 'PATCH', credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, category })
                });
                if (!response.ok) throw new Error();
            } catch { notify('Không thể cập nhật bữa ăn'); return; }
        }
        setMeals(prev => prev.map(meal => meal.id === id ? { ...meal, category } : meal));
    };

    const removeMeal = async id => {
        if (socialAccount) {
            try {
                const response = await fetch('/api/diary?id=' + encodeURIComponent(id), {
                    method: 'DELETE', credentials: 'same-origin'
                });
                if (!response.ok) throw new Error();
            } catch { notify('Không thể xoá món ăn'); return; }
        }
        setMeals(prev => prev.filter(meal => meal.id !== id));
    };

    const value = {
        navigate, heroScanState, setHeroScanState, heroScannedDish, scanErr, todayMeals, sum,
        scanCandidates, scanCorrections, scanCorrectionSaved, chooseScannedDish,
        saveScanCorrection, exportScanCorrections, clearScanCorrections,
        totalCal, targetCal, remainingCal, progress, calorieStatus, showPw, setShowPw, toast,
        notify, rememberMe, setRememberMe, authName, setAuthName, authPassword, setAuthPassword, isLoggedIn, authChecking, userEmail,
        setUserEmail, isTeamOpen, setIsTeamOpen, isGuideOpen, setIsGuideOpen, isOnboardOpen,
        setIsOnboardOpen, obName, setObName, obAge, setObAge, obGender, setObGender, obHeight,
        setObHeight, obWeight, setObWeight, obActivity, setObActivity, obGoal, setObGoal, profile,
        plan, planTw, setPlanTw, planWk, setPlanWk, planErr, setPlanErr, editPlan, setEditPlan,
        water, setWater, workoutDone, setWorkoutDone, obErr, weeklyHistory, loggedDays, weekAvg,
        chartMax, savedWeeklyLogs, isWeeklySaved, rp, pbmi, todayWorkout, dishes, daysIn,
        totalDays, planPct, expectedW, handleSaveWeekToDevice, login, logout, handleAuthSubmit,
        fbLogin, socialLogin, openProfile, saveProfile, savePlan, handleFile, scanImage, addMeal, updateMealCategory,
        removeMeal,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
