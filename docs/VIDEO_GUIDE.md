# Chuẩn bị minh chứng bài giữa kỳ

Theo đề, nộp link Git và Video 1 trong ca học; Video 2 hạn 23/10/2026. Không có yêu cầu độ dài video cố định trong PDF. Tự quay thao tác thật và giải thích bằng lời của mình.

## Trước khi quay

- Chạy `npm run ios`; iPhone dùng Expo Go SDK 57 và cùng Wi-Fi. Tải xong ứng dụng trước khi tắt mạng trong phần offline.
- Đảm bảo đang có ít nhất 3 loại và 5 món. Dữ liệu seed chỉ chạy lần đầu, không tự phục hồi những món đã xóa khi thử CRUD.
- Xem README để tạo MockAPI với hai resource có tiền tố 240245_. Lưu URL ở Cấu hình máy chủ và chờ các job đầu tiên hoàn tất. Chỉ demo phần nâng cao sau khi server thật hoạt động.
- Màn hình có dòng `240245_FoodManager · MSSV: 240245`. Dùng chức năng quay màn hình iPhone cho Video 1.

## Video 1 - Demo ứng dụng

1. Giới thiệu MSSV, tên project, danh sách; chuyển về English nếu đang để tiếng Việt.
2. Mở một món, chỉ loại món, giá, thời gian, trạng thái, mô tả và nhiều ảnh. Đổi ảnh đại diện rồi quay về danh sách để kiểm tra.
3. Thêm món bằng form chọn loại từ local, thêm hai URL ảnh và chọn thumbnail. Lưu, mở chi tiết, sửa giá/trạng thái/thời gian.
4. Thử bỏ trống tên, giá 0, thời gian âm, tên đã có cùng loại: có lỗi. Thử mốc thời gian 15 và 16 phút để thấy Quick/Regular.
5. Kết hợp tìm một phần tên, loại, đang bán và Min/Max; đổi ba kiểu sắp xếp. Mở chi tiết rồi quay lại chứng minh bộ lọc giữ nguyên. Thử Min > Max.
6. Chuyển Tiếng Việt; xem List, Create/Edit và Detail, thử validation để thấy nhãn/nút/lỗi đều đổi ngôn ngữ. Món ngừng bán vẫn có khi xem tất cả nhưng ẩn khi chỉ lọc đang bán.
7. Thử xóa loại đang có món, phải bị chặn. Xóa món thử nghiệm với hộp thoại xác nhận; thử Hủy trước để chứng minh không xóa nhầm.
8. Nâng cao: sau khi app đã tải xong, tắt Internet trên iPhone, tạo hoặc sửa món. Chỉ dữ liệu local/cờ chờ đồng bộ. Bật Internet và chờ app tự đồng bộ, không bấm nút đồng bộ. Đối chiếu record trên MockAPI, ID và giá/tên, không xuất hiện hai record cùng 240245_Id. Nếu thuận tiện, sửa giá trên server và trở lại app để chứng minh chiều tải về.

## Video 2 - Thuyết minh source

1. Mở `app.json`, chỉ tên project 240245_FoodManager. Mở `src/database/schema.js`, giải thích toàn bộ Table và field có tiền tố 240245_, lý do SQL identifier bắt đầu bằng số phải đặt trong dấu nháy kép.
2. Giải thích DishCategory 1-n Dish, Dish 1-n DishImage, FK, cascade ảnh và chặn xóa loại đang dùng. Chỉ CHECK giá/thời gian, UNIQUE tên cùng loại và index chỉ cho tối đa một thumbnail.
3. Mở `src/database/index.js` và `src/database/seed.js` để xem khởi tạo/seed một lần; mở `src/repositories/` để xem đọc dữ liệu, transaction CRUD và outbox/tombstone. Mở `src/domain/dishes.cjs`: validation, tìm kiếm, bộ lọc kết hợp và sắp xếp.
4. Mở `src/application/FoodManagerApp.js`, `src/hooks/`, `src/navigation/` và `src/screens/`: cách điều hướng, giữ bộ lọc, xác nhận xóa, form lấy loại từ SQLite. Chỉ công thức thời gian ≤15 phút được tính khi render.
5. Mở `src/localization/index.js`, `src/localization/content.cjs`: mặc định English, đổi ngôn ngữ qua state, lưu SQLite, thông báo lỗi; catalog mẫu có dịch tên nhưng dữ liệu tùy ý do người dùng nhập được giữ nguyên.
6. Mở `src/services/sync/syncService.js`: NetInfo, worker tự chạy, FIFO upload, tìm 240245_Id trước POST/PUT, chỉ acknowledge sau HTTP thành công. Tiếp tục GET và apply snapshot, giữ dữ liệu local còn dirty, rollback server data sai và tự retry.
7. Chạy `npm test`, giải thích kiểm thử SQLite thật và HTTP giả lập chỉ là kiểm thử, không thay thế demo MockAPI thật. Nêu cách cấu hình URL bằng màn hình Settings.

## Mã nguồn và nộp LMS

Đề yêu cầu **link Git**, không chỉ ZIP. Đưa thư mục project lên repository của mình và kiểm tra link có quyền truy cập phù hợp cho giảng viên. `.gitignore` đã bỏ node_modules, .cache, .expo, dist và .env; nộp source cùng package-lock.json, README và .env.example. Không đưa mật khẩu/token vào Git hoặc video.

Lần rà soát này chỉ chuẩn bị source và hướng dẫn; chưa tạo repository từ xa, chưa quay/nộp hai video và chưa nộp LMS thay người dùng.
