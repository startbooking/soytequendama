#!/usr/bin/env bash
# Aplica la configuración local para servir el sitio en soytequenda.lan.
# Requiere sudo. Uso: sudo bash scripts/setup-domain.sh
set -euo pipefail

VHOST_SRC="$PWD/deploy/soytequenda.lan.conf"
VHOST_AVAILABLE="/etc/apache2/sites-available/soytequenda.lan.conf"
VHOST_ENABLED="/etc/apache2/sites-enabled/soytequenda.lan.conf"
DOCROOT="$PWD/dist"

if [ ! -d "$DOCROOT" ]; then
  echo "No existe dist/. Ejecuta primero: npm run build"
  exit 1
fi

# hosts: soytequenda.lan (+ alias soytequendama.lan)
for host in soytequenda.lan soytequendama.lan; do
  if ! grep -q "^127.0.0.1[[:space:]]\+$host" /etc/hosts; then
    echo "127.0.0.1 $host" >> /etc/hosts
    echo "Agregado $host a /etc/hosts"
  fi
done

install -m 644 "$VHOST_SRC" "$VHOST_AVAILABLE"
ln -sf "$VHOST_AVAILABLE" "$VHOST_ENABLED"
echo "Vhost instalado: $VHOST_ENABLED"

apache2ctl configtest
apache2ctl graceful
echo "Apache recargado."
echo "Abre http://soytequenda.lan en el navegador."