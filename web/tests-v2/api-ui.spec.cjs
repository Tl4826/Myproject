const { test, expect } = require('@playwright/test');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5kAAAAASUVORK5CYII=',
  'base64'
);

async function login(page) {
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"QA isolated"}'
    })
  );
  await page.route('**/predict', route => route.abort());

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('api-ui-qa@example.com');
  await page.getByPlaceholder('Mật khẩu').fill('Test123456');
  await page.getByRole('button', {
    name: 'Đăng nhập', exact: true
  }).click();

  await expect(page).toHaveURL(/\/home$/);
  const skip = page.getByRole('button', { name: 'Để sau' });
  if (await skip.isVisible()) await skip.click();
}

async function upload(page) {
  await page.getByLabel(
    'Chọn ảnh món ăn từ thư viện'
  ).setInputFiles({
    name: 'food.png',
    mimeType: 'image/png',
    buffer: PNG
  });
}

async function mock(page, body, status = 200) {
  await page.unroute('**/predict');
  await page.route('**/predict', route =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    })
  );
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"QA isolated"}'
    })
  );
  await page.route('**/predict', route => route.abort());
});
test('NV2-API-001 | HTTP 503 được xử lý', async ({ page }) => {
  await login(page);
  await mock(page, { error: 'Unavailable' }, 503);
  await upload(page);
  await expect(
    page.getByText(/Không thể nhận diện ảnh: HTTP 503/)
  ).toBeVisible();
});

test('NV2-API-002 | Mất kết nối API không làm treo UI', async ({ page }) => {
  await login(page);
  await upload(page);
  await expect(
    page.getByText(/Không thể nhận diện ảnh:/)
  ).toBeVisible();
  await expect(page).toHaveURL(/\/home$/);
});

test('NV2-API-003 | Phản hồi JSON không hợp lệ được xử lý', async ({ page }) => {
  await login(page);
  await mock(page, '{broken json');
  await upload(page);
  await expect(
    page.getByText(/Không thể nhận diện ảnh:/)
  ).toBeVisible();
});

test('NV2-API-004 | Top3 trống vẫn giữ dự đoán chính', async ({ page }) => {
  await login(page);
  await mock(page, {
    mon: 'pizza', do_tin_cay: 0.93,
    chac_chan: true, top3: []
  });
  await upload(page);
  await expect(
    page.getByText('540 kcal', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^1\. Pizza/ })
  ).toBeVisible();
});

test('NV2-UI-001 | Desktop hiển thị form đăng nhập', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');

  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Mật khẩu')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Đăng nhập', exact: true })
  ).toBeVisible();
});

test('NV2-UI-002 | Mobile hiển thị form đăng nhập', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');

  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Mật khẩu')).toBeVisible();

  const button = page.getByRole('button', {
    name: 'Đăng nhập', exact: true
  });
  await expect(button).toBeVisible();
  await expect(button).toBeInViewport();
});

test('NV2-UI-003 | Mobile truy cập nhật ký', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto('/diary');

  await expect(page).toHaveURL(/\/diary$/);
  await expect(
    page.getByRole('heading', { name: /Nhật Ký Bữa Ăn Hôm Nay/i })
  ).toBeVisible();
  await expect(
    page.getByText('0 món đã lưu')
  ).toBeVisible();
});

