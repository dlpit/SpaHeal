---
trigger: always_on
---

---
name: ui-ux-design-rules
description: >
  Bộ luật thiết kế cốt lõi (Core Design Rulebook) cho dự án SPA HEAL –
  website dịch vụ Spa chú trọng sự thư giãn, chuyên nghiệp và chữa lành.
  Mọi AI Agent (code-reviewer, bug-hunter, brainstorming, v.v.) MUST tuân thủ
  tuyệt đối khi tạo mới hoặc chỉnh sửa bất kỳ dòng code UI/UX nào.
version: "1.0.0"
project: spa-heal
stack: Next.js 16 · Tailwind CSS v4 · shadcn/ui (base-nova) · TypeScript · Prisma
last_updated: "2026-07-31"
---
# 🌿 SPA HEAL — Bộ Luật Thiết Kế Cốt Lõi
> **Tuyên bố:** File này là "hiến pháp thiết kế" của dự án SPA HEAL.
> Mọi Agent — dù là code-reviewer, bug-hunter, brainstorming hay bất kỳ Agent nào khác —
> **MUST** đọc và tuân thủ **100%** nội dung bên dưới trước khi tạo hoặc sửa code liên quan đến giao diện.
> Vi phạm bất kỳ quy tắc nào đều được coi là **lỗi nghiêm trọng (critical violation)**.
---
## 1. Design Philosophy — Triết Lý Thiết Kế
### 1.1 Brand Identity
| Thuộc tính       | Giá trị                                      |
| ---------------- | --------------------------------------------- |
| Tên dự án        | **SPA HEAL** (Bu's Beauty Hideout)            |
| Ngành nghề       | Dịch vụ Spa – Thư giãn – Chữa lành           |
| Đối tượng        | Khách hàng tìm kiếm sự yên bình & chăm sóc   |
| Cảm xúc mục tiêu | Thư giãn · Thanh lịch · An toàn · Chữa lành |
### 1.2 Nguyên Tắc Cốt Lõi
- **MUST** tạo cảm giác **"nhẹ nhàng như bước vào spa thật"** — mỗi pixel, mỗi animation, mỗi khoảng trắng đều phục vụ sự thư giãn.
- **MUST** tuân thủ phong cách **Minimalist Organic** — ít chi tiết thừa, nhiều không gian thở (whitespace), đường nét mềm mại.
- **MUST** ưu tiên **sự rõ ràng (clarity)** hơn sự hào nhoáng — thông tin dễ đọc, hành động dễ tìm.
- **NEVER** sử dụng hiệu ứng chói mắt, màu neon, gradient quá mạnh, hoặc animation gây xao nhãng.
- **NEVER** nhồi nhét quá nhiều nội dung vào một viewport — luôn để giao diện "thở".
- **ALWAYS** thiết kế với mindset: _"Nếu khách hàng đang mệt mỏi nhìn vào trang này, họ có cảm thấy dễ chịu không?"_
### 1.3 Từ Khóa Thẩm Mỹ (Aesthetic Keywords)
```
Organic · Serene · Pastel · Soft · Breathable · Luxurious-Minimalism · Healing
```
--
## 2. Color System — Hệ Thống Màu Sắc
### 2.1 Bảng Màu Chính (Primary Palette)
> Dự án sử dụng CSS Custom Properties (CSS Variables) thông qua Tailwind CSS v4.
> Mọi màu **MUST** được khai báo trong `globals.css` dưới dạng biến `--spa-*`.
> **NEVER** hard-code giá trị màu trực tiếp vào component.
| Token CSS Variable       | Hex       | RGB                  | Vai trò                               |
| ------------------------ | --------- | -------------------- | ------------------------------------- |
| `--spa-green-50`         | `#F0FAF0` | `rgb(240, 250, 240)` | Nền xanh cực nhạt (hover states)      |
| `--spa-green-100`        | `#DCEFDC` | `rgb(220, 239, 220)` | Nền xanh nhạt (highlight sections)    |
| `--spa-green-200`        | `#B6DFB6` | `rgb(182, 223, 182)` | Pastel Green — **Màu điểm nhấn chính** |
| `--spa-green-300`        | `#8ECF8E` | `rgb(142, 207, 142)` | CTA buttons, active states            |
| `--spa-green-400`        | `#66BF66` | `rgb(102, 191, 102)` | Hover của CTA                         |
| `--spa-green-500`        | `#4CAF50` | `rgb(76, 175, 80)`   | Icon nhấn mạnh, badge thành công      |
| `--spa-white`            | `#FFFFFF` | `rgb(255, 255, 255)` | Nền trắng tinh                        |
| `--spa-offwhite`         | `#FAFAF8` | `rgb(250, 250, 248)` | Nền chính (background) — ấm hơn trắng |
| `--spa-cream`            | `#F5F0EB` | `rgb(245, 240, 235)` | Nền section phụ, card background       |
| `--spa-text-primary`     | `#2D2D2D` | `rgb(45, 45, 45)`    | Văn bản chính — gần đen nhưng mềm hơn |
| `--spa-text-secondary`   | `#6B6B6B` | `rgb(107, 107, 107)` | Văn bản phụ, mô tả, caption          |
| `--spa-text-muted`       | `#9B9B9B` | `rgb(155, 155, 155)` | Placeholder, hint text                |
| `--spa-border`           | `#E8E4DF` | `rgb(232, 228, 223)` | Đường viền nhẹ                        |
| `--spa-shadow`           | `#0000000A` | `rgba(0,0,0,0.04)` | Box shadow cực nhẹ                    |
| `--spa-danger`           | `#E57373` | `rgb(229, 115, 115)` | Cảnh báo / lỗi — đỏ pastel           |
| `--spa-warning`          | `#FFD54F` | `rgb(255, 213, 79)`  | Cảnh báo nhẹ — vàng pastel            |
| `--spa-success`          | `#81C784` | `rgb(129, 199, 132)` | Thành công — xanh pastel              |
### 2.2 Quy Tắc Sử Dụng Màu
- **MUST** dùng `--spa-offwhite` hoặc `--spa-cream` làm nền chính — **NEVER** dùng trắng thuần `#FFFFFF` cho toàn bộ background (trừ card nổi bật).
- **MUST** dùng `--spa-green-200` (Pastel Green `#B6DFB6`) làm **màu điểm nhấn chính** (accent color) cho buttons, links active, icons quan trọng.
- **MUST** dùng `--spa-text-primary` cho tiêu đề & nội dung chính — **NEVER** dùng `#000000` (đen thuần) vì nó quá khắc nghiệt.
- **MUST** duy trì **contrast ratio ≥ 4.5:1** cho văn bản thường và **≥ 3:1** cho văn bản lớn (≥ 18px) theo WCAG AA.
- **NEVER** kết hợp hai màu xanh đậm liền kề — luôn có lớp trung tính (trắng/cream) ngăn cách.
- **ALWAYS** sử dụng opacity biến thể thay vì tạo thêm màu mới: `--spa-green-200 / 50%` cho overlay.
### 2.3 Dark Mode
- Hiện tại dự án **KHÔNG** ưu tiên Dark Mode cho giao diện khách hàng (customer-facing).
- Phần dashboard quản trị có thể sử dụng Dark Mode theo cấu hình shadcn/ui mặc định.
- **MUST** đảm bảo mọi CSS variable `--spa-*` có fallback hoạt động đúng trong cả light mode.
---
## 3. Typography & Spacing — Kiểu Chữ & Khoảng Cách
### 3.1 Font Family
| Vai trò       | Font                     | Fallback               | CSS Variable           |
| ------------- | ------------------------ | ---------------------- | ---------------------- |
| Heading       | **Geist Sans** (hiện tại) | `system-ui, sans-serif` | `--font-heading`       |
| Body          | **Geist Sans** (hiện tại) | `system-ui, sans-serif` | `--font-sans`          |
| Monospace     | **Geist Mono**           | `monospace`            | `--font-mono`          |
> **LƯU Ý:** Nếu sau này brand chuyển sang font khác (ví dụ: **Cormorant Garamond** cho heading, **Lato/Nunito** cho body),
> **MUST** cập nhật tại `layout.tsx` và `globals.css` — **NEVER** import font trực tiếp trong component.
### 3.2 Quy Tắc Font
- **MUST** sử dụng font Sans-serif mềm mại — **NEVER** dùng font Serif cứng nhắc hay font Display lạ mắt cho body text.
- **MUST** bật `antialiased` trên thẻ `<html>` (đã có trong `layout.tsx`).
- **MUST** giữ `font-weight` trong phạm vi: `300` (Light), `400` (Regular), `500` (Medium), `600` (Semi-Bold). **NEVER** dùng `700` (Bold) hoặc `800`+ cho nội dung khách hàng — quá nặng nề cho vibe spa.
- **ALWAYS** dùng `leading-relaxed` (line-height: 1.625) hoặc `leading-loose` (line-height: 2) cho đoạn văn bản dài — giúp đọc thoải mái.
### 3.3 Hệ Thống Phân Cấp Heading
| Level | Tailwind Class                              | Font Size     | Weight | Letter Spacing | Sử dụng cho                           |
| ----- | ------------------------------------------- | ------------- | ------ | -------------- | ------------------------------------- |
| H1    | `text-4xl md:text-5xl font-light`           | 36px → 48px   | 300    | `-0.02em`      | Tiêu đề trang chính, Hero section     |
| H2    | `text-3xl md:text-4xl font-light`           | 30px → 36px   | 300    | `-0.01em`      | Tiêu đề section lớn                   |
| H3    | `text-2xl md:text-3xl font-normal`          | 24px → 30px   | 400    | `normal`       | Tiêu đề sub-section, tên dịch vụ      |
| H4    | `text-xl md:text-2xl font-normal`           | 20px → 24px   | 400    | `normal`       | Tiêu đề card, tiêu đề nhỏ            |
| H5    | `text-lg font-medium`                       | 18px          | 500    | `normal`       | Label quan trọng, tên nhóm           |
| H6    | `text-base font-medium uppercase tracking-wide` | 16px     | 500    | `0.05em`       | Overline text, category tag           |
- **MUST** tuân thủ bảng trên — **NEVER** tự ý thay đổi kích thước heading ngoài quy định.
- **MUST** dùng heading nhẹ (font-light / font-normal) — phong cách Spa KHÔNG cần heading đậm.
### 3.4 Spacing System — Hệ Thống Khoảng Cách
> Dự án sử dụng **hệ số 4px** (tương thích Tailwind mặc định).
| Token Tailwind | Giá trị  | Sử dụng                                    |
| -------------- | -------- | ------------------------------------------- |
| `p-1` / `m-1`  | `4px`    | Micro spacing — icon padding                |
| `p-2` / `m-2`  | `8px`    | Spacing trong component nhỏ                 |
| `p-3` / `m-3`  | `12px`   | Padding nội dung card                       |
| `p-4` / `m-4`  | `16px`   | Spacing chuẩn giữa các element              |
| `p-6` / `m-6`  | `24px`   | Padding section nhỏ, gap giữa card          |
| `p-8` / `m-8`  | `32px`   | Padding section trung bình                   |
| `p-12` / `m-12` | `48px`  | Padding section lớn                          |
| `p-16` / `m-16` | `64px`  | Margin giữa các section chính               |
| `p-20` / `m-20` | `80px`  | Top/Bottom padding cho hero & footer        |
| `p-24` / `m-24` | `96px`  | Spacing cực lớn — dùng cho section quan trọng |
**Quy tắc spacing:**
- **MUST** sử dụng giá trị spacing từ bảng trên — **NEVER** dùng giá trị tùy ý như `p-[13px]` hay `m-[37px]`.
- **MUST** dùng `gap-*` cho Flex/Grid layout thay vì margin cho từng child — giữ code sạch hơn.
- **MUST** đảm bảo khoảng cách giữa các section chính ≥ `64px` (`py-16`) — giao diện cần "thở".
- **ALWAYS** dùng `space-y-*` hoặc `gap-*` để quản lý spacing giữa các phần tử cùng cấp — **NEVER** dùng `<br />` để tạo khoảng cách.
---
## 4. Responsive & Layout — Khung Giao Diện
### 4.1 Breakpoints
> **MUST** tuân thủ nguyên tắc **Mobile-First** — viết style cho mobile trước, dùng `md:`, `lg:`, `xl:` để mở rộng.
| Tên        | Tailwind Prefix | Min-Width  | Thiết bị mục tiêu              |
| ---------- | --------------- | ---------- | ------------------------------ |
| Mobile     | (mặc định)      | `0px`      | Điện thoại (< 768px)           |
| Tablet     | `md:`           | `768px`    | Máy tính bảng (768px – 1023px) |
| Desktop    | `lg:`           | `1024px`   | Laptop (1024px – 1279px)       |
| Wide       | `xl:`           | `1280px`   | Màn hình lớn (≥ 1280px)        |
| Ultra-Wide | `2xl:`          | `1536px`   | Màn hình siêu rộng             |
### 4.2 Quy Tắc Layout
- **MUST** code **Mobile-First** — style mặc định là cho mobile, sau đó override lên.
  ```tsx
  // ✅ ĐÚNG — Mobile-First
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  // ❌ SAI — Desktop-First
  <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-6">
  ```
- **MUST** dùng `max-w-7xl mx-auto px-4 md:px-6 lg:px-8` cho container chính — giữ nội dung không tràn ra hai bên.
- **MUST** sử dụng CSS Grid hoặc Flexbox cho layout — **NEVER** dùng `float` hoặc `position: absolute` để dàn layout.
- **MUST** đảm bảo mọi trang, mọi component hiển thị đúng trên cả 3 breakpoint chính (Mobile, Tablet, Desktop).
- **NEVER** ẩn nội dung quan trọng trên mobile bằng `hidden md:block` mà không có phương án thay thế.
- **ALWAYS** test touch target ≥ `44px × 44px` cho các nút bấm trên mobile.
### 4.3 Grid System
```
Mobile:   1 column  | gap-4  | px-4
Tablet:   2 columns | gap-6  | px-6
Desktop:  3-4 columns | gap-6-8 | px-8
```
- **MUST** dùng `grid` cho layout dạng lưới (danh sách dịch vụ, bảng giá, gallery).
- **MUST** dùng `flex` cho layout dạng hàng ngang (navbar, footer links, breadcrumb).
---
## 5. UI Components — Quy Tắc Thành Phần Giao Diện
### 5.1 Nền Tảng Component
- Dự án sử dụng **shadcn/ui (style: base-nova)** làm UI component library.
- **MUST** import component từ `@/components/ui/*` — **NEVER** tự viết lại component mà shadcn/ui đã cung cấp (Button, Dialog, Card, Input, v.v.).
- **MUST** customize shadcn/ui thông qua `className` prop hoặc cập nhật biến CSS — **NEVER** sửa trực tiếp file gốc trong `components/ui/` trừ khi có lý do rõ