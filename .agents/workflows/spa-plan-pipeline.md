---
description: Quy trình thực thi task coding với brainstorming, execution và lưu learning tự động
---

---
description: Quy trình thực thi task coding với brainstorming, execution và lưu learning tự đ
---
---
name: spa-task-execution
description: >
  Quy trình thực thi task 5 pha (Pipeline) cho dự án SPA HEAL.
  Đây là xương sống điều hướng MỌI hành vi code của AI — từ brainstorming,
  lên plan, thực thi, kiểm thử, đến lưu trữ kiến thức.
  Mọi AI Agent PHẢI tuân thủ 100% quy trình này. Bỏ qua bất kỳ pha nào
  đều được coi là vi phạm nghiêm trọng (critical violation).
version: "1.0"
project: spa-heal
triggers:
  - "Khi nhận bất kỳ yêu cầu nào liên quan đến tạo mới, sửa đổi, hoặc xóa code UI/UX"
  - "Khi nhận yêu cầu thêm tính năng (feature), component, hoặc trang mới"
  - "Khi nhận yêu cầu refactor hoặc redesign"
exceptions:
  - "Fix lỗi khẩn cấp (hotfix) do User chỉ định rõ ràng — được phép nhảy thẳng Pha 3 → Pha 4"
  - "Câu hỏi kiến thức thuần túy (không liên quan đến code) — không cần kích hoạt pipeline"
last_updated: "2026-07-31"
---
# 🔄 SPA HEAL — Quy Trình Thực Thi Task 5 Pha
> **Tuyên bố:** File này là **quy trình vận hành bắt buộc** của dự án SPA HEAL.
> Mọi AI Agent — dù đang brainstorm, code, review, hay fix bug —
> **PHẢI** đi qua **ĐẦY ĐỦ 5 pha** theo đúng thứ tự bên dưới.
> **TUYỆT ĐỐI KHÔNG** được nhảy pha, gộp pha, hoặc bỏ qua bất kỳ bước nào
> trừ khi thuộc danh sách ngoại lệ (exceptions) trong frontmatter.
---
## Tổng Quan Pipeline
1. **Pha 1: BRAINSTORMING** (Hiểu & Chốt) → 🔒 **GATE 1** (User xác nhận)
2. **Pha 2: LÊN PLAN** (Checklist)
3. **Pha 3: EXECUTE** (Code)
4. **Pha 4: VERIFY** (Review & Test) → 🔒 **GATE 2** (Không còn lỗi)
5. **Pha 5: AI LEARNING** (Lưu trữ kiến thức)
---
## Pha 1: BRAINSTORMING — Hiểu Sâu & Chốt Thiết Kế
> **Mục tiêu:** Đảm bảo AI hiểu đúng 100% ý định của User trước khi viết bất kỳ dòng code nào.
> **Trạng thái:** 🟡 Bắt buộc cho mọi task mới.
### Bước thực hiện
- [ ] **1.1 — Đọc ngữ cảnh cũ:**
  - **PHẢI** kiểm tra thư mục `.agents/learnings/` và đọc tất cả các file có sẵn (nếu có).
  - Các file cần đọc: `patterns.md`, `bugs-solutions.md`, `architecture-decisions.md`, và bất kỳ file nào khác trong thư mục.
  - Mục đích: Tránh lặp lại lỗi cũ, tái sử dụng pattern đã được chứng minh, nắm ngữ cảnh dự án.
  - Nếu thư mục trống → ghi nhận: _"Chưa có learnings trước đó"_ và tiếp tục.
