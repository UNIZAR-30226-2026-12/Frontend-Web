#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  ./scripts/recover-docker-desktop.sh [--up] [--compose RUTA_COMPOSE]

Opciones:
  --up                 Ademas de recuperar Docker Desktop, ejecuta docker compose up -d --build.
  --compose <ruta>     Ruta del docker-compose.yml (por defecto: ../../docker-compose.yml respecto al script).
  -h, --help           Muestra esta ayuda.
EOF
}

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

fail() {
  printf '[ERROR] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "No se encontro el comando: $1"
}

docker_server_ok() {
  docker version --format '{{.Server.Version}}' >/dev/null 2>&1
}

run_windows_recovery() {
  # Este bloque fuerza un reinicio limpio de Docker Desktop + WSL2.
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "\
    \$ErrorActionPreference='Continue'; \
    Stop-Process -Name 'Docker Desktop' -Force -ErrorAction SilentlyContinue; \
    Stop-Process -Name 'com.docker.backend' -Force -ErrorAction SilentlyContinue; \
    Stop-Process -Name 'com.docker.build' -Force -ErrorAction SilentlyContinue; \
    Stop-Process -Name 'vpnkit' -Force -ErrorAction SilentlyContinue; \
    wsl --shutdown; \
    Start-Process \"\$Env:ProgramFiles\\Docker\\Docker\\Docker Desktop.exe\" \
  " >/dev/null
}

wait_for_daemon() {
  local retries=45
  local delay_seconds=2

  for ((i = 1; i <= retries; i++)); do
    if docker_server_ok; then
      return 0
    fi
    sleep "$delay_seconds"
  done
  return 1
}

run_compose=0
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
compose_file="$script_dir/../../docker-compose.yml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --up)
      run_compose=1
      shift
      ;;
    --compose)
      [[ $# -ge 2 ]] || fail "Falta valor para --compose"
      compose_file="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Argumento no reconocido: $1"
      ;;
  esac
done

require_cmd docker
require_cmd powershell.exe

if docker_server_ok; then
  log "Docker daemon ya estaba disponible."
else
  log "Docker daemon no responde. Ejecutando recuperacion de Docker Desktop..."
  run_windows_recovery

  log "Esperando a que Docker Desktop vuelva a estar disponible..."
  if ! wait_for_daemon; then
    fail "Docker no respondio en el tiempo esperado. Abre Docker Desktop manualmente y revisa logs."
  fi
fi

log "Estado final de Docker Desktop:"
docker desktop status || true

log "Contexto activo:"
docker context show || true

log "Version de servidor Docker:"
docker version --format 'Server: {{.Server.Version}}' || true

if [[ "$run_compose" -eq 1 ]]; then
  [[ -f "$compose_file" ]] || fail "No existe el archivo compose: $compose_file"

  log "Levantando servicios con compose: $compose_file"
  docker compose -f "$compose_file" up -d --build

  log "Servicios activos:"
  docker compose -f "$compose_file" ps
else
  log "Recuperacion completa."
  echo "Siguiente paso sugerido:"
  echo "  docker compose -f \"$compose_file\" up -d --build"
fi
