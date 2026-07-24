# Wild Rift Picker 🎮

Công cụ pick tướng, counter pick và team synergy cho **Liên Minh Tốc Chiến (Wild Rift)**.

## Tính năng

| Tính năng | Mô tả |
|---|---|
| 📊 **Tier List** | Xếp hạng tướng theo từng vai trò (Baron/Jungle/Mid/ADC/Support) |
| ⚔️ **Counter Pick** | Chọn tướng địch → xem ai khắc chế ai |
| 👥 **Team Synergy** | Chọn đội hình → gợi ý pick ăn ý nhất |
| ⚡ **Draft Assistant** | Nhập pick của cả 2 team → gợi ý pick tối ưu cho bạn |

## Cập nhật dữ liệu mỗi patch

Dữ liệu nằm trong thư mục `data/` — chỉ cần sửa file JSON là xong:

| File | Nội dung |
|---|---|
| `data/champions.json` | Danh sách 140 tướng, roles, lanes |
| `data/tiers.json` | Tier list theo patch & role |
| `data/counters.json` | Counter matchups |
| `data/synergies.json` | Synergy pairs |

### Cách update

1. Sửa file JSON trong `data/`
2. `npm run build` — kiểm tra build
3. Commit + push → tự động deploy lên GitHub Pages

## Tech Stack

- **Framework**: Next.js 16 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Data**: JSON thuần (dễ edit mỗi patch)
- **Hosting**: GitHub Pages (static export)

## Data Sources

- Champion icons: [CommunityDragon](https://communitydragon.org)
- Tier list: [WildRift Core](https://wildriftcore.com)
- Counter data: [WildRift Counter](https://wildriftcounter.com)

---

Built with ❤️ for Wild Rift