- [ ] **1.2 — Kích hoạt Brainstorming:**
  - **BẮT BUỘC** kích hoạt công cụ `@brainstorming` (file: `.agents/skills/brainstorming.md`).
  - Tuân thủ đầy đủ quy trình của skill brainstorming:
    1. Tìm hiểu ngữ cảnh hiện tại (project state, files, docs).
    2. Hỏi từng câu hỏi một (one question at a time) — ưu tiên multiple-choice.
    3. Làm rõ Non-Functional Requirements (performance, scale, security, reliability).
    4. Đạt **Understanding Lock** — tóm tắt 5–7 bullet points, liệt kê assumptions.
    5. Đề xuất 2–3 phương án thiết kế, nêu rõ trade-offs.
    6. Trình bày thiết kế cuối cùng theo từng phần (200–300 từ/phần).
    7. Duy trì **Decision Log** xuyên suốt.
- [ ] **1.3 — Đọc bộ luật thiết kế:**
  - **PHẢI** đọc 3 file luật thiết kế sau để nắm toàn bộ quy tắc UI/UX:
    - 🎨 `.agents/rules/ui-colors.md` — Màu sắc, Palette, Dark Mode
    - 📐 `.agents/rules/ui-layout.md` — Breakpoints, Grid, Spacing, Mobile-first
    - 💻 `.agents/rules/code-style.md` — Typography, Tailwind, shadcn/ui, Clean Code
  - Mọi quyết định thiết kế ở bước 1.2 **PHẢI** tương thích với bộ luật này.
  - Nếu có xung đột giữa ý tưởng brainstorm và bộ luật → **bộ luật LUÔN THẮNG**.
### 🔒 GATE 1 — Cổng Chặn Bắt Buộc
**TUYỆT ĐỐI KHÔNG** chuyển sang Pha 2 nếu chưa thỏa mãn:
- [ ] Đạt **Understanding Lock** (User xác nhận hiểu đúng ý).
- [ ] Đã trình bày thiết kế và **User chấp thuận**.
- [ ] Ghi nhận đầy đủ Decision Log.
- [ ] Thiết kế tuân thủ `ui-colors.md`, `ui-layout.md`, `code-style.md`.
**Nếu User từ chối → quay lại 1.2, KHÔNG tự ý tiến tiếp.**
---
## Pha 2: LÊN PLAN — Task Checklist Chi Tiết
> **Mục tiêu:** Biến thiết kế đã chốt thành danh sách công việc cụ thể, có thể thực thi từng bước.
> **Trạng thái:** 🟡 Bắt buộc.
### Bước thực hiện
- [ ] **2.1 — Phân rã task:**
  - **PHẢI** tạo một Checklist Markdown chi tiết dựa trên thiết kế đã chốt ở Pha 1.
  - **PHẢI** phân rã đến mức **sub-task** — mỗi sub-task là một đơn vị công việc hoàn chỉnh.
  - **TUYỆT ĐỐI KHÔNG** gộp chung nhiều task lớn thành một mục — vi phạm sẽ bị reject.
  **Format bắt buộc:**
  ```markdown
  ## Task Checklist — [Tên Feature/Component]
  ### Task 1: [Tên task lớn]
  - [ ] Sub-task 1.1: [Mô tả cụ thể — file nào, component gì, logic ra sao]
  - [ ] Sub-task 1.2: [Mô tả cụ thể]
  - [ ] Sub-task 1.3: [Mô tả cụ thể]
  ### Task 2: [Tên task lớn]
  - [ ] Sub-task 2.1: [Mô tả cụ thể]
  - [ ] Sub-task 2.2: [Mô tả cụ thể]
  ### Task 3: Responsive & Polish
  - [ ] Sub-task 3.1: Kiểm tra Mobile (< 768px)
  - [ ] Sub-task 3.2: Kiểm tra Tablet (768px – 1024px)
  - [ ] Sub-task 3.3: Kiểm tra Desktop (> 1024px)
  ```
- [ ] **2.2 — Ước lượng độ phức tạp:**
  - Mỗi task lớn **PHẢI** được gắn nhãn độ phức tạp:
    - 🟢 **Đơn giản** — < 50 dòng code, 1 file
    - 🟡 **Trung bình** — 50–150 dòng code, 2–3 files
    - 🔴 **Phức tạp** — > 150 dòng code, nhiều files, logic phức tạp
