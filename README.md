# Laboratorio Kubernetes

Oggi mettiamo online la nostra applicazione su **Kubernetes**.

Ognuno di voi avrà:

- **un cluster Kubernetes tutto suo**, dentro un GitHub Codespace;
- **una pipeline** che, a ogni push, prepara le immagini e le installa nel cluster. È come con Render, ma il cluster è vostro.

L'applicazione è quella della prova pratica, «Impianti sportivi in Puglia». Nel cluster gireranno **3 pod**:

| Pod | Che cos'è | Immagine |
|---|---|---|
| `db` | il database PostgreSQL | `postgres:17-alpine` |
| `app` | il backend Spring Boot | `ghcr.io/<voi>/k8s-lab/api` |
| `web` | il frontend React (con nginx) | `ghcr.io/<voi>/k8s-lab/web` |

## Come funziona

```
  voi: git push
        │
        ▼
  GitHub Actions ── test ── build delle 2 immagini ── push su GHCR
        │
        ▼
  job «deploy» nel vostro Codespace ── kubectl apply ── i 3 pod partono
        │
        ▼
  l'app è online: https://<codespace>-30080.app.github.dev
```

## Parole da sapere

| Parola | Significato |
|---|---|
| **Cluster** | l'insieme di macchine su cui Kubernetes fa girare i container. Il vostro ha una macchina sola. |
| **Pod** | un container in esecuzione (a volte più di uno). |
| **Deployment** | la regola «voglio N pod di questa immagine». Se un pod muore, Kubernetes ne crea un altro. |
| **ReplicaSet** | lo crea il Deployment, uno per ogni versione dell'immagine: tiene acceso il numero giusto di pod di quella versione. |
| **Service** | un nome fisso per raggiungere i pod: `db`, `app`, `web`. |
| **Secret** | un posto per le password. |
| **PersistentVolumeClaim** | un disco: i dati restano anche se il pod viene cancellato. |
| **Namespace** | un gruppo con un nome, dentro il cluster, che tiene insieme gli oggetti di un'applicazione. Il nostro si chiama `impianti`. |
| **Manifest** | un file YAML che descrive che cosa vogliamo nel cluster. I nostri sono in `k8s/`. |

## Da docker-compose a Kubernetes

Abbiamo già fatto girare l'app con `docker compose up`. Ecco dove è finito ogni pezzo:

| Nel docker-compose.yml | In Kubernetes | File |
|---|---|---|
| servizio `db` | Deployment `db` + Service `db` | `k8s/db.yaml` |
| password in `environment` | Secret `db-credenziali` | `k8s/db.yaml` |
| volume `dati-postgres` | PersistentVolumeClaim `dati-postgres` | `k8s/db.yaml` |
| servizio `app` | Deployment `app` + Service `app` | `k8s/app.yaml` |
| `depends_on` | initContainer `aspetta-db` | `k8s/app.yaml` |
| `healthcheck` | `readinessProbe` | `k8s/app.yaml` |
| servizio `web` con `ports: "3000:80"` | Deployment `web` + Service `web` sulla porta 30080 | `k8s/web.yaml` |

---

# Laboratorio 1 — Il tuo cluster

Obiettivo: avere un cluster Kubernetes tutto vostro, collegato alla pipeline, e imparare i comandi base.

## Parte A — Preparazione

### Passo 1: create la vostra copia del repository

1. Aprite https://github.com/its-java-backend-2026/k8s-lab
2. Cliccate il pulsante verde **Use this template** → **Create a new repository**.
3. Come **Owner** scegliete il vostro utente, come nome `k8s-lab`, visibilità **Private**. Poi **Create repository**.

✅ **Ce l'avete fatta se** avete il repository `<vostro-utente>/k8s-lab`. È vostro: da qui in poi lavorate solo lì.

Nella scheda **Actions** vedrete una pipeline partita da sola: prepara test e immagini, ma non fa il deploy. Il primo deploy lo lanciate voi nel Laboratorio 2.

### Passo 2: aprite il Codespace

1. Nel vostro repository: pulsante verde **Code** → scheda **Codespaces** → **Create codespace on main**.
2. Si apre VS Code nel browser. La prima volta ci vogliono **2–3 minuti**.
3. Aspettate che nel terminale compaia:

```
✅ Il cluster è pronto.
Headlamp:      https://<nome-codespace>-30090.app.github.dev
Applicazione:  non ancora installata. La installa la pipeline: Actions → CI/CD → Run workflow
```

4. Provate:

```bash
kubectl get nodes
```

✅ **Ce l'avete fatta se** vedete il nodo `k3d-lab-server-0` con `STATUS` = `Ready`.

