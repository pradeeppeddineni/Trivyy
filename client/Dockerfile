# Client dev image (Vite dev server). The monorepo root is the build context.
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
COPY e2e/package.json ./e2e/package.json
RUN npm install --workspace client --include-workspace-root

COPY tsconfig.base.json ./
COPY client ./client

EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace", "client", "--", "--host"]
