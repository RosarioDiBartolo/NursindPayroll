# Workers Analyzer App

Frontend React e TypeScript dedicato esclusivamente all'estrazione automatizzata
delle buste paga.

## Sviluppo

```sh
npm install
npm run dev
```

Se il backend non e disponibile sullo stesso origin, copia `.env.example` in
`.env.local` e imposta `VITE_API_URL` con l'origin del backend, senza `/api`.

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
nella directory sorella `NursindDeployment`.

Firebase Authentication, Firebase Hosting e Render non sono utilizzati.