### Passo 3: collegate il Codespace alla pipeline (runner)

Il job «deploy» della pipeline deve girare **nel vostro Codespace**, perché il cluster è lì. Per questo registriamo il Codespace come **runner**.

1. Nel terminale del Codespace:

```bash
./scripts/registra-runner.sh
```

2. Lo script vi dà un link: apritelo (Ctrl+clic).
3. Nella pagina, sezione **Configure**, c'è una riga come questa:

```
./config.sh --url https://github.com/... --token ABCDEF123456...
```

4. Copiate **solo il token** (quello dopo `--token`), incollatelo nel terminale e premete Invio.

✅ **Ce l'avete fatta se** in GitHub, **Settings → Actions → Runners**, c'è il runner `codespace` con il pallino verde (**Idle**).

### Passo 4: gli strumenti grafici

Ci sono tre modi per trovare l'indirizzo di Headlamp:

1. **Dal messaggio di avvio**: è la riga `Headlamp: https://…-30090.app.github.dev`. Ctrl+clic per aprirla.
2. **Dal terminale**, in qualsiasi momento: `./scripts/indirizzi.sh`. Dopo il primo deploy stampa anche l'indirizzo dell'app.
3. **Dalla scheda PORTS**, in basso nel Codespace: riga **Headlamp (30090)**, colonna **Forwarded Address**. Ctrl+clic sull'indirizzo per aprirlo.

Attenzione alla porta: è **30090** (con tre zeri), non 3090.

✅ **Ce l'avete fatta se** si apre Headlamp e vedete il cluster. Tenetelo aperto: lo useremo sempre.

Ci sono altri due modi per guardare il cluster, già installati:

- **Estensione Kubernetes di VS Code**: icona Kubernetes (il timone) nella barra laterale sinistra → cluster `k3d-lab`. Si possono aprire pod, log e YAML con un clic.
- **k9s** nel terminale: scrivete `k9s`. Frecce per muovervi, `:pods` per i pod, `l` per i log, `Esc` per tornare indietro, `:q` per uscire.

## Parte B — Primi passi con kubectl

Proviamo i comandi base con un'immagine semplice (nginx), in un namespace di prova.

### Creare un Deployment con 2 pod

```bash
kubectl create namespace prove                                              # crea il namespace «prove»
kubectl create deployment ciao --image=nginx:alpine --replicas=2 -n prove   # Deployment «ciao»: 2 pod con nginx
kubectl get pods -n prove                                                   # elenca i pod del namespace
kubectl get deployment,replicaset,pod -n prove                              # la catena: Deployment → ReplicaSet → pod
```

`-n prove` dice in quale namespace lavorare. Senza, kubectl usa il namespace `default`.

✅ Vedete **2 pod** `ciao-...` in stato `Running`. Guardateli anche in Headlamp: **Workloads → Pods** (in alto scegliete il namespace `prove`).

### Kubernetes ripara da solo

Cancellate uno dei due pod: copiate il suo nome dall'elenco di prima.

```bash
kubectl delete pod <nome-del-pod> -n prove   # cancella quel pod
kubectl get pods -n prove                    # elenca di nuovo i pod
```

✅ Ci sono **ancora 2 pod**: Kubernetes ne ha creato subito uno nuovo, perché il Deployment dice «voglio 2 pod».

### Da 2 a 4 pod

```bash
kubectl scale deployment ciao --replicas=4 -n prove   # da 2 a 4 pod
kubectl get pods -n prove
```

`scale` cambia il numero di pod voluti: Kubernetes ne accende 2 in più.

✅ Adesso i pod sono **4**.

### Guardare dentro un pod

```bash
kubectl logs deployment/ciao -n prove              # i log
kubectl describe pod <nome-del-pod> -n prove       # i dettagli e gli eventi, in fondo
kubectl exec -it deployment/ciao -n prove -- sh    # un terminale dentro il container (exit per uscire)
```

### Pulizia

```bash
kubectl delete namespace prove
```

Cancellando il namespace si cancella tutto quello che conteneva.

---

# Laboratorio 2 — L'applicazione su Kubernetes

Obiettivo: mettere online l'app con la pipeline, fare qualche esperimento e rilasciare una nuova versione senza spegnere il sito.

## Parte A — Deploy dalla pipeline

### Passo 1: lanciate la pipeline

Nel vostro repository: **Actions → CI/CD → Run workflow → Run workflow**.

La pipeline ha 4 job:

| Job | Dove gira | Che cosa fa |
|---|---|---|
| `test` | GitHub | i test del backend |
| `web` | GitHub | lint, test e build del frontend |
| `publish` | GitHub | costruisce le 2 immagini e le mette su GHCR |
| `deploy` | **il vostro Codespace** | lancia `./scripts/deploy.sh`, che applica i file di `k8s/` |

