# Workers Analyzer App

Frontend React application for analyzing healthcare worker PDF documents and extracting payroll-related data.

The app is written in Italian and is designed around two authenticated workflows:

- analysis blocks for uploaded employee PDF files
- payroll PDF extraction across months

Most domain processing is delegated to a backend API. This repository contains the browser application, routing, authentication UI, file upload controls, result tables, and download flows.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- React Router
- Axios
- Radix UI-style local components
- JSZip and FileSaver for ZIP exports

## Main Features

### Authenticated Workspace

The root route (`/`) is protected by Firebase Auth. After login, users can create one or more "Blocco Analisi" sections.

Each analysis block supports:

- selecting an azienda
- uploading one or more PDF files
- choosing an operation

Available operations:

- `Conteggio`: counts shifts by year, including mattine, pomeriggi, notti, and domeniche/sabati mattina.
- `Differenziale`: calculates entrate, uscite, and total differential.
- `Estrazione`: downloads CSV exports for full data, entrate, or uscite.

### Payroll Extraction

The `/buste-paga` route is also protected by Firebase Auth and contains a separate backend login form.

After successful backend authentication, the crawler requests monthly payroll PDFs from January 2019 through the current month. Completed files can be downloaded together as a ZIP archive.

## Project Structure

```txt
src/
  App.tsx                         Router setup
  config.ts                       Firebase setup and app constants
  Pages/
    Login.tsx                     Firebase login page
    Layout.tsx                    Authenticated shell
    Tasks.tsx                     Main analysis workspace
    BustePaga.tsx                 Payroll extraction workflow
  components/
    HOC/ProtectedRoute.tsx        Route guard
    Widgets/
      Crawler.tsx                 Monthly payroll crawler
      FileCrawler.tsx             Per-month crawler status
      FileUploader.tsx            File selection control
      blocks/
        block.tsx                 Analysis block controller
        conteggio.tsx             Shift counting operation
        differenziale.tsx         Differential operation
        estrazione.tsx            CSV extraction operation
    ui/                           Reusable UI components
  lib/
    utils.ts                      Axios client, utility helpers, useAxios hook
    tasks/                        Task context/provider
```

## Backend API

The frontend uses the Axios client configured in `src/lib/utils.ts`.

Development base URL:

```txt
http://127.0.0.1:8080
```

Production base URL:

```txt
https://nursindbackend.onrender.com
```

Endpoints used by the frontend:

```txt
GET  /api/aziende
POST /api/conteggio/:Azienda
POST /api/differenziale
POST /api/parse/:Azienda/:what
POST /api/login
POST /api/request
```

The PDF parsing, counting, CSV generation, and payroll request logic are expected to be implemented by the backend.

## Getting Started

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Deployment

The app includes Firebase Hosting configuration in `firebase.json`.

Build output is served from:

```txt
dist
```

Firebase rewrites route `/api/**` requests to the production backend and route all other requests to `index.html` for React Router support.

## Notes

- The repository currently contains only the frontend.
- Firebase Auth protects the main routes.
- The `/buste-paga` page performs an additional backend authentication step before crawling payroll PDFs.
- The available aziende are loaded from `GET /api/aziende`.
