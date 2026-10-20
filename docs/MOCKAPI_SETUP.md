# Cấu hình MockAPI

Tạo project của mình tại https://mockapi.io rồi tạo hai resource trong cùng project. Giữ trường `id` tự sinh của nhà cung cấp. Bỏ các trường mẫu `name/avatar/createdAt`; không Generate dữ liệu Faker.

## Resource 240245_DishCategory

| Field | Type |
|---|---|
| 240245_Id | String |
| 240245_Name | String |
| 240245_Description | String |

## Resource 240245_Dish

| Field | Type |
|---|---|
| 240245_Id | String |
| 240245_Name | String |
| 240245_Price | Number |
| 240245_PreparationTime | Number |
| 240245_IsAvailable | Number |
| 240245_Description | String |
| 240245_DishCategoryId | String |
| 240245_IsSynced | Number |
| 240245_Images | Array |

Images là mảng object có `240245_Id`, `240245_DishId`, `240245_ImageUrl`, `240245_IsThumbnail`. Các cờ dùng số 0/1. Trên SQLite ảnh vẫn ở bảng `240245_DishImage`; gửi kèm món để chỉ cần hai resource REST.

Nhập URL gốc trong **Server settings / Cấu hình máy chủ**. Ví dụ `https://YOUR_PROJECT.mockapi.io/api/v1`, không kèm tên resource hoặc `:endpoint`. URL đã lưu trong app ưu tiên hơn biến `EXPO_PUBLIC_MOCKAPI_URL` trong `.env`. Không cần nút đồng bộ thủ công.

Hai URL GET phải trả mảng JSON, kể cả khi rỗng:

```text
BASE_URL/240245_DishCategory
BASE_URL/240245_Dish
```

`id` của MockAPI chỉ là metadata để gọi đường dẫn REST. ID nghiệp vụ và các field của bài thi luôn có tiền tố `240245_`. Tài liệu chính thức: https://github.com/mockapi-io/docs/wiki/Quick-start-guide .

## Đồng bộ và kiểm chứng

1. Bắt đầu với project riêng có hai resource trống. App gửi seed và các bản sửa local lên trước, rồi tải dữ liệu về.
2. Chờ trạng thái đã đồng bộ và số job bằng 0. Kiểm tra cùng `240245_Id` không xuất hiện hai lần trên server.
3. Sau khi app đã tải xong, tắt Internet trên iPhone, thêm/sửa món rồi bật lại: không cần bấm đồng bộ.
4. Sửa giá hoặc xóa món trên server rồi trở về app có mạng: thay đổi được tải về. Bản sửa local đang chờ gửi được ưu tiên.

Kết nối thật đã được kiểm tra với project của người dùng: 3 loại, 5 món, 10 ảnh; outbox bằng 0; chu kỳ kế tiếp không tạo trùng. URL thực tế nằm trong `.env` trên máy, không được đưa lên GitHub.

Một worker chạy khi app được hệ điều hành cho chạy; sau force-stop, lần mở tiếp theo tiếp tục outbox. Expo Go cần tải bundle phát triển từ máy tính trước khi demo offline. Đây không phải hệ thống giao dịch nhiều người cùng sửa có khóa phân tán.
