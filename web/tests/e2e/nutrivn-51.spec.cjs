/**
 * NutriVN QA: IDs mapped 1:1 to the original 51-row Excel.
 * Run from frontend web/: npx.cmd playwright test --config=playwright.config.cjs
 * LIVE_API=1 enables real ONNX /predict checks. They can fail if backend/AI fails.
 * Test data are confined to isolated Playwright browser contexts.
 * Some requirements are NOT implemented in prototype: a FAIL is meaningful, not auto-corrected.
 * Manual/hardware scenarios use test.skip with an explicit reason.
 */
const { test, expect } = require('@playwright/test');
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const path = require('node:path');
const fixtures = path.join(__dirname, 'fixtures');
const API = process.env.NUTRIVN_API || 'http://127.0.0.1:8000';
const LIVE_API = process.env.LIVE_API === '1';
const tinyPng = fs.readFileSync(path.join(fixtures, 'qa_food.png'));
const predict = (mon='pizza', nutrition=true) => ({mon, do_tin_cay:0.92, chac_chan:true, has_nutrition_data:nutrition, top3:[{mon,do_tin_cay:0.92},{mon:'sushi',do_tin_cay:0.05},{mon:'ramen',do_tin_cay:0.03}]});
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function meal(id='qa1', calories=540, name='Pizza QA') { return {id, date:today(), name, category:'lunch', calories, protein:22, carbs:66, fat:20, time:'12:00'}; }
async function seed(page, {user='qa@example.com', meals=[], profile=true}={}) {
  await page.addInitScript(({user, meals, profile})=>{
    if(sessionStorage.getItem('__nutrivn_qa_seeded') === '1') return;
    localStorage.clear(); sessionStorage.clear();
    sessionStorage.setItem('__nutrivn_qa_seeded', '1');
    if(user) localStorage.setItem('nv_user', JSON.stringify({email:user, name:'QA User', provider:'email'}));
    localStorage.setItem('nv_meals', JSON.stringify(meals));
    if(profile) localStorage.setItem('nv_profile', JSON.stringify({email:user,name:'QA User', age:23,gender:'male',height:172,weight:68,activity:1.375,goal:'keep'}));
  }, {user, meals, profile});
}
async function home(page, opts={}) { await seed(page, opts); await page.goto('/home'); await expect(page).toHaveURL(/\/home/); }
async function mockPredict(page, value=predict(), status=200) {
  await page.route('**/predict', async route => route.fulfill({status, contentType:'application/json', body: JSON.stringify(value)}));
}
async function upload(page, name='qa.png', buffer=tinyPng, mime='image/png') {
  await page.locator('input[type="file"]').first().setInputFiles({name,mimeType:mime,buffer});
}
async function mockScan(page, value=predict()) {
  await mockPredict(page,value); await home(page); await upload(page);
  await expect(page.getByText('Top 3 dự đoán', {exact:false})).toBeVisible();
}
async function health(request) {return request.get(`${API}/health`, {timeout:20000});}
async function livePredict(request, buffer=tinyPng, name='qa.png', mimeType='image/png') {
  return request.post(`${API}/predict`, { multipart:{file:{name,mimeType,buffer}}, timeout:120000 });
}
function manual(id,title,reason) {test(`${id} | ${title}`,async()=>{test.skip(true,reason);});}

