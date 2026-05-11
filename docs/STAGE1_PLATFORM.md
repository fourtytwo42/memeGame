# Stage 1 Platform Foundation

This document records the host-native VM platform state for Meme Foundry.

## VM Runtime

All build and runtime work happens on the remote VM:

```txt
Host: 192.168.50.209
User: hendo420
Repo: /home/hendo420/memeGame
```

Root disk after expansion:

```txt
/: 61G total, about 36G free after pulling the local text model
```

## Core Tools

Verified versions:

```txt
Node.js: v22.22.2
npm: 10.9.7
pnpm: 11.1.0
Python: 3.12.3
Postgres client/server: 16.x
Redis: 7.0.x
Ollama: 0.23.2
Nginx: 1.24.0
```

## Host-Native Services

Enabled and restart-verified with systemd:

```txt
postgresql
redis-server
ollama
nginx
```

Expected local ports:

```txt
Postgres: 127.0.0.1:5432
Redis: 127.0.0.1:6379
Ollama: 127.0.0.1:11434
Nginx: 0.0.0.0:80
```

Nginx is installed and active with the default server. It should be replaced
with the app reverse-proxy config in the deployment stage.

## Databases

Host-native Postgres is installed and active.

App role:

```txt
Role: meme
Password: meme
```

Databases:

```txt
meme_foundry
meme_foundry_test
```

Development connection string:

```txt
DATABASE_URL=postgresql://meme:meme@localhost:5432/meme_foundry
```

Test connection string:

```txt
TEST_DATABASE_URL=postgresql://meme:meme@localhost:5432/meme_foundry_test
```

Verification commands:

```bash
PGPASSWORD=meme psql -h localhost -U meme -d meme_foundry -c 'select 1;'
PGPASSWORD=meme psql -h localhost -U meme -d meme_foundry_test -c 'select 1;'
```

## Redis

Host-native Redis is installed and active.

Connection string:

```txt
REDIS_URL=redis://localhost:6379
```

Prefixes:

```txt
REDIS_KEY_PREFIX=meme:dev
REDIS_TEST_KEY_PREFIX=meme:test
REDIS_PROD_KEY_PREFIX=meme:prod
```

Verification command:

```bash
redis-cli ping
```

Expected output:

```txt
PONG
```

## Local Text Model

Ollama is the selected local text runtime for the host-native build.

Product target from PRD:

```txt
google/gemma-4-e2b
```

Runtime mapping:

```txt
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=gemma4:e2b
LOCAL_LLM_PRODUCT_TARGET=google/gemma-4-e2b
```

The model `gemma4:e2b` is pulled into Ollama and exposed through the local
OpenAI-compatible endpoint. Smoke test returned `meme-ok` from
`/v1/chat/completions`.

Verification commands:

```bash
ollama list
curl -s http://127.0.0.1:11434/v1/models
```

## Local Image Backend Decision

The production worker should remain backend-neutral, but Stage 1 selects Python
Diffusers as the initial implementation path.

FastSD CPU was inspected first because the PRD prefers it if stable. The current
FastSD CPU install path requires `uv`, a pinned Python environment, PyTorch
2.8 CPU, OpenVINO, and a broad GUI/web/CLI dependency set. It is promising but
too heavy and operationally broad for the first worker integration.

Python Diffusers was smoke-tested in:

```txt
/home/hendo420/.local/meme-image-spike
```

Smoke output:

```txt
/home/hendo420/.local/meme-image-spike/output/tiny-smoke.png
```

The smoke test used CPU Torch, Diffusers, and a tiny Stable Diffusion pipeline to
generate a PNG successfully. This validates the basic local CPU image worker
path without committing to the final production model yet.

Implementation direction:

```txt
IMAGE_BACKEND=diffusers
IMAGE_CONCURRENCY=1
IMAGE_OUTPUT_DIR=./data/images
```

The later image worker should still isolate the backend behind an interface so
FastSD, ComfyUI, OpenVINO, or a GPU runtime can replace Diffusers later.

## Restart Smoke

The following services were restarted successfully:

```txt
postgresql
redis-server
ollama
nginx
```

Post-restart checks passed:

```txt
Postgres: select 1
Redis: PONG
Ollama: /api/version returned 0.23.2
Nginx: HTTP/1.1 200 OK
```
