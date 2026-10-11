puts "===> Đang khởi tạo dữ liệu mẫu cho B2B SaaS CRM..."

# 1. Clean existing records
Activity.destroy_all
DebtTransaction.destroy_all
Customer.destroy_all
User.destroy_all

# 2. Seed Users with BCrypt passwords (2 Roles: admin & user + Policies)
admin_user = User.create!(
  name: "Quản trị viên Hệ thống",
  email: "admin@crm.saas",
  password: "password123",
  role: "admin",
  title: "Giám đốc Vận hành & Quản trị (Admin)",
  phone: "0901 000 999",
  department: "management",
  policy_code: "admin_all",
  policy_permissions: User::ADMIN_PERMISSIONS,
  avatar_color: "rose"
)

sales_user = User.create!(
  name: "Nguyễn Văn Hùng",
  email: "sales@crm.saas",
  password: "password123",
  role: "user",
  title: "Trưởng nhóm Kinh doanh B2B (Senior AE)",
  phone: "0908 112 233",
  department: "sales",
  policy_code: "sales_policy",
  policy_permissions: User::POLICY_PRESETS.dig("sales_policy", :permissions),
  avatar_color: "blue"
)

cs_user = User.create!(
  name: "Trần Thị Mai",
  email: "cs@crm.saas",
  password: "password123",
  role: "user",
  title: "Trưởng phòng Chăm sóc Khách hàng (CS Lead)",
  phone: "0912 445 566",
  department: "cs",
  policy_code: "cs_debt_policy",
  policy_permissions: User::POLICY_PRESETS.dig("cs_debt_policy", :permissions),
  avatar_color: "emerald"
)

mkt_user = User.create!(
  name: "Lê Hoàng Nam",
  email: "marketing@crm.saas",
  password: "password123",
  role: "user",
  title: "Giám đốc Tăng trưởng (Growth Marketing)",
  phone: "0934 778 899",
  department: "marketing",
  policy_code: "marketing_policy",
  policy_permissions: User::POLICY_PRESETS.dig("marketing_policy", :permissions),
  avatar_color: "purple"
)

puts "✓ Đã tạo 4 tài khoản (2 Roles: 1 Admin và 3 User gắn Policy khác nhau)"

