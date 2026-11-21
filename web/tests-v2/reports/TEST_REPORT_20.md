# BÁO CÁO KIỂM THỬ NUTRIVN — PLAYWRIGHT 2.0

## 1. Thông tin chung

| Nội dung | Thông tin |
|---|---|
| Dự án | NutriVN |
| Công cụ kiểm thử | Playwright |
| Trình duyệt | Chromium |
| Môi trường | Local Development |
| Frontend | http://localhost:5174 |
| Nhánh Git | feature/hong-playwright-v2-smoke |
| Commit được kiểm tra | b496b56 |
| Loại kiểm thử | UI, Authentication, Session, Navigation |
| Trạng thái | Hoàn thành kiểm thử 20 Test Case |

## 2. Tổng hợp kết quả

| Chỉ số | Kết quả |
|---|---:|
| Tổng Test Case | 20 |
| Passed | 20 |
| Failed | 0 |
| Skipped | 0 |
| Tỷ lệ thành công | 100% |

Kết quả được xác nhận từ lần chạy Playwright trên máy local.
Chưa được xác minh độc lập bằng GitHub Actions.

## 3. Kết quả chi tiết

### 3.1. Authentication cơ bản

| Test ID | Nội dung kiểm thử | Kết quả |
|---|---|---|
| NV2-AUTH-001 | Trang đăng nhập hiển thị | PASSED |
| NV2-AUTH-002 | Trang đăng ký hiển thị | PASSED |
| NV2-AUTH-003 | Đăng nhập có các trường bắt buộc | PASSED |
| NV2-AUTH-004 | Mật khẩu yêu cầu ít nhất 6 ký tự | PASSED |
| NV2-AUTH-005 | Có thể hiện và ẩn mật khẩu | PASSED |
| NV2-AUTH-006 | Chuyển từ đăng nhập sang đăng ký | PASSED |
| NV2-AUTH-007 | Chưa đăng nhập không được vào nhật ký | PASSED |

### 3.2. Authentication mở rộng

| Test ID | Nội dung kiểm thử | Kết quả |
|---|---|---|
| NV2-AUTH-008 | Từ chối email đăng nhập sai định dạng | PASSED |
| NV2-AUTH-009 | Từ chối email đăng ký sai định dạng | PASSED |
| NV2-AUTH-010 | Đăng ký yêu cầu nhập họ tên | PASSED |
| NV2-AUTH-011 | Đăng ký từ chối mật khẩu dưới 6 ký tự | PASSED |
| NV2-AUTH-012 | Phím Escape quay về trang giới thiệu | PASSED |

### 3.3. Session Management

| Test ID | Nội dung kiểm thử | Kết quả |
|---|---|---|
| NV2-SESSION-001 | Ghi nhớ đăng nhập bật mặc định | PASSED |
| NV2-SESSION-002 | Không ghi nhớ thì dùng sessionStorage | PASSED |
| NV2-SESSION-003 | Ghi nhớ thì dùng localStorage | PASSED |
| NV2-SESSION-004 | Reload vẫn giữ phiên đã ghi nhớ | PASSED |
| NV2-SESSION-005 | Browser Context mới không kế thừa đăng nhập | PASSED |

### 3.4. Protected Routes

| Test ID | Nội dung kiểm thử | Kết quả |
|---|---|---|
| NV2-ROUTE-001 | Chưa đăng nhập không được vào Home | PASSED |
| NV2-ROUTE-002 | Chưa đăng nhập không được vào báo cáo | PASSED |
| NV2-ROUTE-003 | Đã đăng nhập không quay lại form đăng nhập | PASSED |

## 4. Phương pháp kiểm thử

- Sử dụng Playwright với Chromium.
- Chạy các Test Case trong môi trường phát triển local.
- Kiểm tra giao diện, validation, session và điều hướng.
- Sử dụng API giả lập để cách ly các yêu cầu backend.
- Các Browser Context được cách ly để hạn chế chia sẻ trạng thái giữa các bài test.
- Không sử dụng tài khoản Google/Facebook thật.

## 5. Giới hạn

- Kết quả PASSED phản ánh những điều kiện được kiểm tra trong script.
- Chưa chứng minh tính bảo mật của cơ chế xác thực email.
- Chưa kiểm chứng xác thực Google/Facebook với backend thật.
- Chưa kiểm chứng hoạt động của Neon Database.
- Chưa kiểm tra độ chính xác thực tế của mô hình AI Food100.
- Chưa thiết lập quy trình chạy kiểm thử tự động trên GitHub Actions.

## 6. Kết luận

20/20 Test Case đã PASSED trong môi trường kiểm thử local.

Những chức năng thuộc phạm vi kiểm thử hiện tại đáp ứng các điều kiện
đã được định nghĩa trong bộ script Playwright 2.0.

Đây là kết quả kiểm thử giai đoạn đầu, không phải xác nhận
toàn bộ hệ thống NutriVN không còn lỗi.

## 7. Kế hoạch tiếp theo

- Mở rộng bộ kiểm thử lên 60 Test Case.
- Kiểm thử AI Food100, upload ảnh và xử lý lỗi.
- Kiểm thử nhật ký ăn uống và tính toán dinh dưỡng.
- Kiểm thử phân tách dữ liệu giữa các tài khoản.
- Kiểm thử báo cáo, API và giao diện responsive.
- Thiết lập GitHub Actions để lưu kết quả kiểm thử tự động.
