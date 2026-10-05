# Yhanko Educa - Portal do Estudante (Frontend)

Frontend web SPA do Portal do Estudante desenvolvido em **React 18**, **TypeScript**, **Vite** e **TailwindCSS**, containerizado com foco em **alta performance**, **segurança máxima (Non-Root)**, **imagem ultraleve (~31.6MB)** e **injeção dinâmica de variáveis de ambiente**.

---

## 🚀 Destaques da Arquitetura Docker

1. **Multi-Stage Build Otimizado**:
   - `base`: Node.js 22 Alpine oficial minimalista.
   - `deps`: Instalação limpa de dependências (`npm ci --prefer-offline`) utilizando cache nativo do Docker BuildKit (`--mount=type=cache,target=/root/.npm`) e tolerância a falhas com retries de rede.
   - `builder`: Compilação TypeScript (`tsc -b`) e bundling com Vite em chunks estáticos (`manualChunks: vendor, charts, ui, motion`).
   - `runner`: Servidor web Nginx oficial sem privilégios (`nginxinc/nginx-unprivileged:alpine-slim`), sem runtime Node.js ou código-fonte exposto.

2. **Injeção Dinâmica de Variáveis de Ambiente (Runtime & Build-Time)**:
   - **Build-Time**: Parâmetro `ARG VITE_API_URL` com fallback para a API padrão da Railway.
   - **Runtime Dinâmico**: O script de entrypoint detecta a variável `VITE_API_URL` (ou `API_URL`) no momento em que o container sobe e substitui automaticamente nos bundles compilados (`.js` e `.html`).
   - **Vantagem de Nuvem**: Permite usar a **mesma imagem Docker** para ambientes de Staging, Homologação e Produção sem precisar recompilar a imagem!

3. **Porta Dinâmica de Hospedagem**:
   - O container se adapta automaticamente à variável `$PORT` injetada por plataformas PaaS como **Railway**, **Render**, **Heroku** e **Google Cloud Run** (padrão local: `8080`).

4. **Segurança Avançada (Hardened & Non-Root)**:
   - Execução restrita sob usuário não-privilegiado `nginx` (`UID 101`).
   - `server_tokens off`: Oculta versões do Nginx em respostas HTTP.
   - Cabeçalhos de segurança HTTP injetados globalmente: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
   - Compatível com a flag `security_opt: ["no-new-privileges:true"]`.

5. **Performance & Caching Inteligente**:
   - **Gzip**: Compressão de nível 6 em tempo real para HTML, CSS, JavaScript, JSON e SVG.
   - **Assets com Hash (/assets/*)**: Cache estático imutável por 1 ano (`Cache-Control: public, max-age=31536000, immutable`).
   - **Index HTML (/index.html)**: Cache desativado (`no-store, no-cache, must-revalidate`) para que novos deploys sejam refletidos instantaneamente nos navegadores dos alunos.
   - **Roteamento SPA**: `try_files $uri $uri/ /index.html;` para suportar recarregamento direto de rotas virtuais (como `/dashboard`, `/notas`, `/pagamentos`, `/chat`).

6. **Healthcheck Nativo**:
   - Endpoint `/healthz` dedicado respondendo `200 healthy` sem ruído nos logs de acesso.
   - Verificação nativa integrada ao daemon do Docker via `wget`.

---

## 📋 Variáveis de Ambiente

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL base da API backend (School API) | `https://school-api-production-a1c6.up.railway.app` |
| `PORT` | Porta HTTP interna do Nginx / PaaS | `8080` (container) / `3002` (compose host) |

---

## 🛠️ Execução e Orquestração

### Opção 1: Via Docker Compose (Recomendado para Desenvolvimento/Servidor)

```bash
# Iniciar o container em segundo plano
docker compose up -d --build

# Inspecionar status e integridade (Healthcheck)
docker compose ps

# Visualizar logs em tempo real com o banner de inicialização
docker compose logs -f shool-stuents

# Parar o serviço
docker compose down
```

A aplicação ficará disponível em: **`http://localhost:3002`** (ou na porta configurada via `.env`).

---

### Opção 2: Via Docker CLI

#### 1. Compilação da Imagem
```bash
# Build com URL de API padrão
docker build -t shool-stuents:latest .

# Build com URL customizada (opcional)
docker build --build-arg VITE_API_URL=https://minha-api.empresa.com -t shool-stuents:latest .
```

#### 2. Execução do Contêiner
```bash
# Execução padrão
docker run -d \
  --name shool-stuents-frontend \
  -p 3002:8080 \
  --restart unless-stopped \
  shool-stuents:latest

# Execução com substituição dinâmica de API em runtime
docker run -d \
  --name shool-stuents-frontend \
  -p 3002:8080 \
  -e VITE_API_URL=https://api-homologacao.empresa.com \
  --restart unless-stopped \
  shool-stuents:latest
```

---

## 🌐 Hospedagem em Plataformas de Nuvem

### 1. Railway
1. Crie um novo serviço e conecte o repositório ou subpasta `shool-stuents`.
2. O Railway detectará automaticamente o `Dockerfile`.
3. Nas variáveis de ambiente do serviço, adicione:
   - `VITE_API_URL`: URL da sua API backend.
4. O container lerá a variável `PORT` e `VITE_API_URL` automaticamente na inicialização.

### 2. Render / Coolify / CapRover / Portainer
1. Crie um serviço Web a partir do Dockerfile.
2. Defina a porta do contêiner como `8080` (ou deixe a plataforma injetar `$PORT`).
3. Adicione a variável de ambiente `VITE_API_URL`.

---

## 🔍 Verificação de Saúde e Diagnóstico

```bash
# 1. Testar endpoint de integridade (Healthcheck)
curl http://localhost:3002/healthz

# 2. Testar roteamento SPA e cabeçalhos HTTP
curl -I http://localhost:3002/login

# 3. Inspecionar usuário seguro (não-root)
docker exec shool-stuents-frontend whoami
# Retorno esperado: nginx (UID 101)
```
