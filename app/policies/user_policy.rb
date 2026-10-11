class UserPolicy < ApplicationPolicy
  # Chỉ Admin mới được xem danh sách và quản lý nhân sự
  def index?
    user&.admin?
  end

  def show?
    user&.admin?
  end

  def create?
    user&.admin?
  end

  def update?
    user&.admin?
  end

  def update_role?
    user&.admin?
  end

  def reassign_customers?
    user&.admin?
  end

  # Chỉ Admin được xóa nhân sự, và không được tự xóa chính mình
  def destroy?
    return false unless user&.admin?
    return false if record.is_a?(User) && record.id == user.id

    true
  end
end
