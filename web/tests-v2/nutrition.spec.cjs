const { test, expect } = require('@playwright/test');

const EMAIL = 'nutrition-qa@example.com';

const form = page => page.locator('form').filter({
  has: page.getByRole('heading', {
    name: 'Chào mừng đến NutriVN!'
  })
});

async function fill(page, changes = {}) {
  const data = {
    name: 'Nutrition QA', age: '23',
    height: '170', weight: '65', ...changes
  };
  await form(page).getByPlaceholder('Nguyễn Văn A').fill(data.name);
  await form(page).getByPlaceholder('20', { exact: true }).fill(data.age);
  await form(page).getByPlaceholder('170', { exact: true }).fill(data.height);
  await form(page).getByPlaceholder('65', { exact: true }).fill(data.weight);
}

async function save(page) {
  await form(page).getByRole('button', {
    name: 'LƯU & BẮT ĐẦU'
  }).click();
}

async function profile(page) {
  return page.evaluate(email =>
    JSON.parse(localStorage.getItem('nv_profile:' + email)), EMAIL);
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

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(EMAIL);
  await page.getByPlaceholder('Mật khẩu').fill('Test123456');
  await page.getByRole('button', {
    name: 'Đăng nhập', exact: true
  }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(form(page)).toBeVisible();
});

test('NV2-NUTRI-001 | Yêu cầu nhập họ tên', async ({ page }) => {
  await fill(page, { name: '' });
  await save(page);
  await expect(form(page).getByText('Vui lòng nhập họ tên')).toBeVisible();
  expect(await profile(page)).toBeNull();
});

test('NV2-NUTRI-002 | Từ chối tuổi ngoài giới hạn', async ({ page }) => {
  for (const age of ['9', '101']) {
    await fill(page, { age });
    await save(page);
    await expect(form(page).getByText('Tuổi phải từ 10 đến 100')).toBeVisible();
  }
  expect(await profile(page)).toBeNull();
});

test('NV2-NUTRI-003 | Từ chối chiều cao ngoài giới hạn', async ({ page }) => {
  for (const height of ['99', '251']) {
    await fill(page, { height });
    await save(page);
    await expect(form(page).getByText(
      'Chiều cao phải từ 100 đến 250 cm'
    )).toBeVisible();
  }
  expect(await profile(page)).toBeNull();
});

test('NV2-NUTRI-004 | Từ chối cân nặng ngoài giới hạn', async ({ page }) => {
  for (const weight of ['19', '301']) {
    await fill(page, { weight });
    await save(page);
    await expect(form(page).getByText(
      'Cân nặng phải từ 20 đến 300 kg'
    )).toBeVisible();
  }
  expect(await profile(page)).toBeNull();
});

test('NV2-NUTRI-005 | BMI tính đúng bốn mức thể trạng', async ({ page }) => {
  await fill(page, { weight: '50' });
  const weight = form(page).getByPlaceholder('65', { exact: true });

  for (const item of [
    ['50', '17.3', 'Thiếu cân'],
    ['65', '22.5', 'Bình thường'],
    ['70', '24.2', 'Thừa cân'],
    ['80', '27.7', 'Béo phì']
  ]) {
    await weight.fill(item[0]);
    await expect(
      form(page).getByText(new RegExp(item[1].replace('.', '\\.') +
        '\\s*' + item[2]))
    ).toBeVisible();
  }
});

test('NV2-NUTRI-006 | Lưu hồ sơ và khôi phục sau reload', async ({ page }) => {
  await fill(page);
  await save(page);
  await expect(form(page)).toHaveCount(0);

  const data = await profile(page);
  expect(data).toMatchObject({
    email: EMAIL, name: 'Nutrition QA',
    age: 23, height: 170, weight: 65, bmi: 22.5
  });

  await page.reload();
  await expect(page).toHaveURL(/\/home$/);
  expect(await profile(page)).toEqual(data);
});
