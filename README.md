# Cộng Đồng Nội Tâm Quốc Tế — Website

Website tĩnh (HTML/CSS/JS thuần, không cần build) cho trang Cộng Đồng Nội Tâm Song Ngữ, dựa trên thiết kế gốc `Cộng Đồng Nội Tâm - Website.dc.html`.

## Cấu trúc

```
site/
├── index.html
├── css/style.css
├── js/
│   ├── i18n-data.js        # Nội dung song ngữ (vi/en)
│   ├── diagrams-data.js    # Thứ tự 405 đồ hình (tự sinh, xem ghi chú bên dưới)
│   ├── quotes-data.js      # Danh sách 31 ảnh câu nói
│   ├── flipbook.js         # Component flipbook (vanilla JS, hiệu năng cao)
│   └── main.js             # Khởi tạo, i18n, nav, footer...
└── images/
    ├── brand/       # logo WiT
    ├── dohinh/      # 810 ảnh (405 cặp vi/en) — flipbook "Đồ hình"
    └── quotes/      # 31 ảnh — flipbook "Câu nói nội tâm"
```

**Về thứ tự đồ hình:** thư mục gốc không có file quy định thứ tự, nên đã áp dụng quy tắc: tên file có số ở đầu (2_, 3_, 4_...16_, 10000_) xếp theo số trước, phần còn lại (~372 đồ hình) xếp theo alphabet tên file. Nếu cần thứ tự khác, gửi lại danh sách thứ tự mong muốn (theo tên file, bỏ đuôi `_vi`/`_en`) để cập nhật `js/diagrams-data.js`.

**Link "Nền tảng tri thức từ Thầy Lê"** (mục Khái niệm nguồn) đã trỏ tới https://thudac.songtute.com/ (mở tab mới).

**Firebase:** hiện chưa tích hợp (theo yêu cầu) — toàn bộ site là tĩnh, không có phần nào cần lưu dữ liệu. Khi cần thêm tính năng (form đăng ký, Nhật Ký Nội Tâm...), có thể thêm Firebase SDK qua CDN/npm sau.

## Chạy thử local

Không cần cài đặt gì, chỉ cần một static server bất kỳ, ví dụ:

```bash
npx serve .
# hoặc
python3 -m http.server 8080
```

rồi mở `http://localhost:<port>/`.

## Deploy lên Cloudflare Pages

1. **Đẩy code lên GitHub** (tạo repo trống trên GitHub trước, ví dụ `congdong-noitam-website`), sau đó:
   ```bash
   git remote add origin <URL_repo_github_cua_ban>
   git branch -M main
   git push -u origin main
   ```
2. Vào **Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git**, chọn repo vừa tạo.
3. Cấu hình build:
   - **Framework preset:** None
   - **Build command:** để trống
   - **Build output directory:** `/` (thư mục gốc của repo, vì đây đã là site tĩnh không cần build)
4. Bấm **Save and Deploy**. Cloudflare sẽ cấp domain dạng `*.pages.dev`.
5. (Tuỳ chọn) Vào **Custom domains** để gắn domain riêng.

Từ lần sau, mỗi lần `git push` lên nhánh `main`, Cloudflare Pages sẽ tự động build & deploy lại.
