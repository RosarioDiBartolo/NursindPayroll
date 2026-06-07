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

1. accede a una sessione permanente con `POST /api/crawl-sessions`, riusando
   quella dello stesso username se esiste;
2. crea esplicitamente uno o piu batch con un intervallo scelto dall'utente;
3. riceve via SSE lo stato dei batch e dei job;
4. scarica i PDF singolarmente o in un archivio ZIP;
5. elimina esplicitamente batch o sessione quando non servono piu.

Le credenziali del portale non vengono conservate nel browser. Restano cifrate
in Redis fino all'eliminazione esplicita della sessione.

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
