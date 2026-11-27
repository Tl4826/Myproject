# Góp ý UI/UX cho nhóm 2 — Remi (Task 5a)

Ngày 28/11/2026. Review mã nguồn với hỗ trợ AI; chưa kiểm thử trực tiếp trên trình duyệt. Repo: [Project_Remi](https://github.com/Kaiser-2504/Project_Remi), xác định nhóm qua [góp ý #42](https://github.com/Tl4826/Myproject/issues/42). Đã thử đăng issue tại repo nhóm 2 nhưng GitHub integration trả HTTP 403; **chưa gửi thành công, chưa có phản hồi**. Thành viên nhóm cần mở issue thật, ghi link và phản hồi tại đây.

## Ưu điểm
- SiteNav có aria-current và điều hướng responsive; NeedLogin có hướng dẫn.
- Lịch có điều hướng tháng, danh sách việc riêng cho mobile và đọc dữ liệu theo phiên.
- Form liên hệ có label, thông báo lỗi, focus trường lỗi và giữ nội dung khi lỗi mạng.

## 1. Lịch trên mobile
[app/lich/page.js](https://github.com/Kaiser-2504/Project_Remi/blob/HEAD/app/lich/page.js): chip công việc thu thành vạch màu (max-sm:text-[0px]), ô ngày chưa có link đến nhóm agenda tương ứng. Đề xuất thêm link/nút ngày có tên truy cập chứa ngày và số việc, dẫn đến agenda hoặc mở chi tiết; bổ sung empty state. Kiểm thử 320/375px với tháng rỗng/nhiều việc, chạm và bàn phím.

## 2. Luồng đăng nhập
[app/_components/Site.js](https://github.com/Kaiser-2504/Project_Remi/blob/HEAD/app/_components/Site.js): NeedLogin dẫn về trang chủ và yêu cầu tự quay lại. Đề xuất giữ đích nội bộ hợp lệ (allowlist /lich, /thong-ke), khôi phục trang/tháng sau login; thử phiên hết hạn, đăng nhập, chặn redirect bên ngoài.

## 3. Minh bạch form liên hệ
[app/lien-he/page.js](https://github.com/Kaiser-2504/Project_Remi/blob/HEAD/app/lien-he/page.js) và [web/js/lien-he.js](https://github.com/Kaiser-2504/Project_Remi/blob/HEAD/web/js/lien-he.js): form yêu cầu email và lưu lời nhắn nhưng chưa thấy mô tả mục đích sử dụng email ngay cạnh form. Đề xuất thêm giải thích theo chính sách thật của nhóm và hướng dẫn không đưa thông tin cá nhân không cần thiết. Giữ hành vi giữ nội dung, focus trường lỗi và role=status hiện có. Kiểm thử email sai, offline, thành công, trình đọc màn hình.

Đề nghị nhóm Remi trả lời từng mục (chấp nhận/không, lý do) và liên kết PR cùng ảnh/test thực tế nếu sửa. Đây là nhận xét từ source, không khẳng định lỗi runtime chưa kiểm tra.
