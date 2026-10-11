# 🏢 NexCRM B2B - Nền tảng SaaS Quản lý Khách hàng Doanh nghiệp & Công nợ

Hệ thống **CRM B2B (SaaS)** cơ bản được xây dựng hoàn toàn bằng **Ruby on Rails 8**, đáp ứng đầy đủ yêu cầu quản lý khách hàng doanh nghiệp, theo dõi công nợ, phân quyền vai trò cho **Sales**, **CS (Customer Success)**, và **Marketing**.

---

## 🚀 1. Hướng dẫn khởi chạy ứng dụng

### Cách 1: Chạy bằng Docker (Khuyên dùng)
Chỉ cần chạy 1 câu lệnh duy nhất:

```bash
docker compose up --build
```
> Hệ thống sẽ tự động khởi động đồng bộ 3 service:
> 1. 🗄️ **PostgreSQL 16** (`db`, port 5432)
> 2. ⚙️ **Rails 8 Backend API** (`crm-web`, port 3000)
> 3. ⚛️ **React 19 Vite Frontend** (`frontend`, port 5173 - Nginx Alpine reverse-proxy `/api` về `crm-web`)
>
> 🌐 Truy cập ngay giao diện React tại: **`http://localhost:5173`** (hoặc Rails API tại `http://localhost:3000`)

---

### Cách 2: Chạy trực tiếp từ máy tính (Local)

Yêu cầu máy tính có cài đặt PostgreSQL đang chạy ở port 5432.

```bash
# 1. Cài đặt các gem và chuẩn bị database PostgreSQL
bin/setup

# Hoặc chạy thủ công:
bundle install
bin/rails db:prepare
bin/rails db:seed

# 2. Khởi động server Rails API Backend
bin/rails server
```
Rails backend chạy tại: **`http://localhost:3000`**

### Chạy Giao diện Frontend (React Vite):
Mở một terminal mới:
```bash
cd frontend
npm run dev
```
Truy cập giao diện React hiện đại tại: **`http://localhost:5173`** (đã được cấu hình tự động proxy API sang port 3000).

---

## 👥 2. Tài khoản Demo & Cơ chế Phân quyền Policy

Hệ thống phân biệt 2 cấp bậc người dùng: **Admin** và **User** (`role: 'admin' | 'user'`). Toàn bộ quyền thao tác được điều khiển độc lập thông qua **Policy Pattern** (`app/policies/`):

| Cấp bậc / Bộ phận | Email | Mật khẩu mặc định | Nhân sự | Quyền hạn theo Policy |
| :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Admin (Quản trị)** | `admin@crm.saas` | `password123` | Quản trị viên | **Toàn quyền**: Tạo, sửa, **Xóa khách hàng B2B**, duyệt công nợ, quản lý nhân sự |
| 🔵 **User - Sales** | `sales@crm.saas` | `password123` | Nguyễn Văn Hùng | Tạo & sửa khách hàng được giao, ghi nhật ký trao đổi/demo, xem công nợ (Không được xóa) |
| 🟢 **User - CS** | `cs@crm.saas` | `password123` | Trần Thị Mai | Sửa thông tin CS, **ghi nhận hóa đơn & thu tiền công nợ**, đôn đốc nhắc nợ (Không được xóa) |
| 🟣 **User - Marketing** | `marketing@crm.saas` | `password123` | Lê Hoàng Nam | **Chỉ xem (Read-only)** thông tin KH & công nợ, tạo Lead mới từ chiến dịch (Không sửa/xóa/thu tiền) |

> **Lưu ý**: Trang chủ và thanh điều hướng có nút **Đăng nhập nhanh 1-Click** cho cả 4 tài khoản để bạn kiểm tra cơ chế phân quyền Policy ngay lập tức.

---

## 🎯 3. Các tính năng cốt lõi đã triển khai

### A. Quản lý Khách hàng Doanh nghiệp B2B (B2B Customer Management)
- **Hồ sơ Pháp nhân**: Tên doanh nghiệp, Mã số thuế (MST), Ngành nghề kinh doanh, Quy mô nhân sự (50-200, 500+ NV), Website, Địa chỉ trụ sở, Tỉnh/Thành phố.
- **Phân loại & Hạng B2B**: 
  - Phân hạng: *Tiêu chuẩn, Bạc (Silver), Vàng (Gold), VIP Doanh nghiệp*.
  - Trạng thái: *Tiềm năng (Lead), Đang đàm phán, Đang hợp tác, Cảnh báo rủi ro (At-risk), Ngưng hợp tác*.
- **Người đại diện liên hệ (Decision Maker)**: Họ tên, Chức vụ (Giám đốc, Kế toán trưởng, Head of Product...), Số điện thoại, Email.
- **Đầu mối phụ trách**: Gán nhân viên Sales hoặc CS phụ trách chính (Account Manager).
- **Bộ lọc & Tìm kiếm đa tiêu chí**: Tìm theo tên công ty, MST, người liên hệ, lọc theo ngành nghề, trạng thái hợp tác và tình trạng nợ.

