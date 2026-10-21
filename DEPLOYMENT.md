# 🚀 Guide de Déploiement Production - LevelUpCode API

Ce guide détaille les étapes pour conteneuriser l'application **LevelUpCode API** et la déployer sur **Google Cloud Run** en connexion avec **Supabase PostgreSQL**, **Resend** et **Google Cloud Scheduler**.

---

## 📋 Prérequis

1. Compte **Google Cloud Platform (GCP)** avec un projet configuré et la CLI `gcloud` installée.
2. Instance de base de données **Supabase PostgreSQL** active avec les migrations appliquées.
3. Clé API **Resend** pour l'envoi d'emails transactionnels.
4. Compte **Buy Me a Coffee** configuré avec le secret de webhook.

---

## 🐳 1. Test du Container Docker en Local

Bien que Cloud Run utilise Cloud Build, vous pouvez tester l'image en local si Docker est installé :

```bash
# 1. Construction de l'image de production
docker build -t levelupcode-back:latest .

# 2. Exécution du conteneur en local
docker run -p 8080:8080 \
  --env-file .env \
  -e PORT=8080 \
  levelupcode-back:latest
```

L'API sera accessible sur `http://localhost:8080` et Swagger sur `http://localhost:8080/api/docs`.

---

## ☁️ 2. Déploiement sur Google Cloud Run

### Option A : Déploiement Direct via Code Source (Cloud Build Automatique)

Cette méthode ne nécessite pas d'installer Docker localement ; Google Cloud compile l'image via Cloud Build et la déploie directement :

```bash
# Se connecter à Google Cloud
gcloud auth login
gcloud config set project ID_DE_VOTRE_PROJET_GCP

# Activer les APIs requises
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com

# Autoriser le compte de service Cloud Run à lire Secret Manager
PROJECT_NUMBER=$(gcloud projects describe levelupcode-512207 --format="value(projectNumber)")
gcloud projects add-iam-policy-binding levelupcode-512207 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Déployer directement depuis le dossier racine du projet
gcloud run deploy levelupcode-api \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars NODE_ENV=production,PORT=8080
```

---

## 🔐 3. Configuration des Variables d'Environnement / Secret Manager

Pour la sécurité en production, stockez les secrets sensibles dans **Google Secret Manager** ou injectez-les comme variables d'environnement Cloud Run :

| Variable | Description / Exemple de Valeur |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `DATABASE_URL` | `postgresql://postgres.[ref]:[mdp]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres.[ref]:[mdp]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | JWT Secret |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | JWT Refresh Secret |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://api.levelupcode.dev/auth/google/callback` |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret |
| `GITHUB_CALLBACK_URL` | `https://api.levelupcode.dev/auth/github/callback` |
| `ADMIN_EMAIL` | `[EMAIL_ADDRESS]` |
| `CRON_SECRET` | Jeton secret partagé avec Cloud Scheduler |
| `RESEND_API_KEY` | API KEY Resend |
| `MAIL_FROM` | `LevelUpCode <onboarding@resend.dev>` (ou votre domaine vérifié) |
| `BMC_WEBHOOK_SECRET` | BMC Secret |

### Mise à jour des variables via la CLI gcloud :
```bash
gcloud run services update levelupcode-api \
  --region europe-west1 \
  --update-env-vars DATABASE_URL="...",DIRECT_URL="...",JWT_SECRET="...",ADMIN_EMAIL="[EMAIL_ADDRESS]",CRON_SECRET="...",RESEND_API_KEY="..."
```

---

## ⏰ 4. Configuration de Google Cloud Scheduler (Rappels de Streak)

Les rappels de streak sont déclenchés automatiquement chaque soir à 19h00 (Europe/Paris) via un appel HTTP sécurisé par le secret partagé `CRON_SECRET`.

### Création du Job Cloud Scheduler :

```bash
gcloud scheduler jobs create http streak-daily-reminders \
  --location europe-west1 \
  --schedule "0 19 * * *" \
  --time-zone "Europe/Paris" \
  --uri "https://<VOTRE-URL-CLOUD-RUN>/notifications/send-daily-reminders" \
  --http-method POST \
  --headers "x-cron-secret=Bearer <CRON_SECRET>,Content-Type=application/json" \
  --description "Envoi quotidien des emails de rappel de streak aux apprenants inactifs"
```

### Tester manuellement le déclencheur :
```bash
gcloud scheduler jobs run streak-daily-reminders --location europe-west1
```

---

## ☕ 5. Configuration du Webhook Buy Me a Coffee

Dans votre tableau de bord créateur **Buy Me a Coffee** :
1. Rendez-vous dans **Settings** > **Webhooks**.
2. URL du Webhook : `https://<VOTRE-URL-CLOUD-RUN>/donations/bmc-webhook`.
3. Secret Key : Indiquez la valeur définie dans `BMC_WEBHOOK_SECRET`.
4. Événements à écouter : **Donations / Support**.

---

## 🔄 6. Migrations de Base de Données en Production

Lorsque vous déployez une nouvelle version avec des modifications de schéma Prisma :

```bash
# Déploiement des migrations vers Supabase (port direct 5432)
npx prisma migrate deploy
```
