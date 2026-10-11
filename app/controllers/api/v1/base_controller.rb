module Api
  module V1
    class BaseController < ActionController::Base
      skip_forgery_protection

      before_action :authenticate_user!

      class NotAuthorizedError < StandardError; end
      rescue_from NotAuthorizedError, with: :user_not_authorized
      rescue_from ActiveRecord::RecordNotFound, with: :not_found

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
          render json: { error: "Vui lòng đăng nhập để tiếp tục." }, status: :unauthorized
        end
      end

      def user_not_authorized(exception)
        render json: { error: exception.message || "Bạn không có quyền thực hiện hành động này (Phân quyền theo Policy)." }, status: :forbidden
      end

      def not_found
        render json: { error: "Không tìm thấy dữ liệu yêu cầu." }, status: :not_found
      end
    end
  end
end
