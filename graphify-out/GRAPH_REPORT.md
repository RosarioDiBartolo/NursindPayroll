# Graph Report - NursindPayroll  (2026-06-07)

## Corpus Check
- 52 files · ~8,443 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 369 nodes · 669 edges · 24 communities (21 shown, 3 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `05b166e3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Payroll Crawler|Payroll Crawler]]
- [[_COMMUNITY_Payroll Crawler|Payroll Crawler]]
- [[_COMMUNITY_Payroll Crawler|Payroll Crawler]]
- [[_COMMUNITY_Test Suite|Test Suite]]
- [[_COMMUNITY_API Sessions|API Sessions]]
- [[_COMMUNITY_Deployment Config|Deployment Config]]
- [[_COMMUNITY_Payroll Crawler|Payroll Crawler]]
- [[_COMMUNITY_Deployment Config|Deployment Config]]
- [[_COMMUNITY_Frontend Data Flow|Frontend Data Flow]]
- [[_COMMUNITY_API Sessions|API Sessions]]
- [[_COMMUNITY_Frontend Data Flow|Frontend Data Flow]]
- [[_COMMUNITY_Deployment Config|Deployment Config]]
- [[_COMMUNITY_Test Suite|Test Suite]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `CrawlBatch` - 20 edges
2. `CrawlJob` - 20 edges
3. `CrawlSession` - 18 edges
4. `compilerOptions` - 18 edges
5. `create_app()` - 12 edges
6. `TemporaryCrawlerError` - 11 edges
7. `Nursind` - 11 edges
8. `CrawlerError` - 10 edges
9. `PayrollCrawler` - 10 edges
10. `utcnow()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Payroll Expiration Policy` --semantically_similar_to--> `Maintenance Service`  [INFERRED] [semantically similar]
  README.md → compose.yml
- `Asynchronous Payroll PDF Crawling` --semantically_similar_to--> `Payroll Crawling Flow`  [INFERRED] [semantically similar]
  backend/README.md → frontend/README.md
- `Separated Login Session and Crawl Commands` --semantically_similar_to--> `Payroll Crawling Flow`  [INFERRED] [semantically similar]
  questions.md → frontend/README.md
- `Frontend Backend Communication` --semantically_similar_to--> `Vite API URL Configuration`  [INFERRED] [semantically similar]
  questions.md → frontend/README.md
- `Resumable Crawl Batch View` --semantically_similar_to--> `Payroll Crawling Flow`  [INFERRED] [semantically similar]
  questions.md → frontend/README.md

## Import Cycles
- 1-file cycle: `backend/nursind/redis_client.py -> backend/nursind/redis_client.py`
- 3-file cycle: `backend/nursind/__init__.py -> backend/nursind/routes.py -> backend/nursind/tasks.py -> backend/nursind/__init__.py`

## Hyperedges (group relationships)
- **Compose Application Services** — compose_frontend_service, compose_web_service, compose_worker_service, compose_maintenance_service, compose_redis_service [EXTRACTED 1.00]
- **Asynchronous Payroll Crawling Pipeline** — frontend_readme_payroll_flow, backend_readme_flask_api, backend_readme_rq_worker, compose_redis_service [INFERRED 0.95]
- **Shared Payroll Storage** — compose_web_service, compose_worker_service, compose_maintenance_service, compose_payroll_data [EXTRACTED 1.00]

## Communities (24 total, 3 thin omitted)

### Community 0 - "Payroll Crawler"
Cohesion: 0.08
Nodes (38): cancelPayrollBatch(), createPayrollBatch(), createPayrollSession(), deletePayrollBatch(), deletePayrollSession(), downloadPayrollPdf(), getPayrollSession(), normalized() (+30 more)

### Community 1 - "Payroll Crawler"
Cohesion: 0.09
Nodes (47): CrawlSession, CrawlSession, Exception, CrawlBatch, CrawlJob, Config, crawler_from_config(), TemporaryCrawlerError (+39 more)

### Community 2 - "Payroll Crawler"
Cohesion: 0.06
Nodes (48): Asynchronous Payroll PDF Crawling, Flask API, Local development, Nursind Backend, RQ Worker, Cryptography, Backend Development Requirements, FakeRedis (+40 more)

### Community 3 - "Test Suite"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, postcss, tailwindcss, @types/file-saver (+9 more)

### Community 4 - "API Sessions"
Cohesion: 0.15
Nodes (15): apiClient, cn(), configuredBaseUrl, BustePaga(), useCreatePayrollSession(), useDeletePayrollSession(), Button, ButtonProps (+7 more)

### Community 5 - "Deployment Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+13 more)

### Community 6 - "Payroll Crawler"
Cohesion: 0.19
Nodes (11): AuthenticationError, CrawlerError, InvalidCrawlerResponse, PayrollCrawler, crawler(), Response, Session, test_download_returns_pdf() (+3 more)

### Community 7 - "Deployment Config"
Cohesion: 0.14
Nodes (13): aliases, components, utils, rsc, $schema, style, tailwind, baseColor (+5 more)

### Community 8 - "Frontend Data Flow"
Cohesion: 0.07
Nodes (27): dependencies, axios, class-variance-authority, clsx, file-saver, jszip, lucide-react, @radix-ui/react-label (+19 more)

### Community 9 - "API Sessions"
Cohesion: 0.16
Nodes (11): create_session(), fake_dependencies(), FakeCrawler, FakeCredentials, FakePortalSession, FakeQueue, test_batch_delete_removes_jobs_and_files(), test_create_session_and_explicit_month_range() (+3 more)

### Community 10 - "Frontend Data Flow"
Cohesion: 0.28
Nodes (4): ErrorWithStatus, queryClient, RETRYABLE_HTTP_STATUSES, shouldRetryQuery()

### Community 11 - "Deployment Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (5): Deployment, Flusso payroll, Sviluppo, Verifiche, Workers Analyzer App

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (7): FakeCrawler, FakeCredentialStore, FakeLock, FakePortalSession, FakeRedis, test_worker_blocks_batch_and_does_not_start_next_month(), test_worker_completes_batch_in_month_order()

## Ambiguous Edges - Review These
- `RQ Worker` → `Frontend Backend Communication`  [AMBIGUOUS]
  questions.md · relation: conceptually_related_to

## Knowledge Gaps
- **116 isolated node(s):** `PreToolUse`, `TestConfig`, `$schema`, `style`, `rsc` (+111 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `RQ Worker` and `Frontend Backend Communication`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `CrawlJob` connect `Payroll Crawler` to `API Sessions`, `Community 23`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `CrawlBatch` connect `Payroll Crawler` to `API Sessions`, `Community 23`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `CrawlSession` connect `Payroll Crawler` to `API Sessions`, `Community 23`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `CrawlBatch` (e.g. with `CrawlSession` and `CrawlSession`) actually correct?**
  _`CrawlBatch` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `CrawlJob` (e.g. with `CrawlSession` and `CrawlSession`) actually correct?**
  _`CrawlJob` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `CrawlSession` (e.g. with `CrawlSession` and `CrawlSession`) actually correct?**
  _`CrawlSession` has 14 INFERRED edges - model-reasoned connections that need verification._