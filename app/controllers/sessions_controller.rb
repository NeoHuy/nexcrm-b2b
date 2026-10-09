class SessionsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:new, :create, :demo_login]

  def new
    redirect_to dashboard_path if logged_in?
    @demo_users = User.order(:id)
  end

  def create
    user = User.find_by(email: params[:email].to_s.strip.downcase)
    if user&.authenticate(params[:password])
      session[:user_id] = user.id
      flash[:notice] = "Chào mừng #{user.name} (#{user.role_label}) đã đăng nhập!"
      redirect_to dashboard_path
    else
      flash.now[:alert] = "Email hoặc mật khẩu không chính xác."
      @demo_users = User.order(:id)
      render :new, status: :unprocessable_entity
    end
  end

  def demo_login
    role = params[:role].to_s
    user = User.find_by(role: role) || User.first
    if user
      session[:user_id] = user.id
      flash[:notice] = "Đã đăng nhập nhanh với vai trò: #{user.role_label} (#{user.name})"
      redirect_to dashboard_path
    else
      flash[:alert] = "Không tìm thấy tài khoản demo."
      redirect_to login_path
    end
  end

  def destroy
    session[:user_id] = nil
    flash[:notice] = "Bạn đã đăng xuất thành công."
    redirect_to login_path
  end
end
