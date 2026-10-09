class Customer < ApplicationRecord
  belongs_to :assigned_user, class_name: "User", optional: true
  has_many :activities, -> { order(occurred_at: :desc) }, dependent: :destroy
  has_many :debt_transactions, -> { order(transaction_date: :desc) }, dependent: :destroy

  STATUSES = {
    "lead" => "Tiềm năng (Lead)",
    "prospect" => "Đang đàm phán",
    "active" => "Đang hợp tác",
    "at_risk" => "Nguy cơ rủi ro",
    "inactive" => "Ngưng hợp tác"
  }.freeze

  TIERS = {
    "standard" => "Tiêu chuẩn",
    "silver" => "Bạc (Silver)",
    "gold" => "Vàng (Gold)",
    "vip" => "Doanh nghiệp VIP"
  }.freeze

  INDUSTRIES = [
    "Công nghệ & Phần mềm",
    "Thương mại điện tử & Bán lẻ",
    "Sản xuất & Chế tạo",
    "Logistics & Vận tải",
    "Tài chính & FinTech",
    "Y tế & Dược phẩm",
    "Xây dựng & Bất động sản",
    "Giáo dục & Đào tạo",
    "Khách sạn & F&B"
  ].freeze

  LEAD_SOURCES = [
    "Website / Đăng ký trực tiếp",
    "Giới thiệu (Referral)",
    "Hội thảo / Triển lãm ngành",
    "Quảng cáo số (Google/LinkedIn)",
    "Đội ngũ Sales tiếp cận (Outbound)",
    "Đối tác chiến lược"
  ].freeze

  validates :company_name, presence: true
  validates :current_debt, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :credit_limit, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :total_revenue, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Scopes
  scope :search, ->(query) {
    if query.present?
      q = "%#{query.strip.downcase}%"
      where(
        "LOWER(company_name) LIKE ? OR LOWER(tax_code) LIKE ? OR LOWER(contact_name) LIKE ? OR LOWER(contact_phone) LIKE ? OR LOWER(contact_email) LIKE ?",
        q, q, q, q, q
      )
    end
  }

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_industry, ->(industry) { where(industry: industry) if industry.present? }
  scope :by_assigned_user, ->(user_id) { where(assigned_user_id: user_id) if user_id.present? }

  scope :with_debt, -> { where("current_debt > 0") }
  scope :overdue_debts, -> { where("current_debt > 0 AND payment_due_date < ?", Date.current) }
  scope :due_soon_debts, -> { where("current_debt > 0 AND payment_due_date >= ? AND payment_due_date <= ?", Date.current, Date.current + 7.days) }

  def overdue?
    current_debt.to_f > 0 && payment_due_date.present? && payment_due_date < Date.current
  end

  def due_soon?
    current_debt.to_f > 0 && payment_due_date.present? && payment_due_date >= Date.current && payment_due_date <= (Date.current + 7.days)
  end

  def days_overdue
    return 0 unless overdue?
    (Date.current - payment_due_date).to_i
  end

  def debt_status
    if current_debt.to_f <= 0
      :settled
    elsif overdue?
      :overdue
    elsif due_soon?
      :due_soon
    else
      :in_term
    end
  end

  def debt_badge
    case debt_status
    when :overdue
      { label: "Quá hạn #{days_overdue} ngày", class: "bg-red-100 text-red-800 border-red-200" }
    when :due_soon
      { label: "Sắp đến hạn", class: "bg-amber-100 text-amber-800 border-amber-200" }
    when :in_term
      { label: "Trong hạn", class: "bg-blue-100 text-blue-800 border-blue-200" }
    when :settled
      { label: "Đã tất toán", class: "bg-slate-100 text-slate-600 border-slate-200" }
    end
  end

  def status_badge
    case status
    when "lead"
      { label: "Tiềm năng", class: "bg-sky-100 text-sky-800 border-sky-200" }
    when "prospect"
      { label: "Đang đàm phán", class: "bg-indigo-100 text-indigo-800 border-indigo-200" }
    when "active"
      { label: "Đang hợp tác", class: "bg-emerald-100 text-emerald-800 border-emerald-200" }
    when "at_risk"
      { label: "Cảnh báo rủi ro", class: "bg-orange-100 text-orange-800 border-orange-200" }
    when "inactive"
      { label: "Ngưng hợp tác", class: "bg-gray-100 text-gray-700 border-gray-200" }
    else
      { label: status.to_s.humanize, class: "bg-gray-100 text-gray-700 border-gray-200" }
    end
  end

  def tier_badge
    case tier
    when "vip"
      { label: "VIP Doanh nghiệp", class: "bg-purple-100 text-purple-800 border-purple-200 font-semibold" }
    when "gold"
      { label: "Vàng (Gold)", class: "bg-yellow-100 text-yellow-800 border-yellow-200 font-semibold" }
    when "silver"
      { label: "Bạc (Silver)", class: "bg-slate-200 text-slate-800 border-slate-300" }
    else
      { label: "Tiêu chuẩn", class: "bg-gray-100 text-gray-600 border-gray-200" }
    end
  end

  def credit_utilization
    return 0 if credit_limit.to_f.zero?
    [((current_debt.to_f / credit_limit.to_f) * 100).round(1), 100.0].min
  end
end
