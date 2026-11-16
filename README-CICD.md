# Scripts de CI/CD de DJ CHISMOSO

## Archivos

- `scripts/preparar-entorno.sh`: comprueba PHP 8.3 y la extensión PDO MySQL.
- `scripts/ejecutar-pruebas.sh`: valida la sintaxis de todos los PHP de `hosting/` y ejecuta las pruebas de humo.
- `tests/validar-proyecto.php`: comprueba archivos esenciales e integraciones básicas entre interfaz y API.
- `scripts/preparar-liberacion.sh`: crea `build/release/` con los archivos públicos listos para desplegar.

## Ejecución local (Linux, macOS o Git Bash)

Desde la raíz del repositorio:

```bash
bash scripts/preparar-entorno.sh
bash scripts/ejecutar-pruebas.sh
bash scripts/preparar-liberacion.sh
```

Se necesita PHP 8.3 CLI con `pdo_mysql`. Las pruebas no conectan con la base de datos de producción ni ejecutan `db_setup.php`.

## Configuración local

El ZIP incluye `hosting/config.example.php` como plantilla sin credenciales. Cópiala como `hosting/config.php` y completa los parámetros de MySQL y Spotify de tu propio entorno. No subas `config.php` a GitHub.

El servidor de producción debe conservar su propio `config.php`. El paquete de liberación lo excluye intencionalmente para no sobrescribir la configuración privada del hosting.

## Flujo GitHub Actions

1. En cada Pull Request a `main`, prepara el entorno y ejecuta validaciones.
2. Si las validaciones pasan, genera el artefacto `dj-chismoso-release`.
3. En `push` a `main` o ejecución manual, descarga el artefacto y lo publica por FTP.

Configura en GitHub Secrets: `FTP_SERVER`, `FTP_USERNAME` y `FTP_PASSWORD`.

Las pruebas actuales son pruebas de humo y validación estática; no sustituyen pruebas de integración con MySQL ni pruebas funcionales del navegador.


### Alcance del despliegue a Hostinger

El paquete de liberación se construye copiando el contenido de `hosting/` y únicamente esa carpeta. Los archivos ubicados en la raíz del repositorio y en otras carpetas (por ejemplo `scripts/`, `tests/` y `.github/`) no se publican. El archivo `config.php` se excluye deliberadamente del paquete para conservar la configuración privada que ya existe en Hostinger. Los demás archivos y subcarpetas presentes en `hosting/` se incluyen en la liberación.
