class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :current_user, :logged_in?, :format_vnd, :policy

  around_action :switch_locale
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
      raise NotAuthorizedError, localized_msg(
        vi: "Bạn không có quyền thực hiện hành động này.",
        en: "You are not authorized to perform this action.",
        ja: "この操作を実行する権限がありません。"
      )
    end
    true
  end

  private

  def switch_locale(&action)
    if params[:locale].present? && %w[vi en ja].include?(params[:locale].to_s.downcase)
      session[:locale] = params[:locale].to_s.downcase.to_sym
    end
    locale = session[:locale] || :vi
    I18n.with_locale(locale, &action)
  end

  def localized_msg(vi:, en:, ja:)
    case I18n.locale
    when :en then en
    when :ja then ja
    else vi
    end
  end

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def logged_in?
    current_user.present?
  end

  def authenticate_user!
    unless logged_in?
      flash[:alert] = localized_msg(
        vi: "Vui lòng đăng nhập để tiếp tục.",
        en: "Please sign in to continue.",
        ja: "続行するにはログインしてください。"
      )
      redirect_to login_path
    end
  end

  def user_not_authorized(exception)
    flash[:alert] = exception.message || localized_msg(
      vi: "Bạn không có quyền thực hiện hành động này (Phân quyền theo Policy).",
      en: "You are not authorized to perform this action (Policy RBAC).",
      ja: "この操作を実行する権限がありません（Policy権限）。"
    )
    redirect_back fallback_location: root_path
  end

  def format_vnd(amount)
    suffix = I18n.locale == :vi ? " đ" : " VND"
    return "0#{suffix}" if amount.blank?
    sep = I18n.locale == :vi ? "." : ","
    formatted = amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, "\\1#{sep}").reverse
    "#{formatted}#{suffix}"
  end
end
