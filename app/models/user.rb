class User < ApplicationRecord
  has_secure_password

  ROLES = %w[sales cs marketing].freeze

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: ROLES }

  has_many :assigned_customers, class_name: "Customer", foreign_key: :assigned_user_id, dependent: :nullify
  has_many :activities, dependent: :destroy
  has_many :debt_transactions, dependent: :nullify

  def sales?
    role == "sales"
  end

  def cs?
    role == "cs"
  end

  def marketing?
    role == "marketing"
  end

  def role_label
    case role
    when "sales" then "Kinh doanh (Sales)"
    when "cs" then "Chăm sóc KH (CS)"
    when "marketing" then "Tiếp thị (Marketing)"
    else role.to_s.titleize
    end
  end

  def role_badge_class
    case role
    when "sales" then "bg-blue-100 text-blue-800 border-blue-200"
    when "cs" then "bg-emerald-100 text-emerald-800 border-emerald-200"
    when "marketing" then "bg-purple-100 text-purple-800 border-purple-200"
    else "bg-slate-100 text-slate-800 border-slate-200"
    end
  end
end
