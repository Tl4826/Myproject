
const { test, expect } = require('@playwright/test');
const { performance } = require('node:perf_hooks');

const EMAIL = 'qa-performance@example.com';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5kAAAAASUVORK5CYII=',
  'base64'
);

test.beforeEach(async ({ page }) => {
  // Cô lập backend/database thật.
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"QA isolated"}'
    })
  );

  await page.route('**/predict', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mon: 'pizza',
        do_tin_cay: 0.92,
        chac_chan: true,
        top3: [{ mon: 'pizza', do_tin_cay: 0.92 }]
      })
    })
  );

  await page.goto('/login');

  await page.getByPlaceholder('Email').fill(EMAIL);
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
});

// PERF-001: Đo thời gian tải Home sau khi đăng nhập.
test('NV2-PERF-001 | Tải trang Home trong 10 giây',
  async ({ page }) => {
    const start = performance.now();

    await page.goto('/home');

    await expect(
      page.getByLabel('Chọn ảnh món ăn từ thư viện')
    ).toBeAttached();

    const elapsed = performance.now() - start;

    console.log(
      `PERF-001: Home ready = ${elapsed.toFixed(0)} ms`
    );

    expect(elapsed).toBeLessThan(10000);
  }
);

// PERF-002: Điều hướng nhiều lần không lỗi.
test('NV2-PERF-002 | Điều hướng Home và Diary liên tục',
  async ({ page }) => {
    const start = performance.now();

    for (let i = 0; i < 5; i++) {
      await page.goto('/diary');

      await expect(
        page.getByRole('heading', {
          name: /Nhật Ký Bữa Ăn Hôm Nay/i
        })
      ).toBeVisible();

      await page.goto('/home');

      await expect(
        page.getByLabel('Chọn ảnh món ăn từ thư viện')
      ).toBeAttached();
    }

    const elapsed = performance.now() - start;

    console.log(
      `PERF-002: 10 navigations = ${elapsed.toFixed(0)} ms`
    );

    expect(elapsed).toBeLessThan(15000);
  }
);

// PERF-003: Kiểm tra khả năng hiển thị nhật ký 100 món.
test('NV2-PERF-003 | Hiển thị nhật ký với 100 món ăn',
  async ({ page }) => {
    // Tạo 1 món bằng luồng thực tế để lấy cấu trúc
    // dữ liệu chính xác từ phiên bản NutriVN này.
    await page.getByLabel(
      'Chọn ảnh món ăn từ thư viện'
    ).setInputFiles({
      name: 'food.png',
      mimeType: 'image/png',
      buffer: PNG
    });

    await page.getByRole('button', {
      name: 'LƯU ƯỚC TÍNH VÀO NHẬT KÝ',
      exact: true
    }).click();

    await expect(page).toHaveURL(/\/diary$/);

    // Chỉ thay localStorage trong browser kiểm thử.
    await page.evaluate(email => {
      const key = 'nv_meals:' + email;
      const raw = localStorage.getItem(key);

      if (!raw) {
        throw new Error('Không tìm thấy dữ liệu nhật ký');
      }

      const stored = JSON.parse(raw);
      const meals = Array.isArray(stored)
        ? stored
        : stored?.meals;

      if (!Array.isArray(meals) || meals.length !== 1) {
        throw new Error(
          'Cấu trúc dữ liệu nhật ký khác dự kiến'
        );
      }

      const template = meals[0];

      const generated = Array.from(
        { length: 100 },
        (_, i) => ({
          ...template,
          id: `qa-perf-${i + 1}`,
          name: `Pizza QA ${i + 1}`
        })
      );

      if (Array.isArray(stored)) {
        localStorage.setItem(
          key,
          JSON.stringify(generated)
        );
      } else {
        stored.meals = generated;
        localStorage.setItem(
          key,
          JSON.stringify(stored)
        );
      }
    }, EMAIL);

    const start = performance.now();

    await page.reload();

    await expect(
      page.getByText('100 món đã lưu', { exact: true })
    ).toBeVisible();

    await expect(
      page.getByText('Pizza QA 1', { exact: true })
    ).toBeVisible();

    await expect(
      page.getByText('Pizza QA 100', { exact: true })
    ).toBeVisible();

    const elapsed = performance.now() - start;

    console.log(
      `PERF-003: 100 meals rendered = ${elapsed.toFixed(0)} ms`
    );

    expect(elapsed).toBeLessThan(10000);
  }
);
