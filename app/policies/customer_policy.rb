class CustomerPolicy < ApplicationPolicy
  # Xem danh sách: Admin & User đều có quyền
  def index?
    true
  end

  # Xem chi tiết khách hàng: Admin & User đều có quyền
  def show?
    true
  end

  # Tạo khách hàng: Admin hoặc nhân viên Sales / Marketing
  def create?
    return true if user.admin?
    user.sales? || user.marketing?
  end

  def new?
    create?
  end

  # Chỉnh sửa thông tin khách hàng:
  # - Admin: Toàn quyền
  # - Marketing: Không có quyền sửa (chỉ xem / tạo lead)
  # - Sales & CS: Được sửa khách hàng mình phụ trách hoặc cập nhật thông tin
  def update?
    return true if user.admin?
    return false if user.marketing?

    user.sales? || user.cs?
  end

  def edit?
    update?
  end

  # XÓA KHÁCH HÀNG: CHỈ DUY NHẤT ADMIN MỚI ĐƯỢC PHÉP XÓA
  # User thường tuyệt đối không được phép xóa dữ liệu doanh nghiệp B2B
  def destroy?
    user.admin?
  end

  # QUẢN LÝ CÔNG NỢ (Ghi nhận hóa đơn, thu tiền nợ):
  # - Admin hoặc nhân viên CS (Customer Success / Tài chính)
  def manage_debt?
    return true if user.admin?
    user.cs?
  end
end
