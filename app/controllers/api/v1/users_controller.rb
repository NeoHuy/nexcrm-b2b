module Api
  module V1
    class UsersController < BaseController
      before_action :set_user, only: [:show, :update, :update_role, :reassign_customers, :destroy]

      def index
        authorize User, :index?

        users_scope = User.includes(:assigned_customers, :activities).order(
          Arel.sql("CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id ASC")
        )

        if params[:q].present?
          q = "%#{params[:q].strip.downcase}%"
          users_scope = users_scope.where(
            "LOWER(name) LIKE :q OR LOWER(email) LIKE :q OR LOWER(COALESCE(title, '')) LIKE :q OR LOWER(COALESCE(phone, '')) LIKE :q",
            q: q
          )
        end

        if params[:role].present?
          users_scope = users_scope.where(role: params[:role])
        end

        if params[:department].present?
          users_scope = users_scope.where(department: params[:department])
        end

        users_list = users_scope.to_a
        if params[:policy_code].present?
          users_list = users_list.select { |u| u.resolved_policy_code == params[:policy_code] }
        end

        all_users = User.all.to_a

        render json: {
          users: users_list.map { |u| serialize_managed_user(u) },
          stats: {
            total_users: all_users.count,
            admin_count: all_users.count(&:admin?),
            user_count: all_users.count(&:user?),
            sales_count: all_users.count { |u| u.user? && u.resolved_policy_code == "sales_policy" },
            cs_count: all_users.count { |u| u.user? && u.resolved_policy_code == "cs_debt_policy" },
            marketing_count: all_users.count { |u| u.user? && u.resolved_policy_code == "marketing_policy" }
          }
        }
      end

      def show
        authorize @user, :show?
        render json: { user: serialize_managed_user(@user) }
      end

      def create
        authorize User, :create?

        attrs = user_params.to_h
        policy_code_param = attrs.delete("policy_code") || params.dig(:user, :policy_code)
        policy_perms_param = params.dig(:user, :policy_permissions)

        user = User.new(attrs)
        user.email = user.email.to_s.strip.downcase
        user.role = "user" unless User::ROLES.include?(user.role)
        user.apply_policy!(
          policy_code_param: policy_code_param,
          permissions_param: policy_perms_param
        )
        user.avatar_color = default_avatar_color(user.role, user.resolved_policy_code) if user.avatar_color.blank?

        if user.save
          render json: {
            message: localized_msg(
              vi: "Đã tạo tài khoản #{user.name} (Role: #{user.role_label} • #{user.policy_label}) thành công!",
              en: "Created account #{user.name} (Role: #{user.role_label} • #{user.policy_label}) successfully!",
              ja: "アカウント「#{user.name}」（Role: #{user.role_label} • #{user.policy_label}）を作成しました！"
            ),
            user: serialize_managed_user(user)
          }, status: :created
        else
          render json: { error: user.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      def update
        authorize @user, :update?

        attrs = user_params.to_h
        attrs.delete("password") if attrs["password"].blank?
        attrs["email"] = attrs["email"].to_s.strip.downcase if attrs["email"].present?
        policy_code_param = attrs.delete("policy_code") || params.dig(:user, :policy_code)
        policy_perms_param = params.dig(:user, :policy_permissions)

        if @user.id == current_user.id && attrs["role"].present? && attrs["role"] != "admin"
          return render json: {
            error: localized_msg(
              vi: "Bạn không thể tự hạ quyền Admin của chính mình.",
              en: "You cannot demote your own Admin account.",
              ja: "自分自身の管理者権限を降格することはできません。"
            )
          }, status: :unprocessable_entity
        end

        if @user.admin? && attrs["role"] == "user" && User.where(role: "admin").count <= 1
          return render json: {
            error: localized_msg(
              vi: "Hệ thống phải có ít nhất 1 Admin.",
              en: "The system must have at least one Admin.",
              ja: "システムには少なくとも1人の管理者が必要です。"
            )
          }, status: :unprocessable_entity
        end

        @user.assign_attributes(attrs)
        @user.apply_policy!(
          policy_code_param: policy_code_param,
          permissions_param: policy_perms_param
        )
        @user.avatar_color = default_avatar_color(@user.role, @user.resolved_policy_code)

        if @user.save
          render json: {
            message: localized_msg(
              vi: "Đã cập nhật thông tin & Policy cho #{@user.name} (Role: #{@user.role_label} • #{@user.policy_label})!",
              en: "Updated profile & Policy for #{@user.name} (Role: #{@user.role_label} • #{@user.policy_label})!",
              ja: "「#{@user.name}」のプロフィールとポリシーを更新しました！"
            ),
            user: serialize_managed_user(@user)
          }
        else
          render json: { error: @user.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      def update_role
        authorize @user, :update_role?

        new_role = params[:role].presence || @user.role
        new_dept = params[:department].presence || @user.department
        policy_code_param = params[:policy_code].presence || params[:preset].presence
        policy_perms_param = params[:policy_permissions]

        if policy_code_param.present?
          case policy_code_param.to_s
          when "admin", "admin_all"
            new_role = "admin"
            new_dept = "management"
          when "sales", "sales_policy"
            new_role = "user"
            new_dept = "sales"
            policy_code_param = "sales_policy"
          when "cs", "cs_debt_policy"
            new_role = "user"
            new_dept = "cs"
            policy_code_param = "cs_debt_policy"
          when "marketing", "marketing_policy"
            new_role = "user"
            new_dept = "marketing"
            policy_code_param = "marketing_policy"
          when "full_user_policy", "readonly_policy", "custom", "no_access"
            new_role = "user"
          end
        end

        if @user.id == current_user.id && new_role != "admin"
          return render json: {
            error: localized_msg(
              vi: "Bạn không thể tự hạ quyền Admin của chính mình.",
              en: "You cannot demote your own Admin account.",
              ja: "自分自身の管理者権限を降格することはできません。"
            )
          }, status: :unprocessable_entity
        end

        if @user.admin? && new_role != "admin" && User.where(role: "admin").count <= 1
          return render json: {
            error: localized_msg(
              vi: "Hệ thống phải có ít nhất 1 Admin.",
              en: "The system must have at least one Admin.",
              ja: "システムには少なくとも1人の管理者が必要です。"
            )
          }, status: :unprocessable_entity
        end

        @user.role = new_role
        @user.department = new_dept
        @user.apply_policy!(
          policy_code_param: policy_code_param,
          permissions_param: policy_perms_param
        )
        @user.avatar_color = default_avatar_color(@user.role, @user.resolved_policy_code)

        if @user.save
          render json: {
            message: localized_msg(
              vi: "Đã cập nhật #{@user.name} -> Role: #{@user.role_label} (#{@user.policy_label})!",
              en: "Updated #{@user.name} -> Role: #{@user.role_label} (#{@user.policy_label})!",
              ja: "「#{@user.name}」の権限を Role: #{@user.role_label}（#{@user.policy_label}）に変更しました！"
            ),
            user: serialize_managed_user(@user)
          }
        else
          render json: { error: @user.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      def reassign_customers
        authorize @user, :reassign_customers?

        target_user = User.find_by(id: params[:target_user_id])
        unless target_user
          return render json: {
            error: localized_msg(
              vi: "Vui lòng chọn nhân sự tiếp nhận hợp lệ.",
              en: "Please select a valid recipient staff member.",
              ja: "有効な引き継ぎ先の担当者を選択してください。"
            )
          }, status: :unprocessable_entity
        end

        if target_user.id == @user.id
          return render json: {
            error: localized_msg(
              vi: "Nhân sự tiếp nhận phải khác nhân sự hiện tại.",
              en: "Recipient must be different from the current owner.",
              ja: "引き継ぎ先は現在の担当者とは別の社員を選択してください。"
            )
          }, status: :unprocessable_entity
        end

        customers_count = @user.assigned_customers.count
        @user.assigned_customers.update_all(assigned_user_id: target_user.id, updated_at: Time.current)

        render json: {
          message: localized_msg(
            vi: "Đã bàn giao #{customers_count} khách hàng B2B từ #{@user.name} sang #{target_user.name}!",
            en: "Transferred #{customers_count} B2B accounts from #{@user.name} to #{target_user.name}!",
            ja: "法人顧客 #{customers_count} 社を「#{@user.name}」から「#{target_user.name}」へ引き継ぎました！"
          ),
          transferred_count: customers_count
        }
      end

      def destroy
        authorize @user, :destroy?

        if @user.id == current_user.id
          return render json: {
            error: localized_msg(
              vi: "Bạn không thể tự xóa tài khoản đang đăng nhập.",
              en: "You cannot delete your own active account.",
              ja: "現在ログイン中の自身のアカウントは削除できません。"
            )
          }, status: :unprocessable_entity
        end

        if @user.admin? && User.where(role: "admin").count <= 1
          return render json: {
            error: localized_msg(
              vi: "Không thể xóa Admin duy nhất của hệ thống.",
              en: "Cannot delete the only Admin in the system.",
              ja: "システム唯一の管理者は削除できません。"
            )
          }, status: :unprocessable_entity
        end

        if params[:target_user_id].present?
          target = User.find_by(id: params[:target_user_id])
          if target && target.id != @user.id
            @user.assigned_customers.update_all(assigned_user_id: target.id, updated_at: Time.current)
          end
        end

        name = @user.name
        @user.destroy!
        render json: {
          message: localized_msg(
            vi: "Đã xóa tài khoản nhân sự #{name} khỏi hệ thống.",
            en: "Deleted staff account #{name} from the system.",
            ja: "社員アカウント「#{name}」を削除しました。"
          )
        }
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:name, :email, :password, :role, :department, :title, :phone, :avatar_color, :policy_code)
      end

      def default_avatar_color(role, policy_code)
        return "rose" if role == "admin"
        case policy_code
        when "sales_policy" then "blue"
        when "cs_debt_policy" then "emerald"
        when "marketing_policy" then "purple"
        when "full_user_policy" then "amber"
        when "no_access" then "slate"
        else "indigo"
        end
      end

      def serialize_managed_user(user)
        customer_pol = CustomerPolicy.new(user, Customer)
        debt_pol = DebtPolicy.new(user, :debt)
        debt_tx_pol = DebtTransactionPolicy.new(user, DebtTransaction)
        activity_pol = ActivityPolicy.new(user, Activity)
        user_pol = UserPolicy.new(user, User)
        assigned = user.assigned_customers

        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          department_label: user.department_label,
          role_preset: user.role_preset,
          policy_code: user.has_any_policy_permission? ? user.resolved_policy_code : "no_access",
          policy_label: user.policy_label,
          policy_badge_class: user.policy_badge_class,
          policy_permissions: user.effective_policy_permissions,
          title: user.title,
          phone: user.phone,
          avatar_color: user.avatar_color,
          role_label: user.role_label,
          badge_class: user.role_badge_class,
          customers_count: assigned.size,
          total_managed_debt: assigned.sum { |c| c.current_debt.to_f },
          total_managed_revenue: assigned.sum { |c| c.total_revenue.to_f },
          activities_count: user.activities.size,
          is_current_user: user.id == current_user&.id,
          created_at: user.created_at,
          updated_at: user.updated_at,
          permissions: {
            has_any_permission: user.has_any_policy_permission?,
            can_view_customer: customer_pol.index?,
            can_create_customer: customer_pol.create?,
            can_edit_customer: customer_pol.update?,
            can_delete_customer: customer_pol.destroy?,
            can_view_debt: debt_pol.index?,
            can_create_debt: debt_tx_pol.create?,
            can_create_activity: activity_pol.create?,
            can_delete_activity: activity_pol.destroy?,
            own_customers_only: user.own_customers_only?,
            can_manage_users: user_pol.index?,
            is_admin: user.admin?,
            is_user: user.user?,
            is_sales: user.sales?,
            is_cs: user.cs?,
            is_marketing: user.marketing?
          }
        }
      end
    end
  end
end
