## AI AGENT RULES — BẮT BUỘC THỰC HIỆN

### Quy trình làm việc bắt buộc:
Sau khi viết hoặc sửa code xong, PHẢI thực hiện các bước sau trước khi báo hoàn thành:

1. **Tự review lại toàn bộ code vừa viết** — kiểm tra logic, edge cases, lỗi tiềm ẩn
2. **Chạy thử** nếu có thể — không được báo xong mà chưa test
3. **Kiểm tra tính liên kết** với các file khác trong project
4. **Liệt kê rõ** những gì đã làm, tại sao làm vậy
5. **KHÔNG được báo hoàn thành** nếu chưa tự test và verify

### Tiêu chuẩn chất lượng:
- Không viết code tạm thời (placeholder, TODO) mà không báo rõ
- Không bỏ qua error handling
- Không giả định mà phải kiểm tra thực tế trong codebase
### Giám sát chất lượng:
- Thực hiện công việc 1 cách nghiêm túc
- Sau khi thực hiện xong sẽ có claude code vào kiểm tra lại và đánh giá kết quản bạn đã làm.