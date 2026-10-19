# Import danh sách API Customer App vào Google Sheets

## File

| File | Mô tả |
|------|--------|
| [CUSTOMER_APP_API.csv](./CUSTOMER_APP_API.csv) | Danh sách API + **cột luồng người dùng** (kể từng bước trên app) |
| [CUSTOMER_APP_API_TONG_HOP.csv](./CUSTOMER_APP_API_TONG_HOP.csv) | Tổng hợp nhanh |

Encoding: **UTF-8 BOM**.

## Cách đọc (cho dev / BA)

**Cột quan trọng nhất: «Luồng người dùng & mô tả API»**

Viết theo kiểu:

> Người dùng ở màn X → làm Y (nhập email, bấm nút…) → app gọi API này → thành công thì sang màn Z / thất bại thì báo gì.

Ví dụ đăng nhập:

> Người dùng ở màn Đăng nhập → nhập email + mật khẩu → bấm Đăng nhập → API kiểm tra → đúng thì vào Trang chủ, sai thì báo lỗi ở lại màn Đăng nhập.

**Đọc trước 2 dòng đầu:**

- **F1** — toàn bộ luồng Pass đồ (mua / bán)
- **F2** — toàn bộ luồng đặt chuyến chuyển trọ

Các cột còn lại (Method, Path, Body, Response) là contract kỹ thuật khi implement.

## Google Sheets

1. **File → Import** → `CUSTOMER_APP_API.csv`
2. Separator: **Comma**
3. **Freeze** hàng 1
4. Cột **J** («Luồng người dùng…»): **Wrap text**, width ~400px
5. Filter theo **Nhóm chức năng** / **Trạng thái BE**

## Sửa mô tả luồng

Chỉnh file `docs/scripts/customer_api_narratives.py` (từng API theo số STT), rồi:

```bash
python docs/scripts/generate_customer_api_csv.py
```

Import lại CSV vào Sheet.