# 3. Seed B2B Customers
customers_data = [
  {
    company_name: "Công ty Cổ phần Phần mềm FPT Software",
    tax_code: "0101234567",
    industry: "Công nghệ & Phần mềm",
    company_size: "Trên 500 nhân viên",
    tier: "vip",
    status: "active",
    website: "fpt-software.com",
    address: "Khu Công nghệ cao Hòa Lạc",
    city: "Hà Nội",
    contact_name: "Nguyễn Tuấn Anh",
    contact_title: "Giám đốc Chuyển đổi số (CDO)",
    contact_phone: "0903 123 456",
    contact_email: "anh.nt@fpt.com",
    lead_source: "Đối tác chiến lược",
    total_revenue: 850_000_000,
    current_debt: 120_000_000,
    credit_limit: 300_000_000,
    payment_due_date: Date.current + 18.days,
    assigned_user: sales_user,
    notes: "Khách hàng chiến lược doanh nghiệp lớn. Thanh toán đối soát định kỳ ngày 25 hàng tháng."
  },
  {
    company_name: "Tập đoàn Bán lẻ Vingroup Retail Distribution",
    tax_code: "0109876543",
    industry: "Thương mại điện tử & Bán lẻ",
    company_size: "Trên 500 nhân viên",
    tier: "vip",
    status: "active",
    website: "vinretail.vn",
    address: "Số 7 đường Bằng Lăng 1, KĐT Vinhomes Riverside",
    city: "Hà Nội",
    contact_name: "Phạm Thu Hương",
    contact_title: "Trưởng phòng Thu mua & Cung ứng",
    contact_phone: "0988 765 432",
    contact_email: "huong.pt@vinretail.vn",
    lead_source: "Hội thảo / Triển lãm ngành",
    total_revenue: 1_250_000_000,
    current_debt: 250_000_000,
    credit_limit: 500_000_000,
    payment_due_date: Date.current + 3.days, # Due soon!
    assigned_user: cs_user,
    notes: "Khoản công nợ đợt 3 sắp đến hạn thanh toán trong 3 ngày tới, cần gửi đối soát cho phòng kế toán Vin."
  },
  {
    company_name: "Công ty CP Vận tải & Logistics Sài Gòn Express",
    tax_code: "0304567890",
    industry: "Logistics & Vận tải",
    company_size: "200 - 500 nhân viên",
    tier: "gold",
    status: "at_risk",
    website: "sgexpress-logistics.vn",
    address: "Tòa nhà Waseco, 10 Phổ Quang, Q. Tân Bình",
    city: "TP. Hồ Chí Minh",
    contact_name: "Lê Minh Trí",
    contact_title: "Phó Tổng Giám đốc Vận hành",
    contact_phone: "0918 334 556",
    contact_email: "tri.le@sgexpress.vn",
    lead_source: "Đội ngũ Sales tiếp cận (Outbound)",
    total_revenue: 420_000_000,
    current_debt: 95_000_000,
    credit_limit: 100_000_000,
    payment_due_date: Date.current - 24.days, # OVERDUE 24 days!
    assigned_user: cs_user,
    notes: "⚠️ Khách hàng đang chậm thanh toán 24 ngày do tái cơ cấu luồng tiền. CS và Sales đã liên hệ nhắc nợ 2 lần."
  },
  {
    company_name: "Công ty CP Dược Phẩm MediCare Hà Nội",
    tax_code: "0103456789",
    industry: "Y tế & Dược phẩm",
    company_size: "50 - 200 nhân viên",
    tier: "silver",
    status: "prospect",
    website: "medicare-pharma.vn",
    address: "Số 45 Tràng Tiền, Hoàn Kiếm",
    city: "Hà Nội",
    contact_name: "Bác sĩ Đặng Quốc Bảo",
    contact_title: "Trưởng ban Dự án Y tế số",
    contact_phone: "0909 888 777",
    contact_email: "bao.dq@medicare.vn",
    lead_source: "Website / Đăng ký trực tiếp",
    total_revenue: 180_000_000,
    current_debt: 0,
    credit_limit: 50_000_000,
    payment_due_date: nil,
    assigned_user: sales_user,
    notes: "Đang trong giai đoạn demo tính năng B2B và chốt điều khoản thanh toán quý 4."
  },
  {
    company_name: "Công ty TNHH Cơ Khí & Chế Tạo An Phát",
    tax_code: "2300987123",
    industry: "Sản xuất & Chế tạo",
    company_size: "20 - 50 nhân viên",
    tier: "standard",
    status: "lead",
    website: "anphat-machinery.com",
    address: "Khu Công nghiệp Quế Võ",
    city: "Bắc Ninh",
    contact_name: "Vũ Đình Trọng",
    contact_title: "Chủ tịch Hội đồng Quản trị",
    contact_phone: "0977 123 999",
    contact_email: "trong.vu@anphat.com",
    lead_source: "Quảng cáo số (Google/LinkedIn)",
    total_revenue: 0,
    current_debt: 0,
    credit_limit: 30_000_000,
    payment_due_date: nil,
    assigned_user: sales_user,
    notes: "Lead mới từ chiến dịch Marketing Google Search ngành cơ khí sản xuất."
  },
  {
    company_name: "Công ty Cổ phần FinTech TrustPay Toàn Cầu",
    tax_code: "0312678901",
    industry: "Tài chính & FinTech",
    company_size: "50 - 200 nhân viên",
    tier: "vip",
    status: "active",
    website: "trustpay-global.io",
    address: "Bitexco Financial Tower, Quận 1",
    city: "TP. Hồ Chí Minh",
    contact_name: "Trần Anh Khoa",
    contact_title: "Head of Product & Operations",
    contact_phone: "0938 555 123",
    contact_email: "khoa.tran@trustpay.io",
    lead_source: "Giới thiệu (Referral)",
    total_revenue: 720_000_000,
    current_debt: 85_000_000,
    credit_limit: 250_000_000,
    payment_due_date: Date.current + 22.days,
    assigned_user: cs_user,
    notes: "Hợp đồng gói Enterprise 2 năm. Lịch sử thanh toán rất uy tín và đầy đủ."
  },
  {
    company_name: "Tập đoàn Xây dựng & Địa ốc Hòa Bình Group",
    tax_code: "0301122334",
    industry: "Xây dựng & Bất động sản",
    company_size: "Trên 500 nhân viên",
    tier: "gold",
    status: "at_risk",
    website: "hoabinhcorp.vn",
    address: "235 Võ Thị Sáu, Quận 3",
    city: "TP. Hồ Chí Minh",
    contact_name: "Hoàng Văn Đức",
    contact_title: "Kế toán trưởng Tập đoàn",
    contact_phone: "0904 999 111",
    contact_email: "duc.hv@hoabinhcorp.vn",
    lead_source: "Đối tác chiến lược",
    total_revenue: 960_000_000,
    current_debt: 180_000_000,
    credit_limit: 200_000_000,
    payment_due_date: Date.current - 45.days, # OVERDUE 45 days!
    assigned_user: cs_user,
    notes: "⚠️ Nợ quá hạn 45 ngày đợt nghiệm thu số 2. Cần gửi biên bản làm việc trực tiếp với CFO."
  },
  {
    company_name: "Chuỗi Cửa hàng F&B The Heritage Coffee",
    tax_code: "0107788990",
    industry: "Khách sạn & F&B",
    company_size: "50 - 200 nhân viên",
    tier: "silver",
    status: "active",
    website: "heritagecoffee.vn",
    address: "18 Trúc Bạch, Ba Đình",
    city: "Hà Nội",
    contact_name: "Lê Cẩm Tú",
    contact_title: "Trưởng phòng Vận hành Chuỗi",
    contact_phone: "0915 667 889",
    contact_email: "tu.le@heritagecoffee.vn",
    lead_source: "Website / Đăng ký trực tiếp",
    total_revenue: 310_000_000,
    current_debt: 35_000_000,
    credit_limit: 80_000_000,
    payment_due_date: Date.current + 12.days,
    assigned_user: sales_user,
    notes: "Đang mở rộng thêm 5 điểm bán mới trong tháng tới."
  }
]

