# Server image. The monorepo root is the build context so workspaces resolve.
FROM node:20-bookworm-slim

WORKDIR /app

# Install workspace dependencies (argon2 has prebuilt binaries for this base).
COPY package.json package-lock.json* ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
COPY e2e/package.json ./e2e/package.json
RUN npm install --workspace server --include-workspace-root

COPY tsconfig.base.json ./
COPY server ./server

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "server"]
