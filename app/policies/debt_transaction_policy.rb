class DebtTransactionPolicy < ApplicationPolicy
  # Ghi nhận giao dịch công nợ (hóa đơn, thu tiền, điều chỉnh nợ):
  # Chỉ Admin hoặc nhân viên bộ phận CS / Tài chính
  def create?
    return true if user.admin?
    user.cs?
  end
end
