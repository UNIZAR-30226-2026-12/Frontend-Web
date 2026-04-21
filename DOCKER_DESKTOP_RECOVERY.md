# Recuperar Docker Desktop Atascado (Windows)

Este procedimiento aplica cuando Docker Desktop queda en `starting` o `docker version` da error 500 en la pipe de Linux engine.

## Archivos

- Script: `scripts/recover-docker-desktop.sh`

## Requisitos

- Windows con Docker Desktop instalado.
- Git Bash (recomendado) o WSL.
- Permisos para abrir Docker Desktop.

## Uso Rapido

1. Ir a la carpeta del frontend:

```bash
cd reversi_Frontend-Web
```

2. Dar permisos de ejecucion (solo la primera vez):

```bash
chmod +x scripts/recover-docker-desktop.sh
```

3. Recuperar Docker Desktop:

```bash
./scripts/recover-docker-desktop.sh
```

4. (Opcional) Recuperar y levantar contenedores en un paso:

```bash
./scripts/recover-docker-desktop.sh --up --compose ../docker-compose.yml
```

## Que hace el script

1. Verifica si el daemon de Docker responde.
2. Si no responde, fuerza cierre de procesos de Docker Desktop.
3. Ejecuta `wsl --shutdown`.
4. Vuelve a abrir Docker Desktop.
5. Espera hasta que el daemon vuelva a responder.
6. Opcionalmente ejecuta `docker compose up -d --build`.

## Como validar que quedo bien

```bash
docker desktop status
docker version
```

Debe verse estado `running` y una seccion `Server` en `docker version`.

## Si sigue fallando

1. Abrir Docker Desktop manualmente como administrador.
2. Revisar logs desde la app (`Troubleshoot` > `Get support`).
3. Ejecutar de nuevo el script.
