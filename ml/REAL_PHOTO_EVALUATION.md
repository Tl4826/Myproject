# Food50 — đánh giá ảnh thực tế

Công cụ `ml/evaluate_real_photos.py` đánh giá model ONNX 50 món bằng ảnh **được gắn nhãn thủ công**. Không dùng lại ảnh huấn luyện/validation/test để báo cáo chất lượng ngoài thực tế.

## Chuẩn bị ảnh

Tạo thư mục riêng **ngoài Git** (không commit ảnh cá nhân). Mỗi thư mục con phải trùng chính xác một nhãn trong `ml/models/classes.json`:

```text
photos/
  Banh cuon/
    001.jpg
    002.jpg
  Hu tieu/
    001.jpg
  Pho/
    001.jpg
```

Nên bắt đầu với 5–10 ảnh/món; để đánh giá toàn bộ 50 món, thu thập ảnh cho cả 50 nhãn. Dùng ảnh được phép sử dụng, tránh ảnh chứa thông tin cá nhân.

## Chạy

Từ thư mục gốc repository:

```bash
python -m pip install -r requirements.txt
python ml/evaluate_real_photos.py --photos /path/to/photos --out evaluation-results
```

Kết quả:
- `evaluation-results/summary.json`: Top-1, Top-3, tỷ lệ đúng từng món và các cặp dễ nhầm.
- `evaluation-results/predictions.csv`: từng ảnh, nhãn thật, nhãn dự đoán, xác suất và Top 3.

Không upload ảnh lên server. Không tự huấn luyện lại model. Kết quả chỉ đại diện cho tập ảnh đã cung cấp; ảnh quá ít hoặc mất cân bằng giữa các món sẽ khiến tỷ lệ tổng thể khó diễn giải. Thư mục kết quả không chứa nội dung ảnh, nhưng tên file có thể mang thông tin riêng tư: kiểm tra trước khi chia sẻ.

## Chạy trực tiếp từ Google Colab với Google Drive

**Quan trọng:** Google Colab authentication yêu cầu IPython kernel. Không chạy `!python ml/evaluate_drive_photos.py` vì lệnh này tạo tiến trình riêng và gây lỗi `AttributeError: 'NoneType' object has no attribute 'kernel'`.

Trong **ô code Colab**, sau khi clone repo và cài dependencies, chạy:

```python
%cd /content/NutriVN
%run ml/evaluate_drive_photos.py
```

Colab sẽ hiện hộp thoại cấp quyền Drive. Chỉ cần chạy lại `%run` nếu lần đầu chưa hoàn tất xác thực. Báo cáo xuất vào `/content/NutriVN/evaluation-results/own_photos`.
