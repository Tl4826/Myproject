const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Chặn API backend của ứng dụng trong nhóm smoke test.
  // Không để bài test tự tạo session hay thay đổi Neon.
  await page.route('**/api/**', route => {
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'QA isolated test' })
    });
  });
});

test('NV2-AUTH-001 | Trang đăng nhập hiển thị', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', {
    name: 'Chào mừng trở lại'
  })).toBeVisible();
});

test('NV2-AUTH-002 | Trang đăng ký hiển thị', async ({ page }) => {
  await page.goto('/dangki');
  await expect(page.getByRole('heading', {
    name: 'Tạo tài khoản'
  })).toBeVisible();
});

test('NV2-AUTH-003 | Đăng nhập có các trường bắt buộc', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByPlaceholder('Email')).toHaveAttribute('required', '');
  await expect(page.getByPlaceholder('Mật khẩu')).toHaveAttribute('required', '');
});

test('NV2-AUTH-004 | Mật khẩu yêu cầu ít nhất 6 ký tự', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByPlaceholder('Mật khẩu'))
    .toHaveAttribute('minlength', '6');
});

test('NV2-AUTH-005 | Có thể hiện và ẩn mật khẩu', async ({ page }) => {
  await page.goto('/login');

  const password = page.getByPlaceholder('Mật khẩu');
  await expect(password).toHaveAttribute('type', 'password');

  await page.getByRole('button', {
    name: 'Hiện/ẩn mật khẩu'
  }).click();

  await expect(password).toHaveAttribute('type', 'text');

  await page.getByRole('button', {
    name: 'Hiện/ẩn mật khẩu'
  }).click();

  await expect(password).toHaveAttribute('type', 'password');
});

test('NV2-AUTH-006 | Có thể chuyển từ đăng nhập sang đăng ký', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', {
    name: 'Tạo tài khoản'
  }).click();

  await expect(page).toHaveURL(/\/dangki$/);
});

test('NV2-AUTH-007 | Chưa đăng nhập không được vào nhật ký', async ({ page }) => {
  await page.goto('/diary');

  await expect(page).toHaveURL(/\/login$/);
});

