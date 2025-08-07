FROM node:24.3.0-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client netcat-traditional && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.7.1

WORKDIR /envio-indexer

# Install deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy rest of the project AFTER codegen
COPY . .

# Build step (must come AFTER codegen + source)
RUN pnpm run codegen && pnpm run build

# Create wait-for-db script
RUN cat > wait-for-db.sh << 'EOF'
#!/bin/bash
set -e

host="$1"
port="$2"
shift 2
cmd="$@"

echo "🔍 Waiting for $host:$port to be ready..."
echo "🔍 Testing DNS resolution first..."

# Test DNS resolution
for i in {1..30}; do
  if nslookup "$host" > /dev/null 2>&1; then
    echo "✅ DNS resolution for $host successful"
    break
  else
    echo "⏳ DNS lookup failed for $host, attempt $i/30 - sleeping 2s"
    sleep 2
  fi
  
  if [ $i -eq 30 ]; then
    echo "❌ DNS resolution failed after 30 attempts"
    exit 1
  fi
done

# Test port connection
echo "🔍 Testing connection to $host:$port..."
for i in {1..60}; do
  if nc -z "$host" "$port"; then
    echo "✅ $host:$port is ready!"
    break
  else
    echo "⏳ $host:$port not ready, attempt $i/60 - sleeping 2s"
    sleep 2
  fi
  
  if [ $i -eq 60 ]; then
    echo "❌ Connection failed after 60 attempts"
    exit 1
  fi
done

echo "🚀 Starting indexer..."
exec $cmd
EOF

RUN chmod +x wait-for-db.sh

# Start with wait script
CMD ["./wait-for-db.sh", "envio-postgres", "5432", "pnpm", "envio", "start"]