// AUTH (11 cases)
test('TC-AUTH-001 | Form đăng ký hiển thị', async({page})=>{await page.goto('/dangki'); await expect(page.getByRole('heading',{name:'Tạo tài khoản'})).toBeVisible(); await expect(page.locator('input[type=email]')).toBeVisible();});
test('TC-AUTH-002 | Đăng ký dữ liệu hợp lệ (prototype)', async({page})=>{await page.goto('/dangki'); await page.getByPlaceholder('Họ và tên').fill('QA Tester');await page.locator('input[type=email]').fill('qa-register@example.com');await page.locator('input[autocomplete=new-password]').fill('Test@12345');await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();await expect(page).toHaveURL(/\/home/);});
test('TC-AUTH-003 | Bắt buộc nhập email/mật khẩu',async({page})=>{await page.goto('/dangki');await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();expect(await page.locator('input[type=email]').evaluate(x=>x.validity.valueMissing)).toBe(true);await expect(page).toHaveURL(/\/dangki/);});
test('TC-AUTH-004 | Email sai định dạng',async({page})=>{await page.goto('/dangki');await page.locator('input[type=email]').fill('invalid-email');expect(await page.locator('input[type=email]').evaluate(x=>x.validity.typeMismatch)).toBe(true);});
test('TC-AUTH-005 | Mật khẩu ngắn hơn 6 ký tự',async({page})=>{await page.goto('/dangki');await page.locator('input[type=password]').fill('123');expect(await page.locator('input[type=password]').evaluate(x=>x.validity.tooShort)).toBe(true);});
test('TC-AUTH-006 | Form đăng nhập và xác thực hợp lệ',async({page})=>{await page.goto('/login');await expect(page.locator('input[type=password]')).toBeVisible();await page.locator('input[type=email]').fill('qa@example.com');await page.locator('input[type=password]').fill('Test@12345');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page).toHaveURL(/\/home/);});
test('TC-AUTH-007 | Sai mật khẩu phải bị từ chối — expected product behavior',async({page})=>{await page.goto('/login');await page.locator('input[type=email]').fill('qa@example.com');await page.locator('input[type=password]').fill('wrongpass');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page).toHaveURL(/\/login/);});
test('TC-AUTH-008 | Email chưa đăng ký phải bị từ chối — expected product behavior',async({page})=>{await page.goto('/login');await page.locator('input[type=email]').fill('never-registered@example.com');await page.locator('input[type=password]').fill('Test@12345');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page).toHaveURL(/\/login/);});
test('TC-AUTH-009 | Ghi nhớ phiên và đăng xuất',async({page})=>{await page.goto('/login');await page.locator('input[type=email]').fill('qa@example.com');await page.locator('input[type=password]').fill('Test@12345');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page).toHaveURL(/\/home/);expect(await page.evaluate(()=>!!localStorage.getItem('nv_user'))).toBe(true);await page.reload();await expect(page).toHaveURL(/\/home/);});
test('TC-AUTH-010 | Chặn route nội bộ nếu chưa login',async({page})=>{await seed(page,{user:null,profile:false});for(const path of ['/home','/diary','/baocao']){await page.goto(path);await expect(page).toHaveURL(/\/login/);}});
test('TC-AUTH-011 | Reload giữ session',async({page})=>{await home(page);await page.reload();await expect(page).toHaveURL(/\/home/);});

// FOOD (12 cases)
test('TC-FOOD-001 | Upload ảnh và hiển thị dự đoán (mock API)',async({page})=>{await mockScan(page);await expect(page.getByText('Pizza',{exact:false}).first()).toBeVisible();});
manual('TC-FOOD-002','Chụp bằng camera thật','Cần camera thật/thiết bị và kiểm tra thao tác chụp, quyền thiết bị');
test('TC-FOOD-003 | Camera bị từ chối quyền',async({page,context})=>{await context.clearPermissions();await home(page);await page.getByRole('button',{name:/Chụp ảnh món ăn/i}).click();await expect(page.getByRole('button',{name:'Đóng camera'})).toBeVisible();});
test('TC-FOOD-004 | Frontend từ chối tệp không phải ảnh',async({page})=>{await home(page);await upload(page,'bad.txt',Buffer.from('not image'),'text/plain');await expect(page.getByText('Chỉ nhận file ảnh dưới 8MB')).toBeVisible();});
test('TC-FOOD-005 | Frontend từ chối tệp trên 8MB',async({page})=>{await home(page);await upload(page,'large.png',Buffer.alloc(8_100_001),'image/png');await expect(page.getByText('Chỉ nhận file ảnh dưới 8MB')).toBeVisible();});
test('TC-FOOD-006 | API từ chối ảnh trên 20 triệu pixel',async({request})=>{ // Tiny compressed PNG header declares 5000 x 5000
  const png=Buffer.from(tinyPng);png.writeUInt32BE(5000,16);png.writeUInt32BE(5000,20);
  const zlib=require('node:zlib');let crc=0xffffffff;for(const b of png.subarray(12,29)){crc^=b;for(let j=0;j<8;j++)crc=crc&1?(crc>>>1)^0xedb88320:crc>>>1;}png.writeUInt32BE((crc^0xffffffff)>>>0,29);
  const r=await livePredict(request,png);expect(r.status()).toBe(413);
});
manual('TC-FOOD-007','Ảnh mờ/tối/bị che','Cần bộ ảnh chất lượng thấp đã gán nhãn và tiêu chí chấp nhận dự đoán');
manual('TC-FOOD-008','Ảnh không có thức ăn','Cần yêu cầu rõ về cơ chế từ chối ảnh ngoài 100 lớp; classifier hiện luôn đưa dự đoán');
test('TC-FOOD-009 | Top-3 hiển thị đủ 3 lựa chọn',async({page})=>{await mockScan(page);await expect(page.getByRole('button',{name:/1\. pizza/i})).toBeVisible();await expect(page.getByRole('button',{name:/2\. sushi/i})).toBeVisible();await expect(page.getByRole('button',{name:/3\. ramen/i})).toBeVisible();});
test('TC-FOOD-010 | Chọn lại món dự đoán',async({page})=>{await mockScan(page);await page.getByRole('button',{name:/2\. sushi/i}).click();await expect(page.getByText('Sushi',{exact:false}).first()).toBeVisible();});
test('TC-FOOD-011 | Lỗi khi mất kết nối nhận diện',async({page})=>{await page.route('**/predict',r=>r.abort('failed'));await home(page);await upload(page);await expect(page.getByText('Không thể nhận diện ảnh:',{exact:false})).toBeVisible();});
test('TC-FOOD-012 | API WebP và BMP',async({request})=>{test.skip(!LIVE_API,'Cần LIVE_API=1 để chạy suy luận với ảnh WebP/BMP');for(const [file,mime] of [['qa_food.webp','image/webp'],['qa_food.bmp','image/bmp']]){const r=await livePredict(request,fs.readFileSync(path.join(fixtures,file)),file,mime);expect(r.status()).toBe(200);}});

