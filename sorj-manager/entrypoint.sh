#!/bin/sh
set -e

# Executa o script JS e aplica as variáveis de ambiente retornadas
if [ -f /data/options.json ]; then
    echo "Carregando variaveis via Node.js..."
    eval "$(node /env-loader.js)"
fi

# --- DEBUG: Lista as variáveis carregadas ---
    echo "🔍 Verificando variáveis NUXT_ definidas:"
    env | grep ESPHOME
    echo "----------------------------------------"

# Executa o comando original (CMD)
exec "$@"

# Executa o comando original do container (CMD)
exec "$@"
