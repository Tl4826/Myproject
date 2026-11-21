# NUTRIVN — AUTHENTICATION SECURITY TEST REPORT

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|---|---|
| Dự án | NutriVN |
| Công cụ | Playwright |
| Trình duyệt | Chromium |
| Môi trường | Local Development |
| Nhánh | feature/hong-playwright-v2-smoke |
| Bộ kiểm thử | Authentication Security |
| Tổng Test Case | 12 |
| Passed | 6 |
| Failed | 6 |
| Thời gian thực thi | 2.2 phút |
| Pass Rate | 50% |

Đây là kết quả kiểm thử local, chưa được xác minh
độc lập bằng GitHub Actions.

## 2. Kết quả chi tiết

| Test ID | Nội dung kiểm thử | Kết quả |
|---|---|---|
| NV2-SEC-001 | Đăng ký và đăng nhập bằng mật khẩu đúng | PASSED |
| NV2-SEC-002 | Từ chối mật khẩu sai | FAILED |
| NV2-SEC-003 | Từ chối email chưa đăng ký | FAILED |
| NV2-SEC-004 | Ngăn đăng ký email trùng | FAILED |
| NV2-SEC-005 | Từ chối các mật khẩu sai khác nhau | FAILED |
| NV2-SEC-006 | Ngăn giả mạo phiên qua localStorage | FAILED |
| NV2-SEC-007 | Ngăn giả mạo phiên qua sessionStorage | FAILED |
| NV2-SEC-008 | Mật khẩu không xuất hiện trong browser storage | PASSED |
| NV2-SEC-009 | Không cho gửi form khi bỏ trống trường bắt buộc | PASSED |
| NV2-SEC-010 | Từ chối email sai định dạng | PASSED |
| NV2-SEC-011 | Không ghi nhớ sử dụng sessionStorage | PASSED |
| NV2-SEC-012 | Chưa đăng nhập không vào được trang riêng tư | PASSED |

## 3. Những vấn đề được phát hiện

### SEC-002 — Mật khẩu sai vẫn đăng nhập thành công

Expected:
Hệ thống từ chối đăng nhập và giữ người dùng ở /login.

Actual:
Ứng dụng chuyển tới /home.

Status: FAILED.

### SEC-003 — Email chưa đăng ký vẫn đăng nhập được

Expected:
Email không tồn tại phải bị từ chối.

Actual:
Ứng dụng chuyển tới /home.

Status: FAILED.

### SEC-004 — Không ngăn đăng ký email trùng

Expected:
Ứng dụng từ chối việc đăng ký email đã tồn tại.

Actual:
Ứng dụng vẫn chuyển tới /home.

Status: FAILED.

### SEC-005 — Các mật khẩu sai không bị từ chối

Expected:
Hệ thống phải xác minh mật khẩu trước khi đăng nhập.

Actual:
Ứng dụng cho đăng nhập với mật khẩu sai trong lần thử đầu.

Status: FAILED.

### SEC-006 — Phiên giả mạo qua localStorage

Expected:
Dữ liệu localStorage tự tạo không được cấp quyền truy cập.

Actual:
Ứng dụng vẫn cho truy cập /diary.

Status: FAILED.

### SEC-007 — Phiên giả mạo qua sessionStorage

Expected:
Dữ liệu sessionStorage tự tạo không được cấp quyền truy cập.

Actual:
Ứng dụng vẫn cho truy cập /baocao.

Status: FAILED.

## 4. Phân tích nguyên nhân

Trong phiên bản NutriVN được kiểm thử:

- Đăng nhập email hiện hoạt động theo cơ chế prototype.
- Chưa có bước đối chiếu email và mật khẩu với tài khoản.
- Trạng thái đăng nhập phía frontend phụ thuộc vào dữ liệu trình duyệt.
- Chưa có xác minh phiên đăng nhập email từ backend.

Các hành vi trên phù hợp với kết quả của 6 bài Failed.

Cần phân biệt việc truy cập trang frontend với việc
truy cập dữ liệu được bảo vệ trên backend.

Bộ kiểm thử này chưa xác nhận có thể vượt qua phân quyền
của Neon Database.

## 5. Mức độ ưu tiên

| Vấn đề | Mức ưu tiên |
|---|---|
| Không đối chiếu mật khẩu | Cao |
| Email chưa đăng ký vẫn đăng nhập | Cao |
| Tin tưởng phiên giả mạo trên trình duyệt | Cao |
| Không kiểm tra email trùng | Trung bình |

Đây là mức ưu tiên đề xuất cho nhóm phát triển,
không phải kết quả chấm điểm bảo mật tự động.

## 6. Hướng khắc phục

1. Triển khai backend authentication cho email/password.
2. Lưu mật khẩu bằng cơ chế hash chuyên dụng như Argon2id.
3. Kiểm tra email tồn tại trước khi đăng nhập.
4. Áp dụng ràng buộc email duy nhất khi đăng ký.
5. Xác minh phiên đăng nhập từ backend.
6. Không dựa vào localStorage/sessionStorage để cấp quyền.
7. Kiểm tra quyền truy cập trên từng API riêng tư.
8. Chạy lại tất cả Test Case sau khi sửa.

## 7. Phạm vi và giới hạn

- Kiểm thử trên frontend local.
- Không sử dụng tài khoản thật.
- Các request API được cách ly bằng mock.
- Chưa thử xác thực email/password với backend thật.
- Chưa kiểm tra chính sách mật khẩu trên server.
- Chưa kiểm chứng phân quyền Neon Database.
- Chưa chạy GitHub Actions.

SEC-001 PASSED chỉ xác nhận luồng đăng nhập với
thông tin được nhập, chưa chứng minh mật khẩu được xác thực.

SEC-008 PASSED chỉ xác nhận mật khẩu thử nghiệm
không xuất hiện trong browser storage, chưa chứng minh
mật khẩu được hash an toàn tại backend.

## 8. Hướng dẫn chạy lại

Tại thư mục web:

    npx.cmd playwright test --config=playwright.security.config.cjs

Xem HTML report:

    npx.cmd playwright show-report playwright-report-security

## 9. Kết luận

Authentication Security Testing:

- 12 Test Case đã thực thi.
- 6 PASSED.
- 6 FAILED.
- Pass Rate: 50%.

Các bài FAILED ghi nhận những hành vi chưa đáp ứng
yêu cầu xác thực và kiểm soát phiên.

Nhóm phát triển cần xử lý các vấn đề này trước
khi sử dụng xác thực email/password trong môi trường thực tế.

Kết quả bộ kiểm thử chức năng 60/60 PASSED trước đó
được giữ riêng và không bị thay đổi.
