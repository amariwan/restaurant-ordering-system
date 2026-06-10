FROM mcr.microsoft.com/devcontainers/dotnet:2-10.0-noble

RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
        curl \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

USER vscode

RUN curl -fsSL https://bun.sh/install | bash

ENV PATH="/home/vscode/.bun/bin:${PATH}"
