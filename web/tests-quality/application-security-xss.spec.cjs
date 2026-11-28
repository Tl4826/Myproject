
const { test, expect } = require('@playwright/test');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5kAAAAASUVORK5CYII=',
  'base64'
);

test.beforeEach(async ({ page }) => {
  // Cô lập API lưu dữ liệu, tránh ảnh hưởng Neon.
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"QA isolated"}'
    })
  );
});

async function login(page, email) {
  await page.goto('/login');

  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Mật khẩu').fill('Test123456');

  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  await expect(page).toHaveURL(/\/home$/);

  const skip = page.getByRole('button', {
    name: 'Để sau'
  });

  if (await skip.isVisible()) {
    await skip.click();
  }
}

async function saveDish(page, name) {
  await page.route('**/predict', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mon: name,
        do_tin_cay: 0.92,
        chac_chan: true,
        top3: [
          { mon: name, do_tin_cay: 0.92 }
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

  // Payload không thuộc bảng dinh dưỡng chuẩn.
  await page.getByRole('button', {
    name: 'LƯU TÊN MÓN VÀO NHẬT KÝ',
    exact: true
  }).click();

  await expect(page).toHaveURL(/\/diary$/);
  console.log('QA DEBUG - Expected dish:', name);

console.log(
  'QA DEBUG - Diary text:',
  await page.locator('body').innerText()
);

console.log(
  'QA DEBUG - Stored meal keys:',
  await page.evaluate(() =>
    Object.keys(localStorage).filter(k =>
      /meal|diary/i.test(k)
    )
  )
);
}


test('NV2-SEC-019 | XSS trong tên món ăn', async ({ page }) => {
  const payload = '<img src=x onerror="window.qaXss=1">';

  await login(page, 'qa-xss-diary@example.com');
  await saveDish(page, payload);

  // Xác nhận nội dung thử nghiệm tới được nhật ký.
  await expect(
    page.getByText(payload, { exact: true })
  ).toBeVisible();

  // Không được biến chuỗi thành thẻ HTML có onerror.
  await expect(
    page.locator('img[onerror]')
  ).toHaveCount(0);

  // Không được thực thi JavaScript từ tên món ăn.
  expect(
    await page.evaluate(() => window.qaXss)
  ).toBeUndefined();
});


test('NV2-SEC-020 | XSS trong thông tin hồ sơ', async ({ page }) => {
  const payload =
    '<img src=x onerror="window.__qaProfileXss=1">';

  const email = 'qa-xss-profile@example.com';

  await page.goto('/login');

  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Mật khẩu').fill('Test123456');

  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  const form = page.locator('form').filter({
    has: page.getByRole('heading', {
      name: 'Chào mừng đến NutriVN!'
    })
  });

  await expect(form).toBeVisible();

  await form.getByPlaceholder('Nguyễn Văn A').fill(payload);
  await form.getByPlaceholder('20', { exact: true }).fill('23');
  await form.getByPlaceholder('170', { exact: true }).fill('170');
  await form.getByPlaceholder('65', { exact: true }).fill('65');

  await form.getByRole('button', {
    name: 'LƯU & BẮT ĐẦU'
  }).click();

  await expect(form).toHaveCount(0);

  // Xác minh payload đã đi qua luồng lưu hồ sơ.
  const saved = await page.evaluate(email => {
    const raw = localStorage.getItem('nv_profile:' + email);
    return raw ? JSON.parse(raw) : null;
  }, email);

  expect(saved).not.toBeNull();
  expect(saved.name).toBe(payload);

  expect(
    await page.evaluate(() => window.__qaProfileXss)
  ).toBeUndefined();

  await expect(page.locator('img[onerror]')).toHaveCount(0);
});

test('NV2-SEC-021 | HTML Injection trong tên món ăn', async ({ page }) => {
  const payload =
  '<strong data-qa-injection="true">QAHTMLMARKER</strong>';

  await login(page, 'qa-html-diary@example.com');
  await saveDish(page, payload);

  // HTML phải tồn tại dưới dạng text, không phải phần tử.
  await expect(
    page.getByText(payload, { exact: true })
  ).toBeVisible();

  await expect(
    page.locator('[data-qa-injection="true"]')
  ).toHaveCount(0);
});
