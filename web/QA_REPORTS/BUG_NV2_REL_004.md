# BÁO CÁO LỖI PHẦN MỀM — NUTRIVN

## 1. Thông tin lỗi

| Thuộc tính | Nội dung |
|---|---|
| Mã lỗi | BUG-NV2-REL-004 |
| Mã Test Case | NV2-REL-004 |
| Tên lỗi | Tạo bản ghi món ăn trùng lặp khi nhấn nút lưu hai lần liên tiếp |
| Dự án | NutriVN — Next.js |
| Chức năng | Nhận diện món ăn AI / Nhật ký ăn uống |
| Loại lỗi | Reliability — Độ tin cậy |
| Mức độ nghiêm trọng | Medium — Trung bình (đề xuất) |
| Trạng thái | Open — Chưa khắc phục |
| Ngày phát hiện | 27/11/2026 |
| Người kiểm thử | QA Team |

## 2. Mô tả lỗi

Trong quá trình kiểm thử chức năng lưu món ăn vào nhật ký, hệ thống xuất hiện tình trạng tạo ra hai bản ghi khi người dùng nhấn đúp vào nút **"LƯU ƯỚC TÍNH VÀO NHẬT KÝ"**.

Kết quả kiểm thử Playwright xác nhận frontend gửi hai HTTP request `POST /api/diary` liên tiếp. Mock Diary API xử lý cả hai request và tạo ra hai bản ghi món ăn.

Điều này cho thấy chức năng lưu món ăn chưa ngăn chặn hiệu quả thao tác gửi yêu cầu lặp lại trong kịch bản kiểm thử.

## 3. Môi trường kiểm thử

- Nền tảng: NutriVN Next.js
- Công cụ kiểm thử: Playwright
- Trình duyệt: Chromium
- Địa chỉ kiểm thử: `http://127.0.0.1:5173`
- Authentication: Mock Authentication
- Diary API: Stateful Mock API
- Cơ sở dữ liệu: Không kết nối Neon thật
- File kiểm thử: `web/tests-quality/reliability.spec.cjs`

## 4. Các bước tái hiện lỗi

1. Khởi động ứng dụng NutriVN Next.js.
2. Đăng nhập bằng tài khoản QA trong môi trường Mock Authentication.
3. Truy cập trang chủ `/home`.
4. Tải lên một hình ảnh món ăn hợp lệ.
5. Chờ hệ thống hiển thị kết quả nhận diện món ăn.
6. Nhấn đúp liên tiếp vào nút **"LƯU ƯỚC TÍNH VÀO NHẬT KÝ"**.
7. Kiểm tra số lượng request `POST /api/diary`.
8. Kiểm tra số lượng bản ghi được tạo trong nhật ký.

## 5. Kết quả mong đợi (Expected Result)

- Hệ thống chỉ xử lý một thao tác lưu cho một lần nhận diện món ăn.
- Chỉ tạo một bản ghi trong nhật ký.
- Không phát sinh bản ghi trùng lặp do thao tác nhấn nút liên tiếp.

**Số bản ghi mong đợi: 1**

## 6. Kết quả thực tế (Actual Result)

Kết quả chạy Playwright:

```text
REL-004: POST /api/diary requests = 2
REL-004: Diary records = 2

Expected: 1
Received: 2

Test Result: FAILED
```

Frontend gửi hai yêu cầu lưu và Mock Diary API tạo hai bản ghi.

**Số bản ghi thực tế: 2**

## 7. Phân tích nguyên nhân có thể xảy ra

Dựa trên kết quả kiểm thử, nguyên nhân có thể liên quan đến cơ chế xử lý sự kiện lưu món ăn ở frontend:

- Nút lưu chưa được vô hiệu hóa kịp thời khi yêu cầu đầu tiên đang xử lý.
- Hàm xử lý lưu món ăn có thể được gọi nhiều lần trước khi trạng thái đang lưu được cập nhật.
- Chưa có cơ chế ngăn gửi trùng yêu cầu trong cùng một thao tác.

Đây là các giả thuyết cần nhóm phát triển kiểm tra mã nguồn để xác nhận.

## 8. Ảnh hưởng của lỗi

Nếu hành vi này xảy ra trong môi trường thực tế, lỗi có thể:

- Tạo nhiều bản ghi cho cùng một món ăn.
- Làm tăng sai tổng calories tiêu thụ trong ngày.
- Ảnh hưởng đến độ chính xác của nhật ký dinh dưỡng và báo cáo.
- Khiến người dùng phải xóa thủ công các bản ghi trùng.

## 9. Đề xuất khắc phục

1. Vô hiệu hóa nút lưu trong thời gian đang xử lý yêu cầu.
2. Sử dụng trạng thái `isSaving` hoặc cơ chế khóa đồng bộ để ngăn gọi hàm lưu nhiều lần.
3. Cân nhắc sử dụng cơ chế idempotency ở backend nhằm tránh tạo bản ghi trùng khi cùng một yêu cầu được gửi lại.
4. Kiểm thử lại thao tác double-click sau khi sửa lỗi.

## 10. Kiểm thử xác nhận sau khi sửa (Retesting)

Chạy lại Test Case `NV2-REL-004` bằng lệnh:

```powershell
npx.cmd playwright test tests-quality/reliability.spec.cjs --config=playwright.quality.config.cjs --grep NV2-REL-004 --reporter=list
```

Điều kiện để Test Case Passed:

- Chỉ có một request `POST /api/diary` trong kịch bản double-click.
- Nhật ký chỉ chứa một bản ghi mới.
- Test Case hoàn thành mà không phát sinh assertion Failed.

## 11. Kết luận

**Trạng thái hiện tại: FAILED — OPEN**

Test Case `NV2-REL-004` đã tái hiện được lỗi lưu trùng trong môi trường kiểm thử Next.js với Stateful Mock API.

Lỗi cần được nhóm phát triển frontend kiểm tra và khắc phục trước khi thực hiện Regression Testing.

**Giới hạn kiểm thử:** Kết quả chỉ xác nhận hành vi frontend và Mock Diary API. Chưa có bằng chứng kết luận cơ sở dữ liệu Neon hoặc backend thực tế cũng tạo bản ghi trùng.