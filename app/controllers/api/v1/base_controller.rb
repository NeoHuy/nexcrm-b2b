module Api
  module V1
    class BaseController < ActionController::Base
      skip_forgery_protection

      before_action :set_locale
      before_action :authenticate_user!

      class NotAuthorizedError < StandardError; end
      rescue_from NotAuthorizedError, with: :user_not_authorized
      rescue_from ActiveRecord::RecordNotFound, with: :not_found

      def policy(record)
        klass_name = case record
                     when Class
                       record.name
                     when Symbol, String
                       record.to_s.camelize
                     else
                       record.class.name
                     end
        policy_class = "#{klass_name}Policy".constantize
        policy_class.new(current_user, record)
      end

      def policy_scope(scope, policy_scope_class: nil)
        scope_class = policy_scope_class || "#{scope.is_a?(Class) ? scope.name : scope.model.name}Policy::Scope".constantize
        scope_class.new(current_user, scope).resolve
      end

      def authorize(record, query = nil)
        query ||= "#{action_name}?"
        pol = policy(record)
        unless pol.public_send(query)
          raise NotAuthorizedError, localized_msg(
            vi: "Bạn không có quyền thực hiện hành động này (Theo cấu hình Policy của tài khoản).",
            en: "You are not authorized to perform this action (Policy restriction).",
            ja: "この操作を実行する権限がありません（ポリシー制限）。"
          )
        end
        true
      end

      private

      def set_locale
        requested = request.headers["X-Locale"].presence || params[:locale].presence
        I18n.locale = if requested && %w[vi en ja].include?(requested.to_s)
                        requested.to_sym
                      else
                        :vi
                      end
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
          render json: {
            error: localized_msg(
              vi: "Vui lòng đăng nhập để tiếp tục.",
              en: "Please sign in to continue.",
              ja: "続行するにはログインしてください。"
            )
          }, status: :unauthorized
        end
      end

      def user_not_authorized(exception)
        render json: {
          error: exception.message || localized_msg(
            vi: "Bạn không có quyền thực hiện hành động này (Phân quyền theo Policy).",
            en: "You are not authorized to perform this action (Policy restriction).",
            ja: "この操作を実行する権限がありません（ポリシー制限）。"
          )
        }, status: :forbidden
      end

      def not_found
        render json: {
          error: localized_msg(
            vi: "Không tìm thấy dữ liệu yêu cầu.",
            en: "Requested resource not found.",
            ja: "要求されたデータが見つかりません。"
          )
        }, status: :not_found
      end
    end
  end
end
