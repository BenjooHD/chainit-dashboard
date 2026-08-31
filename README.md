# ChainIt Dashboard

Team-Dashboard mit eigenen Accounts (E-Mail-Verifizierung), Terminkalender,
Aufgaben/Projekten, Kontakten und KPI-Kacheln.

- **Backend:** Express + `node:sqlite` (keine native Kompilierung nötig)
- **Frontend:** React + Vite
- **Auth:** Benutzername + Passwort, E-Mail-Verifizierung via [Resend](https://resend.com)

## Lokal entwickeln

```powershell
npm install          # installiert Server + Client (npm workspaces)
npm run dev           # startet API (:3001) und Vite (:5173) gemeinsam
```

Öffne dann `http://localhost:5173`. Ohne `RESEND_API_KEY` in `server/.env`
wird der Verifizierungs-Link statt einer echten Mail nur in die
Server-Konsole geloggt — praktisch zum lokalen Testen.

## Live schalten (Railway)

Das Repo ist so vorbereitet, dass ein Host es als **einen** Service
erkennt: `npm install` → `npm run build` (baut das Frontend) → `npm start`
(ein Node-Prozess liefert API **und** Frontend aus derselben URL aus).

### 1. GitHub-Repo anlegen und pushen

Auf [github.com/new](https://github.com/new) ein neues, **leeres** Repository
anlegen (kein README/gitignore ankreuzen, das haben wir schon lokal). Dann:

```powershell
cd C:\Users\Startklar\Desktop\ChainIt-Dashboard
git remote add origin https://github.com/<dein-user>/<repo-name>.git
git push -u origin master
```

### 2. Bei Railway anmelden

Auf [railway.com](https://railway.com) mit "Login with GitHub" registrieren
— das gibt Railway direkt Zugriff, um später aus dem Repo zu deployen.

### 3. Projekt erstellen

"New Project" → "Deploy from GitHub repo" → das gerade gepushte Repo
auswählen. Railway erkennt automatisch, dass es sich um ein Node-Projekt
handelt und nutzt die Scripts aus `package.json`.

### 4. Persistentes Volume anlegen

Im Service unter "Settings" → "Volumes" → "New Volume", Mount-Pfad: `/data`.
Ohne das würde die SQLite-Datenbank bei jedem Neustart/Deploy verloren gehen.

### 5. Umgebungsvariablen setzen

Unter "Variables":

| Variable | Wert |
|---|---|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | ein langer Zufallsstring (siehe unten) |
| `DB_PATH` | `/data/chainit.db` |
| `APP_URL` | die von Railway vergebene URL, z.B. `https://chainit-dashboard-production.up.railway.app` (nach dem ersten Deploy sichtbar, dann hier eintragen) |
| `RESEND_API_KEY` | dein Key von resend.com |
| `RESEND_FROM_EMAIL` | `ChainIt <onboarding@resend.dev>` (siehe Hinweis unten) |

Zufälligen `SESSION_SECRET` generieren:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Deploy abwarten, URL öffnen

Railway baut und startet automatisch. Die vergebene URL (unter "Settings" →
"Networking" → "Generate Domain") ist der Link, den du im Team teilst.

> **Wichtig:** Ohne eigene verifizierte Domain in Resend kann der
> Standard-Absender `onboarding@resend.dev` nur an die E-Mail-Adresse
> deines eigenen Resend-Accounts senden. Für echte Registrierung durch
> mehrere Teammitglieder: in Resend unter "Domains" eine eigene Domain
> hinzufügen, die dort angezeigten DNS-Einträge beim Domain-Anbieter
> eintragen (paar Minuten Arbeit + etwas Wartezeit für DNS), danach
> `RESEND_FROM_EMAIL` auf z.B. `ChainIt <noreply@eure-domain.de>` ändern.

### Redeploys

Jeder `git push` auf den verbundenen Branch löst automatisch ein neues
Deployment aus.
