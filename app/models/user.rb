class User < ApplicationRecord
  has_secure_password

  ROLES = %w[admin user].freeze
  DEPARTMENTS = %w[sales cs marketing management].freeze

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: ROLES }

  has_many :assigned_customers, class_name: "Customer", foreign_key: :assigned_user_id, dependent: :nullify
  has_many :activities, dependent: :destroy
  has_many :debt_transactions, dependent: :nullify

  def admin?
    role == "admin"
  end

  def user?
    role == "user"
  end

  def sales?
    department == "sales"
  end

  def cs?
    department == "cs"
  end

  def marketing?
    department == "marketing"
  end

  def role_label
    if admin?
      "Quản trị viên (Admin)"
    elsif sales?
      "Kinh doanh (Sales)"
    elsif cs?
      "Chăm sóc KH (CS)"
    elsif marketing?
      "Tiếp thị (Marketing)"
    else
      "Nhân viên (User)"
    end
  end

  def role_badge_class
    if admin?
      "bg-rose-100 text-rose-800 border-rose-200 font-bold"
    elsif sales?
      "bg-blue-100 text-blue-800 border-blue-200"
    elsif cs?
      "bg-emerald-100 text-emerald-800 border-emerald-200"
    elsif marketing?
      "bg-purple-100 text-purple-800 border-purple-200"
    else
      "bg-slate-100 text-slate-800 border-slate-200"
    end
  end
end
