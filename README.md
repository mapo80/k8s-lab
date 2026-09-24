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

### Passo 2: aprite il Codespace

1. Nel vostro repository: pulsante verde **Code** → scheda **Codespaces** → **Create codespace on main**.
2. Si apre VS Code nel browser. La prima volta ci vogliono **2–3 minuti**.
3. Aspettate che nel terminale compaia:

```
✅ Il cluster è pronto.
Headlamp:      https://<nome-codespace>-30090.app.github.dev
Applicazione:  https://<nome-codespace>-30080.app.github.dev   (dopo il primo deploy)
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
2. **Dal terminale**, in qualsiasi momento: `./scripts/indirizzi.sh`
3. **Dalla scheda PORTS**, in basso nel Codespace: riga **Headlamp (30090)**, colonna **Forwarded Address**. Il globo 🌐 la apre.

Attenzione alla porta: è **30090** (con tre zeri), non 3090.

✅ **Ce l'avete fatta se** si apre Headlamp e vedete il cluster. Tenetelo aperto: lo useremo sempre.

Ci sono altri due modi per guardare il cluster, già installati:

- **Estensione Kubernetes di VS Code**: icona Kubernetes (il timone) nella barra laterale sinistra → cluster `k3d-lab`. Si possono aprire pod, log e YAML con un clic.
- **k9s** nel terminale: scrivete `k9s`. Frecce per muovervi, `:pods` per i pod, `l` per i log, `Esc` per tornare indietro, `:q` per uscire.

## Parte B — Primi passi con kubectl

Proviamo i comandi base con un'immagine semplice (nginx), in un namespace di prova.

### Creare un Deployment con 2 pod

```bash
kubectl create namespace prove
kubectl create deployment ciao --image=nginx:alpine --replicas=2 -n prove
kubectl get pods -n prove
```

✅ Vedete **2 pod** `ciao-...` in stato `Running`. Guardateli anche in Headlamp: **Workloads → Pods** (in alto scegliete il namespace `prove`).

### Kubernetes ripara da solo

Cancellate uno dei due pod: copiate il suo nome dall'elenco di prima.

```bash
kubectl delete pod <nome-del-pod> -n prove
kubectl get pods -n prove
```

✅ Ci sono **ancora 2 pod**: Kubernetes ne ha creato subito uno nuovo, perché il Deployment dice «voglio 2 pod».

### Da 2 a 4 pod

```bash
kubectl scale deployment ciao --replicas=4 -n prove
kubectl get pods -n prove
```

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

Mentre gira il job `deploy`, nel terminale del Codespace:

```bash
kubectl get pods -n impianti -w
```

Vedrete, in ordine:

1. parte `db`;
2. `app` resta in `Init:0/1`: il suo initContainer aspetta il database;
3. `app` diventa `Running 0/1`: Spring Boot si sta avviando;
4. `app` diventa `1/1`: è pronto;
5. `web` è `1/1`.

Premete **Ctrl+C** per uscire.

✅ **Ce l'avete fatta se** il job `deploy` è verde e ci sono 3 pod `1/1 Running`.

### Passo 3: aprite l'applicazione

1. Scheda **PORTS** → riga **App (30080)** → icona del globo 🌐. Il link c'è anche nel riepilogo del job `deploy`.
2. Andate su **Importazione** e importate gli enti.

✅ **Ce l'avete fatta se** vengono importati **1.739 enti** e li vedete nell'elenco.

> Il link funziona solo per voi. Per farlo vedere a un compagno: scheda PORTS → tasto destro sulla porta 30080 → **Port Visibility → Public**.

## Parte B — Esperimenti

Per ogni esperimento: lanciate il comando e guardate che cosa succede in Headlamp o con `kubectl get pods -n impianti`.

### 1. I dati restano

```bash
kubectl delete pod -l app=db -n impianti
```

Aspettate che il nuovo pod `db` sia `Running`, poi ricaricate l'elenco degli enti.

✅ Gli enti ci sono ancora: il pod nuovo usa **lo stesso disco** (il PersistentVolumeClaim).

### 2. Due copie del backend

```bash
kubectl scale deployment app --replicas=2 -n impianti
kubectl describe service app -n impianti
```

✅ Alla riga `Endpoints` ci sono **2 indirizzi**: il Service divide le richieste tra i due pod.

Poi tornate a 1:

```bash
kubectl scale deployment app --replicas=1 -n impianti
```

### 3. Senza database

```bash
kubectl scale deployment db --replicas=0 -n impianti
```

Aspettate 15 secondi e ricaricate l'app.

✅ Il pod `app` è `0/1`: la readinessProbe dice «non sono pronto». Il frontend mostra un errore.

Rimettete il database:

```bash
kubectl scale deployment db --replicas=1 -n impianti
```

✅ Dopo qualche secondo `app` torna `1/1` e l'app funziona di nuovo.

### 4. Un'immagine sbagliata

```bash
kubectl set image deployment/web web=nginx:non-esiste -n impianti
kubectl get pods -n impianti
```

✅ Il pod nuovo è in `ErrImagePull`, ma **il vecchio pod è ancora lì e l'app funziona**. Kubernetes toglie il pod vecchio solo quando quello nuovo è pronto.

Tornate indietro:

```bash
kubectl rollout undo deployment/web -n impianti
```

(Il `Warning` che compare è normale.)

## Parte C — Una nuova versione

### Passo 1: cambiate il titolo

1. Nel Codespace aprite `web/src/components/NavBar.jsx`.
2. Cambiate il testo `Impianti sportivi in Puglia`, per esempio in `Impianti sportivi — versione 2`.
3. Pannello **Source Control** (a sinistra) → scrivete un messaggio → **Commit** → **Sync Changes**.

### Passo 2: guardate l'aggiornamento

La pipeline parte da sola. Quando arriva al job `deploy`:

```bash
kubectl get pods -n impianti -w
```

✅ Parte un pod `web` nuovo, e quello vecchio si spegne **solo dopo**. Ricaricate l'app: il titolo è cambiato.

Questo si chiama **rolling update**: la nuova versione arriva senza mai spegnere il sito.

### Passo 3: tornate alla versione di prima

```bash
kubectl rollout undo deployment/web -n impianti
```

✅ Ricaricate l'app: il titolo di prima è tornato.

> In un progetto vero si torna indietro con un `git revert` e un nuovo push: la versione giusta è sempre quella nel repository.

---

# Se qualcosa non va

| Problema | Soluzione |
|---|---|
| La pipeline non parte | controllate di essere nel **vostro** repository e non in quello del corso: lì il deploy non parte |
| Il job `deploy` resta fermo su «Waiting for a runner» | il Codespace è spento: riapritelo. Se non basta, rifate `./scripts/registra-runner.sh` |
| Il token del runner non funziona | dura un'ora: aprite di nuovo il link e prendetene uno nuovo |
| `kubectl` non risponde dopo aver riaperto il Codespace | `bash .devcontainer/post-start.sh` |
| Il Codespace si spegne dopo 30 minuti senza usarlo | è normale. Si può alzare il tempo in https://github.com/settings/codespaces |

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
| `.devcontainer/` | com'è fatto il Codespace: strumenti, cluster, Headlamp |
| [APP.md](APP.md) | com'è fatta l'applicazione |