### B. Quản lý Công nợ & Tài chính B2B (Debt & Receivables Management)
- **Hạn mức tín dụng (Credit Limit)**: Thiết lập hạn mức công nợ cho phép cho từng doanh nghiệp.
- **Theo dõi Công nợ hiện tại**: Thanh trực quan tỷ lệ sử dụng hạn mức (Credit Utilization).
- **Cảnh báo công nợ tự động**:
  - 🚨 **Nợ quá hạn**: Hiển thị số ngày quá hạn (e.g., trễ 24 ngày, 45 ngày) với nhãn cảnh báo đỏ để CS/Sales đôn đốc thanh toán.
  - ⚠️ **Sắp đến hạn**: Cảnh báo các khoản nợ cần thanh toán trong vòng 7 ngày tới.
  - ✅ **Đã tất toán / Trong hạn**.
- **Ghi nhận giao dịch công nợ**:
  - Ghi nhận phát sinh nợ mới (*Invoice / Hóa đơn*).
  - Ghi nhận thanh toán (*Payment / Thu tiền*).
  - Lịch sử sổ phụ các lần thanh toán, mã tham chiếu HĐ và người thực hiện.
- **Sổ theo dõi công nợ chuyên biệt (`/debts`)**: Xem tổng công nợ toàn hệ thống, danh sách ưu tiên thu hồi cho bộ phận CS và Sales.

### C. Nhật ký Chăm sóc & Lịch sử Tương tác (CRM Activities Timeline)
- Ghi lại mọi hoạt động: **Cuộc gọi (Call)**, **Họp / Demo**, **Email**, **Hỗ trợ CS**, **Nhắc nợ**, **Ghi chú nội bộ**.
- Lưu trữ người thực hiện, thời gian tương tác và **Lịch hẹn tiếp theo (Next Follow-up)**.
- Timeline sắp xếp trực quan theo thời gian thực tại trang chi tiết từng khách hàng.

### D. Dashboard phân tích theo từng vai trò
- **Sales View**: Theo dõi pipeline đàm phán, doanh số hợp đồng, danh sách khách hàng được gán cho bản thân.
- **CS View**: Bảng điều khiển công nợ quá hạn khẩn cấp, danh sách khách hàng có nguy cơ rời bỏ (At-risk).
- **Marketing View**: Biểu đồ phân bổ nguồn Lead (Google Ads, Referral, Outbound, Hội thảo) và cơ cấu khách hàng theo từng ngành nghề.

---

## 🛠️ Cấu trúc thư mục dự án

```text
fearless-maxwell/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb  # Auth, định dạng tiền tệ VNĐ
│   │   ├── sessions_controller.rb     # Đăng nhập chuẩn & 1-click Demo
│   │   ├── dashboard_controller.rb    # Bảng điều khiển phân quyền Sales/CS/Mkt
│   │   ├── customers_controller.rb    # Quản lý khách hàng B2B, bộ lọc, tìm kiếm
│   │   ├── activities_controller.rb   # Ghi nhật ký tương tác & hẹn lịch
│   │   ├── debt_transactions_controller.rb # Ghi nhận thu tiền & hóa đơn nợ
│   │   └── debts_controller.rb        # Sổ theo dõi công nợ B2B chuyên biệt
│   ├── models/
│   │   ├── user.rb                    # Phân quyền Sales, CS, Marketing
│   │   ├── customer.rb                # Mô hình B2B, tính toán nợ quá hạn, scopes
│   │   ├── activity.rb                # Lịch sử tương tác & chăm sóc
│   │   └── debt_transaction.rb        # Giao dịch công nợ, cập nhật tự động số dư
│   └── views/
│       ├── layouts/application.html.erb # Giao diện chuẩn SaaS Tailwind CSS & Lucide Icons
│       ├── sessions/new.html.erb      # Trang đăng nhập tại trang chủ
│       ├── dashboard/index.html.erb   # Dashboard chỉ số KPI & vai trò
│       ├── customers/                 # Index, Show, New, Edit, _Form
│       └── debts/index.html.erb       # Bảng quản lý công nợ
├── config/
│   ├── routes.rb                      # Định tuyến
│   └── database.yml                   # Cấu hình PostgreSQL
├── db/
│   ├── migrate/                       # Các migration bảng users, customers, activities, debt_transactions
│   ├── schema.rb                      # Schema cơ sở dữ liệu
│   └── seeds.rb                       # Dữ liệu B2B mẫu đa dạng (FPT, VinRetail, Sài Gòn Express...)
└── bin/
    ├── setup                          # Script tự động cài đặt & khởi tạo
    └── rails                          # Rails executable
```
