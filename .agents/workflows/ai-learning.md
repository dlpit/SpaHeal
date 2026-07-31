---
description: Lưu Learning từ conversation hiện tại vào .agents/learnings. theo chủ đề
---

---
name: ai-learning-workflow
description: "Tự động trích xuất kiến thức từ conversation hiện tại, phân loại và lưu trữ vào .agents/learnings/ để tái sử dụng cho các task sau."
version: "1.0"
---

# AI Learning Workflow

**MỤC ĐÍCH (PURPOSE):**
Trích xuất kiến thức có giá trị từ conversation hiện tại và lưu vào **1 file duy nhất theo tên feature/chức năng**, tổng hợp cả 4 khía cạnh: Architecture, Bugs, How-to, Patterns.
AI PHẢI tự động thực thi luồng này khi người dùng xác nhận muốn lưu Learnings ở cuối mỗi task. Tuyệt đối KHÔNG hỏi lại xác nhận định dạng, trực tiếp ghi vào file.

---

## Bước 1: Scan file hiện tại & Xác định Feature

### 1.1: Scan thư mục learnings
AI **BẮT BUỘC** đọc danh sách file trong thư mục `.agents/learnings/` trước tiên để biết những feature nào đã có file.

### 1.2: Xác định feature từ conversation
AI phân tích conversation hiện tại và xác định tên feature/chức năng chính đã thực hiện (VD: Header, Shopping Cart, User Authentication).

### 1.3: Quyết định tạo mới hay cập nhật
- **Nếu đã có file chứa feature đó:** (Ví dụ: conversation về notification mà `notification.md` đã tồn tại) -> **Cập nhật file đó**. Tuyệt đối không tạo file mới.
- **Nếu chưa có file nào liên quan:** -> Tạo file mới với tên **kebab-case**, ngắn gọn (Ví dụ: `notification.md`, `user-segmentation.md`, `splash-screen.md`).

### 1.4: Thông báo trạng thái (Ngắn gọn)
- Nếu cập nhật file cũ, in ra: `> "Đang cập nhật learnings vào: [tên file]"`
- Nếu tạo file mới, in ra: `> "Đang tạo file learnings mới: [tên file]"`

---

## Bước 2: Trích xuất Learnings

AI quét toàn bộ conversation và phân loại thông tin có giá trị tái sử dụng vào 4 nhóm sau:

| Section | Nội dung bắt buộc | Ví dụ minh họa |
| :--- | :--- | :--- |
| **Architecture** | Quyết định kiến trúc, design rationale, tại sao chọn A thay B. | "Dùng WorkManager thay AlarmManager vì..." |
| **Bugs & Solutions** | Lỗi đã gặp, root cause, cách fix dứt điểm. | "Lỗi NPE khi... -> Fix bằng cách..." |
| **How-To** | Quy trình step-by-step để thực hiện một việc cụ thể. | "Cách thêm notification type mới: 1. Tạo model..." |
| **Patterns** | Coding patterns, conventions, cách dùng API/library. | "SharedPreferences dùng pattern X cho boolean flags" |

---

## Bước 3: Merge & Ghi file

**File path:** `.agents/learnings/[feature-name].md`

### 3.1: Nếu file CHƯA tồn tại -> Tạo mới theo template sau:

```markdown
# [Feature Name]

> Tổng hợp kiến thức về [mô tả ngắn feature] trong dự án.
> Cập nhật lần cuối: YYYY-MM-DD

---

## Architecture
### [Tiêu đề]
- **Ngày**: YYYY-MM-DD
- **Chi tiết**: [Nội dung - ngắn gọn, tập trung vào giá trị tái sử dụng]
- **Files liên quan**: `path/to/file.ext`

---

## Bugs & Solutions
### [Tiêu đề]
- **Ngày**: YYYY-MM-DD
- **Vấn đề**: [Mô tả bug]
- **Root cause**: [Nguyên nhân gốc]
- **Fix**: [Cách fix]
- **Files liên quan**: `path/to/file.ext`

---

## How-To
### [Tiêu đề]
- **Ngày**: YYYY-MM-DD
- **Bước thực hiện**:
  1. Step 1
  2. Step 2
- **Files liên quan**: `path/to/file.ext`

---

## Patterns
### [Tiêu đề]
- **Ngày**: YYYY-MM-DD
- **Chi tiết**: [Mô tả pattern]
- **Ví dụ code** (nếu cần):
  ```[language]
  // code snippet

### 3.2: Nếu file ĐÃ tồn tại -> Merge thông minh:
1. **Đọc file hiện tại** – hiểu các entries đã có.
2. **So sánh** entries mới với entries cũ:
   - Nếu entry mới **trùng topic** với entry cũ -> **Cập nhật** entry cũ với thông tin mới, giữ ngày mới nhất.
   - Nếu entry mới **khác topic** -> **Thêm** entry mới vào đúng section.
   - Nếu entry cũ **đã lỗi thời** do thay đổi trong conversation -> **Sửa** cho đúng.
3. **Cập nhật** dòng "Cập nhật lần cuối" ở đầu file.
4. **Viết lại file** hoàn chỉnh – gọn gàng, tuyệt đối KHÔNG trùng lặp.

### 3.3: Quy tắc ghi (Non-Negotiable)
- Mỗi entry tối đa **150 từ**.
- Không lưu thông tin quá cụ thể chỉ áp dụng cho 1 lần (giá trị hardcode, tên biến tạm).
- Ưu tiên thông tin có giá trị **tái sử dụng lâu dài**.

---

## Bước 4: Báo kết quả

Sau khi ghi file thành công, AI PHẢI báo cáo lại kết quả cho User bằng đúng format sau:

```text
✅ Đã lưu learnings vào: .agents/learnings/[feature-name].md
  - Architecture: X entries
  - Bugs & Solutions: Y entries
  - How-To: Z entries
  - Patterns: W entries
  Tổng: N entries (A mới, B cập nhật)