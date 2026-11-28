const { test, expect } = require('@playwright/test');
const { mockAuth } = require('./mock-auth.cjs');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5kAAAAASUVORK5CYII=',
  'base64'
);

const ACCOUNT_A = 'diary-a@example.com';
const ACCOUNT_B = 'diary-b@example.com';

async function login(page, email = ACCOUNT_A) {
  await page.goto('/login');

  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Mật khẩu').fill('Test123456');

  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  await expect(page).toHaveURL(/\/home$/);

  const skip = page.getByRole('button', { name: 'Để sau' });

  if (await skip.isVisible()) {
    await skip.click();
  }
}

async function openDiary(page) {
  await page.goto('/diary');

  await expect(page).toHaveURL(/\/diary$/);

  await expect(
    page.getByRole('heading', {
      name: /Nhật Ký Bữa Ăn Hôm Nay/i
    })
  ).toBeVisible();
}

async function addDish(page, label = 'pizza', known = true) {
  await page.unroute('**/predict');

  await page.route('**/predict', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mon: label,
        do_tin_cay: 0.92,
        chac_chan: true,
        top3: [
          { mon: label, do_tin_cay: 0.92 }
        ]
      })
    })
  );

  await page.goto('/home');

  await page.getByLabel(
    'Chọn ảnh món ăn từ thư viện'
  ).setInputFiles({
    name: 'food.png',
    mimeType: 'image/png',
    buffer: PNG
  });

  const button = known
    ? 'LƯU ƯỚC TÍNH VÀO NHẬT KÝ'
    : 'LƯU TÊN MÓN VÀO NHẬT KÝ';

  await page.getByRole('button', {
    name: button,
    exact: true
  }).click();

  await expect(page).toHaveURL(/\/diary$/);
}

async function expectCount(page, count) {
  await expect(
    page.getByText(`${count} món đã lưu`, {
      exact: true
    })
  ).toBeVisible();
}

async function logoutLocal(page) {
  // Hủy phiên máy chủ giả lập, giữ nguyên nhật ký
  // của từng tài khoản trong localStorage.
  await page.evaluate(async () => {
    await fetch('/api/social-auth', { method: 'DELETE', credentials: 'same-origin' });
    localStorage.removeItem('nv_user');
    sessionStorage.removeItem('nv_user');
  });

  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
}

test.beforeEach(async ({ page }) => {
  // Giả lập các API để không ghi dữ liệu vào Neon.
  await mockAuth(page);

  // Chặn API nhận diện thật.
  await page.route('**/predict', route =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"error":"Mock required"}'
    })
  );

  await login(page);
});

test('NV2-DIARY-001 | Truy cập trang nhật ký', async ({ page }) => {
  await openDiary(page);

  await expect(
    page.getByRole('heading', {
      name: /Nhật Ký Bữa Ăn Hôm Nay/i
    })
  ).toBeVisible();
});

test('NV2-DIARY-002 | Tài khoản mới có nhật ký trống', async ({ page }) => {
  await openDiary(page);

  await expectCount(page, 0);

  await expect(
    page.getByText('Chưa có món nào hôm nay')
  ).toBeVisible();

  await expect(
    page.getByText(/còn 1600 kcal/i)
  ).toBeVisible();
});

