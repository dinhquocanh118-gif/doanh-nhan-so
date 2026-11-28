# DANH-PORT · Doanh Nhân Số

**Nền tảng Hồ sơ Năng lực & Kết nối Doanh nhân ứng dụng AI.**  
Biến các tài liệu rời rạc thành một hồ sơ kinh doanh có chứng cứ, có thể đối thoại trực tiếp và tự động đánh giá mức độ phù hợp hợp tác.

---

## 1. Vấn đề tồn tại

Khi gặp đối tác mới trong kinh doanh, 3 rào cản lớn nhất luôn xuất hiện:
- **Thiếu niềm tin & Khó thẩm định:** Không biết đối tác có thực sự uy tín, năng lực thật đến đâu và thông tin tự giới thiệu có đáng tin hay không.
- **Mất thời gian tìm hiểu nhau:** Thông tin của một doanh nhân bị phân mảnh ở nhiều nơi (CV, bài báo, website công ty, LinkedIn...), đối tác phải tự chắp nối mà vẫn khó trả lời nhanh câu hỏi *"Liệu có hợp tác được với nhau không?"*.
- **Khó nhìn ra điểm chung:** Hai bên ngồi nói chuyện lâu nhưng chưa chắc nắm được người kia đang có nguồn lực gì và đang tìm kiếm gì.

## 2. Dự án giải quyết điều gì?

Giải quyết **sự phân mảnh thông tin** và **rút ngắn thời gian thẩm định đối tác** thông qua một hồ sơ thống nhất, giúp người đối diện nắm trọn **5 câu hỏi cốt lõi trong 30 giây**:
1. **Là ai?** — Vai trò, vị thế và doanh nghiệp đang điều hành.
2. **Năng lực & Tầm cỡ?** — Kinh nghiệm thực chiến, quy mô dự án, thành tựu nổi bật.
3. **Có xác thực không?** — Nguồn tài liệu đối chiếu và mức độ tin cậy của từng thông tin.
4. **Đang có gì & Tìm gì?** — Nguồn lực sẵn có và nhu cầu hợp tác hiện tại.
5. **Có phù hợp hợp tác không?** — Mức độ tương thích và các điểm có thể làm việc chung.

## 3. Thể loại hồ sơ

- **Thể loại:** **Hồ sơ Năng lực Kinh doanh & Điều hành (Business / Executive Profile)** — không phải CV xin việc làm thuê, không phải Portfolio trưng bày mỹ thuật, và không bắt buộc là CV nghiên cứu khoa học.
- **Tính chất:** Thực chiến (tập trung vào doanh nghiệp, dự án, vai trò điều hành), có chứng cứ đối chiếu và hướng tới mục tiêu kết nối thương mại (B2B).

## 4. Phạm vi & Đối tượng (Scope)

- **Người dùng cuối (End-user):** Founder, Doanh nhân, CEO, Nhà quản lý cấp cao và Chuyên gia/Cố vấn độc lập.
- **Khách hàng trả tiền trọng tâm (B2B / Tổ chức):** Các **Hiệp hội doanh nghiệp, Hội đồng khởi nghiệp, CLB Doanh nhân, Quỹ đầu tư, Tập đoàn lớn** — những tổ chức cần chuẩn hóa hồ sơ cho hàng trăm thành viên/chuyên gia để thẩm định uy tín và thúc đẩy kết nối giao thương nội bộ.

## 5. Bốn điểm nhấn cốt lõi (Trọng tâm khác biệt)

1. **Thông tin minh bạch & Có chứng cứ xác thực:** Phân tách rõ dữ liệu *Tự khai báo*, *Có tài liệu đối chiếu* (gắn nguồn gốc để đối tác bấm kiểm tra) và *Được tổ chức xác nhận* — đồng thời phân quyền chặt chẽ giữa *Công khai* và *Riêng tư*.
2. **AI làm sạch & Hỏi đáp trực tiếp trên hồ sơ:**
   - *Cho chủ hồ sơ:* AI tự đọc tài liệu rời rạc và **phát hiện điểm mâu thuẫn / thiếu sót** (lệch thời gian, sai lệch tên tổ chức, thiếu bằng chứng) trước khi công bố.
   - *Cho đối tác:* **Trợ lý AI (RAG)** trả lời trực tiếp mọi câu hỏi về kinh nghiệm, năng lực ngay trên hồ sơ, kèm trích dẫn nguồn và tuyệt đối giữ bí mật các thông tin riêng tư.
3. **Đánh giá mức độ phù hợp ngay lập tức:** Người xem chỉ cần chọn vai trò hoặc nhập 1 câu nhu cầu là thấy ngay **mức độ phù hợp** với chủ hồ sơ mà không cần đọc hết tài liệu dài.
4. **Gợi ý điểm kết nối để làm việc chung:** Chỉ ra cụ thể **hai bên bổ trợ cho nhau ở điểm nào** (*Năng lực của người này ↔ Nhu cầu của người kia*) và đề xuất các kịch bản hợp tác thực tế.

