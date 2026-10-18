# LevelUpCode - Backend API (NestJS)

Backend pour la plateforme d'apprentissage interactif **LevelUpCode**, conçu avec **NestJS**, **Prisma ORM**, **Supabase (PostgreSQL)** et déployé sur **Google Cloud Run**.

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

5. **Gamification, Statistiques & Rappels** :
   - Calcul automatique de streak quotidien (séries de jours consécutifs).
   - Score / XP cumulé par catégorie, par tag et par niveau de difficulté.
   - Suivi de la durée d'inscription.
   - **Rappels quotidiens par email** : alerte automatique en soirée pour préserver le streak si aucun exercice n'a été réalisé dans la journée.

6. **Modèle 100% Gratuit & Soutien Participatif** :
   - Accès libre et illimité à l'ensemble du catalogue de leçons et de quiz.
   - Aucune restriction de quota journalier, aucun abonnement ni paywall.
   - Financement participatif via **Buy Me a Coffee** (dons volontaires & badge cosmétique supporter).

---

## 🏗️ Architecture & Infrastructure

- **API** : Google Cloud Run (Container Docker NestJS).
- **Base de Données** : Supabase (PostgreSQL managé avec Connection Pooling PgBouncer / Supavisor).
- **ORM** : Prisma (avec `DATABASE_URL` pour le pooling et `DIRECT_URL` pour les migrations).
- **Planification & Emails** : Google Cloud Scheduler (déclencheur cron gratuit) + Resend / Nodemailer (envois transactionnels).

---

## 📅 Prochaines Étapes (Reprise Lundi)

- [ ] **Étape 1** : Initialisation du projet NestJS (`nest new` / structure TypeScript), configuration Prisma & Swagger.
- [ ] **Étape 2** : Schéma relationnel Prisma (`schema.prisma`) & migration initiale vers Supabase + script de seed des 9 catégories.
- [ ] **Étape 3** : Module Auth (Email/MDP + Google + GitHub + JWT).
- [ ] **Étape 4** : Modules Catégories, Leçons et Quiz (avec filtrage par difficulté et progression).
- [ ] **Étape 5** : Gamification & Statistiques (calcul automatique de streak, scores par tags et XP).
- [ ] **Étape 6** : Système de Rappel Email Quotidien (MailModule, template d'alerte streak & trigger Cloud Scheduler).
- [ ] **Étape 7** : Module Dons & Webhook Buy Me a Coffee (attribution du badge supporter).
- [ ] **Étape 8** : Dockerfile de production & déploiement Cloud Run.
