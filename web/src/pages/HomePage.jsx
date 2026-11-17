import { useState } from 'react';
import { GOAL_LABEL, FAQ_ITEMS, FOOD_CLASSES } from '../lib/data.js';
import CountUp from '../components/CountUp.jsx';
import GuideAccordion from '../components/GuideAccordion.jsx';
import CameraCapture from '../components/CameraCapture.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function HomePage() {
    const {
        heroScanState, setHeroScanState, heroScannedDish, scanErr, sum, totalCal, targetCal,
        remainingCal, progress, calorieStatus, notify, isLoggedIn, userEmail, isGuideOpen,
        setIsGuideOpen, profile, plan, planTw, setPlanTw, planWk, setPlanWk, planErr, setPlanErr,
        editPlan, setEditPlan, water, setWater, workoutDone, setWorkoutDone, rp, pbmi,
        todayWorkout, dishes, daysIn, totalDays, planPct, expectedW, openProfile, savePlan,
        handleFile, scanImage, addMeal, scanCandidates, scanCorrections, scanCorrectionSaved,
        chooseScannedDish, saveScanCorrection, exportScanCorrections, clearScanCorrections,
    } = useApp();
    const [cameraOpen, setCameraOpen] = useState(false);

    const useCameraPhoto = file => {
        setCameraOpen(false);
        scanImage(file);
    };

    return (
        <div className="space-y-4">
            {cameraOpen && (
                <CameraCapture
                    onClose={() => setCameraOpen(false)}
                    onUsePhoto={useCameraPhoto}
                />
            )}
            {isLoggedIn && <h2 className="px-1 text-lg font-black text-slate-800">Xin chào, <span className="text-emerald-600">{userEmail.split('@')[0]}</span> 👋</h2>}
            <GuideAccordion isOpen={isGuideOpen} onToggle={() => setIsGuideOpen(open => !open)} />
            <section className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white rounded-3xl p-5 shadow-lg space-y-4 border border-emerald-500">
                <div className="text-center space-y-1">
                    <span className="bg-white/20 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        📸 TÍNH NĂNG CHÍNH
                    </span>
                    <h3 className="text-xl font-black">QUÉT 100 MÓN ĂN BẰNG AI</h3>
                    <p className="text-xs text-emerald-100">Chụp ảnh ngay trên ứng dụng hoặc chọn từ thư viện để AI nhận diện món ăn</p>
                </div>

                <div className="bg-white text-slate-900 rounded-2xl p-3 shadow-md space-y-3">
                    {heroScanState === 'idle' && (
                        <div className="py-3 text-center space-y-2">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 text-2xl rounded-full flex items-center justify-center mx-auto">📷</div>
                            <p className="text-xs font-bold text-slate-700">Chưa có ảnh được quét</p>
                        </div>
                    )}
                    {heroScanState === 'scanning' && (
                        <div className="py-5 text-center space-y-2">
                            <div className="text-3xl animate-bounce">🤖</div>
                            <p className="text-xs font-extrabold text-emerald-800 animate-pulse">Đang nhận diện món ăn...</p>
                        </div>
                    )}
                    {heroScanState === 'result' && heroScannedDish && (
                        <div className="space-y-2">
                            {heroScannedDish.thumb && <img src={heroScannedDish.thumb} alt="" className="w-full h-28 object-cover rounded-xl" />}
                            <div className="flex justify-between items-center text-xs gap-2">
                                <span className="font-extrabold text-slate-900">{heroScannedDish.name}</span>
                                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {heroScannedDish.hasNutrition ? `${heroScannedDish.calories} kcal` : 'Chưa có dữ liệu kcal'}
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold">
                                {heroScannedDish.hasNutrition && `P:${heroScannedDish.protein}g C:${heroScannedDish.carbs}g F:${heroScannedDish.fat}g • `}
                                {heroScannedDish.conf == null ? 'Món do bạn chọn (không có xác suất AI)' : `Độ tin cậy nhận diện ${heroScannedDish.conf}%`}
                            </div>
                            {!!scanCandidates.length && (
                                <div className="rounded-xl bg-slate-50 p-2 space-y-2">
                                    <p className="text-[11px] font-bold text-slate-700">Top 3 dự đoán — chọn món đúng nếu AI nhầm:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {scanCandidates.map((candidate, i) => (
                                            <button key={candidate.mon} type="button" onClick={() => chooseScannedDish(candidate.mon)}
                                                className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50">
                                                {i + 1}. {candidate.mon} ({Math.round(candidate.do_tin_cay * 100)}%)
                                            </button>
                                        ))}
                                    </div>
                                    <label className="block text-[11px] font-semibold text-slate-700">
                                        Không đúng? Chọn trong 100 món:
                                        <select value="" onChange={e => { if (e.target.value) chooseScannedDish(e.target.value); }}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs">
                                            <option value="">-- Chọn tên món đúng --</option>
                                            {FOOD_CLASSES.map(label => <option key={label} value={label}>{label}</option>)}
                                        </select>
                                    </label>
                                    {heroScannedDish.manuallySelected && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-emerald-700 font-semibold">Đã dùng tên món bạn chọn thay cho dự đoán ban đầu của AI.</p>
                                            <button type="button" disabled={scanCorrectionSaved} onClick={saveScanCorrection}
                                                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                                                {scanCorrectionSaved ? '✓ Đã lưu phản hồi' : 'Ghi nhận AI đoán sai'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {heroScannedDish.hasNutrition
                                ? <p className="text-[10px] text-amber-700 font-semibold">Dinh dưỡng ước tính theo khẩu phần tham khảo, không suy ra lượng ăn thực tế từ ảnh.</p>
                                : <p className="text-[10px] text-amber-700 font-bold">AI đã nhận diện món ăn, nhưng chưa có dữ liệu dinh dưỡng để thêm nhật ký.</p>}
                            {!heroScannedDish.sure && !heroScannedDish.manuallySelected && <p className="text-[10px] font-bold text-amber-600">⚠️ Độ tin cậy thấp; hãy chụp lại hoặc chọn món đúng.</p>}
                            {heroScannedDish.hasNutrition && (
                                <button onClick={() => { addMeal(heroScannedDish); setHeroScanState('idle'); notify('Đã thêm vào nhật ký'); }}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm">
                                    LƯU ƯỚC TÍNH VÀO NHẬT KÝ
                                </button>
                            )}
                        </div>
                    )}
                    {scanErr && heroScanState === 'idle' && <p className="text-[10px] font-bold text-rose-600 text-center px-2">{scanErr}</p>}
                </div>

                <div className="rounded-xl bg-emerald-900/20 px-3 py-2 text-[11px] text-white space-y-1">
                    <p className="font-bold">Phản hồi nhận diện: {scanCorrections.length} trường hợp lưu trên trình duyệt này</p>
                    <p>Chỉ lưu tên món và xác suất; không lưu ảnh và không tự động gửi dữ liệu lên server.</p>
                    {scanCorrections.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                            <button type="button" onClick={exportScanCorrections} className="rounded-lg bg-white px-2 py-1 font-bold text-emerald-800">Xuất phản hồi JSON</button>
                            <button type="button" onClick={clearScanCorrections} className="rounded-lg border border-white/70 px-2 py-1 font-bold">Xóa phản hồi</button>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => setCameraOpen(true)}
                        disabled={heroScanState === 'scanning'}
                        className="min-h-12 rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-md hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">
                        📷 CHỤP ẢNH MÓN ĂN
                    </button>
                    <label className={`min-h-12 rounded-2xl bg-emerald-800/80 px-4 py-3 text-center text-sm font-black text-white shadow-md hover:bg-emerald-900 ${heroScanState === 'scanning' ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                        🖼️ CHỌN ẢNH TỪ THƯ VIỆN
                        <input type="file" accept="image/*" onChange={handleFile} disabled={heroScanState === 'scanning'} className="sr-only" aria-label="Chọn ảnh món ăn từ thư viện" />
                    </label>
                </div>
            </section>

            {/* Daily Calorie Budget Progress */}
            <section className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl p-5 border border-emerald-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-emerald-700 text-sm">⚡ Ngân Sách Calo Hôm Nay</h3>
                <div className="flex items-center gap-5">
                    <div className="relative w-32 h-32 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-emerald-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className={(totalCal > targetCal ? 'text-rose-500' : 'text-emerald-500') + ' transition-all duration-700'} strokeDasharray={`${progress}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-slate-900 leading-none"><CountUp value={progress} />%</span>
                            <span className="text-[10px] font-bold text-emerald-600 mt-1">hoàn thành</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="bg-white rounded-2xl border border-emerald-200 px-3 py-2.5 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-500">🎯 Mục tiêu mỗi ngày</div>
                            <div className="text-2xl font-black text-emerald-700 leading-tight"><CountUp value={targetCal} /> <span className="text-xs font-bold text-slate-500">kcal</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-white rounded-xl border border-slate-200 py-1.5">
                                <div className="text-[10px] font-bold text-slate-500">Đã ăn</div>
                                <div className="text-sm font-black text-slate-900"><CountUp value={totalCal} /></div>
                            </div>
                            <div aria-label={calorieStatus.label} className={`rounded-xl border py-1.5 ${calorieStatus.bg}`}>
                                <div className="text-[10px] font-bold text-slate-500">
                                    {totalCal > targetCal ? 'Vượt mục tiêu' : 'Còn lại'}
                                </div>
                                <div className={`text-sm font-black ${calorieStatus.text}`}>
                                    <CountUp value={Math.abs(remainingCal)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                    {[['Protein', 'protein', 'bg-sky-100 text-sky-700'], ['Carbs', 'carbs', 'bg-amber-100 text-amber-700'], ['Fat', 'fat', 'bg-rose-100 text-rose-700']].map(([name, k, c]) => (
                        <div key={k} className={`rounded-xl py-1.5 ${c}`}>
                            <div className="text-[10px] font-bold">{name}</div>
                            <div className="text-sm font-black">{sum(k)}g</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Lộ trình hôm nay */}
            <section className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
                <div className="border-b pb-2 flex items-start justify-between gap-2">
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-xs uppercase">🗺️ Lộ Trình Của Bạn</h3>
                        <p className="text-[10px] text-slate-500 font-bold">{profile ? `${GOAL_LABEL[profile.goal]} · BMI ${pbmi.value} (${pbmi.label})` : 'Chưa có thông tin cơ thể'}</p>
                    </div>
                    <button onClick={openProfile} className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 shrink-0">✏️ {profile ? 'Sửa thông tin' : 'Nhập thông tin'}</button>
                </div>

                {!profile ? (
                    <p className="text-[11px] text-slate-500 font-bold text-center py-3">Nhập tuổi, chiều cao, cân nặng và mục tiêu để nhận lộ trình calo, nước uống, vận động và món ăn phù hợp mỗi ngày.</p>
                ) : (<>
                    {profile.goal === 'keep' ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] font-bold text-emerald-800">⚖️ Giữ cân quanh {profile.weight} kg: ăn khoảng {rp.targetCal} kcal/ngày và cân lại mỗi tuần để theo dõi.</div>
                    ) : (!plan || editPlan) ? (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                            <div className="text-[10px] font-bold text-slate-500">Đặt đích đến cho lộ trình {GOAL_LABEL[profile.goal]} (hiện tại {profile.weight} kg)</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500">Cân nặng mục tiêu (kg)</label>
                                    <input type="number" value={planTw} onChange={e => setPlanTw(e.target.value)} placeholder={String(Math.round(profile.weight * (profile.goal === 'lose' ? 0.95 : 1.05)))} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500">Trong bao nhiêu tuần</label>
                                    <input type="number" value={planWk} onChange={e => setPlanWk(e.target.value)} placeholder="8" className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold" />
                                </div>
                            </div>
                            {planErr && <p className="text-[11px] font-bold text-rose-600">{planErr}</p>}
                            <div className="flex gap-2">
                                <button onClick={savePlan} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm">⚡ LẬP LỘ TRÌNH</button>
                                {plan && <button onClick={() => { setEditPlan(false); setPlanErr(''); setPlanTw(String(plan.targetWeight)); setPlanWk(String(plan.weeks)); }} className="px-3 py-2.5 text-xs font-bold text-slate-500">Huỷ</button>}
                            </div>
                            {!plan && <p className="text-[10px] text-slate-400 font-bold italic">Chưa lập lộ trình: calo đang tính theo mức mặc định của mục tiêu.</p>}
                        </div>
                    ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                            <div className="flex justify-between items-center">
                                <div className="text-xs font-black text-emerald-800">{plan.startWeight} → {plan.targetWeight} kg · {rp.weeks} tuần</div>
                                <button onClick={() => setEditPlan(true)} className="text-[10px] font-black text-emerald-700 underline">Chỉnh</button>
                            </div>
                            <div className="text-[10px] font-bold text-emerald-700">Tốc độ {rp.weekly > 0 ? '+' : ''}{rp.weekly.toFixed(2)} kg/tuần · Ngày {Math.min(daysIn + 1, totalDays)}/{totalDays}</div>
                            <div className="h-2 bg-white rounded-full overflow-hidden border border-emerald-100"><div className="h-full bg-emerald-500" style={{ width: planPct + '%' }} /></div>
                            <div className="text-[10px] font-bold text-slate-600">Cân nặng dự kiến hôm nay: ~{expectedW} kg</div>
                            {rp.capped && <p className="text-[10px] font-bold text-amber-600">⚠️ {plan.weeks} tuần là hơi nhanh. Mình đặt tối thiểu {rp.minWeeks} tuần để an toàn cho sức khỏe.</p>}
                            {rp.floored && <p className="text-[10px] font-bold text-amber-600">⚠️ Calo được giữ ở mức tối thiểu an toàn {rp.floor} kcal/ngày nên có thể chậm hơn dự kiến.</p>}
                            {daysIn >= totalDays && <p className="text-[10px] font-black text-emerald-800">🏁 Lộ trình đã kết thúc. Bấm "Sửa thông tin" để cập nhật cân nặng và lập lộ trình mới.</p>}
                        </div>
                    )}

                    <div className="text-[11px] font-black text-slate-900 pt-1">✅ Việc cần làm hôm nay</div>

                    <div className="p-3 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-900">🍽️ Ăn đủ calo & macro</span>
                            <span className="font-black text-emerald-700">{totalCal}/{rp.targetCal} kcal</span>
                        </div>
                        {[['Protein', 'protein', rp.protein, 'bg-sky-500'], ['Carbs', 'carbs', rp.carbs, 'bg-amber-500'], ['Fat', 'fat', rp.fat, 'bg-rose-500']].map(([n, k, t, c]) => (
                            <div key={k}>
                                <div className="flex justify-between text-[10px] font-bold text-slate-500"><span>{n}</span><span>{sum(k)}/{t} g</span></div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={'h-full ' + c} style={{ width: (t ? Math.min(100, Math.round(sum(k) / t * 100)) : 0) + '%' }} /></div>
                            </div>
                        ))}
                        <p className="text-[10px] text-slate-400 font-bold">{rp.daily === 0 ? 'Mức duy trì' : (rp.daily > 0 ? '+' : '') + rp.daily + ' kcal so với nhu cầu duy trì'} ({rp.tdee} kcal)</p>
                    </div>

                    <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${water >= rp.glasses ? 'border-sky-400 bg-sky-50' : 'border-sky-200 bg-sky-50/50'}`}>
                        <div>
                            <div className="text-xs font-extrabold text-slate-900">💧 Uống nước {water >= rp.glasses && '✅'}</div>
                            <div className="text-[10px] font-bold text-slate-500">Mục tiêu {rp.water} lít ≈ {rp.glasses} ly (250 ml)</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setWater(Math.max(0, water - 1))} aria-label="Bớt 1 ly" className="w-8 h-8 rounded-full bg-white border border-sky-200 font-black text-sky-700">−</button>
                            <span className="text-sm font-black text-sky-700 w-12 text-center">{water}/{rp.glasses}</span>
                            <button onClick={() => setWater(water + 1)} aria-label="Thêm 1 ly" className="w-8 h-8 rounded-full bg-white border border-sky-200 font-black text-sky-700">+</button>
                        </div>
                    </div>

                    <div className={`p-3 rounded-2xl border space-y-1 ${workoutDone ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-900">🏃 {todayWorkout.title}</span>
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer">
                                <input type="checkbox" checked={workoutDone} onChange={e => setWorkoutDone(e.target.checked)} className="w-4 h-4 accent-emerald-600" />Đã xong
                            </label>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{todayWorkout.text}</p>
                    </div>

                    <div className="p-3 rounded-2xl border border-slate-200 space-y-2">
                        <div className="text-xs font-extrabold text-slate-900">🥗 Gợi ý món ăn Việt phù hợp</div>
                        {dishes.length ? dishes.map(d => (
                            <div key={d.name} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2">
                                <div>
                                    <div className="text-xs font-extrabold text-slate-800">{d.name}</div>
                                    <div className="text-[10px] font-bold text-slate-500">{d.calories} kcal · P{d.protein} C{d.carbs} F{d.fat}</div>
                                </div>
                                <button onClick={() => { addMeal(d); notify('Đã thêm vào nhật ký'); }} className="text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-2.5 py-1.5 shrink-0">+ Thêm</button>
                            </div>
                        )) : <p className="text-[11px] text-slate-500 font-bold">{rp.targetCal - totalCal <= 0 ? '🎉 Bạn đã đủ calo hôm nay.' : 'Calo còn lại ít, hãy chọn món nhẹ hoặc uống thêm nước.'}</p>}
                        <p className="text-[9px] text-slate-400 font-bold italic">Gợi ý theo calo còn lại hôm nay · số liệu ước lượng 1 khẩu phần</p>
                    </div>
                </>)}
            </section>

            {/* Interactive FAQ Accordion Section */}
            {/* FAQ: thu gọn mặc định, có thể mở bằng chuột hoặc bàn phím */}
            <section
                className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3"
                aria-labelledby="faq-title"
            >
                <div className="border-b pb-2">
                    <h3 id="faq-title" className="font-extrabold text-slate-900 text-xs uppercase">❓ Câu Hỏi Thường Gặp (FAQ)</h3>
                    <p className="text-[10px] text-slate-500 font-bold">Bấm vào từng câu hỏi để xem lời giải đáp</p>
                </div>
                <div className="space-y-2 text-xs">
                    {FAQ_ITEMS.map(faq => (
                        <details key={faq.id} className="group border border-slate-200 rounded-2xl overflow-hidden">
                            <summary className="p-3 bg-slate-50 text-left font-extrabold text-slate-800 cursor-pointer">
                                {faq.question}
                            </summary>
                            <div className="p-3 bg-white border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed font-medium">
                                {faq.answer}
                            </div>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}
