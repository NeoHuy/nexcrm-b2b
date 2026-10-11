module Api
  module V1
    class SessionsController < BaseController
      skip_before_action :authenticate_user!, only: [:create, :demo_login, :demo_users, :me]

      def me
        if logged_in?
          render json: {
            authenticated: true,
            user: serialize_user(current_user)
          }
        else
          render json: { authenticated: false, user: nil }
        end
      end

      def create
        user = User.find_by(email: params[:email].to_s.strip.downcase)
        if user&.authenticate(params[:password])
          session[:user_id] = user.id
          render json: {
            message: localized_msg(
              vi: "Chào mừng #{user.name} (Role: #{user.role_label} - #{user.policy_label}) đã đăng nhập!",
              en: "Welcome back, #{user.name} (Role: #{user.role_label} - #{user.policy_label})!",
              ja: "ようこそ、#{user.name} さん（Role: #{user.role_label} - #{user.policy_label}）！"
            ),
            user: serialize_user(user)
          }
        else
          render json: {
            error: localized_msg(
              vi: "Email hoặc mật khẩu không chính xác.",
              en: "Invalid email or password.",
              ja: "メールアドレスまたはパスワードが正しくありません。"
            )
          }, status: :unprocessable_entity
        end
      end

      def demo_login
        role_key = params[:role].to_s
        user = if params[:user_id].present?
                 User.find_by(id: params[:user_id])
               else
                 case role_key
                 when "admin"
                   User.find_by(role: "admin")
                 when "sales", "sales_policy"
                   User.where(role: "user").find { |u| u.resolved_policy_code == "sales_policy" } || User.find_by(role: "user", department: "sales")
                 when "cs", "cs_debt_policy"
                   User.where(role: "user").find { |u| u.resolved_policy_code == "cs_debt_policy" } || User.find_by(role: "user", department: "cs")
                 when "marketing", "marketing_policy"
                   User.where(role: "user").find { |u| u.resolved_policy_code == "marketing_policy" } || User.find_by(role: "user", department: "marketing")
                 when "user"
                   User.find_by(role: "user")
                 else
                   User.find_by(role: role_key) || User.first
                 end
               end

        if user
          session[:user_id] = user.id
          render json: {
            message: localized_msg(
              vi: "Đã chuyển sang tài khoản #{user.name} (Role: #{user.role_label} • #{user.policy_label})",
              en: "Switched to account #{user.name} (Role: #{user.role_label} • #{user.policy_label})",
              ja: "アカウントを切り替えました: #{user.name} (Role: #{user.role_label} • #{user.policy_label})"
            ),
            user: serialize_user(user)
          }
        else
          render json: {
            error: localized_msg(
              vi: "Không tìm thấy tài khoản demo.",
              en: "Demo account not found.",
              ja: "デモアカウントが見つかりません。"
            )
          }, status: :not_found
        end
      end

      def demo_users
        users = User.order(:id).map do |u|
          {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department,
            role_label: u.role_label,
            policy_code: u.resolved_policy_code,
            policy_label: u.policy_label,
            badge_class: u.role_badge_class,
            policy_badge_class: u.policy_badge_class
          }
        end
        render json: users
      end

      def destroy
        session[:user_id] = nil
        render json: {
          message: localized_msg(
            vi: "Bạn đã đăng xuất thành công.",
            en: "You have signed out successfully.",
            ja: "ログアウトしました。"
          )
        }
      end

      private

      def serialize_user(user)
        customer_pol = CustomerPolicy.new(user, Customer)
        debt_pol = DebtPolicy.new(user, :debt)
        debt_tx_pol = DebtTransactionPolicy.new(user, DebtTransaction)
        activity_pol = ActivityPolicy.new(user, Activity)
        user_pol = UserPolicy.new(user, User)

        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          department_label: user.department_label,
          title: user.title,
          phone: user.phone,
          avatar_color: user.avatar_color,
          role_label: user.role_label,
          policy_code: user.resolved_policy_code,
          policy_label: user.policy_label,
          badge_class: user.role_badge_class,
          policy_badge_class: user.policy_badge_class,
          policy_permissions: user.effective_policy_permissions,
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
