
# FINAL QA TEST REPORT — NUTRIVN NEXT.JS

## 1. Thông tin chung

| Thông tin | Chi tiết |
|---|---|
| Dự án | NutriVN — Food Recognition & Calorie Estimation |
| Phiên bản kiểm thử | NutriVN Next.js |
| Loại báo cáo | Final QA Test Execution Report |
| Công cụ | Playwright, Chromium |
| Môi trường | Local Development |
| Frontend | Next.js — 127.0.0.1:5173 |
| AI Backend | FastAPI — 127.0.0.1:8000 |
| Tổng số Test Case | 100 |
| Phạm vi | Functional, Quality, Security |
| Trạng thái báo cáo | Hoàn thành kiểm thử, còn vấn đề cần xử lý |

---

## 2. Mục tiêu kiểm thử

Hoạt động QA được thực hiện nhằm đánh giá mức độ đáp ứng các yêu cầu chức năng, chất lượng và một số yêu cầu bảo mật của NutriVN Next.js.

Các mục tiêu chính:

1. Kiểm tra các chức năng quan trọng của ứng dụng.
2. Xác minh hoạt động đăng ký và đăng nhập.
3. Kiểm tra chức năng nhận diện món ăn và quản lý nhật ký.
4. Đánh giá giao diện trên các kích thước màn hình.
5. Kiểm tra hiệu năng và tính ổn định của giao diện.
6. Phát hiện các lỗi ảnh hưởng đến tính toàn vẹn dữ liệu.
7. Đánh giá một số kịch bản XSS và HTML Injection.
8. Kiểm tra các điều kiện bảo mật cơ bản của FastAPI.
9. Tổng hợp kết quả và báo cáo vấn đề cho nhóm phát triển.

---

## 3. Phạm vi kiểm thử

### 3.1. Functional Testing

Kiểm thử các chức năng:

- Đăng ký và đăng nhập.
- Xác thực và quản lý phiên người dùng.
- Giao diện nhận diện món ăn bằng AI.
- Giao tiếp giữa frontend và API giả lập.
- Lưu trữ và quản lý nhật ký dinh dưỡng.
- Theo dõi calo và các chỉ số dinh dưỡng.
- Hiển thị báo cáo dinh dưỡng.

**Kết quả: 60/60 Passed.**

### 3.2. UI/UX Testing

Kiểm tra:

- Khả năng hiển thị trên màn hình mobile.
- Bố cục trên màn hình tablet.
- Hiện tượng tràn nội dung theo chiều ngang.
- Khả năng thao tác bằng bàn phím tại form đăng nhập.

**Kết quả: 4/4 Passed.**

### 3.3. Performance Testing

Kiểm tra:

- PERF-001: Thời gian giao diện Home sẵn sàng.
- PERF-002: Điều hướng liên tiếp giữa các trang.
- PERF-003: Hiển thị danh sách 100 món ăn.

Các kết quả đã ghi nhận:

| Test Case | Thời gian | Ngưỡng kiểm thử | Kết quả |
|---|---:|---:|---|
| PERF-001 | 700 ms | < 10 giây | Passed |
| PERF-002 | 6.926 ms | < 15 giây | Passed |
| PERF-003 | 724 ms | < 10 giây | Passed |

Các bài performance được chạy trên môi trường phát triển cục bộ, sử dụng dữ liệu giả lập khi cần thiết.

Kết quả không đại diện cho hiệu năng production hoặc tải đồng thời thực tế.

**Kết quả: 3/3 Passed.**

### 3.4. Reliability Testing

Nhóm Reliability bao gồm 5 Test Case:

- Phản hồi dự đoán bị trì hoãn.
- API trả lỗi HTTP 500.
- Khôi phục sau lỗi mạng.
- Nhấp đúp khi lưu món ăn.
- API trả dữ liệu không đúng cấu trúc.

Kết quả:

- Passed: 4
- Failed: 1

**Failed Test Case: NV2-REL-004**

Khi người dùng nhấp đúp nút lưu món ăn, frontend gửi hai request POST đến `/api/diary`.

Mock Diary API đã ghi nhận hai bản ghi tương ứng.