---

## Thông tin kỹ thuật & Vận hành (Prototype hiện tại)

- Website: https://dinhquocanh118-gif.github.io/doanh-nhan-so/
- Frontend GitHub Pages, PostgreSQL Supabase tại Singapore, migration trong `supabase/migrations/001_profiles.sql`.
- `npm ci && npm run dev` (Node 22+), mở `http://localhost:5173`. `npm test` chạy kiểm thử quyền, phiên bản, công bố/thu hồi và trích xuất. `npm run build` xuất website vào `dist/`.

### Chế độ demo (bản trình bày)
- Mặc định website chạy **chế độ demo**: dữ liệu nằm trong trình duyệt, không cần Supabase hay khóa API. Dùng `?mode=remote` để quay lại database Supabase.
- Có 6 hồ sơ mẫu giả định cùng một hiệp hội mẫu. Mục **Tổ chức** (mã quản trị mẫu `PHUONGNAM-DEMO`) cho phép xác nhận hoặc thu hồi từng thông tin, hiện thành huy hiệu cho đối tác. Xác nhận gắn với nội dung đã duyệt, sửa nội dung thì huy hiệu tự mất.
- Hỏi đáp trên hồ sơ dùng truy xuất và trích dẫn (`web/rag.js`), từ chối khi hồ sơ không nêu. Tab Hợp tác chấm mức phù hợp hai chiều kèm cặp bổ trợ và gợi ý cách làm việc chung (`web/fit.js`).
- Kịch bản trình bày 3 phút, câu hỏi phản biện và phương án dự phòng: [docs/DEMO.md](docs/DEMO.md).
- Chưa có: xác minh danh tính, đăng nhập thật cho tổ chức, LLM diễn giải câu trả lời, đồng bộ hồ sơ tự tạo giữa các thiết bị ở chế độ demo.

### Trải nghiệm hiện có
1. Chọn tài liệu TXT, DOCX, PDF có lớp chữ, văn bản dán hoặc liên kết công khai. URL dùng Jina Reader theo thao tác chủ động. Với LinkedIn chặn đọc, nhập PDF xuất từ LinkedIn hoặc dán nội dung.
2. Kiểm tra bản nháp, mở nguồn để đối chiếu và sửa các trường. File gốc xử lý trên trình duyệt. Database lưu phần chữ trích xuất. PDF scan cần OCR trước.
3. Lưu hồ sơ, chọn từng mục công bố và tải QR. Đối tác mở được bằng điện thoại, không cần mã quản lý. Có thể ghi URL lên thẻ NFC bằng công cụ ghi thẻ.
4. Tại trang đối tác, tra cứu theo nội dung đã công bố hoặc nhập nhu cầu hợp tác để tìm từ khóa trùng và xem căn cứ. AI Qwen qua WebLLM là tùy chọn chạy trên thiết bị có WebGPU. Lần đầu cần tải mô hình, có thể thiếu bộ nhớ. Phần nhập/xuất và tra cứu cơ bản vẫn hoạt động độc lập.
5. Giữ mã không gian 64 ký tự ở nơi an toàn để chuyển thiết bị. Mã là quyền quản lý cho bản thử nghiệm. Không có chức năng khôi phục mã bị mất, tài khoản email hay xác minh danh tính doanh nhân.

### Dữ liệu và vận hành
Bảng nằm trong schema riêng, bật RLS, không cấp quyền bảng cho khách. Các RPC kiểm tra băm SHA-256 của mã sở hữu. Trang công khai chỉ lấy ảnh chụp các trường đã duyệt qua mã UUID. Lưu bản nháp không ghi đè bản công bố. Thu hồi vô hiệu hóa URL và QR, công bố lại sinh mã mới. Sao chép ngoại tuyến trước khi thu hồi vẫn có thể tồn tại. Bản dùng thử giới hạn 25 hồ sơ/không gian, 8 nguồn/hồ sơ, 8 MB/tệp và 45.000 ký tự/nguồn. Hồ sơ mẫu hoàn toàn giả định.

`web/config.js` chỉ chứa project URL và khóa publishable của dự án. Khi tự triển khai, thay cấu hình, chạy migration trên Supabase, bật GitHub Pages với nguồn GitHub Actions. Workflow build và deploy khi cập nhật main. Sao lưu từ trang Backups của Supabase theo khả năng gói hoặc dùng `pg_dump` với thông tin kết nối giữ ngoài repo. Môi trường chạy thật với dữ liệu nhạy cảm cần có đăng nhập, kiểm soát lạm dụng theo người dùng và quy trình khôi phục.
