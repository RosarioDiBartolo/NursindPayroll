# Nursind Backend

Flask API and RQ worker for asynchronous payroll PDF crawling.

## Local development

Create a Fernet key:

```powershell
.\.venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Configure the variables from `.env.example`, start Redis, then run:

```powershell
.\.venv\Scripts\python.exe Main.py
.\.venv\Scripts\python.exe worker.py
```

Run tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

The complete frontend, API, worker, Redis and cleanup stack is defined in the
sibling `NursindDeployment` directory.
