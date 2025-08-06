FROM node:24.3.0-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.7.1

WORKDIR /envio-indexer

# Install deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Codegen step (needs config and schema before build)
COPY config.yaml schema.graphql ./
RUN pnpm envio codegen

# Copy rest of the project AFTER codegen
COPY . .

# Build step (must come AFTER codegen + source)
RUN pnpm run build

# Start
CMD ["pnpm", "envio", "start"]
