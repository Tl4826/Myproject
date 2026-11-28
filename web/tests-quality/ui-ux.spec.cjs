
const { test, expect } = require('@playwright/test');

const EMAIL = 'qa-ui-ux@example.com';

async function login(page) {
  await page.goto('/login');

  await page.getByPlaceholder('Email').fill(EMAIL);
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

test.beforeEach(async ({ page }) => {
  // Cô lập database API.
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"QA isolated"}'
    })
  );

  // Không gọi API nhận diện ảnh thật.
  await page.route('**/predict', route =>
    route.abort()
  );
});

test('NV2-UI-007 | Giao diện nhật ký trên điện thoại',
  async ({ page }) => {
    await page.setViewportSize({
      width: 375,
      height: 812
    });

    await login(page);
    await page.goto('/diary');

    await expect(page).toHaveURL(/\/diary$/);

    await expect(
      page.getByRole('heading', {
        name: /Nhật Ký Bữa Ăn Hôm Nay/i
      })
    ).toBeVisible();

    await expect(
      page.getByText(/món đã lưu/i).first()
    ).toBeVisible();

    const viewportWidth = await page.evaluate(
      () => window.innerWidth
    );

    expect(viewportWidth).toBe(375);
  }
);

test('NV2-UI-008 | Giao diện nhận diện ảnh trên tablet',
  async ({ page }) => {
    await page.setViewportSize({
      width: 768,
      height: 1024
    });

    await login(page);

    await expect(page).toHaveURL(/\/home$/);

    const upload = page.getByLabel(
      'Chọn ảnh món ăn từ thư viện'
    );

    await expect(upload).toBeAttached();

    expect(
      await upload.evaluate(el => el.type)
    ).toBe('file');

    expect(
      await page.evaluate(() => window.innerWidth)
    ).toBe(768);
  }
);

test('NV2-UI-009 | Không có tràn ngang trên màn hình nhỏ',
  async ({ page }) => {
    await page.setViewportSize({
      width: 375,
      height: 812
    });

    await login(page);

    for (const path of ['/home', '/diary']) {
      await page.goto(path);

      await expect(page).toHaveURL(
        new RegExp(path + '$')
      );

      const sizes = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth
      }));

      expect(
        sizes.document,
        `Trang ${path} bị tràn ngang: ` +
        JSON.stringify(sizes)
      ).toBeLessThanOrEqual(sizes.viewport + 1);
    }
  }
);

test('NV2-UI-010 | Đăng nhập bằng bàn phím',
  async ({ page }) => {
    await page.goto('/login');

    const email = page.getByPlaceholder('Email');
    const password = page.getByPlaceholder('Mật khẩu');
    const submit = page.getByRole('button', {
      name: 'Đăng nhập',
      exact: true
    });

    await email.focus();

    await expect(email).toBeFocused();
    await page.keyboard.type(EMAIL);

    // Chuyển từ Email sang Password bằng Tab.
    await page.keyboard.press('Tab');

    await expect(password).toBeFocused();
    await page.keyboard.type('Test123456');

    // Tiếp tục Tab đến nút đăng nhập.
    let focusedSubmit = false;

    for (let i = 0; i < 8; i++) {
      if (await submit.evaluate(
        el => el === document.activeElement
      )) {
        focusedSubmit = true;
        break;
      }

      await page.keyboard.press('Tab');
    }

    expect(
      focusedSubmit,
      'Không thể đến nút Đăng nhập bằng Tab'
    ).toBe(true);

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/home$/);
  }
);
