# QA REPORT — NV2-DATA-005

**Dự án:** NutriVN — Food Recognition & Calorie Estimation  
**Test Case ID:** NV2-DATA-005  
**Nhóm kiểm thử:** Data Integrity Testing  
**Chức năng:** Theo dõi và tính toán lượng calo hằng ngày  
**Loại báo cáo:** Đề xuất điều chỉnh phạm vi kiểm thử (Scope Adjustment)  
**Kết quả thực thi ban đầu:** Failed  
**Trạng thái đề xuất:** Out of Scope (OOS)  
**Trạng thái phê duyệt:** Chờ nhóm dự án xác nhận

---

## 1. Mô tả Test Case

Test Case `NV2-DATA-005` được thiết kế nhằm kiểm tra khả năng xử lý dữ liệu calo âm trong quá trình tính toán tổng lượng calo tiêu thụ và lượng calo còn lại trong ngày.

Trong quá trình kiểm thử, Playwright sử dụng Mock API để giả lập dữ liệu món ăn có giá trị calo âm và quan sát cách giao diện NutriVN xử lý dữ liệu này.

**Dữ liệu kiểm thử:**

| Thông số | Giá trị |
|---|---|
| Mục tiêu calo hằng ngày | 1.600 kcal |
| Giá trị calo giả lập | -100 kcal |
| Kết quả mong đợi theo test | Lượng calo còn lại không vượt quá 1.600 kcal |
| Kết quả thực tế | 1.700 kcal |
| Kết quả thực thi | Failed |

**Nhận xét:** Giao diện đã sử dụng giá trị calo âm trong phép tính, dẫn đến lượng calo còn lại lớn hơn mục tiêu ban đầu.

## 2. Phân tích phạm vi chức năng

NutriVN là ứng dụng hỗ trợ nhận diện món ăn bằng hình ảnh và ước tính lượng calo nhằm giúp người dùng theo dõi chế độ dinh dưỡng.

Các chức năng chính bao gồm:

- Nhận diện món ăn từ hình ảnh bằng mô hình AI.
- Ước tính lượng calo tương ứng với món ăn.
- Lưu trữ các món ăn vào nhật ký dinh dưỡng.
- Tính tổng lượng calo tiêu thụ trong ngày.
- Hiển thị lượng calo còn lại so với mục tiêu cá nhân.

Trong phạm vi sử dụng thông thường, lượng calo của một món ăn được biểu diễn bằng giá trị không âm.

Giá trị `-100 kcal` không đại diện cho lượng năng lượng của một món ăn được tiêu thụ và không thuộc miền dữ liệu đầu vào hợp lệ mà ứng dụng hướng tới.

Đặc biệt, dữ liệu âm trong bài kiểm thử được đưa vào thông qua Mock API, không phải kết quả nhận diện món ăn thực tế đã được xác nhận từ hệ thống.

Vì vậy, nhóm QA đề xuất xem việc xử lý dữ liệu calo âm được giả lập là một trường hợp kiểm thử ngoài phạm vi chức năng đã thống nhất cho phiên bản hiện tại.

## 3. Lý do đề xuất chuyển sang Out of Scope

**Lý do 1 — Không phù hợp với nghiệp vụ chính**

NutriVN được xây dựng để ước tính và theo dõi lượng calo nạp vào cơ thể thông qua thực phẩm.

Lượng calo âm không phải dữ liệu dinh dưỡng hợp lệ trong quy trình ghi nhận lượng năng lượng từ món ăn.

**Lý do 2 — Dữ liệu được tạo nhân tạo trong môi trường kiểm thử**

Test Case sử dụng giá trị `calories: -100` được đưa vào qua Mock API nhằm kiểm tra khả năng xử lý dữ liệu bất thường.

Đây là tình huống thử nghiệm dữ liệu không hợp lệ, không phải một trường hợp sử dụng bình thường của người dùng.

**Lý do 3 — Ưu tiên phạm vi phát triển hiện tại**

Phạm vi chức năng hiện tại tập trung vào độ chính xác nhận diện món ăn, ước tính calo và quản lý nhật ký dinh dưỡng với dữ liệu hợp lệ.

Việc kiểm tra và chuẩn hóa mọi giá trị bất thường từ nguồn dữ liệu bên ngoài có thể được xem xét trong các hoạt động cải thiện độ tin cậy và toàn vẹn dữ liệu của phiên bản tiếp theo.