- [ ] **2.3 — Xác định thứ tự phụ thuộc:**
  - **PHẢI** sắp xếp task theo thứ tự phụ thuộc logic (dependencies first).
  - Ví dụ: Tạo CSS variables → Tạo component → Tích hợp vào page → Test responsive.
- [ ] **2.4 — Trình bày Plan cho User:**
  - **PHẢI** trình bày toàn bộ Checklist cho User review.
  - Chờ User **xác nhận** hoặc **điều chỉnh** trước khi bắt đầu code.
  - **TUYỆT ĐỐI KHÔNG** tự ý bắt đầu code khi chưa có xác nhận từ User.
---
## Pha 3: EXECUTE — Thực Thi Từng Bước
> **Mục tiêu:** Code theo đúng Checklist đã chốt, tuân thủ tuyệt đối bộ luật thiết kế.
> **Trạng thái:** 🟡 Chỉ được bắt đầu sau khi User approve Plan ở Pha 2.
### Bước thực hiện
- [ ] **3.1 — Thiết lập môi trường:**
  - Đọc lại 3 file luật thiết kế (`.agents/rules/ui-colors.md`, `.agents/rules/ui-layout.md`, `.agents/rules/code-style.md`) một lần nữa trước khi code.
  - Xác nhận các CSS variables `--spa-*` đã tồn tại trong `globals.css`. Nếu chưa → tạo trước.
- [ ] **3.2 — Code từng sub-task:**
  - **PHẢI** thực thi **TỪNG sub-task một** theo đúng thứ tự trong Checklist.
  - **PHẢI** đánh dấu `[x]` ngay sau khi hoàn thành mỗi sub-task.
  - **TUYỆT ĐỐI KHÔNG** nhảy cóc hoặc làm song song nhiều sub-task cùng lúc.
  **Quy tắc code bắt buộc:**
  - **Màu sắc:** Dùng var `--spa-*`, KHÔNG hard-code.
  - **Component:** ≤ 150 dòng/file.
  - **Layout:** Mobile-First.
  - **shadcn/ui:** Import từ `@/components/ui/*`.
  - **Class:** Dùng `cn()` từ `@/lib/utils`.
  - **TS:** Khai báo type, KHÔNG dùng `any`.
  - **State:** Ưu tiên RSC, hạn chế `"use client"`.
  - **Hình/Link:** Dùng `next/image`, `next/link`.
  - **Animation:** ≥ `duration-300`.
- [ ] **3.3 — Cập nhật tiến độ:**
  - Sau mỗi task lớn (không phải sub-task), báo cáo ngắn cho User:
    ```
    ✅ Task 1 hoàn thành (3/3 sub-tasks)
    🔄 Đang chuyển sang Task 2...
    ```
---
## Pha 4: VERIFY — Kiểm Thử & Tối Ưu
> **Mục tiêu:** Đảm bảo code vừa viết đạt chất lượng cao, không lỗi, responsive tốt.
> **Trạng thái:** 🟡 Bắt buộc sau khi hoàn thành tất cả task ở Pha 3.
### Bước thực hiện
- [ ] **4.1 — Code Review:**
  - **BẮT BUỘC** kích hoạt công cụ `@code-reviewer` (file: `.agents/skills/code-reviewer.md`).
  - Scope review:
    - [ ] Clean Code & SOLID principles
    - [ ] TypeScript type safety (không `any`, không `as unknown`)
    - [ ] Tuân thủ bộ luật `ui-colors.md` (màu sắc, palette, dark mode)
    - [ ] Tuân thủ bộ luật `ui-layout.md` (spacing, breakpoints, mobile-first)
    - [ ] Tuân thủ bộ luật `code-style.md` (typography, tailwind, shadcn/ui)
    - [ ] Performance (no unnecessary re-renders, proper imports)
    - [ ] Security (no XSS vectors, proper input sanitization)
    - [ ] Accessibility (semantic HTML, aria-labels, contrast ratio)
