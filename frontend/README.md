# Workers Analyzer App

Frontend React e TypeScript dedicato esclusivamente all'estrazione automatizzata
delle buste paga.

## Sviluppo

```sh
npm install
npm run dev
```

Per lo sviluppo manuale impostare `VITE_API_URL` nell'ambiente o in un file
locale non tracciato, indicando l'origin del backend senza `/api`.

## Flusso payroll

La home:

1. crea una sessione temporanea con `POST /api/crawl-sessions`;
2. avvia un job asincrono per ogni mese;
3. controlla lo stato dei job;
4. scarica i PDF completati in un archivio ZIP;
5. elimina la sessione quando non serve piu.

Le credenziali del portale non vengono conservate nel browser dopo il login.

## Verifiche

```sh
npm run build
npm test
npm run lint
```

## Deployment

L'immagine di produzione compila l'app Vite e la serve con Nginx. Nginx inoltra
le richieste `/api` al servizio backend. Lo stack Compose completo si trova
alla root del monorepo.

Firebase Authentication, Firebase Hosting e Render non sono utilizzati.
