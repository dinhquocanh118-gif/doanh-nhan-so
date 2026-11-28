# Kịch bản demo 3 phút · Danhfolio

Bản demo chạy ở **chế độ demo**: toàn bộ dữ liệu nằm trong trình duyệt, không cần database hay khóa API, nên không phụ thuộc mạng. Mọi nhân vật, doanh nghiệp và hiệp hội trong bản demo đều là **giả định**.

## 1. Chuẩn bị trước buổi trình bày

- [ ] `npm ci` rồi `npm test` (23 bài đều pass) và `npm run build`.
- [ ] Đưa website lên GitHub Pages (push `main`) để quét QR bằng điện thoại. QR của **hồ sơ mẫu** mở được trên mọi thiết bị. Hồ sơ tự tạo chỉ xem được trên máy đang demo.
- [ ] Mở website trên laptop, vào Tổng quan, bấm **Nạp lại bộ hồ sơ demo** để đưa dữ liệu về trạng thái ban đầu.
- [ ] Đăng nhập thử mục **Tổ chức** (mã `PHUONGNAM-DEMO`, đã điền sẵn). Hồ sơ Võ Ngọc Lan chưa có mục nào được xác nhận, dùng để xác nhận trực tiếp trên sân khấu.
- [ ] Điện thoại: mở trước một lần hồ sơ Lê Quốc Hưng để chắc chắn quét được, hoặc chuẩn bị ảnh QR trên slide.
- [ ] Quay sẵn một video màn hình toàn bộ luồng dưới đây làm phương án dự phòng.

Mở website bằng địa chỉ có `?mode=local` nếu trình duyệt từng được chuyển sang chế độ `remote`.

## 2. Luồng demo (khớp 5 bước ở trang Tổng quan)

| Giờ | Màn hình | Thao tác | Điều cần nói |
|---|---|---|---|
| 0:00 | Slide | Nêu vấn đề | "Gặp đối tác mới, ta mất hàng giờ ghép thông tin rời rạc mà vẫn không biết có tin được không. Danhfolio trả lời 5 câu hỏi trong 30 giây." |
| 0:25 | Tạo hồ sơ → tab Văn bản | Bấm **Dùng văn bản mẫu** → Thêm văn bản → **Trích xuất cơ bản** → Lưu bản nháp | "Tài liệu rời rạc được đọc thành hồ sơ có cấu trúc. Nguồn gốc luôn được giữ để đối chiếu." |
| 0:50 | Trang hồ sơ vừa lưu | Chọn mục công bố → **Công bố hồ sơ** | "Chủ hồ sơ tự chọn mục nào công khai, mục nào giữ riêng." |
| 1:00 | Tổ chức | Đăng nhập → xác nhận Chức danh và Doanh nghiệp của Võ Ngọc Lan | "Hiệp hội xác nhận từng thông tin. Đối tác sẽ thấy huy hiệu kèm tên tổ chức và ngày xác nhận." |
| 1:30 | Điện thoại | Quét QR hồ sơ Lê Quốc Hưng | "Đối tác không cần cài gì. Họ thấy ngay đâu là tự khai, đâu là có tài liệu, đâu được tổ chức xác nhận." |
| 2:00 | Hỏi đáp | Bấm "Hồ sơ này được xác nhận những gì?", rồi "Họ đang tìm kiếm điều gì?", rồi gõ "Giá vàng hôm nay?" | "Trợ lý chỉ trả lời từ nội dung đã công bố, kèm trích dẫn. Hỏi điều hồ sơ không có thì nó từ chối, không bịa." |
| 2:30 | Hợp tác | Chọn vai trò **Nhà thiết kế nội thất** | "Ra ngay mức phù hợp, cặp *năng lực của họ ↔ nhu cầu của bạn*, và gợi ý cách làm việc chung." |
| 2:50 | Slide | Chốt | "Giá trị nằm ở tổ chức: hiệp hội chuẩn hóa hồ sơ thành viên và bảo chứng cho họ." |

## 3. Cách nói trung thực về phần "AI" và "xác thực"

