# NUTRIVN — PLAYWRIGHT 2.0
# BÁO CÁO KIỂM THỬ 60 TEST CASE — LẦN CHẠY ĐẦU

## 1. Thông tin chung

| Thông tin | Giá trị |
|---|---|
| Dự án | NutriVN |
| Công cụ | Playwright |
| Trình duyệt | Chromium |
| Môi trường | Local Development |
| Nhánh | feature/hong-playwright-v2-smoke |
| Tổng Test Case | 60 |
| Thời gian chạy tổng hợp | 6.3 phút |
| Trạng thái | 59 PASSED, 1 FAILED |

## 2. Kết quả kiểm thử tổng hợp

| Nhóm kiểm thử | Tổng | Passed | Failed |
|---|---:|---:|---:|
| Authentication | 12 | 11 | 1 |
| Session Management | 5 | 5 | 0 |
| Protected Routes | 3 | 3 | 0 |
| AI Food100 | 12 | 12 | 0 |
| Diary | 10 | 10 | 0 |
| Nutrition & BMI | 6 | 6 | 0 |
| Reports | 5 | 5 | 0 |
| API & Error Handling | 4 | 4 | 0 |
| UI & Responsive | 3 | 3 | 0 |
| **Tổng** | **60** | **59** | **1** |

Tỷ lệ Passed: 98.33%.

Kết quả này được ghi nhận từ lần chạy tổng hợp
60 Test Case trên máy local.

## 3. Chi tiết Test Case Failed

### NV2-AUTH-008

Tên bài:
Từ chối email đăng nhập sai định dạng.

File:
web/tests-v2/auth-extra.spec.cjs

Vị trí:
Dòng 37, lỗi tại dòng 41.

Kết quả:
FAILED trong lần chạy tổng hợp 60 Test Case.

Thời gian:
33.3 giây.

Thông báo lỗi:

    Test timeout of 30000ms exceeded.

    Error: locator.fill:
    waiting for getByPlaceholder('Email')

Đoạn mã gặp lỗi:

    const email = page.getByPlaceholder('Email');
    await email.fill('email-khong-hop-le');

### Phân tích sơ bộ

Playwright hết thời gian chờ khi tìm ô Email.

Không có bằng chứng cho thấy chức năng kiểm tra
định dạng email của ứng dụng hoạt động sai.

Nguyên nhân chính xác chưa được xác định.
Một khả năng cần tiếp tục kiểm tra là test
không ổn định trong lúc chạy toàn bộ suite.

## 4. Kết quả chạy lại NV2-AUTH-008

Sau khi phát hiện lỗi, Test Case được chạy riêng.

### Lần kiểm tra đầu tiên

Lệnh:

    npx.cmd playwright test --config=playwright.v2.config.cjs --grep "NV2-AUTH-008" --reporter=list

Kết quả:

    1 passed (5.8s)

### Kiểm tra lặp lại 5 lần

Lệnh:

    npx.cmd playwright test --config=playwright.v2.config.cjs --grep "NV2-AUTH-008" --repeat-each=5 --reporter=list

Kết quả:

    5 passed (11.7s)

### Tổng hợp chạy lại

| Chỉ số | Kết quả |
|---|---:|
| Số lần chạy lại | 6 |
| Passed | 6 |
| Failed | 0 |
| Tỷ lệ Passed khi chạy lại | 100% |

Lưu ý:

6 lần chạy lại không thay thế kết quả của
lần chạy tổng hợp ban đầu.

Trạng thái tổng hợp ban đầu vẫn là:
59 PASSED, 1 FAILED.

## 5. Đánh giá hiện tại

- 18 Test Case bổ sung mới đều PASSED.
- 59/60 Test Case PASSED trong lần chạy tổng hợp.
- NV2-AUTH-008 PASSED 6 lần chạy lại liên tiếp.
- Chưa xác định nguyên nhân timeout ban đầu.
- Chưa xác nhận 60/60 PASSED trong một lần chạy tổng hợp.

## 6. Giới hạn

- Các bài AI sử dụng Mock API.
- Không đánh giá độ chính xác mô hình ONNX thực tế.
- Không xác nhận phân quyền Neon Database thật.
- Các kết quả được ghi nhận từ môi trường local.
- Chưa có GitHub Actions tự động xác minh.
- Báo cáo này ghi nhận lịch sử kiểm thử,
  không khẳng định hệ thống không còn lỗi.

## 7. Kế hoạch tiếp theo

1. Lưu báo cáo lần chạy đầu vào GitHub.
2. Chạy lại toàn bộ 60 Test Case.
3. Phân tích thêm nếu lỗi timeout tái xuất hiện.
4. Lập báo cáo kết quả cuối cùng.
5. Cấu hình GitHub Actions khi môi trường CI đã sẵn sàng.

## 8. Kết luận

Lần chạy tổng hợp đầu tiên:
59 PASSED, 1 FAILED.

Kiểm tra lại riêng bài NV2-AUTH-008:
6/6 PASSED.

Chưa công bố 60/60 PASSED cho đến khi
một lần chạy tổng hợp mới xác nhận kết quả.