### Passo 2: guardate i pod che partono

Lanciate questo comando **subito dopo Run workflow**, prima che parta il job `deploy`, e lasciatelo aperto:

```bash
kubectl get pods -n impianti -w
```

Vedrete, in ordine:

1. parte `db`;
2. `app` resta in `Init:0/1` per qualche secondo: il suo initContainer aspetta il database;
3. `app` diventa `Running 0/1`: Spring Boot si sta avviando;
4. `app` diventa `1/1`: è pronto;
5. `web` è `1/1`.

Premete **Ctrl+C** per uscire.

✅ **Ce l'avete fatta se** il job `deploy` è verde e ci sono 3 pod `1/1 Running`.

### Passo 3: aprite l'applicazione

1. Nel terminale lanciate `./scripts/indirizzi.sh` e fate Ctrl+clic sulla riga **Applicazione**. Lo stesso indirizzo è nella scheda **PORTS** (riga **App (30080)**, colonna **Forwarded Address**) e su GitHub, nella pagina della pipeline: **Actions** → il run → **Summary**.
2. Andate su **Importazione** e importate gli enti.

✅ **Ce l'avete fatta se** vengono importati **1.739 enti** e li vedete nell'elenco.

> Il link funziona solo per voi. Per farlo vedere a un compagno: scheda PORTS → tasto destro sulla porta 30080 → **Port Visibility → Public**.

## Parte B — Esperimenti

Per ogni esperimento: lanciate il comando e guardate che cosa succede in Headlamp o con `kubectl get pods -n impianti`.

### 1. I dati restano

```bash
kubectl delete pod -l app=db -n impianti   # cancella i pod con l'etichetta app=db
kubectl get pods -n impianti -w            # guarda i pod e resta in ascolto
```

`-l app=db` sceglie i pod per etichetta: così non serve copiare il nome. `-w` tiene il comando aperto e mostra ogni cambiamento (Ctrl+C per uscire).

Aspettate che il nuovo pod `db` sia `Running`, poi ricaricate l'elenco degli enti.

✅ Gli enti ci sono ancora: il pod nuovo usa **lo stesso disco** (il PersistentVolumeClaim).

### 2. Due copie del backend

```bash
kubectl scale deployment app --replicas=2 -n impianti   # 2 pod del backend
kubectl describe service app -n impianti                # i dettagli del Service
```

✅ Nell'output di `describe`, la riga `Endpoints` elenca gli indirizzi dei pod dietro al Service: ora sono **2**, e il Service divide le richieste tra loro.

Poi tornate a 1:

```bash
kubectl scale deployment app --replicas=1 -n impianti
```

### 3. Senza database

```bash
kubectl scale deployment db --replicas=0 -n impianti   # zero pod del database: il database è spento
```

Aspettate 15 secondi e ricaricate l'app.

✅ Il pod `app` è `0/1`: la readinessProbe dice «non sono pronto». Il frontend mostra un errore.

Rimettete il database:

```bash
kubectl scale deployment db --replicas=1 -n impianti
```

✅ Dopo qualche secondo `app` torna `1/1` e l'app funziona di nuovo.

### 4. Un'immagine sbagliata

Simuliamo un deploy sbagliato: diamo al frontend un'immagine che non esiste.

```bash
kubectl set image deployment/web web=nginx:non-esiste -n impianti   # cambia l'immagine del Deployment web
kubectl get pods -n impianti
```

✅ Kubernetes prova ad avviare un pod nuovo con quell'immagine: il pod va in `ErrImagePull`, cioè non riesce a scaricarla. Ma **il vecchio pod è ancora lì e l'app funziona**: Kubernetes toglie il pod vecchio solo quando quello nuovo è pronto.

Rimettete l'immagine di prima:

```bash
kubectl rollout undo deployment/web -n impianti   # torna alla versione precedente del Deployment
```

(Il `Warning` che compare è normale.) Come funziona `rollout undo` lo vediamo nella Parte C.

## Parte C — Una nuova versione

### Passo 1: cambiate il titolo

1. Nel Codespace aprite `web/src/components/NavBar.jsx`.
2. Cambiate il testo `Impianti sportivi in Puglia`, per esempio in `Impianti sportivi — versione 2`.
3. Pannello **Source Control** (a sinistra) → scrivete un messaggio → **Commit** → **Sync Changes**.

### Passo 2: guardate l'aggiornamento

La pipeline parte da sola. Quando arriva al job `deploy`:

```bash
kubectl get pods -n impianti -l app=web -w   # solo i pod del frontend, in ascolto
```

