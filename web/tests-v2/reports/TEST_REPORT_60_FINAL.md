# NUTRIVN — PLAYWRIGHT TESTING SUITE 2.0
# BÁO CÁO KIỂM THỬ CUỐI CÙNG — 60 TEST CASE

## 1. Thông tin chung

| Nội dung | Thông tin |
|---|---|
| Dự án | NutriVN |
| Công cụ kiểm thử | Playwright |
| Trình duyệt | Chromium |
| Môi trường | Local Development |
| Frontend | http://localhost:5174 |
| Nhánh | feature/hong-playwright-v2-smoke |
| Tổng Test Case | 60 |
| Trạng thái | 60 PASSED, 0 FAILED |

## 2. Tổng hợp kết quả

| Nhóm kiểm thử | Tổng | Passed | Failed |
|---|---:|---:|---:|
| Authentication | 12 | 12 | 0 |
| Session Management | 5 | 5 | 0 |
| Protected Routes | 3 | 3 | 0 |
| AI Food100 | 12 | 12 | 0 |
| Diary | 10 | 10 | 0 |
| Nutrition & BMI | 6 | 6 | 0 |
| Reports | 5 | 5 | 0 |
| API & Error Handling | 4 | 4 | 0 |
| UI & Responsive | 3 | 3 | 0 |
| **Tổng cộng** | **60** | **60** | **0** |

**Tỷ lệ Passed: 100%.**

Kết quả được xác nhận từ lần chạy tổng hợp
60 Test Case trên máy local.

## 3. Lịch sử kiểm thử

### Giai đoạn 1 — 20 Test Case

- 20 PASSED
- 0 FAILED
- Kết quả: 100%

Chi tiết: [TEST_REPORT_20.md](TEST_REPORT_20.md)

### Giai đoạn 2 — 42 Test Case

- 42 PASSED
- 0 FAILED
- Kết quả: 100%

Chi tiết: [TEST_REPORT_42.md](TEST_REPORT_42.md)

### Giai đoạn 3 — 60 Test Case, lần chạy tổng hợp đầu tiên

- 59 PASSED
- 1 FAILED
- Kết quả: 98.33%

Test Case gặp lỗi:

NV2-AUTH-008 — Từ chối email đăng nhập sai định dạng.

Lỗi:

    Test timeout of 30000ms exceeded.
    Error: locator.fill
    waiting for getByPlaceholder('Email')

Sau đó, NV2-AUTH-008 được chạy lại 6 lần
và đều PASSED.

Chi tiết:
[TEST_REPORT_60_INITIAL.md](TEST_REPORT_60_INITIAL.md)

### Giai đoạn 4 — 60 Test Case, lần chạy tổng hợp mới nhất

- 60 PASSED
- 0 FAILED
- Kết quả: 100%

Không có Test Case Failed trong lần chạy này.

## 4. Kết quả theo chức năng

### Authentication & Session

- Kiểm thử giao diện đăng nhập và đăng ký.
- Kiểm thử các trường bắt buộc.
- Kiểm thử email sai định dạng.
- Kiểm thử mật khẩu và hiển thị mật khẩu.
- Kiểm thử ghi nhớ đăng nhập.
- Kiểm thử lưu phiên và điều hướng.

Kết quả: 20/20 PASSED.

### AI Food100

- Kiểm thử upload ảnh.
- Kiểm thử giới hạn dung lượng.
- Kiểm thử nhận diện món qua Mock API.
- Kiểm thử Top 3 dự đoán.
- Kiểm thử hiển thị calo.
- Kiểm thử phản hồi thiếu dữ liệu.

Kết quả: 12/12 PASSED.

### Diary

- Kiểm thử thêm và xóa món.
- Kiểm thử thay đổi loại bữa ăn.
- Kiểm thử tính tổng calo.
- Kiểm thử lưu trữ dữ liệu.
- Kiểm thử phân tách dữ liệu giữa hai tài khoản.

Kết quả: 10/10 PASSED.

### Nutrition & BMI

- Kiểm thử giới hạn tuổi.
- Kiểm thử chiều cao và cân nặng.
- Kiểm thử cách tính BMI.
- Kiểm thử phân loại thể trạng.
- Kiểm thử lưu hồ sơ sau reload.

Kết quả: 6/6 PASSED.

### Reports

- Kiểm thử biểu đồ báo cáo.
- Kiểm thử trạng thái chưa có dữ liệu.
- Kiểm thử mục tiêu calo.
- Kiểm thử tính trung bình.
- Kiểm thử lưu báo cáo tuần.

Kết quả: 5/5 PASSED.

### API & Error Handling

- Kiểm thử HTTP 503.
- Kiểm thử mất kết nối API.
- Kiểm thử JSON không hợp lệ.
- Kiểm thử dữ liệu Top 3 trống.

Kết quả: 4/4 PASSED.

### UI & Responsive

- Kiểm thử giao diện đăng nhập Desktop.
- Kiểm thử giao diện đăng nhập Mobile.
- Kiểm thử truy cập nhật ký trên Mobile.

Kết quả: 3/3 PASSED.

## 5. Giới hạn kiểm thử

- Các bài AI sử dụng Mock API.
- Chưa đánh giá độ chính xác mô hình ONNX thực tế.
- Chưa kiểm chứng đầy đủ backend và Neon Database thật.
- Kiểm thử chủ yếu trên Chromium.
- Chưa chạy tự động bằng GitHub Actions.
- 60/60 PASSED không có nghĩa toàn bộ ứng dụng không còn lỗi.

## 6. Hướng dẫn chạy lại

Tại thư mục web, khởi động frontend tại localhost:5174.

Chạy:

    npx.cmd playwright test --config=playwright.v2.config.cjs

Mở báo cáo HTML:

    npx.cmd playwright show-report playwright-report-v2

## 7. Kết luận

Bộ NutriVN Playwright Testing Suite 2.0
đã hoàn thành 60 Test Case.

Kết quả lần kiểm thử tổng hợp mới nhất:

**60 PASSED — 0 FAILED — 100%.**

Báo cáo ban đầu 59 PASSED, 1 FAILED vẫn được
lưu để phục vụ việc theo dõi lịch sử kiểm thử.

Đây là kết quả kiểm thử trong môi trường local,
không phải bằng chứng kiểm thử độc lập trên CI.
