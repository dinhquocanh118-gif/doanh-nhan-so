# Danhfolio · Doanh nhân số

Prototype tiếng Việt để nhập tài liệu nghề nghiệp, duyệt và chia sẻ hồ sơ với đối tác.

- Website: https://dinhquocanh118-gif.github.io/doanh-nhan-so/
- Frontend GitHub Pages, PostgreSQL Supabase tại Singapore, migration trong `supabase/migrations/001_profiles.sql`.
- `npm ci && npm run dev` (Node 22+), mở http://localhost:5173. `npm test` chạy kiểm thử quyền, phiên bản, công bố/thu hồi và trích xuất. `npm run build` xuất website vào `dist/`.

## Trải nghiệm

1. Chọn tài liệu TXT, DOCX, PDF có lớp chữ, văn bản dán hoặc liên kết công khai. URL dùng Jina Reader theo thao tác chủ động. Với LinkedIn chặn đọc, nhập PDF xuất từ LinkedIn hoặc dán nội dung.
2. Kiểm tra bản nháp, mở nguồn để đối chiếu và sửa các trường. File gốc xử lý trên trình duyệt. Database lưu phần chữ trích xuất. PDF scan cần OCR trước.
3. Lưu hồ sơ, chọn từng mục công bố và tải QR. Đối tác mở được bằng điện thoại, không cần mã quản lý. Có thể ghi URL lên thẻ NFC bằng công cụ ghi thẻ.
4. Tại trang đối tác, tra cứu theo nội dung đã công bố hoặc nhập nhu cầu hợp tác để tìm từ khóa trùng và xem căn cứ. AI Qwen qua WebLLM là tùy chọn chạy trên thiết bị có WebGPU. Lần đầu cần tải mô hình, có thể thiếu bộ nhớ. Phần nhập/xuất và tra cứu cơ bản vẫn hoạt động độc lập.
5. Giữ mã không gian 64 ký tự ở nơi an toàn để chuyển thiết bị. Mã là quyền quản lý cho bản thử nghiệm. Không có chức năng khôi phục mã bị mất, tài khoản email hay xác minh danh tính doanh nhân.

## Dữ liệu và vận hành

Bảng nằm trong schema riêng, bật RLS, không cấp quyền bảng cho khách. Các RPC kiểm tra băm SHA-256 của mã sở hữu. Trang công khai chỉ lấy ảnh chụp các trường đã duyệt qua mã UUID. Lưu bản nháp không ghi đè bản công bố. Thu hồi vô hiệu hóa URL và QR, công bố lại sinh mã mới. Sao chép ngoại tuyến trước khi thu hồi vẫn có thể tồn tại. Bản dùng thử giới hạn 25 hồ sơ/không gian, 8 nguồn/hồ sơ, 8 MB/tệp và 45.000 ký tự/nguồn. Hồ sơ mẫu hoàn toàn giả định.

`web/config.js` chỉ chứa project URL và khóa publishable của dự án. Khi tự triển khai, thay cấu hình, chạy migration trên Supabase, bật GitHub Pages với nguồn GitHub Actions. Workflow build và deploy khi cập nhật main. Sao lưu từ trang Backups của Supabase theo khả năng gói hoặc dùng pg_dump với thông tin kết nối giữ ngoài repo. Môi trường chạy thật với dữ liệu nhạy cảm cần có đăng nhập, kiểm soát lạm dụng theo người dùng và quy trình khôi phục.
