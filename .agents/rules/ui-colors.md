---
name: ui-colors
description: Quy tắc hệ thống màu sắc (Color System), palette, theme, và chế độ tối (Dark Mode) cho SPA HEAL.
version: "2.0.0"
project: spa-heal
stack: Next.js 16 · Tailwind CSS v4
---
# 🌸 SPA HEAL — UI Colors & Theme

## 1. Design Philosophy — Triết Lý Thiết Kế
### 1.1 Brand Identity
| Thuộc tính       | Giá trị                                                |
| ---------------- | ------------------------------------------------------- |
| Tên dự án        | **SPA HEAL** (Bu's Beauty Hideout)                      |
| Ngành nghề       | Dịch vụ Spa – Thư giãn – Chữa lành                     |
| Đối tượng        | Khách hàng tìm kiếm sự yên bình & chăm sóc             |
| Cảm xúc mục tiêu | Ấm áp · Tinh tế · An toàn · Sang trọng nhẹ nhàng      |

### 1.2 Nguyên Tắc Cốt Lõi
- **MUST** tạo cảm giác **"bước vào một boutique spa sang trọng ấm áp"** — tông màu ấm, typography thanh lịch, khoảng trắng hài hòa.
- **MUST** tuân thủ phong cách **Modern Warm Minimal** — tinh tế qua từng chi tiết, không cần nhiều trang trí, tập trung vào sự đơn giản cao cấp.
- **MUST** kết hợp hài hòa giữa **Serif heading (Playfair Display)** và **Sans body (Inter)** — tạo chiều sâu thẩm mỹ mà không rối mắt.
- **MUST** ưu tiên **sự rõ ràng (clarity)** hơn sự hào nhoáng — thông tin dễ đọc, hành động dễ tìm.
- **NEVER** sử dụng hiệu ứng chói mắt, màu neon, gradient quá mạnh, hoặc animation gây xao nhãng.
- **NEVER** nhồi nhét quá nhiều nội dung vào một viewport — luôn để giao diện "thở".
- **ALWAYS** thiết kế với mindset: _"Giao diện này có toát ra sự tinh tế và ấm áp không?"_

### 1.3 Từ Khóa Thẩm Mỹ (Aesthetic Keywords)
```
Warm · Sophisticated · Champagne · Blush · Boutique · Refined-Minimal · Inviting
```

---

## 2. Color System — Hệ Thống Màu Sắc
### 2.1 Bảng Màu Chính (Primary Palette — Champagne & Blush)
> Dự án sử dụng CSS Custom Properties (CSS Variables) thông qua Tailwind CSS v4.
> Mọi màu **MUST** được khai báo trong `globals.css` dưới dạng biến `--spa-*`.
> **NEVER** hard-code giá trị màu trực tiếp vào component.

#### Tông Warm (Nền)
| Token CSS Variable       | Hex       | Vai trò                               |
| ------------------------ | --------- | ------------------------------------- |
| `--spa-warm-50`          | `#FDFBF9` | Nền cực nhạt (hover states)           |
| `--spa-warm-100`         | `#F7F2ED` | Nền chính (offwhite ấm — background)  |
| `--spa-warm-200`         | `#EFE7DF` | Nền section phụ, card background      |

#### Tông Blush (Điểm nhấn chính)
| Token CSS Variable       | Hex       | Vai trò                               |
| ------------------------ | --------- | ------------------------------------- |
| `--spa-blush-50`         | `#FDF5F2` | Blush cực nhạt (highlight nhẹ)        |
| `--spa-blush-100`        | `#F5DDD4` | Blush nhạt (tag, badge background)    |
| `--spa-blush-200`        | `#E8C4B8` | **Blush pastel — Màu điểm nhấn chính** |
| `--spa-blush-300`        | `#D4A393` | CTA buttons, active states            |
| `--spa-blush-400`        | `#C08B78` | Hover của CTA                         |
| `--spa-blush-500`        | `#A8725E` | Icon nhấn mạnh, accent đậm           |

#### Tông Champagne (Accent phụ / Decorative)
| Token CSS Variable       | Hex       | Vai trò                               |
| ------------------------ | --------- | ------------------------------------- |
| `--spa-champagne-100`    | `#F0E8D8` | Champagne nhạt (decorative bg)        |
| `--spa-champagne-200`    | `#D9C5A0` | **Gold/Champagne accent** (viền, icon)|
| `--spa-champagne-300`    | `#C4AD82` | Champagne đậm (hover accent)         |

#### Trung tính & Văn bản
| Token CSS Variable       | Hex         | Vai trò                             |
| ------------------------ | ----------- | ----------------------------------- |
| `--spa-white`            | `#FFFFFF`   | Nền trắng tinh (card nổi bật)       |
| `--spa-text-primary`     | `#3A2D27`   | Văn bản chính — nâu đậm ấm         |
| `--spa-text-secondary`   | `#7A6A60`   | Văn bản phụ, mô tả, caption        |
| `--spa-text-muted`       | `#A89B93`   | Placeholder, hint text              |
| `--spa-border`           | `#E8E0D8`   | Đường viền nhẹ                      |

#### Trạng thái (Status Colors)
| Token CSS Variable       | Hex       | Vai trò                             |
| ------------------------ | --------- | ----------------------------------- |
| `--spa-danger`           | `#D4726B` | Cảnh báo / lỗi — đỏ terracotta     |
| `--spa-warning`          | `#E5C06B` | Cảnh báo nhẹ — vàng ấm             |
| `--spa-success`          | `#8BAF7A` | Thành công — xanh lá ấm pastel     |

### 2.2 Quy Tắc Sử Dụng Màu
- **MUST** dùng `--spa-warm-100` hoặc `--spa-warm-200` làm nền chính.
- **MUST** dùng `--spa-blush-200` (`#E8C4B8`) làm **màu điểm nhấn chính** cho buttons, links active.
- **MUST** dùng `--spa-champagne-200` (`#D9C5A0`) làm **accent phụ** (decorative).
- **MUST** dùng `--spa-text-primary` (`#3A2D27`) cho tiêu đề & nội dung chính.
- **NEVER** kết hợp hai màu blush/champagne đậm liền kề.

### 2.3 Dark Mode
- Dự án **CÓ** hỗ trợ Dark Mode.
- Thay vì sử dụng tông xám đen lạnh như giao diện web thông thường, Dark Mode của SPA HEAL sử dụng tông **nâu đen ấm (Dark Warm Espresso)** (`#1A1412` và `#251D1A`) để giữ được cảm giác ấm áp và thư giãn.
- Các CSS variable `--spa-*` được điều chỉnh độ sáng hoặc giữ nguyên để tương phản tốt trên nền tối.
- **MUST** kiểm tra giao diện trên cả Light Mode và Dark Mode sau mỗi lần chỉnh sửa UI.
