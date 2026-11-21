const { test, expect } = require('@playwright/test');

const EMAIL = 'security-qa@example.com';
const PASSWORD = 'StrongPass123!';

async function isolate(page) {
  // Không cho test gửi yêu cầu tới backend dùng chung.
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"QA security isolated"}'
    })
  );
  await page.route('**/predict', route => route.abort());
}

async function register(page, email = EMAIL, password = PASSWORD) {
  await page.goto('/dangki');
  await page.getByPlaceholder('Họ và tên').fill('Security QA');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Mật khẩu').fill(password);
  await page.getByRole('button', {
    name: 'Tạo tài khoản',
    exact: true
  }).click();
}

async function login(page, email = EMAIL, password = PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Mật khẩu').fill(password);
  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();
}

async function clearSession(page) {
  await page.evaluate(() => {
    localStorage.removeItem('nv_user');
    sessionStorage.removeItem('nv_user');
  });
  await page.goto('/login');
}

async function expectRejected(page) {
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByPlaceholder('Email')).toBeVisible();

  const user = await page.evaluate(() =>
    localStorage.getItem('nv_user') ||
    sessionStorage.getItem('nv_user')
  );
  expect(user).toBeNull();
}

test.beforeEach(async ({ page }) => {
  await isolate(page);
});

test('NV2-SEC-001 | Đăng ký và đăng nhập với mật khẩu đúng', async ({ page }) => {
  await register(page);
  await expect(page).toHaveURL(/\/home$/);

  await clearSession(page);
  await login(page);

  await expect(page).toHaveURL(/\/home$/);
});

test('NV2-SEC-002 | Từ chối mật khẩu sai của tài khoản đã đăng ký', async ({ page }) => {
  await register(page);
  await expect(page).toHaveURL(/\/home$/);

  await clearSession(page);
  await login(page, EMAIL, 'WrongPass999!');

  await expectRejected(page);
});

test('NV2-SEC-003 | Từ chối email chưa từng đăng ký', async ({ page }) => {
  await login(page, 'never-registered-qa@example.com', PASSWORD);
  await expectRejected(page);
});

test('NV2-SEC-004 | Ngăn đăng ký trùng địa chỉ email', async ({ page }) => {
  await register(page);
  await expect(page).toHaveURL(/\/home$/);

  await clearSession(page);
  await register(page, EMAIL, 'AnotherPass123!');

  await expect(page).toHaveURL(/\/dangki$/);
});

test('NV2-SEC-005 | Không chấp nhận các mật khẩu sai khác nhau', async ({ page }) => {
  await register(page);
  await expect(page).toHaveURL(/\/home$/);
  await clearSession(page);

  for (const password of ['AAAAAA123', 'BBBBBB123']) {
    await login(page, EMAIL, password);
    await expectRejected(page);
  }
});

test('NV2-SEC-006 | Giả mạo localStorage không cấp quyền truy cập', async ({ page }) => {
  await page.goto('/login');

  await page.evaluate(() => {
    localStorage.setItem('nv_user', JSON.stringify({
      email: 'forged-local-qa@example.com',
      provider: 'email'
    }));
  });

  await page.reload();
  await page.goto('/diary');

  await expect(page).toHaveURL(/\/login$/);
});

test('NV2-SEC-007 | Giả mạo sessionStorage không cấp quyền truy cập', async ({ page }) => {
  await page.goto('/login');

  await page.evaluate(() => {
    sessionStorage.setItem('nv_user', JSON.stringify({
      email: 'forged-session-qa@example.com',
      provider: 'email'
    }));
  });

  await page.reload();
  await page.goto('/baocao');

  await expect(page).toHaveURL(/\/login$/);
});

test('NV2-SEC-008 | Mật khẩu không xuất hiện trong browser storage', async ({ page }) => {
  await register(page);
  await expect(page).toHaveURL(/\/home$/);

  const values = await page.evaluate(() => [
    ...Object.values(localStorage),
    ...Object.values(sessionStorage)
  ].join('\n'));

  expect(values).not.toContain(PASSWORD);
});

test('NV2-SEC-009 | Không cho gửi form với trường bắt buộc trống', async ({ page }) => {
  await page.goto('/login');

  const email = page.getByPlaceholder('Email');
  const password = page.getByPlaceholder('Mật khẩu');

  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  expect(await email.evaluate(el => el.validity.valueMissing)).toBe(true);
  await expect(page).toHaveURL(/\/login$/);

  await email.fill(EMAIL);

  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  expect(await password.evaluate(el => el.validity.valueMissing)).toBe(true);
  await expect(page).toHaveURL(/\/login$/);
});

test('NV2-SEC-010 | Email sai định dạng không thể gửi form', async ({ page }) => {
  await page.goto('/login');

  const email = page.getByPlaceholder('Email');
  await email.fill('invalid-email');
  await page.getByPlaceholder('Mật khẩu').fill(PASSWORD);

  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  expect(await email.evaluate(el => el.validity.typeMismatch)).toBe(true);
  await expect(page).toHaveURL(/\/login$/);
});

test('NV2-SEC-011 | Không ghi nhớ chỉ tạo phiên sessionStorage', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('checkbox', {
    name: /Ghi nhớ đăng nhập/
  }).uncheck();

  await page.getByPlaceholder('Email').fill(EMAIL);
  await page.getByPlaceholder('Mật khẩu').fill(PASSWORD);
  await page.getByRole('button', {
    name: 'Đăng nhập',
    exact: true
  }).click();

  await expect(page).toHaveURL(/\/home$/);

  const storage = await page.evaluate(() => ({
    local: localStorage.getItem('nv_user'),
    session: sessionStorage.getItem('nv_user')
  }));

  expect(storage.local).toBeNull();
  expect(storage.session).not.toBeNull();
});

test('NV2-SEC-012 | Không có phiên không được truy cập trang riêng tư', async ({ page }) => {
  await page.goto('/login');

  for (const route of ['/home', '/diary', '/baocao']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
  }
});
