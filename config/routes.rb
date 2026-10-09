Rails.application.routes.draw do
  # Root route: Login screen / Dashboard
  root "sessions#new"

  # Authentication
  get "/login", to: "sessions#new", as: :login
  post "/login", to: "sessions#create"
  get "/logout", to: "sessions#destroy"
  delete "/logout", to: "sessions#destroy", as: :logout
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
end
