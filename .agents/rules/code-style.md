---
name: code-style
description: Quy tắc code style, Typography, Tailwind, cách sử dụng UI Components (shadcn/ui), Clean Code cho SPA HEAL.
version: "2.0.0"
project: spa-heal
stack: Next.js 16 · Tailwind CSS v4
---
# 💻 SPA HEAL — Code Style & Typography

## 1. Typography — Kiểu Chữ
### 1.1 Font Family
| Vai trò       | Font                     | Fallback               | CSS Variable           |
| ------------- | ------------------------ | ---------------------- | ---------------------- |
| Heading       | **Playfair Display**     | `Georgia, serif`       | `--font-heading`       |
| Body          | **Inter**                | `system-ui, sans-serif`| `--font-sans`          |
| Monospace     | **Geist Mono**           | `monospace`            | `--font-mono`          |

> **LƯU Ý:** Font **MUST** được import tại `layout.tsx` thông qua `next/font/google`.
> **NEVER** import font trực tiếp trong component.

### 1.2 Quy Tắc Font
- **MUST** sử dụng **Serif (Playfair Display)** cho heading (H1–H4) — tạo sự thanh lịch, sang trọng.
- **MUST** sử dụng **Sans-serif (Inter)** cho body text, labels, descriptions — hiện đại, dễ đọc.
- **NEVER** dùng Playfair Display cho body text dài — quá nặng, khó đọc đoạn dài.
- **MUST** bật `antialiased` trên thẻ `<html>` (đã có trong `layout.tsx`).
- **MUST** giữ `font-weight` trong phạm vi: `400` (Regular), `500` (Medium), `600` (Semi-Bold). **NEVER** dùng `700` (Bold) hoặc `800`+ cho nội dung khách hàng — quá nặng nề.
- **ALWAYS** dùng `leading-relaxed` (line-height: 1.625) hoặc `leading-loose` (line-height: 2) cho đoạn văn bản dài — giúp đọc thoải mái.

### 1.3 Hệ Thống Phân Cấp Heading
| Level | Tailwind Class                              | Font Family | Font Size     | Weight | Letter Spacing | Sử dụng cho                           |
| ----- | ------------------------------------------- | ----------- | ------------- | ------ | -------------- | ------------------------------------- |
| H1    | `font-heading text-4xl md:text-5xl font-normal`          | Playfair Display | 36px → 48px   | 400    | `-0.02em`      | Tiêu đề trang chính, Hero section     |
| H2    | `font-heading text-3xl md:text-4xl font-normal`          | Playfair Display | 30px → 36px   | 400    | `-0.01em`      | Tiêu đề section lớn                   |
| H3    | `font-heading text-2xl md:text-3xl font-normal`          | Playfair Display | 24px → 30px   | 400    | `normal`       | Tiêu đề sub-section, tên dịch vụ      |
| H4    | `font-heading text-xl md:text-2xl font-normal`           | Playfair Display | 20px → 24px   | 400    | `normal`       | Tiêu đề card, tiêu đề nhỏ            |
| H5    | `text-lg font-medium`                       | Inter        | 18px          | 500    | `normal`       | Label quan trọng, tên nhóm           |
| H6    | `text-base font-medium uppercase tracking-wide` | Inter   | 16px          | 500    | `0.05em`       | Overline text, category tag           |

- **MUST** tuân thủ bảng trên — **NEVER** tự ý thay đổi kích thước heading ngoài quy định.
- **MUST** dùng `font-heading` class cho H1–H4 để áp dụng Playfair Display.
- **MUST** dùng heading nhẹ (font-normal) — phong cách boutique spa KHÔNG cần heading đậm.

---

## 2. Tailwind CSS & Clean Code
- **Utility-first:** **MUST** ưu tiên sử dụng utility classes của Tailwind cho toàn bộ styling. Hạn chế tối đa việc viết CSS thuần (trừ thiết lập root variables).
- **Naming:** Mặc dù dùng Tailwind, khi cần tách component hãy đặt tên file và hàm rõ ràng (ví dụ: `BookingForm`, `ServiceCard`).
- **Clean Code:** 
  - Nếu một element chứa quá nhiều class của Tailwind, hãy xem xét tách nó thành một component UI hoặc sử dụng thư viện như `tailwind-merge` và `clsx` (đã có trong `lib/utils.ts` qua hàm `cn()`).
  - **MUST** dùng `cn()` khi cần kết hợp các class Tailwind có điều kiện (conditional classes).

---

## 3. UI Components (shadcn/ui)
### 3.1 Nền Tảng Component
- Dự án sử dụng **shadcn/ui (style: base-nova)** làm UI component library.
- **MUST** import component từ `@/components/ui/*` — **NEVER** tự viết lại component cơ bản mà shadcn/ui đã cung cấp (Button, Dialog, Card, Input, v.v.).
- **MUST** customize shadcn/ui thông qua `className` prop, hàm `cn()`, hoặc cập nhật biến CSS trong `globals.css`.
- **NEVER** sửa trực tiếp file gốc trong `components/ui/` trừ khi có lý do kỹ thuật rõ ràng hoặc sửa lỗi thư viện.