Vấn đề này có thể dẫn đến việc lưu trùng món ăn và làm sai tổng lượng calo được tính trong nhật ký.

**Trạng thái: Confirmed Bug — Chưa khắc phục.**

Chi tiết xem tại:

`web/QA_REPORTS/BUG_NV2_REL_004.md`

### 3.5. Data Integrity Testing

Nhóm kiểm thử Data Integrity gồm 6 Test Case.

Kết quả thực thi ban đầu:

- Passed: 5
- Failed: 1

Test Case cần phân loại lại:

**NV2-DATA-005 — Negative Calorie Value Handling**

Dữ liệu kiểm thử:

- Mục tiêu: 1.600 kcal.
- Mock API trả về: -100 kcal.
- Kết quả thực tế: 1.700 kcal còn lại.
- Kết quả thực thi ban đầu: Failed.

NutriVN được thiết kế để nhận diện món ăn và ước tính lượng năng lượng nạp vào cơ thể.

Giá trị calo âm không thuộc miền dữ liệu dinh dưỡng hợp lệ trong quy trình sử dụng thông thường.

Vì vậy, nhóm QA đề xuất phân loại trường hợp này là **Out of Scope (OOS)** cho phiên bản hiện tại.

Việc điều chỉnh phạm vi không đồng nghĩa với việc Test Case Passed.

Kết quả Failed ban đầu vẫn được giữ lại làm bằng chứng.

**Trạng thái đề xuất: Out of Scope — Pending Approval.**

Chi tiết xem tại:

`web/QA_REPORTS/BUG_NV2_DATA_005.md`

### 3.6. XSS / HTML Injection Testing

Các Test Case đã thực hiện:

| ID | Nội dung | Kết quả |
|---|---|---|
| NV2-SEC-019 | XSS trong tên món ăn | Passed |
| NV2-SEC-020 | XSS trong thông tin hồ sơ | Passed |
| NV2-SEC-021 | HTML Injection trong tên món ăn | Passed |

Các bài kiểm thử xác minh rằng payload được xử lý trong những luồng giao diện cụ thể mà không thực thi JavaScript độc hại theo các assertion đã xây dựng.

Những bài này sử dụng Mock API và không thay thế kiểm thử bảo mật chuyên sâu trên backend thực tế.

**Kết quả: 3/3 Passed.**

### 3.7. API Security Testing

Nhóm API Security sử dụng FastAPI thực tế chạy tại localhost.

| ID | Nội dung | Kết quả |
|---|---|---|
| NV2-SEC-022 | Từ chối file văn bản | Passed |
| NV2-SEC-023 | Phát hiện file JPEG giả mạo | Passed |
| NV2-SEC-024 | Từ chối file vượt quá 8 MB | Passed |
| NV2-SEC-025 | Kiểm tra trường file bắt buộc | Passed |
| NV2-SEC-026 | Không tiết lộ stack trace | Passed |
| NV2-SEC-027 | Từ chối Origin không tin cậy | Passed |
| NV2-SEC-028 | Health API không tiết lộ thông tin nhạy cảm theo tiêu chí kiểm thử | Passed |

Kết quả Playwright:

`7 passed (1.3s)`

Các bài kiểm thử này xác nhận những yêu cầu cụ thể trong bộ test.

Không thể từ kết quả này kết luận toàn bộ backend đã được kiểm toán bảo mật.

**Kết quả: 7/7 Passed.**

### 3.8. Authentication Security Testing

Nhóm Authentication Security gồm 12 Test Case:

| ID | Nội dung | Kết quả |
|---|---|---|
| NV2-SEC-001 | Đăng ký và đăng nhập đúng | Passed |
| NV2-SEC-002 | Từ chối mật khẩu sai | Passed |
| NV2-SEC-003 | Từ chối email chưa đăng ký | Passed |
| NV2-SEC-004 | Ngăn đăng ký trùng email | Passed |
| NV2-SEC-005 | Từ chối nhiều mật khẩu sai | Passed |
| NV2-SEC-006 | Giả mạo localStorage | Passed |
| NV2-SEC-007 | Giả mạo sessionStorage | Passed |
| NV2-SEC-008 | Không lưu mật khẩu trong browser storage | Passed |
| NV2-SEC-009 | Kiểm tra trường bắt buộc | Passed |
| NV2-SEC-010 | Kiểm tra email sai định dạng | Passed |
| NV2-SEC-011 | Không ghi nhớ đăng nhập | Passed |
| NV2-SEC-012 | Bảo vệ các trang yêu cầu đăng nhập | Passed |

