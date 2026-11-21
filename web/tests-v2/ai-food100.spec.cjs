const { test, expect } = require('@playwright/test');

// NutriVN 2.0 — 12 test AI Food100
// Chỉ kiểm tra frontend bằng Mock API.

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5kAAAAASUVORK5CYII=',
  'base64'
);

const result = (changes = {}) => ({
  mon: 'pizza',
  do_tin_cay: 0.92,
  chac_chan: true,
  top3: [
    { mon: 'pizza', do_tin_cay: 0.92 },
    { mon: 'sushi', do_tin_cay: 0.05 },
    { mon: 'ramen', do_tin_cay: 0.03 }
  ],
  ...changes
});

async function upload(page, buffer = PNG, name = 'food.png', mimeType = 'image/png') {
  await page.getByLabel('Chọn ảnh món ăn từ thư viện').setInputFiles({
    name,
    mimeType,
    buffer
  });
}

async function mockPredict(page, data = result(), status = 200) {
  await page.route('**/predict', route =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data)
    })
  );
}

test.beforeEach(async ({ page }) => {
  // Chặn mọi yêu cầu tới các endpoint dùng chung của ứng dụng.
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'QA isolated' })
    })
  );

  // Chặn API nhận diện thực trước khi thao tác upload.
  await page.route('**/predict', route =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"error":"AI mock not configured"}'
    })
  );

  await page.goto('/login');

  await page.getByPlaceholder('Email').fill('ai-qa@example.com');
  await page.getByPlaceholder('Mật khẩu').fill('Test123456');

  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  await expect(page).toHaveURL(/\/home$/);

  const skip = page.getByRole('button', { name: 'Để sau' });
  if (await skip.isVisible()) await skip.click();
});

test('NV2-AI-001 | Hiển thị chức năng quét 100 món ăn', async ({ page }) => {
  await expect(page.getByText('QUÉT 100 MÓN ĂN BẰNG AI')).toBeVisible();
});

test('NV2-AI-002 | Chưa quét ảnh hiển thị trạng thái ban đầu', async ({ page }) => {
  await expect(page.getByText('Chưa có ảnh được quét')).toBeVisible();
});

test('NV2-AI-003 | Input upload chỉ chấp nhận ảnh', async ({ page }) => {
  await expect(page.getByLabel('Chọn ảnh món ăn từ thư viện'))
    .toHaveAttribute('accept', 'image/*');
});

test('NV2-AI-004 | Từ chối tệp văn bản', async ({ page }) => {
  await upload(page, Buffer.from('not an image'), 'sample.txt', 'text/plain');
  await expect(page.getByText(/Chỉ nhận file ảnh dưới 8MB/)).toBeVisible();
});

test('NV2-AI-005 | Từ chối tệp ảnh vượt 8MB', async ({ page }) => {
  await upload(page, Buffer.alloc(8000001), 'large.png');
  await expect(page.getByText(/Chỉ nhận file ảnh dưới 8MB/)).toBeVisible();
});

test('NV2-AI-006 | API nhận diện trả về Pizza và 540 kcal', async ({ page }) => {
  await mockPredict(page);
  await upload(page);
  await expect(page.getByText('540 kcal', { exact: true })).toBeVisible();
});

test('NV2-AI-007 | Hiển thị Top 3 dự đoán', async ({ page }) => {
  await mockPredict(page);
  await upload(page);

  await expect(page.getByRole('button', { name: /^1\. Pizza/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^2\. Sushi/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^3\. Mì ramen/i })).toBeVisible();
});

test('NV2-AI-008 | Chọn Sushi cập nhật calo thành 350', async ({ page }) => {
  await mockPredict(page);
  await upload(page);

  await page.getByRole('button', { name: /^2\. Sushi/i }).click();
  await expect(page.getByText('350 kcal', { exact: true })).toBeVisible();
});

test('NV2-AI-009 | Cảnh báo khi AI có độ tin cậy thấp', async ({ page }) => {
  await mockPredict(page, result({
    do_tin_cay: 0.31,
    chac_chan: false
  }));

  await upload(page);
  await expect(page.getByText(/Độ tin cậy thấp/)).toBeVisible();
});

test('NV2-AI-010 | Món thiếu dữ liệu dinh dưỡng', async ({ page }) => {
  await mockPredict(page, result({
    mon: 'unknown_qa_food',
    top3: [{ mon: 'unknown_qa_food', do_tin_cay: 0.92 }]
  }));

  await upload(page);

  await expect(page.getByText('Chưa có dữ liệu kcal')).toBeVisible();
  await expect(page.getByRole('button', {
    name: 'LƯU TÊN MÓN VÀO NHẬT KÝ'
  })).toBeVisible();
});

test('NV2-AI-011 | API trả HTTP 500 hiển thị lỗi', async ({ page }) => {
  await mockPredict(page, { error: 'Server error' }, 500);
  await upload(page);

  await expect(page.getByText(/Không thể nhận diện ảnh: HTTP 500/))
    .toBeVisible();
});

test('NV2-AI-012 | API trả tên món không hợp lệ', async ({ page }) => {
  await mockPredict(page, { mon: null });
  await upload(page);

  await expect(page.getByText(/API trả về tên món không hợp lệ/))
    .toBeVisible();
});