// NUTRITION (4 cases)
test('TC-NUT-001 | Món có mapping dinh dưỡng',async({page})=>{await mockScan(page,predict('pizza'));await expect(page.getByText('540 kcal',{exact:true}).first()).toBeVisible();});
test('TC-NUT-002 | Món thiếu dinh dưỡng không hiện 0 kcal',async({page})=>{await mockScan(page,predict('tiramisu',false));await expect(page.getByText('Chưa có dữ liệu kcal')).toBeVisible();await expect(page.getByRole('button',{name:'LƯU ƯỚC TÍNH VÀO NHẬT KÝ'})).toHaveCount(0);});
test('TC-NUT-003 | Đơn vị và khẩu phần tham khảo',async({page})=>{await mockScan(page);await expect(page.getByText(/P:22g C:66g F:20g/)).toBeVisible();await expect(page.getByText(/khẩu phần tham khảo/)).toBeVisible();});
test('TC-NUT-004 | Đổi món đổi dữ liệu dinh dưỡng',async({page})=>{await mockScan(page);await page.getByRole('button',{name:/2\. sushi/i}).click();await expect(page.getByText('350 kcal',{exact:true}).first()).toBeVisible();});

// DIARY (6 cases)
test('TC-DIARY-001 | Thêm món từ kết quả scan',async({page})=>{await mockScan(page);await page.getByRole('button',{name:'LƯU ƯỚC TÍNH VÀO NHẬT KÝ'}).click();await expect(page).toHaveURL(/\/diary/);await expect(page.getByText('Pizza',{exact:false}).first()).toBeVisible();});
test('TC-DIARY-002 | Xóa/sửa category của mục nhật ký',async({page})=>{await home(page,{meals:[meal()]});await page.goto('/diary');await expect(page.getByText('Pizza QA')).toBeVisible();const select=page.locator('select').first();if(await select.count())await select.selectOption({index:1});await page.getByRole('button',{name:'Xoá món'}).click();await expect(page.getByText('Pizza QA')).toHaveCount(0);});
test('TC-DIARY-003 | Nhật ký giữ dữ liệu sau reload',async({page})=>{await home(page,{meals:[meal()]});await page.goto('/diary');await page.reload();await expect(page.getByText('Pizza QA')).toBeVisible();});
test('TC-DIARY-004 | Hai tài khoản không được chia sẻ nhật ký',async({page})=>{await home(page,{user:'a@example.com',meals:[meal()]});await page.evaluate(()=>localStorage.setItem('nv_user',JSON.stringify({email:'b@example.com',name:'B',provider:'email'})));await page.reload();await page.goto('/diary');await expect(page.getByText('Pizza QA')).toHaveCount(0);});
test('TC-DIARY-005 | Nhiều món trong một ngày',async({page})=>{await home(page,{meals:[meal('qa1',540,'Pizza QA'),meal('qa2',350,'Sushi QA')]});await page.goto('/diary');await expect(page.getByText('Pizza QA')).toBeVisible();await expect(page.getByText('Sushi QA')).toBeVisible();await expect(page.getByText(/2 món đã lưu/)).toBeVisible();});
test('TC-DIARY-006 | Ngày trống',async({page})=>{await home(page,{meals:[]});await page.goto('/diary');await expect(page.getByText('Chưa có món nào hôm nay')).toBeVisible();});

