# --- Estágio de Build ---
FROM oven/bun:1 as builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package.json bun.lockb ./

# Instala dependências (incluindo devDependencies para o build do Nuxt)
RUN bun install --frozen-lockfile

# Copia o código fonte
COPY . .

# Executa o build do Nuxt para produção
RUN bun run build

# --- Estágio de Execução ---
# Usamos uma imagem slim do bun para o runtime
FROM oven/bun:1-slim

WORKDIR /app

# Copia apenas o diretório de saída do build (.output)
COPY --from=builder /app/.output ./.output

# Define variáveis de ambiente para o Nuxt em produção
ENV NODE_ENV=production
# O Home Assistant Ingress espera que a aplicação escute na porta definida no config.yaml (ingress_port: 3000)
ENV HOST=0.0.0.0
ENV PORT=3000

# O comando de entrada para rodar o servidor Nuxt gerado
CMD ["bun", "run", ".output/server/index.mjs"]
