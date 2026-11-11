// ===== CẤU HÌNH =====
export const USE_DEMO = false;                     // true: demo 1 món (chưa có backend) | false: gọi API /predict của Thanh

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');   // API /predict của Thanh, cấu hình trong .env

export const UPLOAD_FIELD = 'file';               // tên field ảnh trong FastAPI (đổi nếu khác)

export const GOOGLE_CLIENT_ID = '';               // dán Google Client ID vào đây

export const FACEBOOK_APP_ID = '';                // dán Facebook App ID vào đây

export const FRUITS = [['🍎', 6, 10, 64, 60], ['🥑', 80, 8, 72, -60], ['🍜', 8, 68, 80, 100], ['🍣', 78, 70, 68, 40], ['🥕', 45, 3, 54, -120], ['🍋', 88, 40, 50, -40], ['🍓', 2, 40, 46, -100], ['🥦', 46, 86, 58, 80]]; // [emoji, trái%, trên%, cỡ chữ, độ sâu Z]

export const tilt = e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 16); e.currentTarget.style.setProperty('--my', -((e.clientY - r.top) / r.height - .5) * 10); };

export const GUIDE = [
    ['📸', 'Quét món ăn', 'Bấm "Chọn / chụp ảnh món ăn" ở thẻ xanh bên dưới và chọn ảnh bữa ăn của bạn.'],
    ['➕', 'Thêm vào nhật ký', 'Xem calo và macro rồi bấm "Thêm vào nhật ký". Món tự xếp vào bữa theo giờ, bạn có thể đổi bữa hoặc xoá trong tab 📖 Nhật ký.'],
    ['🎯', 'Đặt mục tiêu calo', 'Nhập chỉ số cơ thể ở mục 🧮 Máy Tính Dinh Dưỡng, mục tiêu calo mỗi ngày sẽ tự cập nhật.'],
    ['📊', 'Xem báo cáo', 'Qua tab 📊 Báo cáo để xem 7 ngày gần nhất và lưu báo cáo tuần.']
];

export const glassInput = 'w-full px-4 py-3 bg-white/15 border border-white/40 rounded-2xl font-semibold text-white placeholder-white/70';

export const MEAL_TYPES = [['breakfast', '🌅 Bữa sáng'], ['lunch', '☀️ Bữa trưa'], ['afternoon', '🍰 Ăn xế'], ['dinner', '🌙 Bữa tối'], ['snack', '🍿 Ăn vặt']];

// SỐ TẠM / 1 khẩu phần: [tên, kcal, protein, carbs, fat] -> thay bằng Bảng TPDD Việt Nam
export const NUTRITION = {
    phobo: ['Phở bò', 450, 28, 55, 12], comtam: ['Cơm tấm sườn', 520, 32, 58, 16], buncha: ['Bún chả', 600, 30, 70, 20],
    spring_rolls: ['Chả giò', 250, 8, 25, 13], fried_rice: ['Cơm chiên', 480, 12, 70, 16], ramen: ['Mì ramen', 550, 22, 70, 20],
    sushi: ['Sushi', 350, 15, 60, 5], pizza: ['Pizza', 540, 22, 66, 20], hamburger: ['Hamburger', 500, 25, 40, 26],
    french_fries: ['Khoai tây chiên', 365, 4, 48, 17], caesar_salad: ['Salad Caesar', 330, 10, 14, 26], omelette: ['Trứng chiên', 190, 13, 1, 15]
};

export const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export const dayKey = d => d.toLocaleDateString('sv-SE'); // YYYY-MM-DD theo giờ máy

export const getUser = () => { try { return JSON.parse(localStorage.getItem('nv_user') || sessionStorage.getItem('nv_user')); } catch { return null; } };

export const mealByHour = () => { const h = new Date().getHours(); return h < 5 || h >= 21 ? 'snack' : h < 10 ? 'breakfast' : h < 14 ? 'lunch' : h < 17 ? 'afternoon' : 'dinner'; };

export const toThumb = f => new Promise(res => {
    const i = new Image();
    i.onload = () => { const c = document.createElement('canvas'), k = 320 / Math.max(i.width, i.height, 320); c.width = i.width * k; c.height = i.height * k; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(i.src); res(c.toDataURL('image/jpeg', .7)); };
    i.onerror = () => res(null);
    i.src = URL.createObjectURL(f);
});

export const GOALS = [['lose', '📉 Giảm cân'], ['gain_muscle', '🏋️ Tăng cơ'], ['gain', '📈 Tăng cân'], ['keep', '⚖️ Giữ cân']];

export const suggestGoal = v => v < 18.5 ? 'gain' : v < 23 ? 'keep' : 'lose';

export const GOAL_LABEL = Object.fromEntries(GOALS);

