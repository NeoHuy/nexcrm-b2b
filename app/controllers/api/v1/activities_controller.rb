module Api
  module V1
    class ActivitiesController < BaseController
      def create
        customer = Customer.find(params[:customer_id])
        activity = customer.activities.build(activity_params)
        activity.user = current_user
        activity.occurred_at ||= Time.current

        authorize activity

        if activity.save
          render json: {
            message: "Đã lưu nhật ký tương tác: #{activity.title}",
            activity: {
              id: activity.id,
              title: activity.title,
              activity_type: activity.activity_type,
              type_info: activity.type_info,
              content: activity.content,
              occurred_at: activity.occurred_at,
              next_follow_up_at: activity.next_follow_up_at,
              created_at: activity.created_at,
              user: { id: current_user.id, name: current_user.name }
            }
          }, status: :created
        else
          render json: { errors: activity.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        customer = Customer.find(params[:customer_id])
        activity = customer.activities.find(params[:id])

        authorize activity

        activity.destroy
        render json: { message: "Đã xóa nhật ký tương tác." }
      end

      private

      def activity_params
        params.require(:activity).permit(:activity_type, :title, :content, :occurred_at, :next_follow_up_at)
      end
    end
  end
end
