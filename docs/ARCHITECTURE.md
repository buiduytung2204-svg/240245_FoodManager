# Kiến trúc mã nguồn

Mã ứng dụng nằm trong `src/`; cấu hình Expo và điểm vào ở thư mục gốc. Sử dụng JavaScript, React hooks và kiến trúc phân lớp. Không thêm thư viện điều hướng chỉ để chuyển các màn hình của bài tập.

| Thành phần | Trách nhiệm |
|---|---|
| `App.js` | Xuất component gốc, giữ entry point Expo ổn định |
| `src/application/FoodManagerApp.js` | Ghép SafeArea, header, loading/error và màn hình hiện tại |
| `src/hooks/useFoodManager.js` | Khởi tạo app, state dữ liệu/bộ lọc/ngôn ngữ, điều phối CRUD và vòng đời sync |
| `src/hooks/useAppNavigation.js` | Route, quay lại và nút Back trên Android |
| `src/navigation/AppNavigator.js` | Ánh xạ route sang screen |
| `src/screens/` | Giao diện List, Detail, Create/Edit, Category và Settings |
| `src/components/` | Button, Field, Choices, Photo, AppHeader dùng chung |
| `src/theme/styles.js` | Màu sắc, khoảng cách và style dùng chung |
| `src/models/fields.cjs` | Tiền tố MSSV, tên project và tên file SQLite |
| `src/domain/dishes.cjs` | Validation, tìm kiếm, lọc, sắp xếp thuần; không gọi DB hoặc mạng |
| `src/database/connection.js` | Mở SQLite và tuần tự hóa giao dịch trên cùng kết nối |
| `src/database/schema.js` | Table/column có tiền tố MSSV, FK, CHECK, UNIQUE và index thumbnail |
| `src/database/seed.js` | Tạo 3 loại, 5 món, 10 ảnh một lần trong transaction |
| `src/database/helpers.js` | Sinh ID và câu INSERT dùng bind parameters |
| `src/repositories/` | Lưu/đọc dữ liệu, tách theo món, loại, catalog, settings và sync |
| `src/services/sync/syncService.js` | NetInfo, HTTP MockAPI, retry, upload FIFO và download |
| `src/config/api.cjs` | Kiểm tra URL cấu hình |
| `src/localization/` | Bản dịch UI, lỗi và catalog mẫu Anh-Việt |
| `tests/unit/` | Quy tắc nghiệp vụ, URL, bản dịch, schema và worker với fake network |
| `tests/integration/` | Repository trên SQLite thật và REST qua HTTP trên máy |
| `tests/helpers/` | Adapter SQLite dùng cho test và loader các module repository thực tế |

## Luồng dữ liệu

```text
Thao tác người dùng
  → Screen / component
  → Hook điều phối hoặc action repository
  → Domain validation
  → Repository
  → SQLite transaction: dữ liệu + outbox
  → Hook đọc lại snapshot cho giao diện

Có mạng / foreground / chu kỳ tự động
  → Sync service
  → Đọc outbox qua syncRepository
  → POST / PUT / DELETE MockAPI
  → Acknowledge khi thành công
  → GET snapshot server
  → applyRemoteSnapshot trong một transaction
  → Hook cập nhật dữ liệu hiển thị
```

Screen không tự thực thi SQL hoặc `fetch`. Repository không render React. Sync service không giữ transaction SQLite trong lúc chờ mạng. Domain không phụ thuộc Expo nên dễ kiểm thử.

## Quy tắc quan trọng được giữ khi chia thư mục

- Không đổi `240245_FoodManager.db`, tên table/column hoặc ID seed: dữ liệu đã lưu trên iPhone vẫn dùng được.
- Mọi truy cập DB dùng hàng đợi ở connection; pragma khóa ngoại được bật trước transaction.
- Thay đổi món/ảnh và outbox nằm trong cùng transaction; xóa offline giữ tombstone.
- Chỉ đánh dấu IsSynced=1 khi không còn job mới hơn cho món đó.
- Download bảo vệ bản sửa local chưa gửi và rollback dữ liệu remote không hợp lệ.
- Bộ lọc ở hook app, không nằm trong screen có thể bị tháo; ngôn ngữ/API URL còn lưu trong SQLite.
- `.env`, SQLite, log, cache và node_modules không thuộc mã nguồn đưa lên GitHub.

Các file `.cjs` là module CommonJS để dùng trực tiếp cả trong Metro và Node test. Các file giao diện/repository là ES modules; test loader dùng Babel để chạy đúng các module repository với adapter SQLite trên Node.
