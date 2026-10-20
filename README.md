# 240245_FoodManager

Ứng dụng quản lý món ăn bằng **Expo SDK 57.0.0 / React Native**, SQLite local và tự đồng bộ hai chiều với MockAPI. MSSV: **240245**.
Link video demo : https://drive.google.com/drive/folders/1C1lAfaMtFmExxyagCk329sEPfYp3IB-C?usp=drive_link

## Chạy trên iPhone

Yêu cầu Node.js 22.13 trở lên (khuyến nghị Node 24 cho bộ test), npm và Expo Go hỗ trợ SDK 57.

```powershell
git clone https://github.com/buiduytung2204-svg/240245_FoodManager.git
cd 240245_FoodManager
npm ci
Copy-Item .env.example .env
npm run ios
```

Cho iPhone và máy tính dùng cùng Wi-Fi, đăng nhập Expo CLI/Expo Go bằng cùng tài khoản, rồi dùng Camera iPhone quét QR. Không cần chạy giả lập hoặc Xcode trên máy tính. Giữ terminal đang chạy trong lúc sử dụng.

`npm start` và `npm run ios` dùng một Metro worker, cổng mặc định 8082. Cache Metro/file tạm ở `.cache/` trong project, cache npm ở thư mục `.npm-cache` cạnh project. Bộ test chạy tuần tự để giảm RAM. Có thể đổi cổng bằng `npm run ios -- --port 8083` hoặc chạy tunnel bằng `npm start -- --tunnel` khi cần.

## Cấu trúc mã nguồn

```text
240245_FoodManager/
├── App.js                       # Entry: xuất component gốc
├── index.js                     # registerRootComponent
├── app.json                     # Tên project và cấu hình Expo
├── src/
│   ├── application/             # Component gốc ghép layout/màn hình
│   ├── components/              # AppHeader, Button, Field, Choices, Photo
│   ├── screens/                 # List, Detail, Form, Category, Settings
│   ├── navigation/              # Ánh xạ route sang screen
│   ├── hooks/                   # State, điều hướng và điều phối tác vụ
│   ├── models/                  # Tiền tố MSSV, tên project/database
│   ├── domain/                  # Validation, tìm kiếm, lọc, sắp xếp
│   ├── database/                # Connection, schema, seed, SQL helpers
│   ├── repositories/            # CRUD, catalog, settings, outbox, snapshot
│   ├── services/sync/           # NetInfo và REST MockAPI
│   ├── config/                  # Kiểm tra cấu hình API
│   ├── localization/            # English / Tiếng Việt
│   └── theme/                   # Style dùng chung
├── tests/
│   ├── unit/                   # Domain, schema, bản dịch, config, worker
│   ├── integration/            # Repository SQLite và REST qua HTTP
│   └── helpers/                # Adapter và module loader cho test
├── docs/                       # Kiến trúc, cấu hình và đối chiếu đề
├── scripts/start.cjs           # Khởi động Expo ít tốn RAM
└── .env.example                # Cấu hình mẫu, không chứa URL thật
```

Chi tiết trách nhiệm và luồng xử lý: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Chức năng

- Seed 3 loại, 5 món và 10 ảnh một lần; SQLite có quan hệ và ràng buộc đầy đủ.
- Danh sách, chi tiết, thêm/sửa, xác nhận xóa; form lấy loại từ dữ liệu local.
- Tìm một phần tên; kết hợp loại, trạng thái, khoảng giá; sắp xếp giá tăng/giảm hoặc thời gian tăng. Bộ lọc giữ khi chuyển màn hình.
- Quản lý nhiều URL ảnh, tối đa một thumbnail; nhãn Quick/Nhanh khi thời gian ≤15 phút, Regular/Thông thường nếu lớn hơn.
- Tên bắt buộc, giá/thời gian hữu hạn >0, loại tồn tại, không trùng tên cùng loại. Chặn xóa loại đang có món.
- English mặc định, chuyển Tiếng Việt và giữ lựa chọn. Catalog mẫu có bản dịch; tên tùy ý do người dùng nhập được giữ nguyên.
- CRUD offline, outbox/tombstone lưu bền vững, tự upload và download khi có mạng. Không cần nút đồng bộ.

## MockAPI

Tạo hai resource **240245_DishCategory** và **240245_Dish**. Nhập URL gốc ở **Server settings / Cấu hình máy chủ** trên app, hoặc đặt `EXPO_PUBLIC_MOCKAPI_URL` trong `.env`. Cấu hình đã lưu trong app được ưu tiên. Nếu sửa `.env`, khởi động lại Expo.

Hướng dẫn đầy đủ các field và kiểu dữ liệu: [docs/MOCKAPI_SETUP.md](docs/MOCKAPI_SETUP.md).

Các table/cột SQLite và field nghiệp vụ đều có tiền tố `240245_`. `id` của MockAPI chỉ là metadata dùng cho đường dẫn REST. File database và ID seed được giữ nguyên khi tổ chức lại source, nên dữ liệu đã lưu trên iPhone vẫn dùng được.

## Kiểm tra

```powershell
npm test
npx expo export --platform ios --max-workers 1 --output-dir .cache/ios-export
```

**24/24 test đạt**, bao gồm validation, bản dịch/lỗi, filter, FK/cascade/thumbnail, repository trên SQLite thật, upload/download qua HTTP mô phỏng MockAPI, lỗi 503 và phục hồi, mất phản hồi POST, bảo vệ bản sửa local và hủy worker. Bundle iOS SDK 57 đã tạo thành công.

Kết nối với dịch vụ MockAPI thật cũng đã kiểm tra: lưu đúng 3 loại, 5 món, 10 ảnh; outbox bằng 0 và chu kỳ tiếp theo không sinh trùng ID. URL thực tế chỉ ở `.env` trên máy của người dùng.

Đối chiếu chức năng của đề: [docs/REQUIREMENTS_REVIEW.md](docs/REQUIREMENTS_REVIEW.md).

## Ghi chú cấu hình

- `expo` ghim chính xác `57.0.0`; `expo.install.exclude` chỉ ngăn đề xuất tự nâng patch cho package này. React Native `0.86.3` và các package native khớp SDK 57.
- `.env`, database, node_modules, log và cache được bỏ khỏi Git. Repository chỉ chứa mã nguồn, lockfile, test và tài liệu.
- Đồng bộ chạy khi app được hệ điều hành cho chạy; mở lại app sẽ tiếp tục outbox sau force-stop. Với Expo Go, tải bundle xong trước khi demo offline.
