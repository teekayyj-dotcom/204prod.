# Hướng Dẫn & Quy Định Cho AI Agent (Agent.md)

Tài liệu này quy định các nguyên tắc bắt buộc cho AI Agent khi thao tác và chỉnh sửa mã nguồn trong toàn bộ dự án `204prod.vn`.

---

## 1. Quy Định Kiểm Thử Bắt Buộc (Mandatory Testing Policy)

Mỗi khi thực hiện thay đổi, sửa lỗi (bugfix) hoặc thêm tính năng mới (feature), Agent **BẮT BUỘC** phải tuân thủ quy trình kiểm thử sau:

### 1.1. Sinh Test (Test Generation) Nếu Chưa Có
- Trước hoặc ngay sau khi chỉnh sửa code, Agent phải kiểm tra xem module/chức năng đó đã có unit test tương ứng chưa.
- **Nếu chưa có test**: Agent phải chủ động tạo unit test kiểm chứng (grounding test) tại thư mục `backend/tests/` (đối với backend) hoặc thư mục test tương ứng (đối với frontend).
- Bộ test phải bao quát:
  1. **Happy path**: Luồng hoạt động chuẩn với dữ liệu hợp lệ.
  2. **Edge cases & Constraints**: Dữ liệu rỗng, chuỗi trắng (`""`, `"   "`), `None`, ID/slug không tồn tại, kiểm tra ràng buộc khóa ngoại (foreign key), ràng buộc duy nhất (unique), v.v.

### 1.2. Chạy Test Xác Minh (Run Tests)
- **Backend**: Sử dụng môi trường ảo của backend để chạy test:
  ```bash
  cd backend && ../backend/.venv/bin/python -m unittest discover -s tests -p "test_*.py"
  ```
  *(Hoặc chạy file test cụ thể: `cd backend && ../backend/.venv/bin/python -m unittest tests/test_<module>.py`)*
- **Frontend**: Luôn kiểm tra tính toàn vẹn của mã nguồn TypeScript / React:
  ```bash
  cd frontend && npm run build
  ```
- **Tuyệt đối không được bỏ qua bước chạy test** hoặc báo cáo hoàn thành khi chưa chạy test xác minh. Nếu test xuất hiện lỗi, Agent phải phân tích nguyên nhân gốc rễ và xử lý triệt để.

---

## 2. Quy Định Tự Động Commit (Automatic Git Commit Policy)

- Sau khi hoàn thành code và **tất cả các bài test (backend & frontend) đều vượt qua 100% không có lỗi**:
  Agent phải tự động tạo commit git vào repository để lưu lại tiến trình làm việc.
- Định dạng commit tuân theo **Conventional Commits**:
  - `fix(<scope>): <mô tả ngắn ngọn lỗi được sửa>`
  - `feat(<scope>): <mô tả ngắn gọn tính năng mới>`
  - `test(<scope>): <mô tả test được thêm mới>`
  - `refactor(<scope>): <mô tả tái cấu trúc mã nguồn>`
- **Lưu ý an toàn khi commit**:
  - Không commit các file tạm, file log (`.log`), file cơ sở dữ liệu tạm (`*.sqlite`, `*.db`), file cấu hình môi trường chứa secret (`.env`, `.env.local`), hoặc thư mục cache (`__pycache__`, `node_modules`).
  - Kiểm tra `git status` trước khi commit để đảm bảo chỉ stage các file có liên quan trực tiếp đến công việc.
