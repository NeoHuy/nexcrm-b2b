class DebtTransactionPolicy < ApplicationPolicy
  def index?
    return true if admin?
    return false unless user

    user.has_policy_permission?(:debt_view)
  end

  # Ghi nhận giao dịch công nợ (hóa đơn, thu tiền, điều chỉnh nợ):
  # Admin có toàn quyền; User dựa theo policy `debt_create` và phạm vi khách hàng phụ trách
  def create?
    return true if admin?
    return false unless user&.has_policy_permission?(:debt_create)

    if record.is_a?(DebtTransaction) && record.customer && user.own_customers_only?
      return record.customer.assigned_user_id == user.id
    end

    true
  end
end
