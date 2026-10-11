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

  def localized_type_label
    case transaction_type
    when "invoice"
      case I18n.locale
      when :en then "New Invoice (Increase Debt)"
      when :ja then "請求書発行（売掛金計上）"
      else "Phát sinh công nợ (Hóa đơn mới)"
      end
    when "payment"
      case I18n.locale
      when :en then "Payment Received (Reduce Debt)"
      when :ja then "入金確認（売掛金消込）"
      else "Thanh toán (Thu tiền)"
      end
    when "adjustment"
      case I18n.locale
      when :en then "Balance Adjustment"
      when :ja then "残高調整"
      else "Điều chỉnh công nợ"
      end
    else
      transaction_type.to_s.humanize
    end
  end

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
