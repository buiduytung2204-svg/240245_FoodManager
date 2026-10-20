# Đối chiếu đề giữa kỳ - 240245_FoodManager

Ngày rà soát: 20/10/2026. Nguồn: PDF 2 trang do người dùng cung cấp, `D:\De_kiem_tra_giua_ky_Mobile_Quan_ly_mon_an.pdf`. Đọc toàn bộ văn bản và kiểm tra hình render cả hai trang. Giữ Expo SDK 57.0.0 theo yêu cầu của người dùng.

## Kết luận theo phạm vi kiểm chứng

Phần mã nguồn đã có các chức năng cơ bản ở mục 3 và 4 của đề. Bản trước còn thiếu chiều MockAPI → local, chưa có cấu hình endpoint ngay trên điện thoại, chưa hiện rõ MSSV khi demo, và lỗi chưa biết có thể rơi về tiếng Anh khi đang chọn tiếng Việt. Các điểm này đã được sửa. Người dùng đã tạo hai resource MockAPI và kết nối thật đã được kiểm tra thành công ngày 20/10/2026. Phạm vi hiện tại là mã nguồn và kết nối dữ liệu; không thực hiện quay video theo yêu cầu của người dùng.

| Yêu cầu trong đề | Mã liên quan / cách đáp ứng | Kết quả rà soát |
|---|---|---|
| Mục 2: React Native và ít nhất một cách lưu trữ | Expo React Native + expo-sqlite; không phụ thuộc API để CRUD | Có trong code |
| Mục 2-3: tên project và tiền tố MSSV | app.json tên 240245_FoodManager; schema và mọi cột local có 240245_; header hiện MSSV | Có; schema được kiểm thử |
| Mục 3: hai model và quan hệ, danh sách ảnh | DishCategory, Dish và bảng ảnh tách riêng, FK; ảnh cascade khi xóa món | Có; kiểm thử SQLite |
| Mục 3: tối thiểu 3 loại, 5 món | Seed một lần trong transaction, 2 ảnh/món và một thumbnail | Có; kiểm thử seed idempotent |
| Mục 3: tên, giá, thời gian, loại hợp lệ, không trùng tên cùng loại | src/domain/dishes.cjs + CHECK/UNIQUE/FK; kiểm tra thêm cả hai tên dịch tương đương | Có; kiểm thử validation |
| Mục 4.1: danh sách/chi tiết/thêm/sửa/xóa có xác nhận | Các screen tương ứng; Alert trước xóa; form lấy loại từ SQLite | Có trong code; cần demo trên iPhone |
| Mục 4.2: tìm một phần tên, lọc phối hợp, sắp xếp, giữ bộ lọc | State ở App; tìm cả Anh-Việt không dấu; loại + trạng thái + khoảng giá cùng lúc; ba cách sắp xếp | Logic được kiểm thử; cần demo điều hướng |
| Mục 4.3: nhiều ảnh URL, đổi thumbnail, tối đa một | Form/Detail + unique partial index; nút thử lại khi ảnh tải lỗi | Có; ràng buộc SQLite được kiểm thử |
| Mục 4.3: Quick khi ≤15, Regular khi >15 | Tính trực tiếp lúc render ở List/Detail; không lưu field phân loại | Có trong code; thử mốc 15/16 khi quay |
| Mục 4.4: không xóa loại đang dùng, món ngừng bán | Kiểm tra nghiệp vụ + ON DELETE RESTRICT; bộ lọc đang bán loại món IsAvailable=0 | Có; kiểm thử |
| Mục 4.4: ID thiếu, dữ liệu/ảnh trống, giá sai, lỗi API | Thông báo ở screen, domain validation, timeout/retry; giữ outbox và rollback download sai | Có; kiểm thử lỗi dữ liệu và HTTP 503 |
| Mục 4.5: English mặc định, chuyển Việt, giữ ngôn ngữ và dịch lỗi | src/localization/index.js, state ở App + SQLite setting; fallback lỗi đúng ngôn ngữ | Có; kiểm thử đủ cặp bản dịch và fallback |
| Mục 5: offline và tự đồng bộ local ↔ MockAPI | Outbox transaction + NetInfo + FIFO upload + GET/applyRemoteSnapshot; local pending được ưu tiên | 24 test tổng đạt; kiểm tra REST MockAPI thật thành công, 3 loại/5 món/10 ảnh, không trùng ID |
| Mục 6-7: Video 1 trong ca học, link Git và Video 2 hạn 23/10/2026 | Đã thêm kịch bản trong VIDEO_GUIDE.md | CẦN người dùng quay và nộp LMS |

