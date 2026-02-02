#!/bin/sh
set -e

# Executa o script JS e aplica as variáveis de ambiente retornadas
if [ -f /data/options.json ]; then
    echo "Carregando variaveis via Node.js..."
    eval "$(node /env-loader.js)"
fi
export NUXT_SUPERVISOR_TOKEN="$SUPERVISOR_TOKEN"
export NUXT_PUBLIC_SUPERVISOR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJlNjY3ZTJhNzFmYzg0NTAzYTUwNWY5NDQyNDM2ZjIwMiIsImlhdCI6MTc3MDA2Njk2NywiZXhwIjoyMDg1NDI2OTY3fQ.-vwuNw4pv7LC_7rpu2G3kvHYlJJHl4gWDq-gbVQ1Ujs"
# --- DEBUG: Lista as variáveis carregadas ---
    echo "🔍 Verificando variáveis NUXT_ definidas:"
    env | grep NUXT_
    env
    echo "----------------------------------------"

# Executa o comando original (CMD)
exec "$@"

# Executa o comando original do container (CMD)
exec "$@"