Những điều bản demo **đang làm được**, có thể khẳng định:
- Đọc tài liệu thành hồ sơ có cấu trúc, giữ nguồn đối chiếu.
- Ba tầng tin cậy, với tầng cao nhất do tổ chức xác nhận. Xác nhận gắn với nội dung đã duyệt, nên sửa nội dung thì huy hiệu tự mất.
- Hỏi đáp có trích dẫn và từ chối khi thiếu căn cứ. Mục riêng tư không bao giờ vào ngữ cảnh.
- Mức phù hợp hai chiều, có giải thích và nguồn.

Những điều **chưa làm**, đừng nói như đã có:
- Hỏi đáp hiện là **truy xuất và trích dẫn**, chưa dùng mô hình ngôn ngữ lớn để viết câu trả lời. Có thể nói: "bước tiếp theo là thêm LLM để diễn giải, phần truy xuất và nguồn giữ nguyên".
- Hệ thống **không tự biết sự thật**. Nó ghi lại *ai đã bảo chứng cho điều gì*. Chưa có xác minh danh tính (eKYC/VNeID).
- Mã quản trị tổ chức là mã mẫu. Bản thật cần tài khoản và phân quyền.
- Nhóm khái niệm dùng để chấm phù hợp được viết cho các ngành trong bộ mẫu. Ngành khác sẽ được so khớp từ khóa, kết quả kém chính xác hơn.
- Chưa có số liệu thị trường. Hãy nói thẳng đây là **giả thuyết cần kiểm chứng với 1-2 hiệp hội thí điểm**, đừng đưa ra con số doanh thu hay người dùng.

## 4. Câu hỏi hội đồng có thể hỏi

**Khác gì LinkedIn?**
LinkedIn là mạng xã hội toàn cầu, thông tin phần lớn do người dùng tự khai. Danhfolio là lớp hồ sơ **do tổ chức bảo chứng cho một cộng đồng cụ thể**, hiện huy hiệu rõ từng mục, và cho phép hỏi đáp và ghép nhu cầu ngay trong cộng đồng đó. Chúng tôi không thay LinkedIn, mà phục vụ hiệp hội muốn có danh bạ thành viên đáng tin của riêng mình.

**Làm sao tin thông tin tự khai?**
Không cố chứng minh tất cả. Hồ sơ chia ba tầng: tự khai, có tài liệu đối chiếu, tổ chức xác nhận. Đối tác nhìn thấy tầng của từng mục. Bước sau có thể đối chiếu dữ liệu doanh nghiệp công khai và, khi có đối tác, xác minh danh tính.

**Ai trả tiền?**
Giả thuyết là hiệp hội, CLB, quỹ và tập đoàn cần chuẩn hóa hồ sơ cho nhiều thành viên. Chúng tôi chưa kiểm chứng mức giá, đó là mục tiêu của giai đoạn thí điểm.

**Dữ liệu cá nhân thì sao?**
Chủ hồ sơ chọn từng mục công bố và có thể thu hồi liên kết bất cứ lúc nào. Sau khi thu hồi, URL và QR cũ ngừng hoạt động. Bản thật sẽ cần rà soát theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.

**Đây là AI thật không?**
Phần đọc tài liệu, truy xuất, trích dẫn và chấm phù hợp chạy bằng thuật toán, có thể kiểm chứng từng kết luận bằng nguồn. Việc dùng LLM để diễn giải là bước tiếp theo, và nó chỉ nhận các đoạn đã được truy xuất và lọc quyền.

## 5. Nếu có sự cố

| Sự cố | Cách xử lý |
|---|---|
| Không có mạng | Demo vẫn chạy vì dữ liệu nằm trong trình duyệt. Chỉ quét QR trên điện thoại cần mạng. |
| QR không mở trên điện thoại | Dùng video quay sẵn hoặc đưa điện thoại cho hội đồng mở đường link in trên slide. |
| Dữ liệu demo bị xáo trộn | Tổng quan → **Nạp lại bộ hồ sơ demo**. Hồ sơ tự tạo không bị ảnh hưởng. |
| Nhu cầu gõ tay cho kết quả lạ | Quay lại 5 vai trò có sẵn trong tab Hợp tác. |
