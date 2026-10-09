class ActivitiesController < ApplicationController
  def create
    @customer = Customer.find(params[:customer_id])
    @activity = @customer.activities.build(activity_params)
    @activity.user = current_user
    @activity.occurred_at ||= Time.current

    if @activity.save
      flash[:notice] = "Đã lưu nhật ký tương tác: #{@activity.title}"
    else
      flash[:alert] = "Không thể lưu tương tác: #{@activity.errors.full_messages.join(', ')}"
    end

    redirect_to customer_path(@customer)
  end

  def destroy
    @customer = Customer.find(params[:customer_id])
    @activity = @customer.activities.find(params[:id])
    @activity.destroy
    flash[:notice] = "Đã xóa nhật ký tương tác."
    redirect_to customer_path(@customer)
  end

  private

  def activity_params
    params.require(:activity).permit(:activity_type, :title, :content, :occurred_at, :next_follow_up_at)
  end
end
