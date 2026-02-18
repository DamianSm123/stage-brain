# ADR-0006: Deployment — Docker Compose na VPS

**Status**: Accepted
**Data**: 2026-02-18
**Autorzy**: Zespół architektury (sesja architektoniczna)

---

## Kontekst

StageBrain MVP musi być wdrożony na infrastrukturze z budżetem 200-800 PLN/miesiąc. System obsługuje 1 koncert na raz, 1-2 operatorów. Wymagania:

- Stabilność (90+ min ciągłej pracy podczas koncertu).
- Szybki deployment (push → deploy w minutach).
- Prosty disaster recovery (restart, rollback).
- SSL/HTTPS (panel operatora na venue musi być szyfrowany).

## Rozważane Alternatywy

### 1. Kubernetes (K8s)

- Skalowalność, auto-healing, rolling deployments.
- **Problem**: Overkill dla jednego serwera, 1 koncertu na raz. Managed K8s (EKS/GKE) kosztuje 200+ PLN/mies. sam cluster, bez node'ów. Self-hosted K8s to tydzień setupu. Złożoność operacyjna nieproporcjonalna do potrzeb.

### 2. Serverless (AWS Lambda / Vercel)

- Zero zarządzania serwerami, pay-per-use.
- **Problem**: Cold start problematyczny dla WebSocket i audio processing. Lambda nie wspiera natywnie persistent WebSocket. Audio pipeline wymaga ciągłego procesu, nie funkcji event-driven. Vendor lock-in.

### 3. PaaS (Heroku / Railway / Render)

- Prosty deployment (git push → deploy).
- **Problem**: Brak kontroli nad siecią (WebSocket timeout, binary frames). Koszt szybko rośnie przy 4 serwisach (API, worker, postgres, redis). Latencja: serwery w US, nie w Europie.

### 4. Docker Compose na VPS (wybrana)

- Pełna kontrola. Jeden serwer, wszystkie serwisy w Docker Compose.

## Decyzja

Wybieramy **Docker Compose na pojedynczym VPS** (Hetzner Cloud lub DigitalOcean).

### Konfiguracja serwisów

```yaml
services:
  api:
    # FastAPI backend (API + WebSocket + Audio processing)
    image: ghcr.io/org/stagebrain-api:latest
    restart: always
    depends_on: [postgres, redis]
    environment:
      - DATABASE_URL=postgresql+asyncpg://...
      - REDIS_URL=redis://redis:6379

  worker:
    # Celery/arq worker (raporty, eksport)
    image: ghcr.io/org/stagebrain-api:latest
    command: ["celery", "-A", "worker", "worker"]
    restart: always
    depends_on: [postgres, redis]

  web:
    # Nginx serwujący React SPA
    image: ghcr.io/org/stagebrain-web:latest
    restart: always

  postgres:
    image: timescale/timescaledb:latest-pg16
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always

  caddy:
    # Reverse proxy + automatyczny SSL (Let's Encrypt)
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
```

### Rekomendacja VPS

| Opcja | Spec | Koszt | Uwagi |
|:---|:---|:---|:---|
| **Hetzner CPX31** (rekomendowana) | 4 vCPU AMD, 8 GB RAM, 160 GB SSD | ~68 PLN/mies. | Najlepszy stosunek cena/wydajność, data center w Europie |
| Hetzner CAX21 (ARM) | 4 vCPU ARM, 8 GB RAM | ~32 PLN/mies. | Tańszy, ale wymaga ARM Docker builds |
| DigitalOcean Droplet | 4 vCPU, 8 GB RAM | ~195 PLN/mies. | Prostszy panel, droższy |

### CI/CD (GitHub Actions)

```
Push na main → Build Docker images → Push do GHCR → SSH do VPS → docker compose pull → docker compose up -d → Alembic migration
```

1. **Build**: GitHub Actions buduje obrazy Docker (api + web) i pushuje do GitHub Container Registry.
2. **Deploy**: SSH do VPS → `docker compose pull && docker compose up -d --remove-orphans`.
3. **Migration**: `docker compose exec api alembic upgrade head`.
4. **Rollback**: `docker compose pull <previous-tag> && docker compose up -d`.

### Backup

- **PostgreSQL**: Automatyczny daily dump (`pg_dump`) → Object Storage (Hetzner Storage Box lub Cloudflare R2).
- **Retencja**: 7 dni daily, 4 tygodnie weekly.
- **VPS snapshot**: Weekly snapshot VPS jako catastrophic recovery.
- **Docker volumes**: Regularne snapshoty.

### SSL / HTTPS

- **Caddy**: Automatyczny SSL z Let's Encrypt. Zero konfiguracji — podajesz domenę, Caddy robi resztę.
- Alternatywa: Traefik (więcej konfiguracji, więcej features).

## Uzasadnienie

1. **Koszt**: ~68 PLN/mies. za pełną infrastrukturę (VPS + storage). Mieści się w budżecie 200-800 PLN.
2. **Prostota**: `docker compose up -d` i cały stack działa. Zero abstrakcji K8s, zero vendorlock.
3. **Kontrola**: Pełna kontrola nad siecią, WebSocket timeout, binary frames, resource limits.
4. **Stabilność**: Docker `restart: always` podnosi serwis w 2-5s po awarii.
5. **Europejski data center**: Hetzner ma DC w Finlandii i Niemczech — niska latencja dla polskich venue.
6. **Szybki deployment**: Push → 2-3 min → nowa wersja na produkcji.

## Konsekwencje

- (+) Niski koszt (~68 PLN/mies.).
- (+) Pełna kontrola nad infrastrukturą.
- (+) Prosty setup i maintenance.
- (+) Docker Compose działa identycznie lokalnie i na produkcji.
- (-) Single point of failure (jeden VPS). Mitygacja: `restart: always`, daily backups, VPS snapshot.
- (-) Brak auto-scaling. Akceptowalne: 1 koncert na raz, 1 operator.
- (-) Brak zero-downtime deployment (krótka przerwa przy `docker compose up`). Mitygacja: deploy między koncertami, nie w trakcie.
- (-) Ręczne zarządzanie VPS (updates, security patches).

## Rewizja

Ta decyzja powinna zostać zrewidowana, jeśli:
- Multi-venue (wiele równoczesnych koncertów) → rozważyć K8s lub wiele VPS.
- Wymagane zero-downtime deployment → rozważyć blue-green na jednym VPS lub K8s.
- Budżet pozwala na managed services → rozważyć PaaS z europejskim DC.