created_customers = customers_data.map do |data|
  Customer.create!(data)
end

puts "✓ Đã tạo #{created_customers.count} doanh nghiệp B2B với đầy đủ thông tin & công nợ"

# 4. Seed Activities & Interaction Logs
# For FPT
fpt = Customer.find_by(company_name: "Công ty Cổ phần Phần mềm FPT Software")
fpt.activities.create!(
  user: sales_user,
  activity_type: "meeting",
  title: "Họp nghiệm thu giai đoạn 1 & ký kết gia hạn hợp đồng",
  content: "Đã làm việc với anh Nguyễn Tuấn Anh (CDO) tại Hòa Lạc. Khách hàng hài lòng với giải pháp và đồng ý thanh toán đợt 2 theo kế hoạch.",
  occurred_at: 2.days.ago,
  next_follow_up_at: 10.days.from_now
)

fpt.activities.create!(
  user: cs_user,
  activity_type: "support",
  title: "Hỗ trợ kỹ thuật tích hợp API hệ thống ERP",
  content: "Đội ngũ CS đã phối hợp kỹ thuật viên FPT cấu hình kết nối webhook hoàn tất trong 2 giờ.",
  occurred_at: 5.days.ago
)

# For Vingroup
vin = Customer.find_by(company_name: "Tập đoàn Bán lẻ Vingroup Retail Distribution")
vin.activities.create!(
  user: cs_user,
  activity_type: "email",
  title: "Gửi bảng đối soát công nợ kỳ tháng 10",
  content: "Đã gửi email kèm bảng sao kê công nợ 250.000.000 đ cho chị Phạm Thu Hương. Hạn chuyển khoản 3 ngày tới.",
  occurred_at: 1.day.ago,
  next_follow_up_at: 2.days.from_now
)