// REPORT (4 cases)
test('TC-REPORT-001 | Trang báo cáo mở được',async({page})=>{await home(page,{meals:[meal()]});await page.goto('/baocao');await expect(page).toHaveURL(/\/baocao/);await expect(page.locator('body')).not.toBeEmpty();});
test('TC-REPORT-002 | Báo cáo có dữ liệu calo phù hợp',async({page})=>{await home(page,{meals:[meal('x',540)]});await page.goto('/baocao');await expect(page.getByText(/540/).first()).toBeVisible();});
test('TC-REPORT-003 | Báo cáo khi không có bữa ăn',async({page})=>{await home(page,{meals:[]});await page.goto('/baocao');await expect(page.locator('body')).not.toContainText('NaN');});
manual('TC-REPORT-004','Thay đổi khoảng thời gian','Bản giao diện đang được kiểm tra thể hiện báo cáo 7 ngày; xác minh đặc tả yêu cầu chọn phạm vi khác');

// PROFILE (3 cases)
test('TC-PROFILE-001 | Cập nhật hồ sơ',async({page})=>{await home(page);await page.getByRole('button',{name:/Sửa thông tin/}).click();await page.getByPlaceholder('Nguyễn Văn A').fill('QA Edited');await page.getByRole('button',{name:'LƯU & BẮT ĐẦU'}).click();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nv_profile')).name)).toBe('QA Edited');});
test('TC-PROFILE-002 | Lưu hồ sơ qua reload',async({page})=>{await home(page);await page.reload();const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('nv_profile')));expect(profile.weight).toBe(68);});
test('TC-PROFILE-003 | Nhập tuổi không hợp lệ',async({page})=>{await home(page);await page.getByRole('button',{name:/Sửa thông tin/}).click();await page.getByPlaceholder('20').fill('0');await page.getByRole('button',{name:'LƯU & BẮT ĐẦU'}).click();await expect(page.getByText('Tuổi phải từ 10 đến 100')).toBeVisible();});

// API (7 cases)
test('TC-API-001 | GET /health',async({request})=>{const r=await health(request);expect(r.status()).toBe(200);const d=await r.json();expect(d.ok).toBe(true);expect(Array.isArray(d.classes)).toBe(true);expect(d.class_count).toBe(d.classes.length);});
test('TC-API-002 | POST /predict ảnh thật',async({request})=>{test.skip(!LIVE_API,'Chỉ chạy khi LIVE_API=1; có thể cần ảnh thật thay qa.png');const r=await livePredict(request);expect(r.status()).toBe(200);const d=await r.json();expect(typeof d.mon).toBe('string');});
test('TC-API-003 | Predict thiếu field file',async({request})=>{const r=await request.post(`${API}/predict`,{data:{},timeout:20000});expect(r.status()).toBe(422);});
test('TC-API-004 | CORS origin hợp lệ/không hợp lệ',async({request})=>{const allowed=await request.fetch(`${API}/predict`,{method:'OPTIONS',headers:{origin:'http://localhost:5173','access-control-request-method':'POST'},timeout:20000});expect(allowed.headers()['access-control-allow-origin']).toBe('http://localhost:5173');const denied=await request.fetch(`${API}/predict`,{method:'OPTIONS',headers:{origin:'https://untrusted.example','access-control-request-method':'POST'},timeout:20000});expect(denied.headers()['access-control-allow-origin']).toBeUndefined();});
manual('TC-API-005','Model bị thiếu/hỏng','Cần khởi động server riêng với MODEL_DIR không hợp lệ để không tác động phiên API đang chạy');
test('TC-API-006 | Đo thời gian đáp ứng health',async({request})=>{const samples=[];for(let i=0;i<5;i++){const start=Date.now();const r=await health(request);expect(r.ok()).toBe(true);samples.push(Date.now()-start);}test.info().annotations.push({type:'timings-ms',description:samples.join(',')});});
test('TC-API-007 | Schema JSON /predict',async({request})=>{test.skip(!LIVE_API,'Cần LIVE_API=1 và ảnh hợp lệ để kiểm tra model thật');const r=await livePredict(request);expect(r.status()).toBe(200);const d=await r.json();expect(typeof d.mon).toBe('string');expect(Array.isArray(d.top3)).toBe(true);expect(d.do_tin_cay).toBeGreaterThanOrEqual(0);expect(d.do_tin_cay).toBeLessThanOrEqual(1);});

// UI (4 cases)
test('TC-UI-001 | Desktop không tràn ngang',async({page})=>{await page.setViewportSize({width:1366,height:768});await page.goto('/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBe(true);});
test('TC-UI-002 | Mobile không tràn ngang',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBe(true);});
test('TC-UI-003 | Hiển thị lỗi khi API không phản hồi',async({page})=>{await page.route('**/predict',r=>r.abort('failed'));await home(page);await upload(page);await expect(page.getByText(/Không thể nhận diện ảnh:/)).toBeVisible();});
test('TC-UI-004 | Không có JS uncaught exception khi điều hướng',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.goto('/login');await page.goto('/dangki');expect(errors).toEqual([]);});
