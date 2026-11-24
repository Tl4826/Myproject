const { test, expect } = require('@playwright/test');
const { mockAuth } = require('./mock-auth.cjs');

// Cách ly backend: không gửi request tới Neon production.
test.beforeEach(async ({ page }) => {
  await mockAuth(page);
});

async function loginEmail(page, remember = true) {
  await page.goto('/login');

  const checkbox = page.getByRole('checkbox');
  if (remember) {
    await checkbox.check();
  } else {
    await checkbox.uncheck();
  }

  await page.getByPlaceholder('Email').fill('qa-v2@example.com');
  await page.getByPlaceholder('Mật khẩu').fill('Test123456');

  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  await expect(page).toHaveURL(/\/home$/);
}

// AUTHENTICATION

test('NV2-AUTH-008 | Từ chối email đăng nhập sai định dạng', async ({ page }) => {
  await page.goto('/login');

  const email = page.getByPlaceholder('Email');
  await email.fill('email-khong-hop-le');

  expect(await email.evaluate(el => el.validity.typeMismatch)).toBe(true);
});

test('NV2-AUTH-009 | Từ chối email đăng ký sai định dạng', async ({ page }) => {
  await page.goto('/dangki');

  const email = page.getByPlaceholder('Email');
  await email.fill('sai-dinh-dang');

  expect(await email.evaluate(el => el.validity.typeMismatch)).toBe(true);
});

test('NV2-AUTH-010 | Đăng ký yêu cầu nhập họ tên', async ({ page }) => {
  await page.goto('/dangki');

  const name = page.getByPlaceholder('Họ và tên');

  await expect(name).toHaveAttribute('required', '');
  expect(await name.evaluate(el => el.checkValidity())).toBe(false);
});

test('NV2-AUTH-011 | Đăng ký từ chối mật khẩu dưới 6 ký tự', async ({ page }) => {
  await page.goto('/dangki');

  const password = page.getByPlaceholder('Mật khẩu');

  await password.fill('12345');

  expect(await password.evaluate(el => el.validity.tooShort)).toBe(true);
});

test('NV2-AUTH-012 | Phím Escape quay về trang giới thiệu', async ({ page }) => {
  await page.goto('/login');

  await page.keyboard.press('Escape');

 await expect(page).toHaveURL(new RegExp(`^${test.info().project.use.baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
});

// SESSION

test('NV2-SESSION-001 | Ghi nhớ đăng nhập bật mặc định', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('checkbox')).toBeChecked();
});

test('NV2-SESSION-002 | Không ghi nhớ thì dùng sessionStorage', async ({ page }) => {
  await loginEmail(page, false);

  const result = await page.evaluate(() => ({
    session: sessionStorage.getItem('nv_user'),
    local: localStorage.getItem('nv_user')
  }));

  expect(result.session).toBeTruthy();
  expect(result.local).toBeNull();
});

test('NV2-SESSION-003 | Ghi nhớ thì dùng localStorage', async ({ page }) => {
  await loginEmail(page, true);

  const result = await page.evaluate(() => ({
    session: sessionStorage.getItem('nv_user'),
    local: localStorage.getItem('nv_user')
  }));

  expect(result.local).toBeTruthy();
  expect(result.session).toBeNull();
});

test('NV2-SESSION-004 | Reload vẫn giữ phiên đã ghi nhớ', async ({ page }) => {
  await loginEmail(page, true);

  await page.reload();

  await expect(page).toHaveURL(/\/home$/);
});

test('NV2-SESSION-005 | Browser context mới không kế thừa đăng nhập', async ({ browser }) => {
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    await mockAuth(page);

    await page.goto('/diary');
    await expect(page).toHaveURL(/\/login$/);

    expect(await page.evaluate(() =>
      localStorage.getItem('nv_user')
    )).toBeNull();
  } finally {
    await context.close();
  }
});

// PROTECTED ROUTES

test('NV2-ROUTE-001 | Chưa đăng nhập không được vào Home', async ({ page }) => {
  await page.goto('/home');

  await expect(page).toHaveURL(/\/login$/);
});

test('NV2-ROUTE-002 | Chưa đăng nhập không được vào báo cáo', async ({ page }) => {
  await page.goto('/baocao');

  await expect(page).toHaveURL(/\/login$/);
});

test('NV2-ROUTE-003 | Đã đăng nhập không quay lại form đăng nhập', async ({ page }) => {
  await loginEmail(page, true);

  await page.goto('/login');

  await expect(page).toHaveURL(/\/home$/);
});
