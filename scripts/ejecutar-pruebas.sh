#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Validación de sintaxis PHP =="
mapfile -d '' PHP_FILES < <(find hosting -type f -name '*.php' -print0)
if [[ ${#PHP_FILES[@]} -eq 0 ]]; then
  echo "ERROR: No se encontraron archivos PHP en hosting/." >&2
  exit 1
fi

for file in "${PHP_FILES[@]}"; do
  php -l "$file"
done

echo
echo "== Pruebas automatizadas de humo =="
php tests/validar-proyecto.php
