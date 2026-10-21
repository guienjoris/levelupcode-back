# ==============================================================================
# Multi-stage Dockerfile pour LevelUpCode API (NestJS v12 + ESM + Prisma 7)
# Optimisé pour Google Cloud Run (image légère, non-root, cache de couches)
# ==============================================================================

# ------------------------------------------------------------------------------
# Étape 1 : Builder (Installation, génération Prisma et compilation TypeScript)
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Installation des dépendances système nécessaires à Prisma et aux modules natifs
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copie des manifests de dépendances et configuration npm
COPY package.json package-lock.json .npmrc ./

# Installation propre des dépendances avec support legacy-peer-deps
RUN npm ci --legacy-peer-deps

# Variables d'environnement fictives pour la phase de build (génération client Prisma sans accès BD réseau)
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Copie du schéma Prisma et génération du client Prisma 7
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npx prisma generate

# Copie des configurations TypeScript et du code source
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# Compilation de l'application NestJS vers dist/
RUN npm run build

# Élagage des dépendances de dev pour ne conserver que les dépendances de production
RUN npm prune --production --legacy-peer-deps && \
    npx prisma generate

# ------------------------------------------------------------------------------
# Étape 2 : Runner de Production (Image finale minimale et sécurisée)
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Installation minimale d'openssl pour le moteur de requêtes Prisma
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Variables d'environnement de production
ENV NODE_ENV=production
ENV PORT=8080

# Création d'un utilisateur non-root pour les contraintes de sécurité Cloud Run
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash nestjs

# Copie des artefacts de compilation et dépendances de production depuis le builder
COPY --chown=nestjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nestjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nestjs:nodejs --from=builder /app/prisma.config.ts ./prisma.config.ts

# Basculement vers l'utilisateur non-privilégié
USER nestjs

# Port d'écoute par défaut injecté par Cloud Run
EXPOSE 8080

# Démarrage de l'application NestJS en mode ES Module
CMD ["node", "dist/main.js"]
