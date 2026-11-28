
const { test, expect } = require('@playwright/test');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5kAAAAASUVORK5CYII=',
  'base64'
);

const EMAIL = 'qa-reliability@example.com';
const API_PATTERN = '**/predict';

function validPrediction(name = 'pizza') {
  return {
    mon: name,
    do_tin_cay: 0.92,
    chac_chan: true,
    top3: [{ mon: name, do_tin_cay: 0.92 }]
  };
}

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

async function uploadImage(page) {
  await page.getByLabel(
    'Chọn ảnh món ăn từ thư viện'
  ).setInputFiles({
    name: 'food.png',
    mimeType: 'image/png',
    buffer: PNG
  });
}

async function mockPrediction(page, options = {}) {
  await page.unroute(API_PATTERN);

  await page.route(API_PATTERN, async route => {
    if (options.delay) {
      await new Promise(resolve =>
        setTimeout(resolve, options.delay)
      );
    }

    if (options.abort) {
      await route.abort('failed');
      return;
    }

    await route.fulfill({
      status: options.status ?? 200,
      contentType: 'application/json',
      body: options.body ??
        JSON.stringify(validPrediction())
    });
  });
}

async function readMeals(page) {
  return page.evaluate(email => {
    const raw = localStorage.getItem('nv_meals:' + email);
    if (!raw) return [];

    const data = JSON.parse(raw);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.meals)) return data.meals;

    throw new Error('Cấu trúc nhật ký không được hỗ trợ');
  }, EMAIL);
}

const saveButton = page => page.getByRole('button', {
  name: 'LƯU ƯỚC TÍNH VÀO NHẬT KÝ',
  exact: true
});

test.beforeEach(async ({ page }) => {
  // Không cho test ghi dữ liệu vào API database.
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"QA isolated"}'
    })
  );

  await page.route(API_PATTERN, route =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"error":"Mock required"}'
    })
  );

  await login(page);
});

// REL-001: API chậm nhưng cuối cùng phản hồi thành công.
test('NV2-REL-001 | Xử lý API nhận diện phản hồi chậm',
  async ({ page }) => {
    await mockPrediction(page, { delay: 1500 });

    await uploadImage(page);

    // Chưa được hiển thị kết quả khi API chưa trả lời.
    await expect(saveButton(page)).toHaveCount(0);

    // Khi API trả lời, kết quả phải xuất hiện.
    await expect(saveButton(page)).toBeVisible();

    expect(await readMeals(page)).toHaveLength(0);
  }
);

// REL-002: HTTP 500 không được tạo bản ghi sai.
test('NV2-REL-002 | Xử lý API trả lỗi HTTP 500',
  async ({ page }) => {
    await mockPrediction(page, {
      status: 500,
      body: '{"error":"Internal Server Error"}'
    });

    await uploadImage(page);

    await expect(
      page.getByText(/Không thể nhận diện ảnh/i)
    ).toBeVisible();

    await expect(saveButton(page)).toHaveCount(0);

    expect(await readMeals(page)).toHaveLength(0);
  }
);

// REL-003: Mất mạng rồi thử lại phải hoạt động.
test('NV2-REL-003 | Phục hồi sau khi mất kết nối API',
  async ({ page }) => {
    await mockPrediction(page, { abort: true });

    await uploadImage(page);

    await expect(
      page.getByText(/Không thể nhận diện ảnh/i)
    ).toBeVisible();

    await expect(saveButton(page)).toHaveCount(0);

    expect(await readMeals(page)).toHaveLength(0);

    // Khôi phục API bằng mock thành công.
    await mockPrediction(page);

    await uploadImage(page);

    await expect(saveButton(page)).toBeVisible();

    await saveButton(page).click();

    await expect(page).toHaveURL(/\/diary$/);

    expect(await readMeals(page)).toHaveLength(1);
  }
);

// REL-004: Hai sự kiện click liên tiếp chỉ nên lưu một lần.
test('NV2-REL-004 | Nhấn lưu liên tiếp không tạo bản ghi trùng',
  async ({ page }) => {
    await mockPrediction(page);

    await uploadImage(page);

    await expect(saveButton(page)).toBeVisible();

    // Hai thao tác trong cùng một lượt JavaScript.
    // Không sửa ứng dụng hoặc dữ liệu database.
   await saveButton(page).dblclick();

    await expect(page).toHaveURL(/\/diary$/);

    const meals = await readMeals(page);

    // Một lần nhận diện chỉ nên tạo một bản ghi.
    expect(
      meals.length,
      'Nhấn lưu hai lần đã tạo bản ghi trùng'
    ).toBe(1);

    expect(
      new Set(meals.map(meal => String(meal.id))).size
    ).toBe(meals.length);
  }
);

// REL-005: JSON hợp lệ về cú pháp nhưng sai cấu trúc.
test('NV2-REL-005 | Từ chối response API sai cấu trúc',
  async ({ page }) => {
    await mockPrediction(page, {
      body: JSON.stringify({
        mon: null,
        do_tin_cay: 0.92,
        chac_chan: true,
        top3: []
      })
    });

    await uploadImage(page);

    await expect(
      page.getByText(/Không thể nhận diện ảnh/i)
    ).toBeVisible();

    await expect(saveButton(page)).toHaveCount(0);

    expect(await readMeals(page)).toHaveLength(0);
  }
);