Việc loại trừ trường hợp này cần được nhóm dự án xác nhận dựa trên yêu cầu và phạm vi kiểm thử đã thống nhất.

## 4. Đề xuất điều chỉnh trạng thái Test Case

Nhóm QA đề xuất thay đổi phân loại của `NV2-DATA-005` như sau:

| Nội dung | Trước điều chỉnh | Sau điều chỉnh đề xuất |
|---|---|---|
| Test Case ID | NV2-DATA-005 | NV2-DATA-005 |
| Kết quả thực thi | Failed | Failed — giữ lịch sử |
| Trạng thái phạm vi | In Scope | Out of Scope |
| Tính vào Passed | Không | Không |
| Tính vào Failed trong phạm vi được chấp nhận | Có | Không |
| Lưu bằng chứng kiểm thử | Có | Có |

**Nguyên tắc:** Out of Scope không đồng nghĩa với Passed.

Bài kiểm thử đã thực sự Failed và kết quả đó cần được giữ lại. Việc thay đổi trạng thái chỉ nhằm phân loại lại phạm vi kiểm thử, không phải sửa hoặc che giấu kết quả.

## 5. Đánh giá rủi ro

Mặc dù calo âm không phải dữ liệu hợp lệ trong quy trình nghiệp vụ thông thường, vẫn tồn tại khả năng hệ thống nhận dữ liệu bất thường từ:

- API trả về dữ liệu sai định dạng hoặc sai giá trị.
- Lỗi trong quá trình xử lý hoặc chuyển đổi dữ liệu.
- Dữ liệu được nhập hoặc đồng bộ không hợp lệ.
- Những thay đổi trong các phiên bản ứng dụng tương lai.

Do đó, kết quả kiểm thử cho thấy ứng dụng chưa xử lý an toàn giá trị calo âm trong kịch bản Mock API đã kiểm tra.

Việc phân loại Out of Scope không chứng minh API thực tế luôn loại bỏ calo âm và không loại trừ hoàn toàn rủi ro về tính toàn vẹn dữ liệu.

**Đề xuất cải thiện trong tương lai:** Bổ sung validation để bảo đảm `calories` là giá trị số hữu hạn, không âm trước khi thực hiện các phép tính dinh dưỡng.

## 6. Ảnh hưởng đến tổng kết QA

Kết quả 100 Test Case trước khi điều chỉnh phạm vi:

| Trạng thái | Số lượng |
|---|---:|
| Passed | 98 |
| Failed | 2 |
| Out of Scope | 0 |
| Tổng cộng | 100 |

Kết quả đề xuất sau khi `NV2-DATA-005` được phê duyệt Out of Scope:

| Trạng thái | Số lượng |
|---|---:|
| Passed | 98 |
| Failed (In Scope) | 1 |
| Out of Scope | 1 |
| Tổng cộng | 100 |

**Pass Rate trong phạm vi được chấp nhận:**

98 / 99 × 100 = **98,99%**

Test Case `NV2-REL-004` vẫn giữ trạng thái Failed và cần được xử lý riêng.

## 7. Kết luận

Dựa trên mục tiêu nghiệp vụ của NutriVN và tính chất dữ liệu được sử dụng trong bài kiểm thử, nhóm QA đề xuất phân loại `NV2-DATA-005` thành **Out of Scope (OOS)** cho phiên bản hiện tại.

Lý do là kịch bản sử dụng calo âm không thuộc miền dữ liệu hợp lệ của quy trình nhận diện món ăn và ước tính năng lượng tiêu thụ.

Đề xuất này không làm thay đổi kết quả thực thi ban đầu và không xác nhận rằng ứng dụng đã xử lý đúng dữ liệu calo âm.

**Quyết định đề xuất:**

- Chuyển phân loại phạm vi của `NV2-DATA-005` sang Out of Scope sau khi được phê duyệt.
- Không tính Test Case này vào Passed hoặc Failed của phạm vi được chấp nhận.
- Giữ lại lịch sử Failed và bằng chứng kiểm thử.
- Khuyến nghị bổ sung validation dữ liệu calo trong các phiên bản tiếp theo.

**Trạng thái cuối cùng:** Proposed Out of Scope — Pending Approval.