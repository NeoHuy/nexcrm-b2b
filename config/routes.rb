Rails.application.routes.draw do
  # Root route: Login screen / Dashboard
  root "sessions#new"

  # Authentication
  get "/login", to: "sessions#new", as: :login
  post "/login", to: "sessions#create"
  match "/logout", to: "sessions#destroy", via: [:get, :delete], as: :logout
  post "/demo_login", to: "sessions#demo_login", as: :demo_login

  # Dashboard
  get "/dashboard", to: "dashboard#index", as: :dashboard

  # B2B Customer Management
  resources :customers do
    resources :activities, only: [:create, :destroy]
    resources :debt_transactions, only: [:create]
  end

  # Dedicated Debt / Receivables Management
  resources :debts, only: [:index]

  # REST API for React Frontend
  namespace :api do
    namespace :v1 do
      get "/me", to: "sessions#me"
      post "/login", to: "sessions#create"
      delete "/logout", to: "sessions#destroy"
      post "/demo_login", to: "sessions#demo_login"
      get "/demo_users", to: "sessions#demo_users"

      get "/dashboard", to: "dashboard#index"

      resources :customers do
        collection do
          get :meta
        end
        resources :activities, only: [:create, :destroy]
        resources :debt_transactions, only: [:create]
      end

      resources :debts, only: [:index]

      resources :users, only: [:index, :show, :create, :update, :destroy] do
        member do
          patch :update_role
          post :reassign_customers
        end
      end
    end
  end
end
