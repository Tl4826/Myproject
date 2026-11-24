
const { test, expect } = require('@playwright/test');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5kAAAAASUVORK5CYII=',
  'base64'
);

const EMAIL = 'qa-data-integrity@example.com';
const STORAGE_KEY = `nv_meals:${EMAIL}`;

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

async function addDish(page, name = 'pizza', known = true) {
  await page.unroute('**/predict');

  await page.route('**/predict', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mon: name,
        do_tin_cay: 0.92,
        chac_chan: true,
        top3: [{ mon: name, do_tin_cay: 0.92 }]
      })
    })
  );

  await page.goto('/home');

  await page.getByLabel(
    'Chọn ảnh món ăn từ thư viện'
  ).setInputFiles({
    name: 'food.png',
    mimeType: 'image/png',
    buffer: PNG
  });

  await page.getByRole('button', {
    name: known
      ? 'LƯU ƯỚC TÍNH VÀO NHẬT KÝ'
      : 'LƯU TÊN MÓN VÀO NHẬT KÝ',
    exact: true
  }).click();

  await expect(page).toHaveURL(/\/diary$/);
}

async function expectCount(page, count) {
  await expect(
    page.getByText(`${count} món đã lưu`, { exact: true })
  ).toBeVisible();
}

// Đọc cấu trúc nhật ký được lưu ở localStorage.
// Chấp nhận mảng trực tiếp hoặc object có thuộc tính meals.
async function getStored(page) {
  return page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

function extractMeals(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.meals)) return data.meals;

  throw new Error(
    'Cấu trúc nv_meals chưa được hỗ trợ: ' +
    JSON.stringify(data).slice(0, 400)
  );
}

async function getMeals(page) {
  return extractMeals(await getStored(page));
}

// Chỉ dùng trong kiểm thử tính toàn vẹn.
// Không gửi dữ liệu lên backend.
async function updateFirstMeal(page, changes) {
  await page.evaluate(({ key, changes }) => {
    const stored = JSON.parse(localStorage.getItem(key));

    const meals = Array.isArray(stored)
      ? stored
      : stored?.meals;

    if (!Array.isArray(meals) || !meals.length) {
      throw new Error('Không tìm thấy mảng món ăn để kiểm thử');
    }

    Object.assign(meals[0], changes);

    localStorage.setItem(key, JSON.stringify(stored));
  }, { key: STORAGE_KEY, changes });

  await page.reload();
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"QA isolated"}'
    })
  );

  await page.route('**/predict', route =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"error":"Mock required"}'
    })
  );

  await login(page);
});

// --------------------------------------------------
// DATA-001: Thêm trùng món liên tiếp
// --------------------------------------------------
test('NV2-DATA-001 | Thêm cùng một món liên tiếp không mất bản ghi',
  async ({ page }) => {
    await addDish(page, 'pizza');
    await addDish(page, 'pizza');

    await expectCount(page, 2);

    const meals = await getMeals(page);

    expect(meals).toHaveLength(2);
    expect(new Set(meals.map(m => String(m.id))).size).toBe(2);
    expect(meals.every(m =>
      String(m.name).toLowerCase() === 'pizza'
    )).toBe(true);
  }
);

// --------------------------------------------------
// DATA-002: Xóa một món nhưng giữ món còn lại
// --------------------------------------------------
test('NV2-DATA-002 | Xóa một món không xóa nhầm bản ghi khác',
  async ({ page }) => {
    await addDish(page, 'pizza');
    await addDish(page, 'sushi');

    await expectCount(page, 2);

    const before = await getMeals(page);
    const beforeIds = before.map(m => String(m.id));

    await page.getByRole('button', {
      name: 'Xoá món',
      exact: true
    }).first().click();

    await expectCount(page, 1);

    const after = await getMeals(page);

    expect(after).toHaveLength(1);
    expect(beforeIds).toContain(String(after[0].id));

    await page.reload();
    await expectCount(page, 1);

    const reloaded = await getMeals(page);

    expect(reloaded).toHaveLength(1);
    expect(String(reloaded[0].id)).toBe(String(after[0].id));
  }
);

