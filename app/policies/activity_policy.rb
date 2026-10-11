class ActivityPolicy < ApplicationPolicy
  # Ghi nhận nhật ký tương tác: Admin có toàn quyền, User dựa vào policy `activity_create` và phạm vi KH
  def create?
    return true if admin?
    return false unless user&.has_policy_permission?(:activity_create)

    if record.is_a?(Activity) && record.customer && user.own_customers_only?
      return record.customer.assigned_user_id == user.id
    end

    true
  end

  # Xóa nhật ký tương tác: Admin có toàn quyền, User dựa vào policy `activity_delete` và phạm vi KH
  def destroy?
    return true if admin?
    return false unless user&.has_policy_permission?(:activity_delete)

    if record.is_a?(Activity) && record.customer && user.own_customers_only?
      return record.customer.assigned_user_id == user.id
    end

    true
  end
end
