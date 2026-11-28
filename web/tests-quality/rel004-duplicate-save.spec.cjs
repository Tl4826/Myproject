// Regression tests for BUG-NV2-REL-004 (Issue #80 / PR #81).
// Scope: frontend double-click / rapid-save guard only (does not claim backend idempotency).
// Verifies POST /api/diary request counts and server records against the stateful mock API
// (dev-mock-api.mjs via Next.js LOCAL_API_PROXY), without reading legacy localStorage.

const { test, expect } = require('@playwright/test');

test.use({ video: 'off' });

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5kAAAAASUVORK5CYII=',
  'base64'
);

const PREDICT_PATTERN = '**/predict';

function validPrediction(name = 'pizza') {
  return {
    mon: name,
    do_tin_cay: 0.92,
    chac_chan: true,
    top3: [{ mon: name, do_tin_cay: 0.92 }],
  };
}

async function registerFreshAccount(page, label) {
  const email = `rel004-${label}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.invalid`;
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const status = await page.evaluate(async emailAddr => {
    const res = await fetch('/api/email-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        name: 'QA REL004',
        email: emailAddr,
        password: 'synthetic-rel004-test-only',
        remember: true,
      }),
    });
    return res.status;
  }, email);
  expect(status, 'Stateful mock registration must succeed').toBe(201);
  return email;
}

async function fetchServerMeals(page) {
  return page.evaluate(async () => {
    const res = await fetch('/api/diary', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('GET /api/diary failed with HTTP ' + res.status);
    const data = await res.json();
    return Array.isArray(data.meals) ? data.meals : [];
  });
}

async function mockPrediction(page) {
  await page.route(PREDICT_PATTERN, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(validPrediction('pizza')),
    })
  );
}

async function uploadFoodImage(page) {
  await page.getByLabel('Chọn ảnh món ăn từ thư viện').setInputFiles({
    name: 'food.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
}

function installDiarySpy(page, { delayMs = 0, failFirst503 = false } = {}) {
  const state = { postCount: 0, payloads: [], failedOnce: false };

  const ready = page.route('**/api/diary', async route => {
    if (route.request().method() === 'POST') {
      state.postCount += 1;
      const payload = route.request().postDataJSON();
      state.payloads.push(payload);
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      if (failFirst503 && !state.failedOnce) {
        state.failedOnce = true;
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Nhật ký tạm thời không kết nối được database' }),
        });
      }
    }
    return route.continue();
  });

  return { state, ready };
}

const saveScanButton = page =>
  page.getByRole('button', { name: 'LƯU ƯỚC TÍNH VÀO NHẬT KÝ', exact: true });

