# Danhfolio · Doanh nhân số

Prototype tiếng Việt để nhập tài liệu nghề nghiệp, duyệt và chia sẻ hồ sơ với đối tác.

- Website: https://dinhquocanh118-gif.github.io/doanh-nhan-so/
- Frontend GitHub Pages, PostgreSQL Supabase tại Singapore, migration trong `supabase/migrations/` (chạy theo thứ tự 001 → 003).
- `npm ci && npm run dev` (Node 22.18+), mở http://localhost:5173. `npm run build` xuất website vào `dist/` và tự gắn mã phiên bản theo nội dung cho `app.js`/`app.css`.
- `npm test` chạy kiểm thử database (PGlite), Edge Function, các module giao diện và kiểm thử đầu-cuối bằng Playwright (Chromium). `npm run format` định dạng code bằng Prettier; CI chạy `npm run format:check`.

## Cấu trúc frontend

`web/app.js` điều hướng theo hash và gắn sự kiện; `views.js` dựng các trang; `actions.js` xử lý nút và form; `state.js` giữ trạng thái phiên và mã không gian; `ui.js` chứa tiện ích DOM. `data.js`, `profile.js`, `imports.js`, `avatar.js`, `ai.js` là phần trích xuất, tra cứu, đọc tệp và AI trên thiết bị.

## Trải nghiệm

1. Chọn tài liệu TXT, DOCX, PDF có lớp chữ, văn bản dán hoặc liên kết công khai. URL dùng Jina Reader theo thao tác chủ động. Với LinkedIn chặn đọc, nhập PDF xuất từ LinkedIn hoặc dán nội dung.
2. Kiểm tra bản nháp, mở nguồn để đối chiếu và sửa các trường. File gốc xử lý trên trình duyệt. Database lưu phần chữ trích xuất. PDF scan cần OCR trước.
3. Lưu hồ sơ, chọn từng mục công bố và tải QR. Đối tác mở được bằng điện thoại, không cần mã quản lý. Có thể ghi URL lên thẻ NFC bằng công cụ ghi thẻ.
4. Tại trang đối tác, tra cứu theo nội dung đã công bố hoặc nhập nhu cầu hợp tác để tìm từ khóa trùng và xem căn cứ. AI Qwen qua WebLLM là tùy chọn chạy trên thiết bị có WebGPU. Lần đầu cần tải mô hình, có thể thiếu bộ nhớ. Phần nhập/xuất và tra cứu cơ bản vẫn hoạt động độc lập.
5. Giữ mã không gian 64 ký tự ở nơi an toàn để chuyển thiết bị. Ứng dụng nhắc sao lưu khi không gian đã có hồ sơ và cho tải tệp sao lưu `.txt`; thiết bị mới mở lại bằng tệp này hoặc dán mã. Mã là quyền quản lý cho bản thử nghiệm. Không có chức năng khôi phục mã bị mất, tài khoản email hay xác minh danh tính doanh nhân.

## Dữ liệu và vận hành

Bảng nằm trong schema riêng, bật RLS, không cấp quyền bảng cho khách. Các RPC kiểm tra băm SHA-256 của mã sở hữu. Trang công khai chỉ lấy ảnh chụp các trường đã duyệt qua mã UUID. Lưu bản nháp không ghi đè bản công bố. Thu hồi vô hiệu hóa URL và QR, công bố lại sinh mã mới. Sao chép ngoại tuyến trước khi thu hồi vẫn có thể tồn tại. Bản dùng thử giới hạn 25 hồ sơ/không gian, 8 nguồn/hồ sơ, 8 MB/tệp và 45.000 ký tự/nguồn. Migration 003 thêm giới hạn tần suất lưu trong database: mỗi địa chỉ IP (lưu dạng băm) tạo tối đa 20 hồ sơ và lưu 120 lần mỗi giờ, toàn hệ thống tối đa 400 hồ sơ mới mỗi giờ; vượt giới hạn trả HTTP 429. Danh sách trường hồ sơ nằm duy nhất ở `dns_private.profile_fields()`.

Edge Function `extract-profile` dùng secret `OPENAI_API_KEY` của chủ dự án cho mọi thiết bị và không gian; không cần bật riêng từng không gian (secret `DNS_AI_WORKSPACE_HASH` cũ không còn dùng). `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` do Supabase cung cấp sẵn, dùng để gọi `dns_ai_quota` giữ chi phí trong tầm kiểm soát: mỗi không gian 1 lượt/5 giây và 20 lượt/giờ, mỗi địa chỉ IP 30 lượt/giờ, toàn hệ thống 300 lượt/ngày. CORS cho phép trang GitHub Pages và `localhost:5173`. Hồ sơ mẫu hoàn toàn giả định.

`web/config.js` chỉ chứa project URL và khóa publishable của dự án. Khi tự triển khai, thay cấu hình, chạy migration trên Supabase, bật GitHub Pages với nguồn GitHub Actions. Workflow build và deploy khi cập nhật main. Sao lưu từ trang Backups của Supabase theo khả năng gói hoặc dùng pg_dump với thông tin kết nối giữ ngoài repo. Môi trường chạy thật với dữ liệu nhạy cảm cần có đăng nhập, kiểm soát lạm dụng theo người dùng và quy trình khôi phục.
