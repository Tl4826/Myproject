const { test, expect } = require('@playwright/test');
const { mockAuth } = require('./mock-auth.cjs');

const EMAIL = 'reports-qa@example.com';

async function login(page) {
  await mockAuth(page);

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(EMAIL);
  await page.getByPlaceholder('Mật khẩu').fill('Test123456');
  await page.getByRole('button', {
    name: 'Đăng nhập', exact: true
  }).click();

  await expect(page).toHaveURL(/\/home$/);
  const skip = page.getByRole('button', { name: 'Để sau' });
  if (await skip.isVisible()) await skip.click();
}

async function reports(page) {
  await page.goto('/baocao');
  await expect(page).toHaveURL(/\/baocao$/);
}

async function seedPizza(page) {
  // Chỉ tạo dữ liệu trong trình duyệt test.
  await page.evaluate(email => {
    const d = new Date();
    const today = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');

    const meal = {
      id: 'qa-report-1',
      date: today,
      name: 'Pizza',
      category: 'lunch',
      calories: 540,
      protein: 20,
      carbs: 60,
      fat: 24,
      time: '12:00'
    };
    localStorage.setItem('nv_meals:' + email, JSON.stringify([meal]));
  }, EMAIL);

  await page.reload();
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('NV2-REPORT-001 | Truy cập trang báo cáo 7 ngày', async ({ page }) => {
  await reports(page);
  await expect(
    page.getByRole('heading', { name: /Biểu Đồ Xu Hướng Calo 7 Ngày/i })
  ).toBeVisible();
});

test('NV2-REPORT-002 | Báo cáo trống hiển thị chưa có dữ liệu', async ({ page }) => {
  await reports(page);
  await expect(
    page.getByText('Chưa có dữ liệu', { exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText('Chưa có báo cáo tuần nào được lưu')
  ).toBeVisible();
});

test('NV2-REPORT-003 | Báo cáo hiển thị mục tiêu 1600 kcal', async ({ page }) => {
  await reports(page);
  await expect(
    page.getByText(/Mục tiêu 1600 kcal\/ngày/)
  ).toBeVisible();
});

test('NV2-REPORT-004 | Tính trung bình 540 kcal từ nhật ký', async ({ page }) => {
  await seedPizza(page);
  await reports(page);

  await expect(
    page.getByText('TB: 540 kcal/ngày', { exact: true })
  ).toBeVisible();
});

test('NV2-REPORT-005 | Lưu báo cáo tuần và duy trì sau reload', async ({ page }) => {
  await seedPizza(page);
  await reports(page);

  await page.getByRole('button', {
    name: /LƯU BÁO CÁO 7 NGÀY TRÊN THIẾT BỊ/
  }).click();

  await expect(
    page.getByText(/Đã lưu báo cáo tuần này trên thiết bị/)
  ).toBeVisible();

  const saved = await page.evaluate(email =>
    JSON.parse(localStorage.getItem('nv_weeks:' + email)), EMAIL);

  expect(saved.length).toBeGreaterThan(0);
  expect(saved[0].avgCal).toBe(540);
  expect(saved[0].daysRecorded).toBe(1);

  await page.reload();

  await expect(
    page.getByText(/Trung bình: 540 kcal\/ngày/)
  ).toBeVisible();
});