- [ ] **4.2 — Kiểm tra Responsive:**
  - **PHẢI** kiểm tra giao diện ở 3 breakpoint chính:
    - [ ] **Mobile** (< 768px): Layout 1 cột, touch targets ≥ 44px, text đọc được
    - [ ] **Tablet** (768px – 1024px): Layout 2 cột (nếu áp dụng), spacing phù hợp
    - [ ] **Desktop** (> 1024px): Layout đầy đủ, max-width container hoạt động đúng
  - Nếu phát hiện UI bị vỡ, tràn khung, chữ đè nhau → chuyển ngay bước 4.3.
- [ ] **4.3 — Bug Hunting (nếu cần):**
  - **BẮT BUỘC** kích hoạt công cụ `@bug-hunter` (file: `.agents/skills/bug-hunter.md`) nếu phát hiện:
    - Layout bị vỡ hoặc tràn khung (overflow)
    - Chữ/element đè lên nhau (z-index conflict)
    - Button/link không click được
    - Animation bị giật hoặc không hoạt động
    - Console errors (JavaScript/TypeScript)
    - Responsive không đúng ở bất kỳ breakpoint nào
  - Quy trình bug-hunter:
    1. Reproduce → 2. Gather evidence → 3. Hypothesis → 4. Root cause → 5. Fix → 6. Verify fix
  - **PHẢI** fix hết lỗi trước khi chuyển sang GATE 2.
- [ ] **4.4 — Kiểm tra Code Quality Checklist:**
  - Chạy qua checklist bắt buộc từ bộ luật thiết kế (Section 9):
    - [ ] Mọi màu sắc đều sử dụng CSS variable `--spa-*`
    - [ ] Mọi spacing đều dùng giá trị Tailwind chuẩn
    - [ ] Component ≤ 150 dòng
    - [ ] Mobile-First
    - [ ] Không có `any` trong TypeScript
    - [ ] Không có `"use client"` thừa
    - [ ] Không có `useEffect` fetch data
    - [ ] Mọi hình ảnh dùng `next/image`
    - [ ] Mọi link nội bộ dùng `next/link`
    - [ ] Contrast ratio đạt WCAG AA
    - [ ] Touch target ≥ 44px trên mobile
    - [ ] Animation có `prefers-reduced-motion` fallback
### 🔒 GATE 2 — Cổng Chặn Bắt Buộc
**TUYỆT ĐỐI KHÔNG** chuyển sang Pha 5 nếu chưa thỏa mãn:
- [ ] Pass `@code-reviewer`, không còn issue critical/major.
- [ ] Responsive đúng ở 3 breakpoint (Mobile, Tablet, Desktop).
- [ ] Không còn bug, không có console error.
- [ ] Pass 12 điểm Code Quality Checklist.
**Nếu chưa đạt → quay lại bước tương ứng Pha 3 hoặc 4.**
---
## Pha 5: AI LEARNING — Lưu Trữ Kiến Thức
> **Mục tiêu:** Trích xuất và lưu trữ kiến thức từ task vừa hoàn thành để phục vụ các task tương lai.
> **Trạng thái:** 🟡 Bán tự động — cần xác nhận của User.
### Bước thực hiện
- [ ] **5.1 — Hỏi xác nhận User:**
  - **PHẢI** hỏi User câu hỏi sau (nguyên văn):
  > **✅ Task hoàn thành!**
  > Bạn có muốn lưu learnings từ task này không?
  > - **Có** → AI sẽ phân tích và trích xuất kiến thức hữu ích.
  > - **Không** → Kết thúc task, không lưu gì thêm.
- [ ] **5.2 — Phân tích & Trích xuất (nếu User chọn "Có"):**
- Tự phân tích ngữ cảnh và lưu kiến thức vào thư mục `.agents/learnings/`.
- Cập nhật các file liên quan như `patterns.md`, `bugs-solutions.md`.