// --------------------------------------------------
// DATA-003: Tổng calo với món có và thiếu dinh dưỡng
// --------------------------------------------------
test('NV2-DATA-003 | Tổng calories bỏ qua món thiếu dữ liệu',
  async ({ page }) => {
    await addDish(page, 'pizza');
    await addDish(page, 'sushi');
    await addDish(page, 'unknown_qa_food', false);

    await expectCount(page, 3);

    const meals = await getMeals(page);
    expect(meals).toHaveLength(3);

    const total = meals.reduce(
      (sum, meal) =>
        sum + (Number.isFinite(meal.calories)
          ? meal.calories
          : 0),
      0
    );

    expect(total).toBe(890);

    // Mục tiêu mặc định là 1600 kcal.
    // 1600 - (540 + 350) = 710 kcal.
    await expect(
      page.getByText(/còn 710 kcal/i)
    ).toBeVisible();

    await expect(
      page.getByText(/1 món chưa có dữ liệu dinh dưỡng/i)
    ).toBeVisible();
  }
);

// --------------------------------------------------
// DATA-004: Bảo toàn giá trị thập phân
// --------------------------------------------------
test('NV2-DATA-004 | Calories thập phân không bị mất khi reload',
  async ({ page }) => {
    await addDish(page, 'pizza');

    await updateFirstMeal(page, {
      calories: 125.5,
      protein: 12.25,
      carbs: 18.5,
      fat: 4.75
    });

    await expectCount(page, 1);

    const meals = await getMeals(page);

    expect(meals[0].calories).toBe(125.5);
    expect(meals[0].protein).toBe(12.25);
    expect(meals[0].carbs).toBe(18.5);
    expect(meals[0].fat).toBe(4.75);

    // Kiểm tra giao diện sử dụng giá trị chính xác.
    await expect(
      page.getByText('125.5 kcal', { exact: true })
    ).toBeVisible();
  }
);

// --------------------------------------------------
// DATA-005: Phát hiện tổng calo sai do giá trị âm
// --------------------------------------------------
test('NV2-DATA-005 | Calories âm không làm tăng năng lượng còn lại',
  async ({ page }) => {
    await addDish(page, 'pizza');

    // Giả lập dữ liệu lưu trữ bị hỏng hoặc bị can thiệp.
    await updateFirstMeal(page, {
      calories: -100,
      protein: -5
    });

    await expectCount(page, 1);

    const body = await page.locator('body').innerText();

    const match = body.match(/còn\s+([\d.,]+)\s*kcal/i);

    expect(
      match,
      'Không tìm thấy chỉ số calories còn lại'
    ).not.toBeNull();

    const remaining = Number(match[1].replace(',', '.'));

    expect(Number.isFinite(remaining)).toBe(true);

    // Calories âm không được cộng thêm vào hạn mức ngày.
    expect(remaining).toBeLessThanOrEqual(1600);
  }
);

// --------------------------------------------------
// DATA-006: Nhất quán dữ liệu qua nhiều lần reload
// --------------------------------------------------

test('NV2-DATA-006 | Dữ liệu nhật ký nhất quán qua nhiều lần reload',
  async ({ page }) => {
    await addDish(page, 'pizza');
    await addDish(page, 'sushi');

    await expectCount(page, 2);

    const before = await getMeals(page);

    expect(before).toHaveLength(2);
    expect(new Set(before.map(m => String(m.id))).size).toBe(2);

    const pizza = before.find(
      m => String(m.name).toLowerCase() === 'pizza'
    );

    expect(pizza, 'Không tìm thấy Pizza trong dữ liệu').toBeDefined();

    const next = pizza.category === 'breakfast'
      ? 'dinner'
      : 'breakfast';

    // Luôn xác định combobox theo đúng tên Pizza,
    // không sử dụng .first() vì thứ tự có thể thay đổi.
    const pizzaCategory = page
      .locator('div.p-3.bg-slate-50')
      .filter({
        has: page.getByText('Pizza', { exact: true })
      })
      .locator('select');

    await expect(pizzaCategory).toHaveCount(1);

    await pizzaCategory.selectOption(next);

    // Xác minh đúng món Pizza đã đổi loại bữa ăn.
    await expect(pizzaCategory).toHaveValue(next);

    // Chờ dữ liệu mới được lưu vào localStorage.
    await expect.poll(async () => {
      const meals = await getMeals(page);
      return meals.find(
        m => String(m.id) === String(pizza.id)
      )?.category;
    }).toBe(next);

    const snapshot = await getStored(page);

    // Kiểm tra dữ liệu qua 3 lần reload.
    for (let i = 0; i < 3; i++) {
      await page.reload();

      await expectCount(page, 2);

      const actual = await getStored(page);

      expect(actual).toEqual(snapshot);

      await expect(
        page
          .locator('div.p-3.bg-slate-50')
          .filter({
            has: page.getByText('Pizza', { exact: true })
          })
          .locator('select')
      ).toHaveValue(next);
    }

    console.log(
      'DATA-006: Pizza giữ nguyên category sau 3 lần reload'
    );
  }
);
