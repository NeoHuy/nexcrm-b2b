class ActivityPolicy < ApplicationPolicy
  # Ghi nhận nhật ký tương tác (cuộc gọi, họp, email...): Mọi user đều có quyền
  def create?
    true
  end

  # Xóa nhật ký tương tác: Chỉ Admin hoặc chính người tạo nhật ký đó
  def destroy?
    return true if user.admin?
    record.user_id == user.id
  end
end
