#!/bin/sh
set -e

# O volume de uploads pode já existir de execuções anteriores rodando como
# root; ajusta a posse aqui (ainda como root) antes de derrubar privilégio
# para o usuário "node" e executar a aplicação de fato.
chown -R node:node /app/uploads

exec su-exec node "$@"
