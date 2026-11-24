
const { test, expect } = require('@playwright/test');

const API = process.env.NUTRIVN_API || 'http://127.0.0.1:8000';

function upload(name, mimeType, buffer) {
  return {
    multipart: {
      file: { name, mimeType, buffer }
    },
    timeout: 30000
  };
}

function expectClientRejection(response) {
  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
}

function expectNoInternalLeak(text) {
  expect(text).not.toMatch(
    /Traceback \(most recent call last\)|File "[^"]+\.py", line \d+|DATABASE_URL|SECRET_KEY|PRIVATE_KEY/i
  );
}

test('NV2-SEC-022 | API từ chối file văn bản thay vì ảnh', async ({ request }) => {
  const response = await request.post(
    `${API}/predict`,
    upload('test.txt', 'text/plain', Buffer.from('not an image'))
  );

  expectClientRejection(response);
});

test('NV2-SEC-023 | Phát hiện file JPEG giả mạo', async ({ request }) => {
  const response = await request.post(
    `${API}/predict`,
    upload('fake.jpg', 'image/jpeg', Buffer.from('fake jpeg content'))
  );

  expectClientRejection(response);
});

test('NV2-SEC-024 | Từ chối file vượt quá 8MB', async ({ request }) => {
  const oversized = Buffer.alloc(8 * 1024 * 1024 + 1, 0x41);

  const response = await request.post(
    `${API}/predict`,
    upload('oversized.png', 'image/png', oversized)
  );

  expectClientRejection(response);
});

test('NV2-SEC-025 | API kiểm tra trường file bắt buộc', async ({ request }) => {
  const response = await request.post(`${API}/predict`, {
    multipart: {},
  });

  expect(response.status()).toBe(422);
});

test('NV2-SEC-026 | Lỗi xử lý ảnh không tiết lộ stack trace', async ({ request }) => {
  const response = await request.post(
    `${API}/predict`,
    upload('broken.png', 'image/png', Buffer.from([0, 1, 2, 3, 4]))
  );

  expectClientRejection(response);
  expectNoInternalLeak(await response.text());
});

test('NV2-SEC-027 | CORS không cho phép Origin không tin cậy', async ({ request }) => {
  const response = await request.fetch(`${API}/predict`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://untrusted.example',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });

  expect(
    response.headers()['access-control-allow-origin']
  ).not.toBe('https://untrusted.example');
});

test('NV2-SEC-028 | Health API không tiết lộ thông tin nhạy cảm', async ({ request }) => {
  const response = await request.get(`${API}/health`);

  expect(response.ok()).toBeTruthy();

  const body = await response.json();

  expect(body.ok).toBe(true);
  expect(body.class_count).toBe(100);

  expectNoInternalLeak(JSON.stringify(body));
});
