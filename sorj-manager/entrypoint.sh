#!/bin/sh
set -e

# Verifica se o arquivo de opções existe
if [ -f /data/options.json ]; then
    echo "Carregando opções de /data/options.json..."

    # Lê o arquivo, converte chaves para maiúsculas, prefixa com NUXT_ e cria comandos de export
    # A estrutura .key | ascii_upcase garante a caixa alta
    # As aspas simples em volta do valor garantem que espaços ou caracteres especiais não quebrem o shell
    export_commands=$(jq -r 'to_entries | .[] | "export NUXT_" + (.key | ascii_upcase) + "='\''" + (.value | tostring) + "'\''"' /data/options.json)

    # Avalia e executa os comandos de export gerados
    eval "$export_commands"
fi

# Executa o comando original do container (CMD)
exec "$@"
