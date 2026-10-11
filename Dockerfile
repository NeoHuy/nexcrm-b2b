# syntax = docker/dockerfile:1

ARG RUBY_VERSION=3.3.0
FROM ruby:$RUBY_VERSION-slim AS base

# Rails app lives here
WORKDIR /rails

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development:test" \
    RAILS_SERVE_STATIC_FILES="true" \
    RAILS_LOG_TO_STDOUT="true"

# Throw-away build stage to reduce size
FROM base AS build

# Install packages needed to build gems (including libpq-dev for pg gem)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    pkg-config \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install application gems
COPY Gemfile Gemfile.lock* ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

# Copy application code
COPY . .

# Final stage for app image
FROM base

# Install runtime dependencies (PostgreSQL client libraries and tzdata)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    libpq5 \
    postgresql-client \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Copy built artifacts: gems, application
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

# Setup entrypoint and storage directory
RUN chmod +x /rails/bin/docker-entrypoint /rails/bin/rails && \
    mkdir -p /rails/storage /rails/tmp/pids /rails/log

# Entrypoint prepares the database.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
