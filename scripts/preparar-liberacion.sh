#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/hosting"
RELEASE_DIR="$ROOT_DIR/build/release"

 echo "== Preparación del paquete de liberación =="

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "ERROR: No existe la carpeta hosting/." >&2
  exit 1
fi

for file in index.php api.php app.js styles.css; do
  if [[ ! -s "$SOURCE_DIR/$file" ]]; then
    echo "ERROR: Falta el archivo requerido hosting/$file." >&2
    exit 1
  fi
done

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# El contenido publicado procede exclusivamente de hosting/.
# config.php se conserva en el servidor y nunca se sobrescribe desde el repositorio.
cp -a "$SOURCE_DIR/." "$RELEASE_DIR/"
rm -f "$RELEASE_DIR/config.php"

# Evitar incluir metadatos del control de versiones o archivos temporales privados.
find "$RELEASE_DIR" -type d -name '.git' -prune -exec rm -rf {} +
find "$RELEASE_DIR" -type f \( -name '*.log' \) -delete

if [[ -e "$RELEASE_DIR/config.php" ]]; then
  echo "ERROR: El paquete contiene config.php." >&2
  exit 1
fi

echo "Paquete preparado desde hosting/ en build/release."
echo "Archivos incluidos: $(find "$RELEASE_DIR" -type f | wc -l)"
