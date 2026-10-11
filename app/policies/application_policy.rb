class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def admin?
    user&.admin? == true
  end

  def index?
    return true if admin?
    false
  end

  def show?
    return true if admin?
    false
  end

  def create?
    return true if admin?
    false
  end

  def new?
    create?
  end

  def update?
    return true if admin?
    false
  end

  def edit?
    update?
  end

  def destroy?
    return true if admin?
    false
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      return scope.all if user&.admin?
      scope.none
    end
  end
end