test.describe('NV2-REL-004 | Chống lưu trùng phía frontend với stateful mock API', () => {
  test('NV2-REL-004a | Double-click với POST /api/diary chậm 250ms chỉ gửi 1 POST và tạo 1 bản ghi', async ({ page }) => {
    await mockPrediction(page);
    await registerFreshAccount(page, 'delay250');
    const spy = installDiarySpy(page, { delayMs: 250 });
    await spy.ready;

    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await uploadFoodImage(page);
    await expect(saveScanButton(page)).toBeVisible();

    await saveScanButton(page).dblclick();
    await expect(page).toHaveURL(/\/diary$/);
    await page.waitForTimeout(400);

    const serverMeals = await fetchServerMeals(page);
    expect(spy.state.postCount, 'Double-click khi API chậm 250ms chỉ được gửi 1 POST').toBe(1);
    expect(serverMeals, 'Stateful mock API chỉ được tạo 1 bản ghi').toHaveLength(1);
    expect(spy.state.payloads[0]).not.toHaveProperty('thumb');
  });

  test('NV2-REL-004b | Double-click với POST /api/diary tức thời 0ms chỉ gửi 1 POST và tạo 1 bản ghi', async ({ page }) => {
    await mockPrediction(page);
    await registerFreshAccount(page, 'instant0');
    const spy = installDiarySpy(page, { delayMs: 0 });
    await spy.ready;

    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await uploadFoodImage(page);
    await expect(saveScanButton(page)).toBeVisible();

    await saveScanButton(page).dblclick();
    await expect(page).toHaveURL(/\/diary$/);
    await page.waitForTimeout(400);

    const serverMeals = await fetchServerMeals(page);
    expect(spy.state.postCount, 'Double-click khi API phản hồi 0ms chỉ được gửi 1 POST').toBe(1);
    expect(serverMeals, 'Stateful mock API chỉ được tạo 1 bản ghi').toHaveLength(1);
    expect(spy.state.payloads[0]).not.toHaveProperty('thumb');
  });

  test('NV2-REL-004c | Mở khóa sau lỗi 503 và thử lại bằng double-click tạo đúng 1 bản ghi', async ({ page }) => {
    await mockPrediction(page);
    await registerFreshAccount(page, 'retry503');
    const spy = installDiarySpy(page, { delayMs: 50, failFirst503: true });
    await spy.ready;

    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await uploadFoodImage(page);
    await expect(saveScanButton(page)).toBeVisible();

    // Lần lưu đầu nhận 503: không điều hướng, không tạo bản ghi và phải mở khóa nút.
    await saveScanButton(page).click();
    await expect.poll(() => spy.state.postCount).toBe(1);
    await expect(saveScanButton(page)).toBeEnabled();
    await expect(page).toHaveURL(/\/home$/);
    expect(await fetchServerMeals(page)).toHaveLength(0);

    // Thử lại bằng double-click: chỉ gửi thêm đúng 1 POST và tạo 1 bản ghi.
    await saveScanButton(page).dblclick();
    await expect(page).toHaveURL(/\/diary$/);
    await page.waitForTimeout(400);

    const serverMeals = await fetchServerMeals(page);
    expect(spy.state.postCount, 'Tổng POST phải là 2 (1 lần 503 + 1 lần retry thành công)').toBe(2);
    expect(serverMeals, 'Stateful mock API chỉ được tạo đúng 1 bản ghi').toHaveLength(1);
    for (const payload of spy.state.payloads) {
      expect(payload).not.toHaveProperty('thumb');
    }
  });

  test('NV2-REL-004d | Nút + Thêm chống double-click và quay lại /home vẫn cho lưu thao tác hợp lệ tiếp theo', async ({ page }) => {
    await registerFreshAccount(page, 'suggest');
    const spy = installDiarySpy(page, { delayMs: 100 });
    await spy.ready;

    await page.goto('/home', { waitUntil: 'domcontentloaded' });

    // Nhập hồ sơ cơ thể để hiển thị danh sách gợi ý món ăn (+ Thêm).
    const openProfileBtn = page.getByRole('button', { name: /Nhập thông tin/i });
    await expect(openProfileBtn).toBeVisible();
    await openProfileBtn.click();
    await page.getByPlaceholder('Nguyễn Văn A').fill('QA REL004');
    await page.getByPlaceholder('20').fill('25');
    await page.getByPlaceholder('170').fill('170');
    await page.getByPlaceholder('65').fill('65');
    await page.getByRole('button', { name: 'LƯU & BẮT ĐẦU', exact: true }).click();

    const addSuggestionButtons = page.getByRole('button', { name: '+ Thêm', exact: true });
    await expect(addSuggestionButtons.first()).toBeVisible();

    // Lần 1: double-click vào + Thêm chỉ gửi 1 POST và tạo 1 bản ghi.
    await addSuggestionButtons.first().dblclick();
    await expect(page).toHaveURL(/\/diary$/);
    await page.waitForTimeout(300);

    expect(spy.state.postCount, 'Double-click nút + Thêm chỉ được gửi 1 POST').toBe(1);
    expect(await fetchServerMeals(page)).toHaveLength(1);

    // Quay lại /home bằng điều hướng ứng dụng và bấm + Thêm hợp lệ lần tiếp theo.
    await page.getByRole('link', { name: /Trang chủ/i }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(addSuggestionButtons.first()).toBeVisible();
    await expect(addSuggestionButtons.first()).toBeEnabled();

    await addSuggestionButtons.first().click();
    await expect(page).toHaveURL(/\/diary$/);
    await page.waitForTimeout(300);

    const serverMealsAfterReturn = await fetchServerMeals(page);
    expect(
      spy.state.postCount,
      'Quay lại /home rồi bấm + Thêm phải gửi POST hợp lệ thứ 2 (savingSuggestionRef không bị khóa kẹt)'
    ).toBe(2);
    expect(serverMealsAfterReturn).toHaveLength(2);
    for (const payload of spy.state.payloads) {
      expect(payload).not.toHaveProperty('thumb');
    }
  });
});
