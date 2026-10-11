class CustomerPolicy < ApplicationPolicy
  # Xem danh sách khách hàng: Admin có toàn quyền, User phụ thuộc vào policy `customer_view`
  def index?
    return true if admin?
    return false unless user

    user.has_policy_permission?(:customer_view)
  end

  # Xem chi tiết khách hàng: Admin có toàn quyền, User cần `customer_view` và nằm trong phạm vi dữ liệu cho phép
  def show?
    return true if admin?
    return false unless user&.has_policy_permission?(:customer_view)

    within_scope?
  end

  # Tạo khách hàng mới: Admin có toàn quyền, User cần `customer_create`
  def create?
    return true if admin?
    return false unless user

    user.has_policy_permission?(:customer_create)
  end

  def new?
    create?
  end

  # Chỉnh sửa thông tin khách hàng: Admin có toàn quyền, User cần `customer_update` và nằm trong phạm vi dữ liệu
  def update?
    return true if admin?
    return false unless user&.has_policy_permission?(:customer_update)

    within_scope?
  end

  def edit?
    update?
  end

  # Xóa khách hàng: Admin có toàn quyền, User cần `customer_delete` và nằm trong phạm vi dữ liệu
  def destroy?
    return true if admin?
    return false unless user&.has_policy_permission?(:customer_delete)

    within_scope?
  end

  # Quản lý công nợ của khách hàng: Admin có toàn quyền, User cần `debt_create` và nằm trong phạm vi dữ liệu
  def manage_debt?
    return true if admin?
    return false unless user&.has_policy_permission?(:debt_create)

    within_scope?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless user
      return scope.all if user.admin?
      return scope.none unless user.has_policy_permission?(:customer_view)

      if user.own_customers_only?
        scope.where(assigned_user_id: user.id)
      else
        scope.all
      end
    end
  end

  private

  def within_scope?
    return true unless record.is_a?(Customer)
    return true unless user.own_customers_only?

    record.assigned_user_id == user.id
  end
end