## Những thay đổi trong lần rà soát

1. Thêm `applyRemoteSnapshot`: tải dữ liệu server về, đồng bộ thêm/sửa/xóa và ảnh trong một transaction. Không hồi sinh món đã xóa offline, không đè thay đổi local đang chờ lên mạng. Không ghi job đồng bộ cho dữ liệu vừa tải.
2. Đổi tên resource REST sang `240245_DishCategory` và `240245_Dish`, giữ tiền tố MSSV cho thực thể/dữ liệu nghiệp vụ cả phía API. Metadata `id` do MockAPI cấp chỉ dùng làm đường dẫn REST; không dùng nó thay `240245_Id` và không lưu thành cột SQLite.
3. Thêm Cấu hình máy chủ, lưu URL trong SQLite, tự chạy worker khi cấu hình xong. URL phải là HTTPS hợp lệ. Đổi endpoint sẽ xếp lại các bản ghi đã đồng bộ để gửi tới đích mới; giữ các job đang chờ.
4. Worker có tín hiệu hủy khi dừng/đổi URL, không xác nhận job của endpoint cũ sau khi dừng. Giữ xử lý mất phản hồi POST bằng cách tìm ID nghiệp vụ trước retry.
5. Header hiện tên project/MSSV để có bằng chứng trong Video 1. Thêm trạng thái loại trống và nút thử lại ảnh lỗi.
6. Sửa fallback lỗi chưa biết theo ngôn ngữ đã chọn; form chỉ chuyển sang chi tiết sau khi dữ liệu mới đã đọc lại, tránh chớp thông báo ID chưa tồn tại.
7. Bổ sung kiểm thử upload/download qua HTTP thật trên máy với REST server mô phỏng, bảo vệ dữ liệu chưa gửi, rollback dữ liệu lỗi và cấu hình endpoint.

## Giới hạn cần minh chứng

- Đã kiểm tra worker/repository trên SQLite với MockAPI thật: upload đủ dữ liệu và ảnh, GET/pull thành công, outbox bằng 0, IsSynced=1; chạy tiếp một chu kỳ không sinh trùng bản ghi. Việc kiểm tra này không phải bản ghi thao tác trên iPhone; mở lại app trên điện thoại để quan sát trạng thái thực tế của thiết bị.
- Mặc định ưu tiên bản sửa local đang chờ gửi. Không thiết kế hệ thống nhiều người chỉnh cùng lúc có giao dịch phân tán; MockAPI chỉ là dịch vụ REST mẫu. Dùng project riêng, ban đầu để trống, để demo bài thi.
- Ảnh seed là ảnh minh họa từ Picsum; đề chỉ yêu cầu ImageUrl, danh sách ảnh và thumbnail. Có thể thay bằng URL ảnh món ăn thực tế nếu muốn demo đẹp hơn.
- Đề nói rõ KHÔNG bắt buộc dịch tên/mô tả do người dùng nhập. Bản hiện tại dịch thêm catalog mẫu để đáp ứng yêu cầu bổ sung của người dùng; không tự đổi tên tùy ý của món đã nhập.
- Barem là chức năng 4,5 điểm, nâng cao 1,5 điểm và hai video 4,0 điểm. Kiểm thử code không thay thế video hoặc quyết định chấm điểm của giảng viên.
