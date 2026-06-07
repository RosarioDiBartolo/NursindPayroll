# Nursind Backend

Flask API and RQ worker for permanent crawl sessions and autonomous,
strictly-sequential payroll batches. Session state is streamed to clients over
server-sent events.

## Local development

Docker Compose from the repository root is the supported startup method. For a
manual local run, export the required environment variables, start Redis, then
run the API and worker in separate PowerShell terminals:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe Main.py
```

```powershell
.\.venv\Scripts\python.exe worker.py
```

Run tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

The complete frontend, API, worker, Redis and cleanup stack is defined in
`compose.yml` at the repository root.