✅ Parte un pod `web` nuovo, e quello vecchio si spegne **solo dopo**. Ricaricate l'app: il titolo è cambiato.

Questo si chiama **rolling update**: la nuova versione arriva senza mai spegnere il sito.

### Da dove arriva l'immagine

- Il deploy scrive nel Deployment solo il **nome** dell'immagine: `ghcr.io/<voi>/k8s-lab/web:<commit>`.
- Il nodo del cluster controlla se ha già quell'immagine. Se non ce l'ha, la scarica da GHCR usando il Secret `ghcr` (le credenziali). Da quel momento ne tiene una copia.
- Ogni volta che cambia l'immagine, il Deployment salva una **versione** (in inglese *revision*) in un **ReplicaSet**: un oggetto che ricorda quale immagine usare e quanti pod accendere.
- Le versioni vecchie restano con 0 pod: il nome dell'immagine è nel ReplicaSet, la copia dell'immagine è sul nodo.

### Passo 3: tornate alla versione di prima

```bash
kubectl rollout history deployment/web -n impianti   # l'elenco delle versioni salvate
kubectl rollout undo deployment/web -n impianti      # torna alla versione precedente
```

`rollout undo` riaccende il ReplicaSet della versione precedente e spegne quello attuale, con un rolling update: il sito resta acceso. Il nodo ha già la copia dell'immagine vecchia, quindi bastano pochi secondi.

✅ Ricaricate l'app: il titolo di prima è tornato.

> Attenzione: `rollout undo` cambia solo il cluster, non il repository. Al prossimo push la pipeline rimette la versione del repository. Per tornare indietro davvero si usa `git revert` e un nuovo push.

---

# Se qualcosa non va

| Problema | Soluzione |
|---|---|
| La pipeline non parte | controllate di essere nel **vostro** repository e non in quello del corso: lì il deploy non parte |
| Il job `deploy` resta fermo su «Waiting for a runner» | il Codespace è spento: riapritelo. Se non basta, rifate `./scripts/registra-runner.sh` |
| Il token del runner non funziona | dura un'ora: aprite di nuovo il link e prendetene uno nuovo |
| `kubectl` non risponde dopo aver riaperto il Codespace | `bash .devcontainer/post-start.sh` |
| Il Codespace si spegne dopo 30 minuti senza usarlo | è normale. Si può alzare il tempo in https://github.com/settings/codespaces |

# Gli script

Sono tutti file di testo con comandi bash: si possono aprire e leggere. I primi due partono da soli, gli altri li lanciate voi o la pipeline.

| Script | Quando parte | Chi lo lancia | Che cosa fa |
|---|---|---|---|
| `.devcontainer/post-create.sh` | una volta sola, quando si crea il Codespace | GitHub, da solo | installa k3d (per creare il cluster) e k9s (per guardarlo dal terminale) |
| `.devcontainer/post-start.sh` | a ogni avvio del Codespace | GitHub, da solo | crea il cluster «lab» (o lo riaccende), installa Headlamp, riavvia il runner, stampa gli indirizzi |
| `scripts/registra-runner.sh` | una volta sola, nel Laboratorio 1 | voi | chiede il token, scarica il runner e lo registra sul vostro repository con il nome `codespace` |
| `scripts/avvia-runner.sh` | a ogni avvio del Codespace | `post-start.sh` | rimette in ascolto il runner, se è già registrato |
| `scripts/deploy.sh` | a ogni deploy | il job `deploy` della pipeline (o voi, a mano) | applica i file di `k8s/` con le immagini appena pubblicate e aspetta che i pod siano pronti |
| `scripts/indirizzi.sh` | quando vi serve | voi (e `post-start.sh`) | stampa gli indirizzi di Headlamp e dell'app |

Se qualcosa non parte all'avvio del Codespace, si rilancia a mano: `bash .devcontainer/post-start.sh`.

# I file del laboratorio

| File | A che cosa serve |
|---|---|
| `k8s/db.yaml` | il database: Secret, disco, Deployment e Service |
| `k8s/app.yaml` | il backend: Deployment e Service |
| `k8s/web.yaml` | il frontend: Deployment e Service sulla porta 30080 |
| `scripts/deploy.sh` | il deploy: applica i file di `k8s/` e aspetta che i pod siano pronti |
| `scripts/registra-runner.sh` | collega il Codespace alla pipeline |
| `scripts/indirizzi.sh` | stampa gli indirizzi di Headlamp e dell'app |
| `.github/workflows/ci.yml` | la pipeline |
| `.devcontainer/devcontainer.json` | com'è fatta la macchina del Codespace: Docker, kubectl, porte, script da lanciare |
| [APP.md](APP.md) | com'è fatta l'applicazione |
