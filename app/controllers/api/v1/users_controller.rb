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

        all_users = User.all

        render json: {
          users: users_scope.map { |u| serialize_managed_user(u) },
          stats: {
            total_users: all_users.count,
            admin_count: all_users.count(&:admin?),
            sales_count: all_users.count { |u| !u.admin? && u.sales? },
            cs_count: all_users.count { |u| !u.admin? && u.cs? },
            marketing_count: all_users.count { |u| !u.admin? && u.marketing? }
          }
        }
      end

      def show
        authorize @user, :show?
        render json: { user: serialize_managed_user(@user) }
      end

      def create
        authorize User, :create?

        user = User.new(user_params)
        user.email = user.email.to_s.strip.downcase
        user.avatar_color = default_avatar_color(user.role, user.department) if user.avatar_color.blank?

        if user.save
          render json: {
            message: "Đã tạo tài khoản nhân sự #{user.name} (#{user.role_label}) thành công!",
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

        if @user.id == current_user.id && attrs["role"].present? && attrs["role"] != "admin"
          return render json: {
            error: "Bạn không thể tự hạ quyền Quản trị viên (Admin) của chính mình."
          }, status: :unprocessable_entity
        end

        if @user.admin? && attrs["role"] == "user" && User.where(role: "admin").count <= 1
          return render json: {
            error: "Hệ thống phải có ít nhất 1 Quản trị viên (Admin)."
          }, status: :unprocessable_entity
        end

        if @user.update(attrs)
          render json: {
            message: "Đã cập nhật thông tin & phân quyền cho #{@user.name}!",
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

        if params[:preset].present?
          case params[:preset].to_s
          when "admin"
            new_role = "admin"
            new_dept = "management"
          when "sales"
            new_role = "user"
            new_dept = "sales"
          when "cs"
            new_role = "user"
            new_dept = "cs"
          when "marketing"
            new_role = "user"
            new_dept = "marketing"
          end
        end

        if @user.id == current_user.id && new_role != "admin"
          return render json: {
            error: "Bạn không thể tự hạ quyền Quản trị viên (Admin) của chính mình."
          }, status: :unprocessable_entity
        end

        if @user.admin? && new_role != "admin" && User.where(role: "admin").count <= 1
          return render json: {
            error: "Hệ thống phải có ít nhất 1 Quản trị viên (Admin)."
          }, status: :unprocessable_entity
        end

        if @user.update(
          role: new_role,
          department: new_dept,
          avatar_color: default_avatar_color(new_role, new_dept)
        )
          render json: {
            message: "Đã phân quyền #{@user.name} thành: #{@user.role_label}!",
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
          return render json: { error: "Vui lòng chọn nhân sự tiếp nhận hợp lệ." }, status: :unprocessable_entity
        end

        if target_user.id == @user.id
          return render json: { error: "Nhân sự tiếp nhận phải khác nhân sự hiện tại." }, status: :unprocessable_entity
        end

        customers_count = @user.assigned_customers.count
        @user.assigned_customers.update_all(assigned_user_id: target_user.id, updated_at: Time.current)

        render json: {
          message: "Đã bàn giao #{customers_count} khách hàng B2B từ #{@user.name} sang #{target_user.name}!",
          transferred_count: customers_count
        }
      end

      def destroy
        authorize @user, :destroy?

        if @user.id == current_user.id
          return render json: { error: "Bạn không thể tự xóa tài khoản đang đăng nhập." }, status: :unprocessable_entity
        end

        if @user.admin? && User.where(role: "admin").count <= 1
          return render json: { error: "Không thể xóa Quản trị viên duy nhất của hệ thống." }, status: :unprocessable_entity
        end

        if params[:target_user_id].present?
          target = User.find_by(id: params[:target_user_id])
          if target && target.id != @user.id
            @user.assigned_customers.update_all(assigned_user_id: target.id, updated_at: Time.current)
          end
        end

        name = @user.name
        @user.destroy!
        render json: { message: "Đã xóa tài khoản nhân sự #{name} khỏi hệ thống." }
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:name, :email, :password, :role, :department, :title, :phone, :avatar_color)
      end

      def default_avatar_color(role, dept)
        return "rose" if role == "admin"
        case dept
        when "sales" then "blue"
        when "cs" then "emerald"
        when "marketing" then "purple"
        else "indigo"
        end
      end

      def serialize_managed_user(user)
        customer_pol = CustomerPolicy.new(user, Customer)
        debt_pol = DebtTransactionPolicy.new(user, DebtTransaction)
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
            can_create_customer: customer_pol.create?,
            can_edit_customer: customer_pol.update?,
            can_delete_customer: customer_pol.destroy?,
            can_create_debt: debt_pol.create?,
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
