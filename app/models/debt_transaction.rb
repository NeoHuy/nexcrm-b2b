class DebtTransaction < ApplicationRecord
  belongs_to :customer
  belongs_to :user

  TRANSACTION_TYPES = {
    "invoice" => "Phát sinh công nợ (Hóa đơn mới)",
    "payment" => "Thanh toán (Thu tiền)",
    "adjustment" => "Điều chỉnh công nợ"
  }.freeze

  validates :transaction_type, presence: true, inclusion: { in: TRANSACTION_TYPES.keys }
  validates :amount, numericality: { greater_than: 0 }
  validates :transaction_date, presence: true

  after_create :update_customer_debt

  private

  def update_customer_debt
    case transaction_type
    when "invoice"
      customer.update(current_debt: customer.current_debt.to_f + amount.to_f)
    when "payment"
      new_debt = [customer.current_debt.to_f - amount.to_f, 0.0].max
      customer.update(current_debt: new_debt)
    when "adjustment"
      customer.update(current_debt: amount.to_f)
    end
  end
end
