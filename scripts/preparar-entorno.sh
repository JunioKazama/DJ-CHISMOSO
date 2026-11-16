#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Preparación del entorno DJ CHISMOSO =="

if ! command -v php >/dev/null 2>&1; then
  echo "ERROR: PHP CLI no está instalado." >&2
  exit 1
fi

PHP_VERSION="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
if [[ "$PHP_VERSION" != "8.3" ]]; then
  echo "ERROR: Se requiere PHP 8.3; versión detectada: $PHP_VERSION." >&2
  exit 1
fi

if ! php -m | grep -qi '^pdo_mysql$'; then
  echo "ERROR: Falta la extensión pdo_mysql." >&2
  exit 1
fi

echo "PHP $PHP_VERSION disponible."
echo "Extensión PDO MySQL disponible."
echo "No se instala ni modifica la base de datos real durante CI."