// SỐ ƯỚC LƯỢNG / 1 khẩu phần, dùng để gợi ý món -> thay bằng Bảng Thành Phần Dinh Dưỡng Việt Nam
export const VN_DISHES = [
    { name: 'Phở bò', calories: 450, protein: 28, carbs: 55, fat: 12 },
    { name: 'Cơm tấm sườn', calories: 520, protein: 32, carbs: 58, fat: 16 },
    { name: 'Bún chả', calories: 600, protein: 30, carbs: 70, fat: 20 },
    { name: 'Bún bò Huế', calories: 550, protein: 30, carbs: 62, fat: 18 },
    { name: 'Hủ tiếu', calories: 450, protein: 22, carbs: 62, fat: 12 },
    { name: 'Gỏi cuốn (2 cuốn)', calories: 160, protein: 9, carbs: 22, fat: 4 },
    { name: 'Canh chua cá + cơm', calories: 420, protein: 30, carbs: 52, fat: 9 },
    { name: 'Cá kho + rau luộc + cơm', calories: 500, protein: 32, carbs: 58, fat: 15 },
    { name: 'Cháo gà', calories: 320, protein: 22, carbs: 42, fat: 6 },
    { name: 'Cơm ức gà luộc + rau', calories: 420, protein: 38, carbs: 48, fat: 6 },
    { name: 'Bánh mì trứng', calories: 350, protein: 14, carbs: 42, fat: 13 }
];

export const suggestDishes = (goal, remaining, targetCal) => {
    const score = { lose: d => -d.protein / d.calories, gain_muscle: d => -d.protein, gain: d => -d.calories, keep: d => Math.abs(d.calories - targetCal / 3) }[goal];
    return VN_DISHES.filter(d => d.calories <= remaining).sort((x, y) => score(x) - score(y)).slice(0, 3);
};

// Lộ trình: p = hồ sơ, pl = {targetWeight, weeks} hoặc null. 1 kg ≈ 7700 kcal
export const computePlan = (p, pl) => {
    const bmr = p.gender === 'male' ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5 : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
    const tdee = Math.round(bmr * p.activity);
    const floor = p.gender === 'male' ? 1500 : 1200;
    const dir = p.goal === 'lose' ? -1 : p.goal === 'keep' ? 0 : 1;
    let daily = { lose: -400, gain_muscle: 300, gain: 500, keep: 0 }[p.goal];
    let weekly = 0, weeks = 0, minWeeks = 0, capped = false;
    if (dir && pl && (pl.targetWeight - p.weight) * dir > 0) {
        const diff = pl.targetWeight - p.weight;
        const maxRate = dir < 0 ? Math.min(1, 0.01 * p.weight) : (p.goal === 'gain_muscle' ? 0.35 : 0.5); // kg/tuần an toàn
        minWeeks = Math.ceil(Math.abs(diff) / maxRate);
        weeks = Math.max(pl.weeks, minWeeks);
        capped = weeks > pl.weeks;
        weekly = diff / weeks;
        daily = Math.round(weekly * 7700 / 7);
    }
    let targetCal = Math.round(tdee + daily), floored = false;
    if (targetCal < floor) { targetCal = floor; floored = true; }
    const protein = Math.round(p.weight * { lose: 1.8, gain_muscle: 2.0, gain: 1.6, keep: 1.4 }[p.goal]);
    const fat = Math.round(targetCal * 0.25 / 9);
    const carbs = Math.max(Math.round((targetCal - protein * 4 - fat * 9) / 4), 0);
    return { tdee, targetCal, daily: targetCal - tdee, weekly, weeks, minWeeks, capped, floored, floor, protein, fat, carbs, water: (p.weight * 0.035).toFixed(1), glasses: Math.ceil(p.weight * 35 / 250) };
};

export const workoutToday = p => {
    const n = p.activity >= 1.725 ? 5 : p.activity >= 1.55 ? 4 : 3;
    const days = { 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6] }[n]; // getDay(): 0 = CN
    const idx = days.indexOf(new Date().getDay());
    const starter = p.activity <= 1.2 ? ' Mới bắt đầu thì làm 15–20 phút rồi tăng dần.' : '';
    if (idx < 0) return { title: 'Ngày nghỉ chủ động', text: 'Đi bộ nhẹ 20–30 phút hoặc giãn cơ 10–15 phút. Cơ bắp phục hồi và phát triển trong ngày nghỉ.' };
    if (p.goal === 'lose') return idx % 2 === 0
        ? { title: 'Cardio nhẹ – vừa', text: '30–45 phút đi bộ nhanh, đạp xe hoặc bơi, nhịp tim vừa phải, vẫn nói chuyện được.' + starter }
        : { title: 'Tập tạ toàn thân', text: '30–40 phút các bài cơ bản (squat, đẩy, kéo) để giữ cơ khi giảm cân.' + starter };
    if (p.goal === 'gain_muscle') return { title: idx % 2 === 0 ? 'Tập thân trên' : 'Tập thân dưới', text: '45–60 phút tập kháng lực, 3–4 bài chính × 3–4 hiệp, tăng dần mức tạ. Ăn đủ đạm sau buổi tập.' + starter };
    if (p.goal === 'gain') return { title: 'Tập tạ toàn thân', text: '40–50 phút ưu tiên bài compound (squat, đẩy ngực, kéo xà/kéo cáp), hạn chế cardio quá nhiều.' + starter };
    return { title: 'Cardio hoặc thể thao', text: '30–45 phút chạy bộ, bơi, cầu lông hoặc môn bạn thích để duy trì sức khỏe.' + starter };
};

