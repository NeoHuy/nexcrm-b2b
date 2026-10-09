class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :current_user, :logged_in?, :format_vnd

  before_action :authenticate_user!

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def logged_in?
    current_user.present?
  end

  def authenticate_user!
    unless logged_in?
      flash[:alert] = "Vui lòng đăng nhập để tiếp tục."
      redirect_to login_path
    end
  end

  def format_vnd(amount)
    return "0 đ" if amount.blank?
    formatted = amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1.').reverse
    "#{formatted} đ"
  end
end
