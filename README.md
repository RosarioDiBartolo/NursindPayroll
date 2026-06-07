# Nursind

Applicazione full stack per scaricare e gestire le buste paga dal portale
remoto.

## Servizi

- `frontend`: React/Vite compilato e servito da Nginx
- `web`: API Flask
- `worker`: worker RQ per i job di download
- `redis`: coda e sessioni temporanee
- `maintenance`: scadenza delle buste paga e pulizia dei job

Nginx e l'unico servizio esposto. L'applicazione non deve essere pubblicata
direttamente su Internet: usare una rete privata o VPN.

## Avvio con Docker

Requisiti: Docker Desktop su Windows oppure Docker Engine con Compose su Linux.

```powershell
Copy-Item .env.example .env
```

Generare una chiave Fernet:

```powershell
docker run --rm python:3.12-slim sh -c "pip install -q cryptography && python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
```

Inserire il valore in `CREDENTIAL_ENCRYPTION_KEY` dentro `.env` e configurare
`CRAWLER_EMAIL` se richiesto dal portale. Quindi:

```powershell
docker compose up --build -d
docker compose ps
```

Aprire `http://127.0.0.1:8080`. Lo stato dell'API e disponibile su
`http://127.0.0.1:8080/api/health`.

## Operazioni

```powershell
docker compose logs -f web worker
docker compose restart
docker compose down
```

I dati SQLite e le buste paga temporanee sono conservati nel volume
`payroll_data`. Redis usa il volume `redis_data`. Le buste paga scadono dopo 24
ore e i metadati dei job dopo 30 giorni.

`CRAWLER_TLS_VERIFY=false` resta intenzionalmente attivo finche la catena dei
certificati del portale non viene verificata.

## Sviluppo senza Docker

L'avvio senza Docker e secondario. Esportare manualmente le variabili richieste,
usare `REDIS_URL=redis://localhost:6379/0`, quindi avviare API e worker dalle
rispettive directory.

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe Main.py
.\.venv\Scripts\python.exe worker.py
```

Frontend:

```powershell
cd frontend
npm ci
npm test
npm run lint
npm run build
npm run dev
```
