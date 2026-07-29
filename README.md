# AMF Révision — version connectée

## Ce que contient ce projet
- Authentification e-mail / mot de passe via Supabase
- Banque centrale de QCM
- Historique des tentatives par étudiant
- Tableau de bord personnel
- Révision des erreurs
- Examen blanc
- Rôle administrateur pour ajouter des questions
- Row Level Security (RLS)

## Mise en route
1. Créez un projet Supabase.
2. Dans SQL Editor, exécutez `schema.sql`.
3. Exécutez ensuite `seed_questions.sql` pour charger les 50 QCM.
4. Dans Project Settings > API, copiez l’URL du projet et la clé publishable.
5. Remplacez les deux valeurs dans `config.js`.
6. Créez votre compte dans l’application.
7. Pour vous rendre administrateur, exécutez dans SQL Editor :
   `update public.profiles set role='admin' where id=(select id from auth.users where email='VOTRE_EMAIL');`
8. Déployez le dossier sur Netlify, Vercel, GitHub Pages ou tout hébergeur statique.

Important : n’utilisez jamais la clé `service_role` dans `config.js`. Utilisez uniquement la clé publique/publishable.