// BMI theo chuẩn WHO khu vực châu Á - Thái Bình Dương (phù hợp người Việt)
export const bmiInfo = (w, h) => {
    if (!(w > 0) || !(h > 0)) return null;
    const v = w / Math.pow(h / 100, 2);
    const [label, color] = v < 18.5 ? ['Thiếu cân', 'text-sky-600'] : v < 23 ? ['Bình thường', 'text-emerald-600'] : v < 25 ? ['Thừa cân', 'text-amber-600'] : ['Béo phì', 'text-rose-600'];
    return { value: Math.round(v * 10) / 10, label, color };
};

export const TEAM_MEMBERS = [
    {
        name: 'Lê Hoàng Thanh',
        title: 'Chủ Tịch',
        role: 'Chairman & Founder',
        image: 'images/thanh_le.jpg',
        bio: 'Định hướng chiến lược phát triển hệ sinh thái NutriVN Health Platform.'
    },
    {
        name: 'Võ Quốc Huy',
        title: 'Phó Chủ Tịch',
        role: 'Vice Chairman & Co-Founder',
        image: 'images/huy_vo.jpg',
        bio: 'Phụ trách điều hành tổng thể, phát triển giải pháp AI Vision.'
    },
    {
        name: 'Mai Tuấn Anh',
        title: 'Giám Đốc',
        role: 'Executive Director',
        image: 'images/tuan_anh.jpg',
        bio: 'Quản lý chất lượng trải nghiệm người dùng trên nền tảng Web.'
    },
    {
        name: 'Trần Văn Hồng',
        title: 'Giám Đốc',
        role: 'Technical Director',
        image: 'images/van_hong.png',
        bio: 'Chịu trách nhiệm kiến trúc mô hình Deep Learning nhận diện thực phẩm.'
    }
];

export const INITIAL_MEALS = [
    {
        id: '1',
        name: 'Phở Bò Tái Sài Gòn',
        category: 'breakfast',
        calories: 450,
        protein: 28,
        carbs: 55,
        fat: 12,
        time: '07:30',
        thumb: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=100&q=80'
    },
    {
        id: '3',
        name: 'Cơm Tấm Sườn Nướng',
        category: 'lunch',
        calories: 520,
        protein: 32,
        carbs: 58,
        fat: 16,
        time: '12:15',
        thumb: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'
    }
];

export const FAQ_ITEMS = [
    {
        id: 1,
        question: "NutriVN nhận diện món ăn Việt bằng cách nào?",
        answer: "Máy quét AI của NutriVN dựa trên mô hình Deep Learning được huấn luyện từ hàng nghìn hình ảnh đĩa/tô thực phẩm đặc trưng Việt Nam."
    },
    {
        id: 2,
        question: "Cơ sở dữ liệu 12 món ăn Việt có chuẩn dinh dưỡng không?",
        answer: "Toàn bộ thông số Calo và tỉ lệ Macro (Protein, Carbs, Fat) cho 12 món ăn cốt lõi được tham chiếu trực tiếp từ Bảng Thành Phần Dinh Dưỡng Thực Phẩm Việt Nam."
    },
    {
        id: 3,
        question: "Lượng nước uống được tính toán như thế nào?",
        answer: "Công thức y khoa tiêu chuẩn khuyến nghị 35ml nước trên mỗi 1kg trọng lượng cơ thể."
    },
    {
        id: 4,
        question: "Dữ liệu và ảnh của tôi có được bảo mật không?",
        answer: "Nhật ký ăn uống, mục tiêu calo và báo cáo tuần được lưu ngay trên trình duyệt của bạn. NutriVN không lưu mật khẩu, ảnh món ăn chỉ dùng để nhận diện món và bạn có thể đăng xuất bất cứ lúc nào."
    },
    {
        id:5,
        question: "Nếu muốn đóng góp ý kiến hay phản ứng lỗi thì liên hệ chúng tôi qua đâu?",
        answer: "Ban quản trị NutriVN luôn sẵn sàng lắng nghe bạn! Bạn có thể kết nối trực tiếp với chúng tôi qua các kênh truyền thông chính thức ở chân trang web (Footer) như Facebook, Zalo, GitHub hoặc xem thông tin trong mục Ban Lãnh Đạo."
    }
];