Kết quả Playwright:

`12 passed (48.5s)`

Các API xác thực và nhật ký được giả lập trong Playwright nhằm bảo đảm không ảnh hưởng đến tài khoản thật hoặc Neon production.

**Kết quả: 12/12 Passed.**

Kết quả này phản ánh hành vi frontend với mock session, chưa xác minh đầy đủ cơ chế bảo mật của backend xác thực thật.

---

## 4. Phương pháp kiểm thử

### 4.1. Automated Testing

Sử dụng Playwright để:

- Mô phỏng thao tác người dùng.
- Kiểm tra điều hướng.
- Kiểm tra dữ liệu hiển thị.
- Kiểm tra trạng thái form.
- Gửi request kiểm thử đến API.
- Kiểm tra response và các điều kiện bảo mật.
- Thu thập log, screenshot, video và trace khi test thất bại.

### 4.2. Mock API Testing

Mock API được áp dụng trong phần lớn bài Functional, Quality và Authentication Security.

Mục đích:

- Cô lập dữ liệu giữa các bài kiểm thử.
- Tạo dữ liệu đầu vào có thể kiểm soát.
- Mô phỏng các tình huống lỗi.
- Tránh thay đổi dữ liệu production.
- Giúp kết quả có khả năng tái hiện.

Các kết quả Mock API không mặc nhiên chứng minh backend thật có hành vi tương tự.

### 4.3. Real API Testing

Nhóm API Security thực hiện request đến FastAPI chạy cục bộ tại:

`http://127.0.0.1:8000`

Các bài kiểm thử sử dụng endpoint `/predict` và `/health`.

---

## 5. Tổng hợp kết quả kiểm thử

### 5.1. Kết quả thực thi ban đầu

| Trạng thái | Số lượng |
|---|---:|
| Passed | 98 |
| Failed | 2 |
| Tổng cộng | 100 |

Execution Pass Rate:

98 / 100 × 100 = **98%**

### 5.2. Kết quả đề xuất sau phân loại phạm vi

| Nhóm | Tổng | Passed | Failed | Proposed OOS |
|---|---:|---:|---:|---:|
| Functional | 60 | 60 | 0 | 0 |
| UI/UX | 4 | 4 | 0 | 0 |
| Performance | 3 | 3 | 0 | 0 |
| Reliability | 5 | 4 | 1 | 0 |
| Data Integrity | 6 | 5 | 0 | 1 |
| XSS / HTML Injection | 3 | 3 | 0 | 0 |
| API Security | 7 | 7 | 0 | 0 |
| Authentication Security | 12 | 12 | 0 | 0 |
| **Tổng** | **100** | **98** | **1** | **1** |

Nếu nhóm chấp thuận chuyển DATA-005 thành Out of Scope:

- Test Case trong phạm vi: 99.
- Passed: 98.
- Failed: 1.
- Out of Scope: 1.

Accepted-Scope Pass Rate:

98 / 99 × 100 = **98,99%**

Chỉ số 98,99% là kết quả có điều kiện, không thay thế lịch sử thực thi ban đầu.

---

## 6. Danh sách vấn đề được ghi nhận

### 6.1. BUG-NV2-REL-004

**Tên:** Duplicate Meal Submission

**Trạng thái:** Failed — Confirmed Bug

**Mức độ ưu tiên:** Cần nhóm phát triển đánh giá.

**Ảnh hưởng:** Có nguy cơ lưu trùng dữ liệu món ăn và tính sai tổng lượng calo.

**Đề xuất:** Bổ sung cơ chế ngăn double-submit và kiểm soát request trùng lặp.

### 6.2. NV2-DATA-005

**Tên:** Negative Calorie Value Handling

**Kết quả thực thi:** Failed

