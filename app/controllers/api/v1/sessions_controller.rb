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
            message: "Chào mừng #{user.name} (#{user.role_label}) đã đăng nhập!",
            user: serialize_user(user)
          }
        else
          render json: { error: "Email hoặc mật khẩu không chính xác." }, status: :unprocessable_entity
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
                 when "sales"
                   User.find_by(role: "user", department: "sales") || User.find_by(department: "sales")
                 when "cs"
                   User.find_by(role: "user", department: "cs") || User.find_by(department: "cs")
                 when "marketing"
                   User.find_by(role: "user", department: "marketing") || User.find_by(department: "marketing")
                 else
                   User.find_by(role: role_key) || User.first
                 end
               end

        if user
          session[:user_id] = user.id
          render json: {
            message: "Đã đăng nhập nhanh với vai trò: #{user.role_label} (#{user.name})",
            user: serialize_user(user)
          }
        else
          render json: { error: "Không tìm thấy tài khoản demo." }, status: :not_found
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
            badge_class: u.role_badge_class
          }
        end
        render json: users
      end

      def destroy
        session[:user_id] = nil
        render json: { message: "Bạn đã đăng xuất thành công." }
      end

      private

      def serialize_user(user)
        customer_pol = CustomerPolicy.new(user, Customer)
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
          badge_class: user.role_badge_class,
          permissions: {
            can_create_customer: customer_pol.create?,
            can_edit_customer: customer_pol.update?,
            can_delete_customer: customer_pol.destroy?,
            can_create_debt: DebtTransactionPolicy.new(user, DebtTransaction).create?,
            can_manage_users: user_pol.index?,
            is_admin: user.admin?,
            is_sales: user.sales?,
            is_cs: user.cs?,
            is_marketing: user.marketing?
          }
        }
      end
    end
  end
end
