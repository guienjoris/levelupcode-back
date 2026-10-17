# LevelUpCode - Backend API (NestJS)

Backend pour la plateforme d'apprentissage interactif **LevelUpCode**, conçu avec **NestJS**, **Prisma ORM**, **Google Cloud SQL** et déployé sur **Google Cloud Run**.

---

## 🎯 Fonctionnalités Principales

1. **Authentification Multi-Providers** :
   - Email / Mot de passe (hachage sécurisé).
   - Google OAuth2.
   - GitHub OAuth2.
   - Sécurisation des routes par JWT (Access Token + Refresh Token).

2. **9 Catégories d'Apprentissage (avec Tags)** :
   - JavaScript (`front-end`, `language`)
   - TypeScript (`front-end`, `language`, `full-stack`)
   - React (`front-end`, `library`, `framework`)
   - NestJS (`back-end`, `framework`)
   - NextJS (`front-end`, `full-stack`, `framework`)
   - Git (`devOps`, `tools`)
   - Principes de conception (`architecture`, `best-practices`, `clean-code`)
   - Architecture (`architecture`, `system-design`)
   - SQL / MongoDB (`database`, `back-end`)

3. **Niveaux de Difficulté** :
   - `NOVICE` (Fondamentaux, syntaxe, découverte)
   - `INTERMEDIAIRE` (Cas pratiques, patterns courants)
   - `SENIOR` (Optimisation, performance, architecture poussée)

4. **Contenu Pédagogique & Évaluations** :
   - Leçons concises au format Markdown avec extraits de code interactifs.
   - Quiz QCM associés à chaque leçon avec explication des réponses.

5. **Gamification & Statistiques** :
   - Calcul automatique de streak quotidien (séries de jours consécutifs).
   - Score / XP cumulé par catégorie, par tag et par niveau de difficulté.
   - Suivi de la durée d'inscription.

6. **Monétisation & Quotas Journaliers** :
   - **Formule Gratuite** : 5 leçons / quiz par jour (bloqué via `DailyQuotaGuard`).
   - **Formule Illimitée (5 € / mois)** :
     - Web : Stripe Checkout & Webhooks.
     - Mobile Android : Google Play Billing API & notifications temps réel RTDN.

---

## 🏗️ Architecture & Infrastructure GCP

- **API** : Google Cloud Run (Container Docker NestJS).
- **Base de Données** : Google Cloud SQL (PostgreSQL).
- **ORM** : Prisma.

---

## 📅 Prochaines Étapes (Reprise Lundi)

- [ ] **Étape 1** : Initialisation du projet NestJS (`nest new` / structure TypeScript), configuration Prisma & Swagger.
- [ ] **Étape 2** : Schéma relationnel Prisma (`schema.prisma`) & migration initiale vers Cloud SQL + script de seed des 9 catégories.
- [ ] **Étape 3** : Module Auth (Email/MDP + Google + GitHub + JWT).
- [ ] **Étape 4** : Modules Catégories, Leçons et Quiz (avec filtrage par difficulté).
- [ ] **Étape 5** : Moteur de quota journalier (limite 5/jour).
- [ ] **Étape 6** : Statistiques, scores par tags et streaks.
- [ ] **Étape 7** : Modules de facturation Stripe & Google Play.
- [ ] **Étape 8** : Dockerfile de production & déploiement Cloud Run.
