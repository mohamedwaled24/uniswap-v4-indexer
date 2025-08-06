FROM node:24.3.0-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.7.1

WORKDIR /envio-indexer

# Copy only necessary files for install phase
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy files needed for codegen
COPY config.yaml schema.graphql ./
RUN pnpm envio codegen

# Copy the rest of the project
COPY . .

CMD ["pnpm", "envio", "start"]