test('NV2-DIARY-003 | Lưu món ăn từ kết quả AI', async ({ page }) => {
  await addDish(page);

  await expectCount(page, 1);

  await expect(
    page.getByText('Pizza', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Chưa có món nào hôm nay')
  ).toHaveCount(0);
});

test('NV2-DIARY-004 | Hiển thị đúng tên món calo và macro', async ({ page }) => {
  await addDish(page);

  await expect(
    page.getByText('Pizza', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('540 kcal', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText(/P:\d+g C:\d+g F:\d+g/)
  ).toBeVisible();
});

test('NV2-DIARY-005 | Thay đổi loại bữa ăn', async ({ page }) => {
  await addDish(page);

  const category = page.getByRole('combobox');
  const current = await category.inputValue();

  const next = current === 'breakfast'
    ? 'dinner'
    : 'breakfast';

  await category.selectOption(next);

  await expect(category).toHaveValue(next);
  await expectCount(page, 1);

  // Kiểm tra loại bữa ăn vẫn đúng sau reload.
  await page.reload();

  await expect(
    page.getByRole('combobox')
  ).toHaveValue(next);
});

test('NV2-DIARY-006 | Xóa món khỏi nhật ký', async ({ page }) => {
  await addDish(page);

  await expectCount(page, 1);

  await page.getByRole('button', {
    name: 'Xoá món',
    exact: true
  }).click();

  await expectCount(page, 0);

  await expect(
    page.getByText('Pizza', { exact: true })
  ).toHaveCount(0);

  await expect(
    page.getByText('Chưa có món nào hôm nay')
  ).toBeVisible();

  await expect(
    page.getByText(/còn 1600 kcal/i)
  ).toBeVisible();
});

test('NV2-DIARY-007 | Nhật ký vẫn tồn tại sau reload', async ({ page }) => {
  await addDish(page);

  await expectCount(page, 1);

  await page.reload();

  await expectCount(page, 1);

  await expect(
    page.getByText('Pizza', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('540 kcal', { exact: true })
  ).toBeVisible();
});

test('NV2-DIARY-008 | Lưu nhiều món và tính tổng calo', async ({ page }) => {
  await addDish(page, 'pizza');
  await addDish(page, 'sushi');

  await expectCount(page, 2);

  await expect(
    page.getByText('540 kcal', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('350 kcal', { exact: true })
  ).toBeVisible();

  // 540 + 350 = 890 kcal.
  // Mục tiêu mặc định: 1600 kcal.
  // Còn lại: 710 kcal.
  await expect(
    page.getByText(/còn 710 kcal/i)
  ).toBeVisible();
});

test('NV2-DIARY-009 | Hai tài khoản có nhật ký độc lập', async ({ page }) => {
  // Tài khoản A lưu Pizza.
  await addDish(page, 'pizza');
  await expectCount(page, 1);

  // Chuyển sang B trong cùng trình duyệt.
  await logoutLocal(page);
  await login(page, ACCOUNT_B);
  await openDiary(page);

  await expectCount(page, 0);

  await expect(
    page.getByText('Pizza', { exact: true })
  ).toHaveCount(0);

  // Tài khoản B lưu Sushi.
  await addDish(page, 'sushi');
  await expectCount(page, 1);

  // Quay lại A.
  await logoutLocal(page);
  await login(page, ACCOUNT_A);
  await openDiary(page);

  await expectCount(page, 1);

  await expect(
    page.getByText('Pizza', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Sushi', { exact: true })
  ).toHaveCount(0);

  // B vẫn giữ Sushi và không có Pizza.
  await logoutLocal(page);
  await login(page, ACCOUNT_B);
  await openDiary(page);

  await expectCount(page, 1);

  await expect(
    page.getByText('Sushi', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Pizza', { exact: true })
  ).toHaveCount(0);
});

test('NV2-DIARY-010 | Món thiếu dinh dưỡng không làm sai tổng calo', async ({ page }) => {
  await addDish(page, 'pizza');

  await addDish(page, 'unknown_qa_food', false);

  await expectCount(page, 2);

  await expect(
    page.getByText('unknown qa food', {
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByText('Chưa có kcal', {
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByText('Chưa có dữ liệu dinh dưỡng', {
      exact: false
    }).first()
  ).toBeVisible();

  await expect(
    page.getByText(/1 món chưa có dữ liệu dinh dưỡng/)
  ).toBeVisible();

  // Chỉ Pizza được tính vào tổng calo.
  // 1600 - 540 = 1060 kcal.
  await expect(
    page.getByText(/còn 1060 kcal/i)
  ).toBeVisible();
});
