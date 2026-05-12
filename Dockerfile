FROM node:22-bookworm-slim AS app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json prisma.config.ts ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
COPY scripts ./scripts
COPY assets ./assets

ENV DATABASE_URL="postgresql://meme:meme@postgres:5432/meme_foundry"
ENV AUTH_URL="http://localhost:8080"
ENV NEXTAUTH_URL="http://localhost:8080"
ENV AUTH_SECRET="docker-build-placeholder-secret"
ENV NEXTAUTH_SECRET="docker-build-placeholder-secret"
ENV AUTH_TRUST_HOST="true"

RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate
RUN pnpm build

ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@meme-foundry/web", "start"]
