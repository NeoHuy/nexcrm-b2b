class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :current_user, :logged_in?, :format_vnd, :policy

  before_action :authenticate_user!

  class NotAuthorizedError < StandardError; end
  rescue_from NotAuthorizedError, with: :user_not_authorized

  def policy(record)
    policy_class = "#{record.is_a?(Class) ? record : record.class}Policy".constantize
    policy_class.new(current_user, record)
  end

  def authorize(record, query = nil)
    query ||= "#{action_name}?"
    pol = policy(record)
    unless pol.public_send(query)
      raise NotAuthorizedError, "Bạn không có quyền thực hiện hành động này."
    end
    true
  end

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

  def user_not_authorized(exception)
    flash[:alert] = exception.message || "Bạn không có quyền thực hiện hành động này (Phân quyền theo Policy)."
    redirect_back fallback_location: root_path
  end

  def format_vnd(amount)
    return "0 đ" if amount.blank?
    formatted = amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1.').reverse
    "#{formatted} đ"
  end
end
