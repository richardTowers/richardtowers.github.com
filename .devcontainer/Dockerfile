FROM mcr.microsoft.com/devcontainers/ruby:3-bullseye
RUN rm -f /etc/apt/sources.list.d/yarn.list /etc/apt/sources.list.d/yarn.list.save \
    && apt-get update \
    && rm -rf /var/lib/apt/lists/*
