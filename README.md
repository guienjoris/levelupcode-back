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

6. **Signalement d'Erreurs & Feedback Pédagogique** :
   - Bouton de signalement d'erreur intégré directement dans chaque leçon et chaque quiz (coquille, bug, imprécision).
   - **Envoi automatique d'un email instantané à l'administrateur** : notification immédiate avec l'identifiant (`id`) de la leçon ou du quiz concerné et le commentaire détaillé de l'apprenant explicitant le problème.
   - Enregistrement et suivi des signalements en base pour audit et amélioration continue du contenu.

7. **Modèle 100% Gratuit & Soutien Participatif** :
   - Accès libre et illimité à l'ensemble du catalogue de leçons et de quiz.
   - Aucune restriction de quota journalier, aucun abonnement ni paywall.
   - Financement participatif via **Buy Me a Coffee** (dons volontaires & badge cosmétique supporter).

8. **Administration & Gestion de Contenu (CRUD Leçons & Quiz)** :
   - Espace sécurisé réservé aux administrateurs via contrôle d'accès RBAC (`Role.ADMIN`).
   - Requêtes complètes de **création**, **mise à jour** et **suppression** pour les leçons (markdown, ordre, difficulté).
   - Requêtes de **création**, **mise à jour** et **suppression en cascade** pour les quiz, questions et réponses associées.

---

## 🏗️ Architecture & Infrastructure

- **API** : Google Cloud Run (Container Docker NestJS).
- **Base de Données** : Supabase (PostgreSQL managé avec Connection Pooling PgBouncer / Supavisor).
- **ORM** : Prisma (avec `DATABASE_URL` pour le pooling et `DIRECT_URL` pour les migrations).
- **Planification & Emails** : Google Cloud Scheduler (déclencheur cron gratuit) + Resend / Nodemailer (rappels quotidiens de streak & alertes automatiques d'erreurs admin).

---

## 📅 Prochaines Étapes

- [ ] **Étape 1** : Initialisation du projet NestJS (`nest new` / structure TypeScript), configuration Prisma & Swagger.
- [ ] **Étape 2** : Schéma relationnel Prisma (`schema.prisma` avec rôles `USER`/`ADMIN`, signalements, cascade) & migration vers Supabase + script de seed.
- [ ] **Étape 3** : Module Auth (Email/MDP + Google + GitHub + JWT) & Guards RBAC.
- [ ] **Étape 4** : Modules Catégories, Leçons et Quiz publics (consultation, filtrage et validation de progression).
- [ ] **Étape 5** : Module Administration CRUD (Création, modification et suppression de leçons et quiz pour l'administrateur).
- [ ] **Étape 6** : Gamification & Statistiques (calcul automatique de streak, scores par tags et XP).
- [ ] **Étape 7** : Système d'Emails Transactionnels (`MailModule` : rappels de streak avec Cloud Scheduler & alertes admin de signalement d'erreurs).
- [ ] **Étape 8** : Module de Signalement d'Erreurs (`ReportsModule` : endpoint `POST /reports`, persistance et transmission instantanée du mail à l'admin avec ID et commentaire).
- [ ] **Étape 9** : Module Dons & Webhook Buy Me a Coffee (attribution du badge supporter).
- [ ] **Étape 10** : Dockerfile de production & déploiement Cloud Run.