**Phân loại đề xuất:** Out of Scope

**Lý do:** Dữ liệu calo âm được tạo nhân tạo và nằm ngoài miền dữ liệu nghiệp vụ hợp lệ được đề xuất cho phiên bản hiện tại.

**Khuyến nghị:** Bổ sung kiểm tra dữ liệu calo không hợp lệ trong các phiên bản tiếp theo.

**Trạng thái:** Chờ phê duyệt phạm vi.

---

## 7. Giới hạn kiểm thử

Báo cáo có những giới hạn sau:

1. Phần lớn bài kiểm thử sử dụng Mock API.
2. Authentication Security chưa được kiểm thử tích hợp đầy đủ với database thử nghiệm riêng biệt.
3. Kết quả Performance được đo trên môi trường phát triển cục bộ.
4. Chưa thực hiện kiểm thử tải lớn hoặc kiểm thử bảo mật chuyên sâu.
5. Lỗi REL-004 chưa được khắc phục và kiểm thử lại sau bản vá.
6. DATA-005 chỉ được đề xuất Out of Scope, chưa có quyết định phê duyệt được xác nhận.
7. Kết quả tổng hợp đến từ các lần chạy suite riêng biệt, không phải một lần chạy đồng thời toàn bộ 100 Test Case.

Các giới hạn trên cần được xem xét khi đánh giá mức độ sẵn sàng phát hành.

---

## 8. Đề xuất cải thiện

### Ưu tiên hiện tại

- Khắc phục lỗi double-submit tại nút lưu món ăn.
- Chạy lại NV2-REL-004 sau khi áp dụng bản vá.
- Hoàn tất review và quyết định phạm vi của NV2-DATA-005.

### Cải thiện trong tương lai

- Bổ sung validation dữ liệu calo.
- Thực hiện integration testing với database thử nghiệm độc lập.
- Kiểm thử backend authentication thực tế.
- Mở rộng các bài kiểm thử hiệu năng.
- Bổ sung kiểm thử tải đồng thời.
- Tự động chạy QA suite trong CI/CD khi phù hợp.

---

## 9. Kết luận

Hoạt động QA của NutriVN Next.js đã hoàn thành việc thực thi 100 Test Case theo các nhóm Functional, Quality và Security.

**Kết quả thực thi:**
- 98 Passed.
- 2 Failed.

**Kết quả phân loại đề xuất:**
- 98 Passed.
- 1 Failed.
- 1 Proposed Out of Scope.

Tỷ lệ Passed trong phạm vi được chấp nhận dự kiến là 98,99%, nếu đề xuất OOS được phê duyệt.

Nhìn chung, các kịch bản đã kiểm tra cho thấy ứng dụng đáp ứng phần lớn các điều kiện được đặt ra trong bộ kiểm thử.

Tuy nhiên, lỗi REL-004 vẫn cần được khắc phục. Đồng thời, những giới hạn của Mock API Testing và kiểm thử bảo mật cần được ghi nhận rõ ràng.

**Kết luận QA:** Hoàn thành đợt kiểm thử; chưa đề xuất xác nhận hệ thống hoàn toàn không có lỗi hoặc sẵn sàng production chỉ dựa trên kết quả hiện tại.

---

## 10. Tài liệu và bằng chứng liên quan

### Báo cáo vấn đề

- `web/QA_REPORTS/BUG_NV2_REL_004.md`
- `web/QA_REPORTS/BUG_NV2_DATA_005.md`

### Test Suites

- `web/tests-v2/`
- `web/tests-quality/`
- `web/tests-security/`

### Cấu hình Playwright

- `web/playwright.v2.config.cjs`
- `web/playwright.quality.config.cjs`
- `web/playwright.security.config.cjs`

### Bằng chứng thực thi

Các kết quả kiểm thử được ghi nhận từ Playwright CLI. Screenshot, video và trace khi có lỗi được tạo trong các thư mục test-results tương ứng ở môi trường cục bộ.

Báo cáo không khẳng định các artifact cục bộ đã được upload lên GitHub.

---

**Final QA Status:** Testing Completed — 1 Confirmed Bug Open — 1 Proposed Out of Scope.
