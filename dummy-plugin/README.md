# Plugin Documentation

**Plugin de référence pour le développement de plugins Stomy**

Ce plugin sert à la fois de **documentation complète** et d'**exemple vivant** du système de plugins Stomy. Il est conçu pour être une ressource indispensable aux développeurs de plugins.

## 📚 Contenu

Ce plugin contient la documentation exhaustive du système de plugins répartie en 4 fichiers principaux :

### 1. [PLUGIN_SPEC.md](./PLUGIN_SPEC.md) - Spécifications

Documentation complète de l'architecture et des APIs :

- **Interface Plugin** : Propriétés requises et optionnelles
- **Hooks du Cycle de Vie** : onInstall, onEnable, onDisable, onUninstall, onUpdate
- **Actions et Menu Items** : Système d'actions contextuelles
- **Settings Management** : Gestion de la configuration persistante
- **Services Disponibles** : notificationService, libraryService, dbService, Tauri APIs
- **Types de Plugins** : Standard, ExportPlugin, SyncPlugin
- **Intégration Sidebar** : Configuration et composants
- **Permissions** : Système de permissions Tauri
- **Backend Rust** : Intégration de commandes Rust
- **Manifest.json** : Format et options
- **Conventions** : Nommage, structure, validation

### 2. [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Guide de Développement

Guide pas-à-pas pour créer un plugin :

- **Démarrage Rapide** : Plugin minimal en 5 minutes
- **Étapes de Développement** : De la définition des types à la publication
- **Fonctionnalités Avancées** :
  - Plugin avec Backend Rust
  - Plugin avec Sidebar
  - Plugin ExportPlugin
- **Testing** : Stratégies de test manuel et automatisé
- **Organisation du Code** : Structure recommandée
- **Debugging** : Logs structurés, try-catch, vérifications
- **Documentation** : JSDoc, README
- **Publication** : Checklist et processus de PR

### 3. [EXAMPLES.md](./EXAMPLES.md) - Exemples

8 exemples de plugins complets et fonctionnels :

1. **Plugin Simple** : Les bases avec une action
2. **Plugin avec Settings** : Configuration utilisateur
3. **Plugin Export** : Export JSON avec ExportPlugin interface
4. **Plugin Sync** : Synchronisation USB
5. **Plugin avec Backend Rust** : Analytics avec traitement performant
6. **Plugin avec Sidebar** : Dashboard avec UI personnalisée
7. **Plugin avec Base de Données** : Historique de lecture
8. **Plugin avec API Externe** : Récupération de métadonnées

Tous les exemples incluent du code prêt à copier-coller et peuvent servir de base pour vos propres plugins.

### 4. [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Meilleures Pratiques

Guide des bonnes pratiques pour du code maintenable :

- **Principes Généraux** : KISS, DRY, SOLID
- **Conventions de Code** : Nommage, structure
- **Gestion d'Erreurs** : Try-catch, messages clairs, validation
- **Performance** : Éviter les blocages, cache, debounce
- **Feedback Utilisateur** : Notifications, loading states
- **Sécurité** : Pas de credentials, validation, permissions minimales
- **Logging** : Logs structurés, niveaux appropriés
- **Testabilité** : Fonctions pures, injection de dépendances
- **Documentation** : JSDoc, README
- **Maintenance** : Versioning, migrations, deprecation
- **UI/UX** : Actions contextuelles, icônes appropriées
- **Internationalisation** : Préparation i18n
- **Checklist** : Liste de vérification avant publication

## 🎯 Comment Utiliser ce Plugin

### En tant que Documentation

1. **Lisez dans l'ordre** :
   - Commencez par `PLUGIN_SPEC.md` pour comprendre l'architecture
   - Suivez `DEVELOPMENT_GUIDE.md` pour créer votre premier plugin
   - Consultez `EXAMPLES.md` pour trouver du code réutilisable
   - Référez-vous à `BEST_PRACTICES.md` pour le code de qualité

2. **Gardez-le ouvert** pendant le développement comme référence rapide

### En tant que Plugin Actif

1. **Activez le plugin** dans Settings > Plugins
2. **Testez les actions** pour voir des démonstrations en live :
   - 📚 Voir la documentation
   - ⚙️ Démo Settings
   - 📝 Démo Logging
   - ⚠️ Démo Gestion d'Erreurs
   - 🔄 Démo Lifecycle Hooks
