# Troubleshooting

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

---

Typowe problemy i ich rozwiązania podczas pracy z StageBrain.

## 1. Docker Compose — nie startuje

### Objaw: "Port already in use"

PostgreSQL (5432) lub Redis (6379) konfliktuje z lokalną instancją.

```bash
# Sprawdź co zajmuje port
lsof -i :5432
lsof -i :6379

# Opcja A: zatrzymaj lokalny serwis
brew services stop postgresql  # macOS
sudo systemctl stop postgresql  # Linux

# Opcja B: zmień port w docker-compose.override.yml
# ports:
#   - "5433:5432"  # PostgreSQL na innym porcie
```

### Objaw: "Cannot connect to Docker daemon"

```bash
# macOS: upewnij się, że Docker Desktop jest uruchomiony
open -a Docker

# Linux: sprawdź serwis
sudo systemctl start docker
sudo systemctl enable docker
```

### Objaw: "no space left on device" (Docker)

```bash
# Wyczyść nieużywane obrazy i kontenery
docker system prune -a

# Sprawdź zużycie przestrzeni Docker
docker system df
```

---

## 2. Python / Backend

### Objaw: "ModuleNotFoundError" przy uruchamianiu API

```bash
# Upewnij się, że jesteś w venv
which python
# Powinno wskazywać: apps/api/.venv/bin/python

# Aktywuj venv
cd apps/api
source .venv/bin/activate

# Reinstaluj zależności
pip install -r requirements.txt
```

### Objaw: "alembic.util.exc.CommandError: Can't locate revision"

Migracje bazy danych są rozjechane (np. po rebasing brancha).

```bash
# Sprawdź aktualny stan migracji
docker compose exec api alembic current

# Opcja A: reset bazy (lokalne środowisko)
docker compose down -v
docker compose up -d postgres redis
docker compose exec api alembic upgrade head

# Opcja B: stamp na konkretną wersję
docker compose exec api alembic stamp head
```

### Objaw: "asyncpg.TooManyConnectionsError"

Zbyt wiele jednoczesnych połączeń do PostgreSQL.

```bash
# Sprawdź aktywne połączenia
docker compose exec postgres psql -U stagebrain -c "SELECT count(*) FROM pg_stat_activity;"

# Zwiększ pool w config.py lub restart API
docker compose restart api
```

### Objaw: Backend startuje, ale `/health` zwraca błąd DB

```bash
# Sprawdź czy PostgreSQL jest ready
docker compose exec postgres pg_isready

# Sprawdź logi PostgreSQL
docker compose logs postgres

# Sprawdź DATABASE_URL w .env
# Typowy błąd: użycie localhost zamiast "postgres" (nazwa serwisu Docker)
# Poprawnie: postgresql+asyncpg://stagebrain:localdev@postgres:5432/stagebrain
# Błędnie:   postgresql+asyncpg://stagebrain:localdev@localhost:5432/stagebrain
```

---

## 3. Frontend / React

### Objaw: TypeScript nie widzi typów z `shared-types`

```bash
# Regeneruj typy z OpenAPI
cd apps/web
npm run generate-types

# Upewnij się, że backend jest uruchomiony (potrzebny /openapi.json)
curl http://localhost:8000/openapi.json | head -c 200
```

### Objaw: Vite HMR nie działa (zmiany nie odświeżają się)

```bash
# Restart Vite dev server
cd apps/web
npm run dev

# Jeśli nie pomaga — wyczyść cache Vite
rm -rf node_modules/.vite
npm run dev
```

### Objaw: "CORS error" w konsoli przeglądarki

Frontend (port 5173) próbuje połączyć się z API (port 8000).

```python
# Sprawdź CORS config w apps/api/src/main.py
# Powinien zawierać:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 4. WebSocket

### Objaw: WebSocket nie łączy się (panel nie pokazuje danych live)

```bash
# 1. Sprawdź czy API jest uruchomione
curl http://localhost:8000/health

# 2. Testuj WebSocket ręcznie (wscat)
npx wscat -c ws://localhost:8000/ws/panel

# 3. Sprawdź logi API
docker compose logs -f api | grep -i websocket

# 4. Sprawdź przeglądarkę (DevTools → Network → WS)
# Filtr: WS → sprawdź czy jest połączenie i jakie frames przychodzą
```

### Objaw: Audio WebSocket nie wysyła danych

```bash
# 1. Sprawdź pozwolenie na mikrofon w przeglądarce
# Chrome: chrome://settings/content/microphone

