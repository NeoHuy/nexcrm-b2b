class DebtPolicy < ApplicationPolicy
  def index?
    return true if admin?
    return false unless user

    user.has_policy_permission?(:debt_view)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless user
      return scope.all if user.admin?
      return scope.none unless user.has_policy_permission?(:debt_view)

      if user.own_customers_only?
        scope.where(assigned_user_id: user.id)
      else
        scope.all
      end
    end
  end
end