3. **Observez la console** DevTools pour voir les logs des hooks
4. **Testez les hooks** en activant/désactivant le plugin

### En tant qu'Exemple de Code

Le code source de `index.ts` est lui-même un exemple complet qui démontre :

- ✅ Tous les lifecycle hooks
- ✅ Actions avec différents contextes
- ✅ Settings management
- ✅ Gestion d'erreurs
- ✅ Logging structuré
- ✅ Notifications utilisateur
- ✅ Menu items
- ✅ Bonnes pratiques de code

## 🚀 Démarrage Rapide

Pour créer votre premier plugin basé sur cette documentation :

```bash
# 1. Créer le répertoire du plugin
cd stomy-plugins
mkdir my-plugin
cd my-plugin

# 2. Créer le fichier principal
cat > index.ts << 'EOF'
import type { Plugin } from '../types';

export const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  description: 'Description',
  version: '1.0.0',
  author: 'Your Name',
  enabled: false,
  icon: 'PuzzlePieceRegular',
};

export default myPlugin;
EOF

# 3. Enregistrer dans l'app principale
# Éditer src/plugins/index.ts et ajouter:
# import { myPlugin } from './core/my-plugin';
# await pluginManager.registerPlugin(myPlugin);
```

## 📖 Ressources Complémentaires

- **CLAUDE.md** (racine du repo) : Guide pour Claude Code sur le développement de plugins
- **README.md** (racine du repo) : Documentation générale du système de plugins
- **Plugins existants** : csv-export, kobo-sync, kindle-sync, epub-to-pdf, fake-sync, bug-tracker

## 🎓 Parcours d'Apprentissage Recommandé

### Niveau Débutant
1. Lire PLUGIN_SPEC.md - Interface Plugin et Actions
2. Suivre DEVELOPMENT_GUIDE.md - Démarrage Rapide
3. Copier l'exemple "Plugin Simple" de EXAMPLES.md
4. Activer ce plugin et tester les démonstrations

### Niveau Intermédiaire
1. Lire PLUGIN_SPEC.md - Hooks et Settings
2. Suivre DEVELOPMENT_GUIDE.md - Étapes de Développement
3. Copier l'exemple "Plugin avec Settings" ou "Plugin Export"
4. Consulter BEST_PRACTICES.md - Sections de base

### Niveau Avancé
1. Lire PLUGIN_SPEC.md - Backend Rust et Sidebar
2. Suivre DEVELOPMENT_GUIDE.md - Fonctionnalités Avancées
3. Étudier fake-sync ou bug-tracker comme exemples complexes
4. Maîtriser BEST_PRACTICES.md - Toutes les sections

## 💡 Tips

- **Utilisez les snippets** : Copiez-collez le code des exemples
- **Consultez les plugins existants** : csv-export est un excellent exemple simple
- **Activez ce plugin** : Les démonstrations interactives aident à comprendre
- **Lisez le code source** : Le fichier `index.ts` de ce plugin est un exemple complet
- **Testez fréquemment** : Activez/désactivez pour voir les hooks en action

## 🤝 Contribution

Ce plugin de documentation est maintenu par l'équipe Stomy. Pour suggérer des améliorations :

1. Ouvrir une issue sur le dépôt GitHub
2. Proposer des exemples supplémentaires
3. Signaler des sections peu claires
4. Contribuer des cas d'usage réels

## 📝 Versions

### v2.0.0 (Actuelle)
- Transformation de dummy-plugin en Plugin Documentation
- Ajout de PLUGIN_SPEC.md
- Ajout de DEVELOPMENT_GUIDE.md
- Ajout de EXAMPLES.md (8 exemples)
- Ajout de BEST_PRACTICES.md
- Actions interactives de démonstration
- Migration vers Fluent UI System Icons

### v1.0.0 (Legacy)
- Plugin Dummy original
- Démonstration basique des hooks

## 📄 Licence

Internal use only - Stomy Team

---

**Note** : Ce plugin est désormais la **référence officielle** pour le développement de plugins Stomy. Toute autre documentation doit pointer vers ces fichiers comme source de vérité.
