class UserPolicy < ApplicationPolicy
  # Chỉ Admin (user đặc biệt có toàn quyền hệ thống) mới được quản lý nhân sự & phân quyền Policy
  def index?
    admin?
  end

  def show?
    admin?
  end

  def create?
    admin?
  end

  def update?
    admin?
  end

  def update_role?
    admin?
  end

  def reassign_customers?
    admin?
  end

  # Chỉ Admin được xóa nhân sự, và không được tự xóa chính mình
  def destroy?
    return false unless admin?
    return false if record.is_a?(User) && record.id == user.id

    true
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if user&.admin?
      scope.none
    end
  end
end
