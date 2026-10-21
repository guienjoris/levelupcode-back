#!/usr/bin/env node

/**
 * Script de récupération et synchronisation des variables d'environnement depuis Google Secret Manager.
 * Écrit ou écrase le fichier .env localement à la racine du projet.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envFilePath = path.join(rootDir, '.env');

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'levelupcode-512207';
const BUNDLE_SECRET_NAME = 'levelupcode-back';

/**
 * Formatage d'une valeur pour le fichier .env
 */
function formatEnvValue(val) {
  if (val === undefined || val === null) return '';
  const str = String(val);
  // Si la valeur contient des espaces ou caractères spéciaux, encadrement de guillemets
  if (
    str.includes(' ') ||
    str.includes('"') ||
    str.includes("'") ||
    str.includes('\n') ||
    str.includes('#') ||
    str.includes('@') ||
    str.includes(':') ||
    str.includes('/') ||
    str.includes('$')
  ) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

/**
 * Organisation logique des variables d'environnement dans le fichier .env
 */
function organizeEnvFile(secretsMap) {
  const sections = [
    {
      title: 'Environment',
      keys: ['PORT', 'NODE_ENV'],
    },
    {
      title: 'Supabase PostgreSQL Configuration',
      keys: [
        'SUPABASE_URL',
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_JWKS_URL',
        'DATABASE_URL',
        'DIRECT_URL',
      ],
    },
    {
      title: 'JWT Authentication',
      keys: [
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'JWT_REFRESH_SECRET',
        'JWT_REFRESH_EXPIRES_IN',
      ],
    },
    {
      title: 'OAuth2 Authentication',
      keys: [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_CALLBACK_URL',
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'GITHUB_CALLBACK_URL',
      ],
    },
    {
      title: 'Administrator & Error Reporting',
      keys: ['ADMIN_EMAIL'],
    },
    {
      title: 'Cloud Scheduler & Notifications',
      keys: ['CRON_SECRET'],
    },
    {
      title: 'Mail Provider (Resend)',
      keys: ['RESEND_API_KEY', 'MAIL_FROM'],
    },
    {
      title: 'Buy Me a Coffee Webhook',
      keys: ['BMC_WEBHOOK_SECRET'],
    },
  ];

  const processedKeys = new Set();
  const lines = [
    '# ============================================================================== #',
    '# Fichier .env synchronisé automatiquement depuis Google Secret Manager          #',
    `# Projet GCP: ${PROJECT_ID}                                                     #`,
    `# Généré le: ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}                                  #`,
    '# ============================================================================== #',
    '',
  ];

  for (const section of sections) {
    const sectionEntries = [];
    for (const key of section.keys) {
      if (secretsMap.has(key)) {
        sectionEntries.push(`${key}=${formatEnvValue(secretsMap.get(key))}`);
        processedKeys.add(key);
      }
    }
    if (sectionEntries.length > 0) {
      lines.push(`# ${section.title}`);
      lines.push(...sectionEntries);
      lines.push('');
    }
  }

  // Ajout des clés restantes non catégorisées
  const remainingKeys = Array.from(secretsMap.keys()).filter((k) => !processedKeys.has(k));
  if (remainingKeys.length > 0) {
    lines.push('# Autres Variables');
    for (const key of remainingKeys.sort()) {
      lines.push(`${key}=${formatEnvValue(secretsMap.get(key))}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Récupération via la CLI gcloud (utilise les identifiants actifs de gcloud auth login)
 */
async function fetchViaGcloud() {
  console.log(`📡 Connexion à Google Secret Manager via gcloud (Projet : ${PROJECT_ID})...`);

  // 1. Vérifier si un secret groupé BUNDLE_SECRET_NAME existe
  try {
    const { stdout: bundleVal } = await execAsync(
      `gcloud secrets versions access latest --secret=${BUNDLE_SECRET_NAME} --project=${PROJECT_ID}`,
    );
    if (bundleVal && bundleVal.includes('=')) {
      console.log(`✓ Secret groupé "${BUNDLE_SECRET_NAME}" détecté et utilisé.`);
      return bundleVal;
    }
  } catch {
    // Secret groupé non présent, on procède avec la liste des secrets individuels
  }

  // 2. Liste tous les secrets du projet
  const { stdout: listOutput } = await execAsync(
    `gcloud secrets list --project=${PROJECT_ID} --format="value(name)"`,
  );
  const secretNames = listOutput
    .trim()
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (secretNames.length === 0) {
    throw new Error(`Aucun secret trouvé dans le projet GCP "${PROJECT_ID}".`);
  }

  console.log(`→ ${secretNames.length} secrets trouvés. Téléchargement en parallèle...`);

  const secretsMap = new Map();
  await Promise.all(
    secretNames.map(async (name) => {
      try {
        const { stdout: val } = await execAsync(
          `gcloud secrets versions access latest --secret=${name} --project=${PROJECT_ID}`,
        );
        secretsMap.set(name, val.replace(/\r?\n$/, ''));
        console.log(`  ✓ ${name}`);
      } catch (err) {
        console.warn(`  ⚠️ Impossible de lire "${name}":`, err.message);
      }
    }),
  );

  return organizeEnvFile(secretsMap);
}

/**
 * Repli via SDK @google-cloud/secret-manager (utile en environnement avec service account)
 */
async function fetchViaSdk() {
  const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
  const client = new SecretManagerServiceClient();

  try {
    const bundlePath = `projects/${PROJECT_ID}/secrets/${BUNDLE_SECRET_NAME}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name: bundlePath });
    const payload = version.payload?.data?.toString();
    if (payload && payload.includes('=')) {
      return payload;
    }
  } catch {
    // Poursuite avec les secrets individuels
  }

  const [secrets] = await client.listSecrets({ parent: `projects/${PROJECT_ID}` });
  const secretsMap = new Map();

  await Promise.all(
    secrets.map(async (secret) => {
      const secretName = secret.name.split('/').pop();
      try {
        const [version] = await client.accessSecretVersion({
          name: `${secret.name}/versions/latest`,
        });
        const value = version.payload?.data?.toString() || '';
        secretsMap.set(secretName, value);
      } catch (err) {
        console.warn(`  ⚠️ Impossible de lire "${secretName}":`, err.message);
      }
    }),
  );

  return organizeEnvFile(secretsMap);
}

async function main() {
  console.log('====================================================');
  console.log('🔄 Mise à jour du fichier .env depuis Secret Manager');
  console.log('====================================================');

  let envContent = '';

  try {
    // 1. Priorité à la CLI gcloud (fonctionne directement avec le compte actif)
    envContent = await fetchViaGcloud();
  } catch (gcloudErr) {
    console.log('ℹ️  gcloud non disponible ou en échec, essai via le SDK Google Cloud...');
    try {
      envContent = await fetchViaSdk();
    } catch (sdkErr) {
      console.error('\n❌ Impossible de récupérer les secrets depuis GCP :');
      console.error(`- gcloud: ${gcloudErr.message}`);
      console.error(`- SDK: ${sdkErr.message}`);
      console.error('\n💡 Assurez-vous d’être connecté avec: gcloud auth login');
      process.exit(1);
    }
  }

  // Écrasement (ou création) du fichier .env
  fs.writeFileSync(envFilePath, envContent, { encoding: 'utf-8', flag: 'w' });

  console.log('====================================================');
  console.log(`✅ Fichier .env mis à jour avec succès :`);
  console.log(`   ${envFilePath}`);
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('Erreur inattendue:', err);
  process.exit(1);
});
