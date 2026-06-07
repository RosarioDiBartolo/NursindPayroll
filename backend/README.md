# Nursind Backend

Flask API and RQ worker for asynchronous payroll PDF crawling.

## Local development

Create the local configuration:

```powershell
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Paste the generated value into `CREDENTIAL_ENCRYPTION_KEY` in `.env` and set
`CRAWLER_EMAIL`. The `.env` file is ignored by Git and is loaded automatically
by both the API and the worker.

Install dependencies and start Redis. Then run the API and worker in separate
PowerShell terminals:

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

The complete frontend, API, worker, Redis and cleanup stack is defined in the
sibling `NursindDeployment` directory.