# 2. Sprawdź czy audio source page jest otwarta
# URL: http://localhost:5173/audio-source (lub dedykowana strona)

# 3. Sprawdź format audio (oczekiwany: PCM 16-bit, 16kHz mono)
# Logi API powinny pokazywać received frames:
docker compose logs -f api | grep -i "audio.*frame"
```

### Objaw: WebSocket rozłącza się co kilka sekund

```bash
# Sprawdź timeout w konfiguracji
# FastAPI WebSocket domyślnie nie ma timeout — problem może być w proxy

# Jeśli używasz Caddy lokalnie (nietypowe):
# Dodaj websocket timeout w Caddyfile

# Sprawdź czy przeglądarka nie zasypia (laptop w uśpieniu, tab w tle)
# Chrome throttluje WebSocket w background tabs
```

---

## 5. TimescaleDB

### Objaw: "extension timescaledb is not available"

```bash
# Upewnij się, że używasz obrazu timescale, nie standardowego postgres
# docker-compose.yml powinien mieć:
#   postgres:
#     image: timescale/timescaledb:latest-pg16

# Sprawdź czy extension jest włączony
docker compose exec postgres psql -U stagebrain -c "SELECT * FROM pg_extension WHERE extname = 'timescaledb';"

# Włącz ręcznie (jeśli brakuje)
docker compose exec postgres psql -U stagebrain -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
```

### Objaw: Continuous aggregate nie odświeża się

```bash
# Sprawdź policy
docker compose exec postgres psql -U stagebrain -c "
  SELECT * FROM timescaledb_information.continuous_aggregate_stats;
"

# Ręczne odświeżenie
docker compose exec postgres psql -U stagebrain -c "
  CALL refresh_continuous_aggregate('engagement_per_minute', NULL, NULL);
"
```

---

## 6. Audio Pipeline

### Objaw: "librosa.load() failed" lub wolne przetwarzanie

```bash
# librosa wymaga ffmpeg (w Docker powinien być zainstalowany)
docker compose exec api which ffmpeg

# Jeśli brak — dodaj do Dockerfile:
# RUN apt-get update && apt-get install -y ffmpeg

# Sprawdź rozmiar audio buffer
docker compose logs -f api | grep -i "buffer\|processing"
```

### Objaw: YAMNet nie klasyfikuje (always returns "unknown")

```bash
# Sprawdź czy model jest pobrany
docker compose exec api python -c "
from src.audio.classifier import YAMNetClassifier
c = YAMNetClassifier()
print(c.model_path)
"

# Model powinien być w: apps/api/models/yamnet.tflite (lub .onnx)
# Jeśli brak — pobierz przy pierwszym uruchomieniu (logika w classifier.py)
```

---

## 7. CI/CD

### Objaw: GitHub Actions build fails — "pip install" error

```bash
# Sprawdź czy requirements.txt jest aktualny
cd apps/api
pip freeze > requirements.txt

# Lub jeśli używamy poetry:
poetry export -f requirements.txt > requirements.txt
```

### Objaw: Deploy fails — "Permission denied" na VPS

```bash
# Sprawdź SSH key w GitHub Secrets
# Klucz musi mieć dostęp do usera "deploy" na VPS

# Na VPS — sprawdź uprawnienia
ls -la /opt/stagebrain/
# Owner powinien być: deploy:deploy

# Sprawdź czy deploy user jest w grupie docker
groups deploy
# Powinno zawierać: docker
```

---

## 8. Ogólne

### Reset całego środowiska lokalnego

Gdy nic nie pomaga — "nuclear option":

```bash
# Zatrzymaj i usuń wszystko (kontenery, volumes, sieci)
docker compose down -v --remove-orphans

# Usuń Python venv
rm -rf apps/api/.venv

# Usuń node_modules
rm -rf apps/web/node_modules

# Zacznij od nowa
docker compose up -d postgres redis
cd apps/api && python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd apps/web && npm install
docker compose exec api alembic upgrade head
```

### Przydatne komendy diagnostyczne

```bash
# Status kontenerów
docker compose ps

# Zasoby (CPU/RAM per kontener)
docker stats

# Logi z timestampami
docker compose logs -f --timestamps api

# Wejdź do kontenera (debug)
docker compose exec api bash
docker compose exec postgres psql -U stagebrain

# Redis CLI
docker compose exec redis redis-cli
redis-cli> PING
# → PONG
redis-cli> PUBSUB CHANNELS *
# → lista aktywnych kanałów pub/sub
```
