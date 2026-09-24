# Impianti sportivi in Puglia — soluzione

Soluzione di riferimento della prova pratica, usata nel laboratorio Kubernetes: la guida è nel [README](README.md).

Microservizio Spring Boot 4 (Java 21) che importa dall'open data della Regione Puglia gli enti proprietari di impianti sportivi, li salva su PostgreSQL e li espone via REST. In [`web/`](web/) c'è il frontend React che copre tutte le funzionalità: vedi [Frontend](#frontend).

## Avvio

Da una cartella appena clonata:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- Stato: http://localhost:8080/actuator/health

Partono tre servizi: `db` (PostgreSQL), `app` (il backend) e `web` (nginx con la build del frontend, che inoltra `/api/...` ad `app`). Poi si lancia l'importazione dalla pagina «Importazione» del frontend, oppure con `POST /import/enti`. Tutte le chiamate, con i casi di errore, sono in [http/impianti.http](http/impianti.http).

## Test

```bash
./mvnw test      # test di unità, senza Docker
./mvnw verify    # anche i test di integrazione: PostgreSQL in Testcontainers, serve Docker
```

| Tipo | Classe | Che cosa verifica |
|---|---|---|
| Unità | `NormalizzatoreTest` | trim, stringa vuota a null, telefono senza spazi con punti, barre e trattini conservati |
| Unità | `TipoEnteTest` | «Privato» e «Pubblico» convertiti nell'enum, valori sconosciuti rifiutati |
| Unità | `EnteSorgenteJsonTest` | radice array, chiavi maiuscole, CAP, EMAIL, FAX e PEC ignorati |
| Unità | `OpenDataClientTest` | URL dalla configurazione; errore 5xx e timeout diventano `SorgenteNonDisponibileException` |
| Unità | `ImportazioneServiceTest` | ID vuoto scartato, idempotenza, duplicati nel file, record non validi scartati senza fermare gli altri, province lette una volta |
| Unità | `EnteServiceTest` | creazione normalizzata, idSorgente duplicato (anche nella corsa sul vincolo UNIQUE), provincia ed ente inesistenti |
| Unità | `ControllerTest` | rotte, validazione del corpo e dei parametri, 400 con i campi in errore, 404, 409, 503, paginazione 20 e tetto 100, 405 su `GET /import/enti` |
| Integrazione | `ImportazioneIT` | il file open data reale: 1.739 inseriti e 1 scartato, poi 1.739 già presenti; normalizzazione sui record veri; 503 con la sorgente giù |
| Integrazione | `EntiApiIT` | le API su PostgreSQL vero: creazione e Location, 409, 404, province della migrazione, filtro per provincia, ordinamento, tetto della pagina, nessuna N+1 (2 query per 20 enti) |

## Dove sta ogni requisito

| Requisito | Dove |
|---|---|
| Schema da Flyway, `ddl-auto: validate` | `src/main/resources/db/migration`, `application.yaml` |
| Province dalla migrazione, id assegnati lì | `V1__provincia.sql` |
| `id_sorgente` UNIQUE, tipo enum, telefono testo fino a 30 | `V2__ente.sql`, `domain/Ente.java` |
| Provincia LAZY senza N+1 | `@EntityGraph` in `repository/EnteRepository.java` |
| Client dichiarativo, URL in configurazione, timeout | `client/OpenDataClient.java`, `config/OpenDataClientConfig.java`, `application.yaml` |
| DTO di confine con `@JsonIgnoreProperties` | `client/EnteSorgente.java` |
| Normalizzazione | `importazione/Normalizzatore.java` |
| Import idempotente, scarti contati, province lette una volta | `importazione/ImportazioneService.java` |
| Import su `/import/enti` e non su `/enti/import` | `web/ImportController.java` |
| DTO in uscita e mapper | `web/dto`, `web/mapper` |
| Paginazione: default 20 per denominazione ASC, massimo 100 | `@PageableDefault` nei controller, `spring.data.web.pageable.max-page-size` |
| Errori ProblemDetail, 400 con i campi in errore, 404, 409, 503 | `web/GestoreErrori.java` |
| OpenAPI documentato | annotazioni nei controller e nei DTO, `config/OpenApiConfig.java` |
| Docker multi-stage, `.dockerignore`, compose con volume e healthcheck | `Dockerfile`, `.dockerignore`, `docker-compose.yml` |
| Build, test e push su GHCR | `.github/workflows/ci.yml` |

## Frontend

React 19, Vite 8, react-router-dom 7, Tailwind CSS 4, oxlint; Vitest 5 con Testing Library per i test di unità, Playwright per gli end-to-end. Stesse versioni e stessa struttura di `cinema-web`. Nessuna autenticazione.

### Pagine

| Pagina | Percorso | API |
|---|---|---|
| Elenco degli enti | `/enti?page=&size=&sort=` | `GET /enti` |
| Dettaglio di un ente | `/enti/:id` | `GET /enti/{id}` |
| Nuovo ente | `/enti/nuovo` | `GET /province`, `POST /enti` |
| Province | `/province` | `GET /province` |
| Enti di una provincia | `/province/:id?page=&size=&sort=` | `GET /province/{id}/enti`, `GET /province` per il nome |
| Importazione | `/importazione` | `POST /import/enti` |

Ogni pagina ha lo stato di caricamento, quello di errore (il `title` e il `detail` del ProblemDetail) e quello di lista vuota, per esempio prima dell'importazione.

- **Paginazione e ordinamento nell'URL**, con gli stessi nomi e lo stesso significato dei parametri del backend: `page` da 0, `size` fino a 100, `sort=campo,asc|desc`. Il clic su un'intestazione ordina per quella colonna (per la provincia `provincia.nome`); un secondo clic inverte la direzione. Cambiare dimensione o ordinamento riporta alla prima pagina. Un valore non valido scritto a mano nell'URL torna al default invece di finire al backend.
- **Spareggio per id**: 40 denominazioni si ripetono, e a parità di valore l'ordine delle righe non è definito, quindi un ente potrebbe comparire in due pagine e un altro in nessuna. Il modulo API aggiunge sempre `sort=id,asc` come secondo criterio; un test e2e scorre tutte le 18 pagine da 100 e conta 1.739 enti distinti.
- **Form «Nuovo ente»**: la provincia si sceglie fra quelle di `GET /province` e il tipo da una select. La validazione lato client ha le stesse regole di `EnteRequest` (obbligatori e lunghezze massime, misurate sul valore inviato come fa `@Size`). Gli errori `[{ campo, messaggio }]` di un 400 compaiono accanto ai campi, il 409 sull'`idSorgente`, il 404 sulla provincia. Dopo la creazione si va al dettaglio, con l'id letto dall'header `Location`.
- **Importazione**: il pulsante resta disabilitato mentre l'import è in corso; alla fine si vedono i tre contatori. Sul 503 la pagina spiega che la sorgente open data non risponde e, dall'header `Retry-After`, fra quanto riprovare.

### Avvio in sviluppo

Con il backend su `http://localhost:8080` (per esempio `docker compose up db app`):

```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

Il backend non ha CORS e le sue rotte non hanno il prefisso `/api`: il browser chiama `/api/...` sullo stesso origin del frontend, e il proxy di Vite inoltra al backend togliendo il prefisso (`/api/enti` → `http://localhost:8080/enti`). In produzione fa lo stesso nginx ([`web/nginx.conf`](web/nginx.conf)), che serve anche `index.html` per le rotte di React Router, così un link come `/enti/42` si può ricaricare.

```bash
npm run lint       # oxlint
npm run build      # build di produzione in dist/
```

### Test di unità

```bash
npm test           # Vitest, una sola esecuzione; report in reports/unit (html e junit)
```

125 test, senza backend: `fetch` e il modulo API sono simulati.

| File | Che cosa verifica |
|---|---|
| `api/impiantiApi.test.js` | URL con `page`, `size`, `sort` e spareggio; lettura del ProblemDetail (`title`, `detail`, `errori`) e di `Retry-After`; id dall'header `Location`; corpo non JSON, server che non risponde |
| `utils/*.test.js` | parametri letti dall'URL e ripuliti, tetto di 100, inversione dell'ordinamento, ritorno alla prima pagina; validazione con le regole del backend; formattazione |
| `hooks/useRichiesta.test.jsx` | caricamento, errore, dati della pagina precedente tenuti durante il caricamento, risposta arrivata in ritardo ignorata |
| `components/*.test.jsx` | `ErrorAlert`, `Paginazione` (pulsanti disabilitati ai bordi, dimensione), `TabellaEnti` (nome della provincia, `aria-sort`, colonne ordinabili) |
| `pages/*.test.jsx` | ogni pagina con l'API simulata: caricamento, errore, lista vuota, dati, paginazione e ordinamento nell'URL, form con validazione ed errori del server sui campi (400, 409, 404), esito dell'import e 503 |
| `App.test.jsx` | rotte: `/` porta a `/enti`, `/enti/nuovo` non è un id, pagina inesistente |

### Test end-to-end

```bash
npx playwright install chromium   # una tantum
npm run test:e2e                  # report in reports/e2e (list, html, junit), uno screenshot per test
```

23 test contro il backend vero con PostgreSQL. Serve Docker: prima dei test `e2e/support/global-setup.js` avvia [`web/e2e/docker-compose.yml`](web/e2e/docker-compose.yml), dopo li spegne (`E2E_MANTIENI=1` per lasciarli su). Lo stack dei test è separato da quello di sviluppo (progetto `impianti-e2e`, backend sulla porta 18080), così possono girare insieme:

- **database pulito a ogni esecuzione**: PostgreSQL tiene i dati in `tmpfs`, e il setup fa comunque `down --volumes` prima di ripartire;
- **niente dipendenza da dati.puglia.it**: un nginx (`open-data`) serve il file reale del repository, `src/test/resources/open-data/enti.json`, e `OPEN_DATA_URL` punta lì. I numeri sono sempre 1.739/0/1 e poi 0/1.739/1.

Lo stato dei dati conta, quindi i test sono divisi in tre progetti di Playwright che girano in sequenza:

| Progetto | File | Che cosa verifica |
|---|---|---|
| `vuoto` | `01-vuoto.spec.js` | elenco vuoto con invito all'import, le sei province senza enti, 404 sul dettaglio e sulla provincia, 503 sull'import |
| `importazione` | `02-importazione.spec.js` | prima import 1.739/0/1 con lo stato di caricamento, seconda 0/1.739/1 |
| `dati` | `03-elenco.spec.js` | prima pagina confrontata con l'API, navigazione e reload, pagine senza sovrapposizioni, dimensione fino a 100, ordinamento su ogni colonna, azioni ravvicinate, dettaglio |
| `dati` | `04-province.spec.js` | ogni provincia con il suo totale, somma uguale al totale generale; paginazione e ordinamento degli enti di Lecce |
| `dati` | `05-nuovo-ente.spec.js` | creazione con i valori normalizzati dal server, validazione client senza chiamate, 400 con i campi, 400 sul tipo, 409 su idSorgente duplicato, 404 sulla provincia |

Alcune scelte:

- **Il 503 si ottiene spegnendo davvero la finta sorgente** (`docker compose stop open-data`) invece che con `page.route`. Così la catena è quella reale: il backend non raggiunge la sorgente, `GestoreErrori` risponde 503 con `Retry-After: 60`, il proxy lo inoltra, la pagina lo spiega. Con `page.route` si sarebbe provato solo che il frontend legge un 503 scritto a mano, e quello lo fanno già i test di unità. Un dettaglio: mentre la sorgente è spenta il nome `open-data` non si risolve, e la JVM ricorda i fallimenti DNS per 10 secondi; nello stack dei test [`e2e/dns-senza-cache.security`](web/e2e/dns-senza-cache.security) toglie la cache, altrimenti il backend risponderebbe 503 anche a sorgente riaccesa. Il backend resta com'è.
- **400 e 404 del form con il corpo modificato in viaggio**: la validazione lato client ha le stesse regole del server, quindi dall'interfaccia un 400 non si ottiene, e la select offre solo province esistenti. Per questi due casi `page.route` modifica il corpo della POST, come farebbe un client che non valida; la richiesta arriva comunque al backend vero, e la risposta è la sua.
- **Stato di caricamento dell'import**: sul file locale l'import dura meno di un secondo, così il test trattiene la risposta vera per un secondo prima di darla alla pagina, e verifica il pulsante disabilitato e lo spinner.
- **Niente retry**: una seconda import dà 0/1.739/1 e non 1.739/0/1, quindi un retry nasconderebbe un errore invece di ripararlo.

### Struttura

```text
web/
├── src/
│   ├── api/impiantiApi.js     l'unico modulo che parla con il backend
│   ├── components/            ElencoEnti, TabellaEnti, Paginazione, ErrorAlert, StatoVuoto, Spinner, NavBar
│   ├── hooks/useRichiesta.js  stato di una richiesta: dati, errore, caricamento
│   ├── pages/                 una pagina per rotta, con il suo test accanto
│   ├── utils/                 paginazione e ordinamento, validazione del form, colonne, formattazione
│   └── test/                  setup di Vitest, dati di prova, router in memoria
├── e2e/                       test Playwright, stack Docker dei test e supporto
├── Dockerfile                 build con Node, poi nginx
└── nginx.conf                 file statici, fallback per le rotte, proxy /api -> app:8080
```

## Pipeline

A ogni push su `main`, `.github/workflows/ci.yml` esegue quattro job:

| Job | Che cosa fa |
|---|---|
| `test` | `./mvnw verify`: test di unità e di integrazione del backend |
| `web` | `npm ci`, `npm run lint`, `npm test`, `npm run build` nel frontend; report dei test come artifact |
| `e2e` | i test Playwright, con lo stack Docker dei test; report, screenshot e trace come artifact, anche quando falliscono |
| `publish` | solo se i tre precedenti sono verdi, e solo da `main`: costruisce l'immagine del backend dal Dockerfile e la pubblica su `ghcr.io/<proprietario>/<repository>` con due tag, lo SHA del commit e `latest`, autenticandosi con il `GITHUB_TOKEN` |

`test`, `web` ed `e2e` girano in parallelo; `publish` aspetta anche gli end-to-end perché esercitano il backend attraverso l'interfaccia.
