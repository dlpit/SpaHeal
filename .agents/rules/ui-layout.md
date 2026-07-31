---
name: ui-layout
description: Quy tắc layout, breakpoints, Flexbox, Grid, Mobile-first, và hệ thống spacing cho SPA HEAL.
version: "2.0.0"
project: spa-heal
stack: Next.js 16 · Tailwind CSS v4
---
# 📐 SPA HEAL — Layout & Spacing Rules

## 1. Spacing System — Hệ Thống Khoảng Cách
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

## 2. Responsive & Layout — Khung Giao Diện
### 2.1 Breakpoints
> **MUST** tuân thủ nguyên tắc **Mobile-First** — viết style cho mobile trước, dùng `md:`, `lg:`, `xl:` để mở rộng.

| Tên        | Tailwind Prefix | Min-Width  | Thiết bị mục tiêu              |
| ---------- | --------------- | ---------- | ------------------------------ |
| Mobile     | (mặc định)      | `0px`      | Điện thoại (< 768px)           |
| Tablet     | `md:`           | `768px`    | Máy tính bảng (768px – 1023px) |
| Desktop    | `lg:`           | `1024px`   | Laptop (1024px – 1279px)       |
| Wide       | `xl:`           | `1280px`   | Màn hình lớn (≥ 1280px)        |
| Ultra-Wide | `2xl:`          | `1536px`   | Màn hình siêu rộng             |

### 2.2 Quy Tắc Layout
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

### 2.3 Grid System
```
Mobile:   1 column  | gap-4  | px-4
Tablet:   2 columns | gap-6  | px-6
Desktop:  3-4 columns | gap-6-8 | px-8
```
- **MUST** dùng `grid` cho layout dạng lưới (danh sách dịch vụ, bảng giá, gallery).
- **MUST** dùng `flex` cho layout dạng hàng ngang (navbar, footer links, breadcrumb).
