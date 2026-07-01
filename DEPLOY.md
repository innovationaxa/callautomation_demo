# Publier la démo sur Vercel

L'app est prête (build de production OK). Dossier : `Demo Voicebot Selfcare/webapp`.

## Voie recommandée — CLI Vercel (la plus rapide)

Dans un terminal, depuis le dossier `webapp` :

```bash
cd "Demo Voicebot Selfcare/webapp"

# 1. Authentification (ouvre le navigateur)
vercel login

# 2. Lier / créer le projet (scope = innovationaxa's projects)
vercel link

# 3. Définir les variables d'environnement (Production)
vercel env add MONAXAIA_API_BASE production
#   → coller : https://mon-axaia.vercel.app
vercel env add MONAXAIA_API_KEY production
#   → coller la clé secrète (voir .env.local, non versionné — ne jamais committer cette valeur)

# 4. Déployer en production
vercel --prod
```

> La CLI n'envoie jamais les fichiers `.env*` (exclus par défaut + `.vercelignore`).
> La clé reste donc côté serveur uniquement.

## Voie alternative — connecteur Vercel dans Claude

1. Autoriser le connecteur **Vercel** dans les paramètres de connecteurs claude.ai.
2. Dans une session Claude **interactive**, redemander le déploiement : je pourrai alors
   créer le projet, poser les variables d'env et déployer via l'intégration.

## Protéger l'accès (choisi : accès protégé)

Après le premier déploiement, dans le dashboard Vercel :

**Project → Settings → Deployment Protection**
- **Vercel Authentication** (tous plans) : seuls les membres connectés à Vercel voient le site.
- **Password Protection** (plan Pro/Enterprise) : un mot de passe partagé à donner au comité —
  idéal pour une démo, mais nécessite un plan Pro.

Objectif : éviter que des tiers déclenchent le mode « Réel » (qui écrit sur la prod
`mon-axaia.vercel.app`). Le mode par défaut reste « Répétition » (sans écriture).

## Nettoyage éventuel des données de test

Après des essais en mode « Réel », l'endpoint de purge vide events + handoffs :

```
GET https://mon-axaia.vercel.app/api/events?purge=all&key=<clé secrète — voir .env.local>
```