# For Sài Gòn Express (Overdue debt reminder)
sg = Customer.find_by(company_name: "Công ty CP Vận tải & Logistics Sài Gòn Express")
sg.activities.create!(
  user: cs_user,
  activity_type: "debt_reminder",
  title: "Gọi điện nhắc công nợ quá hạn 95 triệu",
  content: "Đã liên hệ anh Lê Minh Trí. Đại diện công ty cam kết sẽ thanh toán trước 50 triệu vào cuối tuần này và phần còn lại trong tuần sau.",
  occurred_at: 1.day.ago,
  next_follow_up_at: 3.days.from_now
)

sg.activities.create!(
  user: sales_user,
  activity_type: "call",
  title: "Trao đổi tình hình hoạt động kinh doanh vận tải",
  content: "Khách hàng gặp khó khăn dòng tiền mùa thấp điểm, đã thống nhất giữ nguyên chính sách không tăng lãi phạt.",
  occurred_at: 8.days.ago
)

# For MediCare
med = Customer.find_by(company_name: "Công ty CP Dược Phẩm MediCare Hà Nội")
med.activities.create!(
  user: sales_user,
  activity_type: "meeting",
  title: "Demo trực tiếp hệ thống quản lý dữ liệu bệnh viện",
  content: "Buổi demo trực tuyến qua Zoom với 4 trưởng khoa của MediCare. Phản hồi rất tích cực về tính năng bảo mật.",
  occurred_at: 3.days.ago,
  next_follow_up_at: 4.days.from_now
)

# For An Phát
anphat = Customer.find_by(company_name: "Công ty TNHH Cơ Khí & Chế Tạo An Phát")
anphat.activities.create!(
  user: mkt_user,
  activity_type: "note",
  title: "Phân loại Lead từ chiến dịch Google Ads B2B",
  content: "Khách hàng điền form tư vấn chuyển đổi số nhà máy. Đã bàn giao lại hồ sơ cho Sales Nguyễn Văn Hùng chăm sóc.",
  occurred_at: 4.days.ago
)

# 5. Seed Debt Transactions
fpt.debt_transactions.create!(
  user: cs_user,
  transaction_type: "invoice",
  amount: 200_000_000,
  transaction_date: 30.days.ago.to_date,
  reference_code: "INV-FPT-001",
  note: "Hóa đơn dịch vụ giai đoạn 1"
)

fpt.debt_transactions.create!(
  user: cs_user,
  transaction_type: "payment",
  amount: 80_000_000,
  transaction_date: 10.days.ago.to_date,
  reference_code: "PAY-FPT-001",
  note: "FPT thanh toán đợt đầu qua BIDV"
)

vin.debt_transactions.create!(
  user: cs_user,
  transaction_type: "invoice",
  amount: 250_000_000,
  transaction_date: 15.days.ago.to_date,
  reference_code: "INV-VIN-002",
  note: "Hóa đơn triển khai phân hệ B2B Retail"
)

sg.debt_transactions.create!(
  user: cs_user,
  transaction_type: "invoice",
  amount: 95_000_000,
  transaction_date: 45.days.ago.to_date,
  reference_code: "INV-SGX-009",
  note: "Hóa đơn dịch vụ vận hành hạ tầng quý 3 (Quá hạn)"
)

puts "✓ Đã tạo các hoạt động tương tác và chứng từ công nợ mẫu"
puts "===> Hoàn thành nạp dữ liệu CRM B2B!"
