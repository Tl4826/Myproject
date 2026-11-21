# BÁO CÁO KIỂM THỬ NUTRIVN — PLAYWRIGHT 2.0

## 1. Thông tin chung

| Nội dung | Thông tin |
|---|---|
| Dự án | NutriVN |
| Công cụ | Playwright |
| Trình duyệt | Chromium |
| Môi trường | Local Development |
| Nhánh | feature/hong-playwright-v2-smoke |
| Thời gian chạy | 2.6 phút |

## 2. Tổng hợp kết quả

| Nhóm kiểm thử | Passed | Failed |
|---|---:|---:|
| Authentication | 12 | 0 |
| Session Management | 5 | 0 |
| Protected Routes | 3 | 0 |
| AI Food100 (Mock API) | 12 | 0 |
| Diary | 10 | 0 |
| **Tổng** | **42** | **0** |

**Kết quả: 42/42 PASSED — 100%.**

Đây là kết quả chạy local, chưa phải kết quả chạy trên GitHub Actions.

## 3. Test Case AI Food100

| ID | Nội dung | Kết quả |
|---|---|---|
| NV2-AI-001 | Hiển thị chức năng quét món ăn | PASSED |
| NV2-AI-002 | Hiển thị trạng thái ban đầu | PASSED |
| NV2-AI-003 | Input upload chỉ chấp nhận ảnh | PASSED |
| NV2-AI-004 | Từ chối tệp văn bản | PASSED |
| NV2-AI-005 | Từ chối ảnh vượt 8MB | PASSED |
| NV2-AI-006 | Nhận diện Pizza và 540 kcal | PASSED |
| NV2-AI-007 | Hiển thị Top 3 dự đoán | PASSED |
| NV2-AI-008 | Chọn Sushi cập nhật 350 kcal | PASSED |
| NV2-AI-009 | Cảnh báo độ tin cậy thấp | PASSED |
| NV2-AI-010 | Xử lý món thiếu dữ liệu dinh dưỡng | PASSED |
| NV2-AI-011 | Xử lý API trả HTTP 500 | PASSED |
| NV2-AI-012 | Xử lý tên món không hợp lệ | PASSED |

## 4. Test Case Diary

| ID | Nội dung | Kết quả |
|---|---|---|
| NV2-DIARY-001 | Truy cập trang nhật ký | PASSED |
| NV2-DIARY-002 | Nhật ký trống của tài khoản mới | PASSED |
| NV2-DIARY-003 | Lưu món từ kết quả AI | PASSED |
| NV2-DIARY-004 | Hiển thị tên món, calo và macro | PASSED |
| NV2-DIARY-005 | Thay đổi loại bữa ăn | PASSED |
| NV2-DIARY-006 | Xóa món khỏi nhật ký | PASSED |
| NV2-DIARY-007 | Giữ dữ liệu sau reload | PASSED |
| NV2-DIARY-008 | Lưu nhiều món và tính tổng calo | PASSED |
| NV2-DIARY-009 | Phân tách nhật ký giữa hai tài khoản | PASSED |
| NV2-DIARY-010 | Món thiếu dinh dưỡng không làm sai tổng calo | PASSED |

## 5. Các bài kiểm thử nền tảng

20 Test Case Authentication, Session và Navigation
được mô tả trong [TEST_REPORT_20.md](TEST_REPORT_20.md).

Cả 20 bài đều PASSED trong lần chạy tổng hợp 42 bài.

## 6. Giới hạn kiểm thử

- AI Food100 sử dụng Mock API, chưa đo độ chính xác mô hình thật.
- Nhật ký kiểm thử dùng tài khoản email giả lập và localStorage.
- Chưa kiểm tra phân quyền trên Neon Database thật.
- Chưa có kết quả kiểm thử tự động trên GitHub Actions.
- 42/42 PASSED không đồng nghĩa toàn bộ ứng dụng không còn lỗi.

## 7. Hướng dẫn chạy lại

Tại thư mục `web`, khởi động frontend ở localhost:5174.

Chạy:

    npx.cmd playwright test --config=playwright.v2.config.cjs

Mở HTML Report:

    npx.cmd playwright show-report playwright-report-v2

## 8. Kết luận

42/42 Test Case đã PASSED trong môi trường local.

Bộ kiểm thử đạt 70% mục tiêu 60 Test Case.
