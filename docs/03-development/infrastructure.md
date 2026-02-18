# Infrastructure

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

---

Infrastruktura StageBrain: Docker Compose na Hetzner VPS. Bez Terraform, bez Kubernetes — celowa prostota dla MVP z jednym serwerem.

## 1. Architektura Infrastruktury

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │   Caddy (443)   │  ← Auto SSL (Let's Encrypt)
              │  Reverse Proxy  │
              └───────┬─────────┘
                      │
            ┌─────────┼─────────┐
            ▼         ▼         ▼
     ┌──────────┐ ┌────────┐ ┌─────────────────┐
     │ Web (80) │ │API(8000│ │  WebSocket (ws)  │
     │  nginx   │ │FastAPI │ │  /ws/audio       │
     │  React   │ │  REST  │ │  /ws/panel       │
     └──────────┘ └───┬────┘ └────────┬─────────┘
                      │               │
            ┌─────────┼───────────────┘
            ▼         ▼
     ┌────────────┐ ┌───────────┐
     │ PostgreSQL │ │   Redis   │
     │ TimescaleDB│ │  Pub/Sub  │
     │   (5432)   │ │  (6379)   │
     └────────────┘ └───────────┘

     Hetzner VPS: CPX31 (4 vCPU, 8 GB RAM, 160 GB SSD)
```

---

## 2. Serwer — Hetzner Cloud

### Rekomendacja

| Parametr | Wartość |
|:---|:---|
| **Plan** | CPX31 (AMD) |
| **vCPU** | 4 |
| **RAM** | 8 GB |
| **SSD** | 160 GB |
| **Lokalizacja** | Falkenstein (DE) lub Helsinki (FI) |
| **Koszt** | ~68 PLN/mies. (~€15) |
| **OS** | Ubuntu 24.04 LTS |

### Dlaczego Hetzner?

- Najlepszy stosunek cena/wydajność w Europie.
- Data center w Niemczech/Finlandii — niska latencja dla polskich venue (~10-20ms).
- Snapshots VPS (backup) w cenie lub za grosze.
- API do automatyzacji (nie potrzebne na MVP, ale nice-to-have).

### Alternatywy

| Opcja | Koszt | Uwagi |
|:---|:---|:---|
| Hetzner CAX21 (ARM) | ~32 PLN/mies. | Tańszy, ale wymaga ARM Docker builds |
| DigitalOcean Droplet (4vCPU/8GB) | ~195 PLN/mies. | Prostszy panel, 3× droższy |
| OVH VPS | ~60 PLN/mies. | Porównywalny, mniej popularny w community |

---

## 3. Docker Compose — Production

```yaml
# docker-compose.yml
services:
  api:
    image: ghcr.io/org/stagebrain-api:latest
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
      - SENTRY_DSN=${SENTRY_DSN}
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 3G

  worker:
    image: ghcr.io/org/stagebrain-api:latest
    command: ["celery", "-A", "src.worker", "worker", "--loglevel=info"]
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 1G

  web:
    image: ghcr.io/org/stagebrain-web:latest
    restart: always

  postgres:
    image: timescale/timescaledb:latest-pg16
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 2G

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M

  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/caddy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  postgres_data:
  redis_data:
  caddy_data:
  caddy_config:
```

### Resource Limits (budżet 8 GB RAM)

| Serwis | CPU | RAM | Uzasadnienie |
|:---|:---|:---|:---|
| API (FastAPI + audio) | 2.0 | 3 GB | Audio processing (librosa, YAMNet) jest CPU/RAM-intensive |
| Worker | 0.5 | 1 GB | Raporty PDF, eksport — rzadkie operacje |
| PostgreSQL + TimescaleDB | 1.0 | 2 GB | DB wymaga RAM na bufory i continuous aggregates |
| Redis | 0.5 | 512 MB | Cache + pub/sub — lekki workload |
| Web (nginx) | — | 128 MB | Statyczny React SPA, minimalny footprint |
| Caddy | — | 128 MB | Reverse proxy, auto SSL |
| **System** | — | ~1 GB | OS + Docker overhead |

---

## 4. Caddy — Reverse Proxy + SSL

```
# infra/caddy/Caddyfile

stagebrain.example.com {
    # API i WebSocket
    handle /api/* {
        reverse_proxy api:8000
    }
    handle /ws/* {
        reverse_proxy api:8000
    }
    handle /docs* {
        reverse_proxy api:8000
    }
    handle /openapi.json {
        reverse_proxy api:8000
    }

    # Frontend (React SPA)
    handle {
        reverse_proxy web:80
    }
}
```

Caddy automatycznie:
- Uzyskuje certyfikat SSL od Let's Encrypt.
- Odnawia certyfikat przed wygaśnięciem.
- Przekierowuje HTTP → HTTPS.
- Obsługuje WebSocket (bez dodatkowej konfiguracji).

---

## 5. Monitoring

### Sentry (Error Tracking)

```python
# apps/api/src/main.py
import sentry_sdk

sentry_sdk.init(
    dsn=settings.sentry_dsn,
    traces_sample_rate=0.1,  # 10% traces
    environment="production",
)
```

- Wszystkie unhandled exceptions automatycznie raportowane.
- Traces dla API endpoints (performance monitoring).
- Alerty email/Slack na nowe errory.

### Uptime Robot (Availability)

| Monitor | URL | Interwał | Alert |
|:---|:---|:---|:---|
| Health check | `https://stagebrain.example.com/health` | 5 min | Email + SMS |
| API response | `https://stagebrain.example.com/api/v1/health` | 5 min | Email |

### Logi

```bash
# Logi wszystkich serwisów
docker compose logs -f

# Logi konkretnego serwisu
docker compose logs -f api

# Logi z ostatnich 30 minut
docker compose logs --since 30m api
```

> **MVP:** Logi w Docker (stdout/stderr). Post-MVP: rozważyć Loki + Grafana lub centralne logowanie.

---

## 6. Backup

### PostgreSQL — Daily Dump

```bash
#!/bin/bash
# infra/scripts/backup.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="stagebrain_${TIMESTAMP}.sql.gz"

# Dump + kompresja
docker compose exec -T postgres pg_dump -U stagebrain stagebrain | gzip > /tmp/${BACKUP_FILE}

# Upload do Object Storage (Hetzner Storage Box / S3)
rclone copy /tmp/${BACKUP_FILE} remote:stagebrain-backups/daily/

# Cleanup
rm /tmp/${BACKUP_FILE}

echo "Backup completed: ${BACKUP_FILE}"
```

### Retencja

| Typ | Częstotliwość | Retencja |
|:---|:---|:---|
| Daily dump | Codziennie 3:00 UTC | 7 dni |
| Weekly dump | Niedziela 3:00 UTC | 4 tygodnie |
| VPS snapshot | Tygodniowo | 2 snapshoty |

### Cron (na VPS)

```cron
# /etc/cron.d/stagebrain-backup
0 3 * * * deploy /opt/stagebrain/infra/scripts/backup.sh >> /var/log/stagebrain-backup.log 2>&1
```

### Restore

```bash
# infra/scripts/restore.sh
# 1. Pobierz backup
rclone copy remote:stagebrain-backups/daily/stagebrain_20260515_030000.sql.gz /tmp/

# 2. Zatrzymaj API (żeby nie pisał do DB)
docker compose stop api worker

# 3. Restore
gunzip -c /tmp/stagebrain_20260515_030000.sql.gz | \
  docker compose exec -T postgres psql -U stagebrain stagebrain

# 4. Uruchom API
docker compose start api worker
```

---

## 7. Pierwszy Setup VPS (od zera)

### Checklist

```bash
# 1. Utwórz VPS na Hetzner (CPX31, Ubuntu 24.04, lokalizacja: Falkenstein)

# 2. SSH na serwer
ssh root@<vps-ip>

# 3. Utwórz użytkownika deploy
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# 4. Zainstaluj Docker
curl -fsSL https://get.docker.com | sh

# 5. Skonfiguruj SSH key (dla GitHub Actions deploy)
su - deploy
mkdir ~/.ssh
# Dodaj klucz publiczny do ~/.ssh/authorized_keys

# 6. Sklonuj repo i skonfiguruj
cd /opt
sudo mkdir stagebrain && sudo chown deploy:deploy stagebrain
cd stagebrain
git clone <repo-url> .

# 7. Utwórz .env (produkcyjne sekrety)
cp .env.example .env
nano .env  # Uzupełnij produkcyjne wartości

# 8. Zaloguj się do GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# 9. Uruchom stack
docker compose pull
docker compose up -d

# 10. Uruchom migracje
docker compose exec api alembic upgrade head

# 11. Skonfiguruj DNS (A record → VPS IP)
# 12. Caddy automatycznie uzyska SSL
```

---

## 8. Zasady bezpieczeństwa

- **Sekrety** nigdy w repozytorium — `.env` na VPS, sekrety w GitHub Actions.
- **SSH** — tylko klucze (wyłączony password auth). Firewall (ufw): 22, 80, 443.
- **Docker images** — z GHCR (prywatne repo), nie z publicznego Docker Hub.
- **PostgreSQL** — dostępny tylko wewnątrz Docker network (nie exposed na host).
- **Deploy** — nigdy w trakcie live show. Deployment window: między koncertami.
- **Updates** — `apt update && apt upgrade` co tydzień. Docker images rebuilded w CI.
