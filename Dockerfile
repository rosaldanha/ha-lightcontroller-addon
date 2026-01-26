# --- Estágio de Build ---
FROM node:20-alpine as builder

WORKDIR /app

# Instala ferramentas necessárias para compilar pacotes nativos (se houver)
RUN apk add --no-cache python3 make g++

# Copia os arquivos de dependência
COPY package.json package-lock.json* ./

# Instala dependências usando NPM (mais seguro no HA Supervisor)
RUN npm install

# Copia o código fonte
COPY . .

# Executa o build do Nuxt
RUN npm run build

# --- Estágio de Execução ---
FROM node:20-alpine

WORKDIR /app

# Define variáveis de ambiente para produção
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copia o output gerado no estágio anterior
COPY --from=builder /app/.output /app/.output

# Comando para iniciar
CMD ["node", ".output/server/index.mjs"]
