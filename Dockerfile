FROM node:24.3.0-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.7.1

WORKDIR /envio-indexer

# Step 1: install deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Step 2: copy full project (including src/, config, etc)
COPY . .

# Step 3: run codegen after all files are present
RUN pnpm envio codegen

# Optional: if you're building (for example, if you're using tsc)
RUN pnpm run build

# Step 4: start the indexer
CMD ["pnpm", "envio", "start"]
