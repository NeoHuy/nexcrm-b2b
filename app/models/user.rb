class User < ApplicationRecord
  has_secure_password

  # Hệ thống chỉ có duy nhất 2 roles: admin và user
  ROLES = %w[admin user].freeze
  DEPARTMENTS = %w[sales cs marketing management].freeze

  PERMISSION_KEYS = %w[
    customer_view
    customer_create
    customer_update
    customer_delete
    debt_view
    debt_create
    activity_create
    activity_delete
    own_customers_only
  ].freeze

  ADMIN_PERMISSIONS = {
    "customer_view" => true,
    "customer_create" => true,
    "customer_update" => true,
    "customer_delete" => true,
    "debt_view" => true,
    "debt_create" => true,
    "activity_create" => true,
    "activity_delete" => true,
    "own_customers_only" => false
  }.freeze

  NO_ACCESS_PERMISSIONS = {
    "customer_view" => false,
    "customer_create" => false,
    "customer_update" => false,
    "customer_delete" => false,
    "debt_view" => false,
    "debt_create" => false,
    "activity_create" => false,
    "activity_delete" => false,
    "own_customers_only" => true
  }.freeze

  POLICY_PRESETS = {
    "no_access" => {
      label: "Chưa cấp quyền (Không có quyền truy cập)",
      label_en: "No Access (Unassigned Policy)",
      label_ja: "権限未設定（アクセス不可）",
      description: "Tài khoản chưa được thiết lập Policy. User sẽ không thể sử dụng bất kỳ tính năng nào.",
      permissions: NO_ACCESS_PERMISSIONS
    },
    "sales_policy" => {
      label: "Policy Kinh doanh (Sales)",
      label_en: "Sales Policy",
      label_ja: "営業ポリシー (Sales)",
      description: "Xem, tạo và sửa khách hàng phụ trách; xem công nợ; ghi nhật ký tương tác.",
      permissions: {
        "customer_view" => true,
        "customer_create" => true,
        "customer_update" => true,
        "customer_delete" => false,
        "debt_view" => true,
        "debt_create" => false,
        "activity_create" => true,
        "activity_delete" => false,
        "own_customers_only" => true
      }
    },
    "cs_debt_policy" => {
      label: "Policy Công nợ & CSKH",
      label_en: "Receivables & CS Policy",
      label_ja: "債権・CSポリシー",
      description: "Xem & cập nhật toàn bộ khách hàng, tạo hóa đơn & thu nợ, ghi nhật ký CSKH.",
      permissions: {
        "customer_view" => true,
        "customer_create" => false,
        "customer_update" => true,
        "customer_delete" => false,
        "debt_view" => true,
        "debt_create" => true,
        "activity_create" => true,
        "activity_delete" => false,
        "own_customers_only" => false
      }
    },
    "marketing_policy" => {
      label: "Policy Tiếp thị (Lead)",
      label_en: "Marketing Lead Policy",
      label_ja: "マーケティングポリシー",
      description: "Xem danh sách khách hàng, tạo Lead mới và ghi chú; không truy cập sổ công nợ.",
      permissions: {
        "customer_view" => true,
        "customer_create" => true,
        "customer_update" => false,
        "customer_delete" => false,
        "debt_view" => false,
        "debt_create" => false,
        "activity_create" => true,
        "activity_delete" => false,
        "own_customers_only" => false
      }
    },
    "full_user_policy" => {
      label: "Policy Nhân viên Toàn diện",
      label_en: "Full Staff Policy",
      label_ja: "標準総合ポリシー",
      description: "Truy cập đầy đủ nghiệp vụ Khách hàng, Công nợ và Nhật ký (trừ quyền Quản trị Nhân sự).",
      permissions: {
        "customer_view" => true,
        "customer_create" => true,
        "customer_update" => true,
        "customer_delete" => false,
        "debt_view" => true,
        "debt_create" => true,
        "activity_create" => true,
        "activity_delete" => true,
        "own_customers_only" => false
      }
    },
    "readonly_policy" => {
      label: "Policy Chỉ xem (Read-Only)",
      label_en: "Read-Only Policy",
      label_ja: "閲覧専用ポリシー",
      description: "Chỉ xem danh sách khách hàng và công nợ, không được thêm/sửa/xóa dữ liệu.",
      permissions: {
        "customer_view" => true,
        "customer_create" => false,
        "customer_update" => false,
        "customer_delete" => false,
        "debt_view" => true,
        "debt_create" => false,
        "activity_create" => false,
        "activity_delete" => false,
        "own_customers_only" => false
      }
    },
    "custom" => {
      label: "Policy Tùy chỉnh (Custom)",
      label_en: "Custom Policy",
      label_ja: "カスタムポリシー",
      description: "Tùy chỉnh chi tiết từng quyền truy xuất tính năng và phạm vi dữ liệu cho User.",
      permissions: {}
    }
  }.freeze

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: ROLES }

  has_many :assigned_customers, class_name: "Customer", foreign_key: :assigned_user_id, dependent: :nullify
  has_many :activities, dependent: :destroy
  has_many :debt_transactions, dependent: :nullify

  before_save :normalize_role_and_policy

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

  def resolved_policy_code
    return "admin_all" if admin?

    code = has_attribute?(:policy_code) ? self[:policy_code].to_s : ""
    return code if POLICY_PRESETS.key?(code)

    "no_access"
  end

  def effective_policy_permissions
    return ADMIN_PERMISSIONS.dup if admin?

    code = resolved_policy_code
    base = POLICY_PRESETS.dig(code, :permissions)
    base = NO_ACCESS_PERMISSIONS if base.blank?

    stored = if has_attribute?(:policy_permissions) && self[:policy_permissions].is_a?(Hash)
               self[:policy_permissions].transform_keys(&:to_s)
             else
               {}
             end

    PERMISSION_KEYS.each_with_object({}) do |key, result|
      if stored.key?(key)
        result[key] = ActiveModel::Type::Boolean.new.cast(stored[key])
      else
        result[key] = ActiveModel::Type::Boolean.new.cast(base[key])
      end
    end
  end

  def has_policy_permission?(key)
    key_str = key.to_s
    if admin?
      return false if key_str == "own_customers_only"
      return true
    end

    effective_policy_permissions[key_str] == true
  end

  def has_any_policy_permission?
    return true if admin?

    perms = effective_policy_permissions
    %w[
      customer_view
      customer_create
      customer_update
      customer_delete
      debt_view
      debt_create
      activity_create
      activity_delete
    ].any? { |k| perms[k] == true }
  end

  def own_customers_only?
    return false if admin?
    has_policy_permission?(:own_customers_only)
  end

  def apply_policy!(policy_code_param: nil, permissions_param: nil)
    if admin?
      self[:policy_code] = "admin_all" if has_attribute?(:policy_code)
      self[:policy_permissions] = ADMIN_PERMISSIONS.dup if has_attribute?(:policy_permissions)
      return
    end

    normalized_code = if policy_code_param.present?
                        normalize_preset_code(policy_code_param)
                      elsif new_record?
                        "no_access"
                      else
                        resolved_policy_code
                      end
    preset_perms = POLICY_PRESETS.dig(normalized_code, :permissions) || {}

    merged_perms = effective_policy_permissions
    if preset_perms.present? && normalized_code != "custom"
      merged_perms = preset_perms.dup
    end

    if permissions_param.is_a?(Hash) || permissions_param.is_a?(ActionController::Parameters)
      raw_hash = permissions_param.to_unsafe_h if permissions_param.respond_to?(:to_unsafe_h)
      raw_hash ||= permissions_param.to_h
      raw_hash.each do |k, v|
        k_str = k.to_s
        next unless PERMISSION_KEYS.include?(k_str)
        merged_perms[k_str] = ActiveModel::Type::Boolean.new.cast(v)
      end

      capability_keys = PERMISSION_KEYS - ["own_customers_only"]
      if capability_keys.none? { |k| merged_perms[k] == true }
        normalized_code = "no_access"
        merged_perms["own_customers_only"] = true if merged_perms["own_customers_only"].nil?
      else
        matched_preset = POLICY_PRESETS.find do |preset_key, cfg|
          preset_key != "custom" && preset_key != "no_access" && cfg[:permissions] == merged_perms
        end&.first

        normalized_code = matched_preset || "custom"
      end
    end

    self[:policy_code] = normalized_code if has_attribute?(:policy_code)
    self[:policy_permissions] = merged_perms if has_attribute?(:policy_permissions)
  end

  def role_label
    admin? ? "Admin" : "User"
  end

  def policy_label
    locale = I18n.locale
    if admin?
      return case locale
             when :en then "Full System Access (Admin)"
             when :ja then "全権限 (Admin)"
             else "Toàn quyền hệ thống (Admin)"
             end
    end

    code = has_any_policy_permission? ? resolved_policy_code : "no_access"
    preset = POLICY_PRESETS[code] || POLICY_PRESETS["custom"]
    case locale
    when :en then preset[:label_en] || preset[:label]
    when :ja then preset[:label_ja] || preset[:label]
    else preset[:label]
    end
  end

  def department_label
    locale = I18n.locale
    case department
    when "management"
      case locale
      when :en then "Executive Management"
      when :ja then "経営管理本部"
      else "Ban Quản trị / Giám đốc"
      end
    when "sales"
      case locale
      when :en then "Sales Department"
      when :ja then "法人営業部 (Sales)"
      else "Phòng Kinh doanh (Sales)"
      end
    when "cs"
      case locale
      when :en then "Customer Success & Receivables"
      when :ja then "CS・債権管理部"
      else "Phòng CS & Quản lý Công nợ"
      end
    when "marketing"
      case locale
      when :en then "Marketing Department"
      when :ja then "マーケティング部"
      else "Phòng Tiếp thị (Marketing)"
      end
    else
      case locale
      when :en then "Staff"
      when :ja then "一般社員"
      else "Nhân viên Hệ thống"
      end
    end
  end

  def role_preset
    has_any_policy_permission? ? resolved_policy_code : "no_access"
  end

  def role_badge_class
    if admin?
      "bg-rose-100 text-rose-800 border-rose-200 font-bold"
    else
      "bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold"
    end
  end

  def policy_badge_class
    return "bg-rose-100 text-rose-800 border-rose-200 font-bold" if admin?
    return "bg-red-100 text-red-800 border-red-300 font-semibold" unless has_any_policy_permission?

    case resolved_policy_code
    when "sales_policy"
      "bg-blue-100 text-blue-800 border-blue-200"
    when "cs_debt_policy"
      "bg-emerald-100 text-emerald-800 border-emerald-200"
    when "marketing_policy"
      "bg-purple-100 text-purple-800 border-purple-200"
    when "full_user_policy"
      "bg-amber-100 text-amber-800 border-amber-200"
    when "readonly_policy"
      "bg-slate-100 text-slate-700 border-slate-200"
    else
      "bg-cyan-100 text-cyan-800 border-cyan-200"
    end
  end

  private

  def normalize_preset_code(code)
    case code.to_s
    when "admin", "admin_all"
      "admin_all"
    when "no_access", "none", ""
      "no_access"
    when "sales", "sales_policy"
      "sales_policy"
    when "cs", "cs_debt_policy"
      "cs_debt_policy"
    when "marketing", "marketing_policy"
      "marketing_policy"
    when "full_user_policy"
      "full_user_policy"
    when "readonly_policy"
      "readonly_policy"
    when "custom"
      "custom"
    else
      "no_access"
    end
  end

  def normalize_role_and_policy
    self.role = "user" unless ROLES.include?(role)

    if admin?
      self[:policy_code] = "admin_all" if has_attribute?(:policy_code)
      self[:policy_permissions] = ADMIN_PERMISSIONS.dup if has_attribute?(:policy_permissions)
    else
      if has_attribute?(:policy_code) && (self[:policy_code].blank? || self[:policy_code] == "admin_all")
        self[:policy_code] = "no_access"
      end
      if has_attribute?(:policy_permissions) && self[:policy_permissions].blank?
        self[:policy_permissions] = effective_policy_permissions
      end
    end
  end
end
