
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://127.0.0.1:8000';

test('TC-001: Trang chủ hoạt động', async ({ page }) => {
  const response = await page.goto(BASE_URL);

  expect(response.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
});

test('TC-002: Trang đăng nhập hiển thị', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);

  await expect(
    page.locator('input[type="email"]')
  ).toBeVisible();

  await expect(
    page.locator('input[type="password"]')
  ).toBeVisible();
});

test('TC-003: Trang đăng ký hiển thị', async ({ page }) => {
  await page.goto(`${BASE_URL}/dangki`);

  await expect(
    page.locator('input[type="email"]')
  ).toBeVisible();

  await expect(
    page.locator('input[type="password"]')
  ).toBeVisible();
});

test('TC-004: Email không hợp lệ', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);

  const email = page.locator('input[type="email"]');

  await email.fill('email-khong-hop-le');

  const isValid = await email.evaluate(
    element => element.checkValidity()
  );

  expect(isValid).toBe(false);
});


test('TC-005: Backend FastAPI hoạt động', async ({ request }) => {
  const response = await request.get(`${API_URL}/health`);

  expect(response.status()).toBe(200);

  const data = await response.json();

  expect(data.ok).toBe(true);
  expect(data.class_count).toBe(100);
  expect(Array.isArray(data.classes)).toBe(true);
});

