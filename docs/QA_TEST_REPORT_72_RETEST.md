# NutriVN — QA Regression & Security Test Report

**Ngày kiểm thử:** 23/11/2026  
**Dự án:** NutriVN — AI Food Recognition & Nutrition Tracking  
**Công cụ:** Playwright  
**Trình duyệt:** Chromium  
**Môi trường:** Local Development  
**Frontend:** http://localhost:5173  
**Backend:** http://127.0.0.1:8000  
**Source baseline:** `origin/main` — `7f44006`

## 1. Executive Summary

Đợt kiểm thử đánh giá khả năng hoạt động của ứng dụng NutriVN sau khi đồng bộ mã nguồn từ nhánh `main`, đồng thời kiểm thử lại các vấn đề bảo mật đã được ghi nhận.

| Test Suite | Total | Passed | Failed | Pass Rate |
|---|---:|---:|---:|---:|
| Functional Testing | 60 | 60 | 0 | 100% |
| Authentication Security — Run 3 | 12 | 6 | 6 | 50% |
| **Total** | **72** | **66** | **6** | **91.67%** |

**Overall Status: FUNCTIONAL PASSED — SECURITY ISSUES UNRESOLVED**

## 2. Functional Testing Results

**Kết quả: 60/60 PASSED**

**Thời gian chạy:** 2.4 phút  
**Worker:** 1  
**Browser:** Chromium

| Nhóm kiểm thử | Tổng | Passed |
|---|---:|---:|
| AI Food Recognition | 12 | 12 |
| API Error Handling | 4 | 4 |
| UI & Responsive | 3 | 3 |
| Authentication & Session & Routing | 20 | 20 |
| Diary Management | 10 | 10 |
| Nutrition & BMI | 6 | 6 |
| Reports & Analytics | 5 | 5 |
| **Total** | **60** | **60** |

Các chức năng vượt qua kiểm thử bao gồm nhận diện món ăn với phản hồi API mô phỏng, hiển thị Top 3, xử lý lỗi API, lưu nhật ký, tính calo, BMI và báo cáo tuần.

Trong lần chạy trước, `NV2-AUTH-012` thất bại do assertion cố định cổng `5174`. Sau khi điều chỉnh test và chạy lại, bài này đã Passed.

Kết quả 60/60 chỉ phản ánh phạm vi các bài kiểm thử Functional hiện có, không đồng nghĩa toàn bộ chức năng ứng dụng đã được kiểm tra đầy đủ.

## 3. Security Testing — Run 3

**Kết quả: 6 PASSED — 6 FAILED**

**Thời gian chạy:** 1.7 phút  
**Pass Rate:** 50%

### 3.1. Test Cases Passed

| Test Case | Nội dung | Status |
|---|---|---|
| NV2-SEC-001 | Đăng ký và đăng nhập với mật khẩu đúng | PASSED |
| NV2-SEC-008 | Mật khẩu không xuất hiện trong browser storage | PASSED |
| NV2-SEC-009 | Không gửi form khi bỏ trống trường bắt buộc | PASSED |
| NV2-SEC-010 | Từ chối email sai định dạng | PASSED |
| NV2-SEC-011 | Không ghi nhớ chỉ sử dụng sessionStorage | PASSED |
| NV2-SEC-012 | Không có phiên không truy cập được trang riêng tư | PASSED |

### 3.2. Test Cases Failed

| Test Case | Expected | Actual | Status |
|---|---|---|---|
| NV2-SEC-002 | Từ chối mật khẩu sai | Chuyển đến `/home` | FAILED |
| NV2-SEC-003 | Từ chối email chưa đăng ký | Chuyển đến `/home` | FAILED |
| NV2-SEC-004 | Ngăn đăng ký trùng email | Chuyển đến `/home` | FAILED |
| NV2-SEC-005 | Không chấp nhận các mật khẩu sai | Chuyển đến `/home` | FAILED |
| NV2-SEC-006 | Từ chối phiên giả mạo qua localStorage | Truy cập được `/diary` | FAILED |
| NV2-SEC-007 | Từ chối phiên giả mạo qua sessionStorage | Truy cập được `/baocao` | FAILED |

### 3.3. Security Retest Comparison

| Kết quả | Run 1 | Run 2 | Run 3 |
|---|---:|---:|---:|
| Total | 12 | 12 | 12 |
| Passed | 6 | 6 | 6 |
| Failed | 6 | 6 | 6 |
| Pass Rate | 50% | 50% | 50% |

Không có bài Failed nào chuyển sang Passed, cũng không có bài Passed nào chuyển sang Failed.

**Security Status: NO CHANGE — 6 ISSUES REMAIN UNRESOLVED.**

## 4. Additional Security Observations

Trong quá trình chạy `npm install`, npm báo cáo:

- 3 dependency vulnerabilities mức Moderate.
- 1 dependency vulnerability mức High.

Đây là kết quả cảnh báo dependency ban đầu. Cần thực hiện `npm audit` để xác định package, advisory và ảnh hưởng thực tế.

Chưa đủ bằng chứng để phân loại những cảnh báo này thành lỗ hổng có thể khai thác trong NutriVN.

## 5. Test Limitations

- Các bài AI Functional sử dụng phản hồi API mô phỏng ở những trường hợp tương ứng; chưa chứng minh độ chính xác của mô hình trên ảnh thật.
- Authentication Security hiện chủ yếu kiểm thử hành vi frontend và browser storage.
- Chưa xác minh bảo vệ dữ liệu ở backend hoặc phân quyền cơ sở dữ liệu.
- Kết quả này không phải một đợt penetration testing toàn diện.
- FastAPI `/health` đã phản hồi thành công với 100 lớp món ăn, nhưng kiểm tra này không thay thế bài dự đoán ảnh thực tế.

## 6. Recommendations

1. Hoàn thiện cơ chế xác thực email/password ở backend trước khi triển khai hệ thống tài khoản thật.
2. Không sử dụng dữ liệu browser storage tự khai báo làm bằng chứng xác thực có độ tin cậy cao.
3. Xác minh phân quyền backend với các yêu cầu API riêng tư.
4. Kiểm tra bốn dependency vulnerabilities bằng npm audit.
5. Bổ sung các bài kiểm thử bảo mật API, XSS, file upload, CORS, dữ liệu bất thường và hiệu năng.
6. Thực hiện regression testing sau mỗi lần sửa lỗi.

## 7. Final Conclusion

**Functional Testing: 60/60 PASSED — 100%.**

**Security Testing Run 3: 6/12 PASSED — 50%.**

**Overall: 66/72 PASSED — 91.67%.**

NutriVN đáp ứng toàn bộ 60 trường hợp Functional được kiểm thử trong lần chạy này. Tuy nhiên, sáu bài Security tiếp tục thất bại do những hạn chế chưa được giải quyết của cơ chế xác thực frontend prototype.

**Kết luận QA: Chức năng đạt yêu cầu trong phạm vi bộ test hiện có; chưa đạt các kỳ vọng bảo mật xác thực được kiểm thử.**