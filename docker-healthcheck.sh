#!/bin/sh

# ==============================================================================
# Healthcheck Script - Yhanko Educa Portal do Estudante (Frontend)
# Suporta portas dinâmicas ($PORT) e total compatibilidade com Coolify e Docker
# ==============================================================================

check_url() {
    TARGET="$1"
    if command -v curl >/dev/null 2>&1; then
        curl -f -s "$TARGET" >/dev/null 2>&1
        return $?
    elif command -v wget >/dev/null 2>&1; then
        wget -q -O /dev/null "$TARGET" >/dev/null 2>&1
        return $?
    fi
    return 1
}

# 1. Recupera porta salva pelo entrypoint ou variável PORT ou padrão 8080
SAVED_PORT=""
if [ -f /tmp/nginx_port ]; then
    SAVED_PORT=$(cat /tmp/nginx_port 2>/dev/null || true)
fi

PORT_CHECK="${SAVED_PORT:-${PORT:-8080}}"

# 2. Testa a porta identificada (/healthz ou /)
if check_url "http://127.0.0.1:${PORT_CHECK}/healthz" || check_url "http://127.0.0.1:${PORT_CHECK}/"; then
    exit 0
fi

# 3. Fallbacks de segurança para portas comuns (3000, 8080, 3002) caso a porta divirja no runtime
for P in 3000 8080 3002; do
    if [ "$PORT_CHECK" != "$P" ]; then
        if check_url "http://127.0.0.1:${P}/healthz" || check_url "http://127.0.0.1:${P}/"; then
            exit 0
        fi
    fi
done

exit 1
