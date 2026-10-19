import 'dotenv/config';
import { PrismaClient, Role, Difficulty, AuthProvider } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Début du seed de la base de données LevelUpCode...');

  // 1. Tags
  const tagsData = [
    { slug: 'front-end', name: 'Front-End' },
    { slug: 'back-end', name: 'Back-End' },
    { slug: 'full-stack', name: 'Full-Stack' },
    { slug: 'language', name: 'Langage' },
    { slug: 'framework', name: 'Framework' },
    { slug: 'library', name: 'Bibliothèque' },
    { slug: 'devOps', name: 'DevOps' },
    { slug: 'tools', name: 'Outils' },
    { slug: 'architecture', name: 'Architecture' },
    { slug: 'best-practices', name: 'Bonnes Pratiques' },
    { slug: 'clean-code', name: 'Clean Code' },
    { slug: 'system-design', name: 'System Design' },
    { slug: 'database', name: 'Base de Données' },
  ];

  console.log(`🏷️  Création / mise à jour de ${tagsData.length} tags...`);
  const tagsMap = new Map<string, string>();
  for (const tag of tagsData) {
    const upsertedTag = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
    tagsMap.set(tag.slug, upsertedTag.id);
  }

  // 2. Les 9 Catégories officielles
  const categoriesData = [
    {
      slug: 'javascript',
      name: 'JavaScript',
      description: 'Maîtrisez les fondamentaux, la programmation asynchrone, les closures et le moteur V8.',
      icon: 'logos:javascript',
      orderIndex: 1,
      tags: ['front-end', 'language'],
    },
    {
      slug: 'typescript',
      name: 'TypeScript',
      description: 'Typage statique avancé, génériques, interfaces, types utilitaires et decorators.',
      icon: 'logos:typescript-icon',
      orderIndex: 2,
      tags: ['front-end', 'language', 'full-stack'],
    },
    {
      slug: 'react',
      name: 'React',
      description: 'Composants, hooks personnalisés, gestion d’état, optimisation de rendu et architecture moderne.',
      icon: 'logos:react',
      orderIndex: 3,
      tags: ['front-end', 'library', 'framework'],
    },
    {
      slug: 'nestjs',
      name: 'NestJS',
      description: 'Framework back-end modulaire, injection de dépendances, middleware, guards, interceptors et microservices.',
      icon: 'logos:nestjs',
      orderIndex: 4,
      tags: ['back-end', 'framework'],
    },
    {
      slug: 'nextjs',
      name: 'Next.js',
      description: 'React Server Components, App Router, SSR, SSG, Server Actions et optimisations SEO.',
      icon: 'logos:nextjs-icon',
      orderIndex: 5,
      tags: ['front-end', 'full-stack', 'framework'],
    },
    {
      slug: 'git',
      name: 'Git & GitHub',
      description: 'Gestion de versions, workflows Git Flow / Trunk-based, rebase interactif et CI/CD.',
      icon: 'logos:git-icon',
      orderIndex: 6,
      tags: ['devOps', 'tools'],
    },
    {
      slug: 'design-principles',
      name: 'Principes de Conception',
      description: 'Principes SOLID, DRY, KISS, YAGNI et écriture de code propre et maintenable.',
      icon: 'carbon:clean',
      orderIndex: 7,
      tags: ['architecture', 'best-practices', 'clean-code'],
    },
    {
      slug: 'architecture',
      name: 'Architecture Logicielle',
      description: 'Architecture hexagonale, Clean Architecture, CQRS, Event-Driven et scalabilité.',
      icon: 'carbon:cloud-monitoring',
      orderIndex: 8,
      tags: ['architecture', 'system-design'],
    },
    {
      slug: 'sql-mongodb',
      name: 'SQL & MongoDB',
      description: 'Modélisation relationnelle, indexation B-Tree, requêtes complexes, NoSQL et transactions ACID.',
      icon: 'carbon:data-base',
      orderIndex: 9,
      tags: ['database', 'back-end'],
    },
  ];

  console.log(`📚 Création / mise à jour des 9 catégories officielles...`);
  const categoriesMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const upsertedCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        orderIndex: cat.orderIndex,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        orderIndex: cat.orderIndex,
      },
    });
    categoriesMap.set(cat.slug, upsertedCat.id);

    // Lier les tags à la catégorie
    for (const tagSlug of cat.tags) {
      const tagId = tagsMap.get(tagSlug);
      if (tagId) {
        await prisma.tagOnCategory.upsert({
          where: {
            categoryId_tagId: {
              categoryId: upsertedCat.id,
              tagId,
            },
          },
          update: {},
          create: {
            categoryId: upsertedCat.id,
            tagId,
          },
        });
      }
    }
  }

  // 3. Compte Administrateur par défaut
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@levelupcode.dev';
  console.log(`👑 Création / vérification du compte Administrateur (${adminEmail})...`);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      email: adminEmail,
      name: 'Administrateur LevelUpCode',
      role: Role.ADMIN,
      provider: AuthProvider.LOCAL,
      isSupporter: true,
      streak: {
        create: {
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date(),
        },
      },
    },
  });

  // 4. Exemple de Leçon et de Quiz d'introduction (NestJS)
  const nestjsCatId = categoriesMap.get('nestjs');
  if (nestjsCatId) {
    console.log('📝 Création de la leçon et du quiz démo (NestJS)...');
    const lesson = await prisma.lesson.upsert({
      where: { slug: 'introduction-aux-modules-nestjs' },
      update: {},
      create: {
        slug: 'introduction-aux-modules-nestjs',
        title: 'Introduction aux Modules dans NestJS',
        description: 'Comprendre le rôle des modules et la structure d’une application NestJS.',
        difficulty: Difficulty.NOVICE,
        orderIndex: 1,
        categoryId: nestjsCatId,
        contentMarkdown: `# Les Modules dans NestJS

Un module est une classe annotée avec le décorateur \`@Module()\`. Ce décorateur fournit les métadonnées que Nest utilise pour organiser la structure de l'application.

## Structure de base d'un module

Chaque application Nest possède au minimum un module racine, généralement nommé \`AppModule\`.

\`\`\`typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
\`\`\`

### Propriétés clés :
- **providers** : les services instanciés par l'injecteur Nest et partageables.
- **controllers** : les contrôleurs définis dans ce module.
- **imports** : la liste des modules exportés nécessaires à ce module.
- **exports** : les fournisseurs à exposer aux autres modules qui importeront celui-ci.
`,
      },
    });

    // Quiz associé
    const quizExists = await prisma.quiz.findFirst({
      where: { lessonId: lesson.id },
    });

    if (!quizExists) {
      await prisma.quiz.create({
        data: {
          title: 'Quiz : Les fondamentaux des Modules NestJS',
          description: 'Testez vos connaissances sur le décorateur @Module et ses propriétés.',
          difficulty: Difficulty.NOVICE,
          categoryId: nestjsCatId,
          lessonId: lesson.id,
          orderIndex: 1,
          questions: {
            create: [
              {
                title: 'Quel décorateur est requis pour définir un module NestJS ?',
                codeSnippet: null,
                explanation: 'Le décorateur @Module() permet à NestJS d\'enregistrer les métadonnées de structure de l\'application.',
                orderIndex: 1,
                answers: {
                  create: [
                    { text: '@Module()', isCorrect: true, orderIndex: 1 },
                    { text: '@Component()', isCorrect: false, orderIndex: 2 },
                    { text: '@Injectable()', isCorrect: false, orderIndex: 3 },
                    { text: '@Package()', isCorrect: false, orderIndex: 4 },
                  ],
                },
              },
              {
                title: 'Quelle propriété du décorateur @Module permet d\'exposer un service aux autres modules ?',
                codeSnippet: null,
                explanation: 'La propriété "exports" permet de partager des providers avec tout module qui importe celui-ci.',
                orderIndex: 2,
                answers: {
                  create: [
                    { text: 'exports', isCorrect: true, orderIndex: 1 },
                    { text: 'public', isCorrect: false, orderIndex: 2 },
                    { text: 'expose', isCorrect: false, orderIndex: 3 },
                    { text: 'shared', isCorrect: false, orderIndex: 4 },
                  ],
                },
              },
            ],
          },
        },
      });
    }
  }

  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
