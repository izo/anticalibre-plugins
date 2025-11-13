/**
 * Plugin Documentation (ex-Dummy Plugin)
 * Plugin de référence et documentation pour le développement de plugins Stomy
 *
 * Ce plugin sert à la fois de:
 * - Spécification complète du système de plugins
 * - Guide de développement avec exemples
 * - Référence des meilleures pratiques
 * - Plugin exemple démontrant tous les hooks et fonctionnalités
 */

import type { Plugin } from '../types';
import { notificationService } from '../../services/notificationService';

interface DocPluginSettings {
  exampleCounter: number;
  showDetailedLogs: boolean;
  demoMode: boolean;
}

const LOG_PREFIX = '[PluginDocs]';

export const pluginDocsPlugin: Plugin = {
  // === Métadonnées ===
  id: 'plugin-docs',
  name: 'Plugin Documentation',
  description: 'Spécifications, guide de développement et exemples pour créer des plugins Stomy',
  version: '2.0.0',
  author: 'Stomy Team',
  icon: 'DocumentTextRegular',
  repository: 'https://github.com/izo/stomy-plugins',

  // === Configuration ===
  enabled: false,
  settings: {
    exampleCounter: 0,
    showDetailedLogs: true,
    demoMode: true,
  } as DocPluginSettings,

  // === Lifecycle Hooks ===
  // Ces hooks démontrent tous les points d'entrée du cycle de vie d'un plugin

  async onInstall() {
    console.log(`${LOG_PREFIX} onInstall() called`);
    console.log(`${LOG_PREFIX} Use this hook to initialize data, create DB tables, etc.`);

    await notificationService.notify({
      title: 'Plugin Documentation',
      body: '📚 Plugin installé! Voir le README pour la documentation complète.',
    });
  },

  async onUninstall() {
    console.log(`${LOG_PREFIX} onUninstall() called`);
    console.log(`${LOG_PREFIX} Use this hook to clean up data, remove DB tables, etc.`);

    await notificationService.notify({
      title: 'Plugin Documentation',
      body: 'Plugin désinstallé. Données nettoyées.',
    });
  },

  async onEnable() {
    console.log(`${LOG_PREFIX} onEnable() called`);
    console.log(`${LOG_PREFIX} Use this hook to start services, register listeners, etc.`);

    const settings = pluginDocsPlugin.settings as DocPluginSettings;

    if (settings.showDetailedLogs) {
      console.log(`${LOG_PREFIX} Detailed logs enabled`);
      console.log(`${LOG_PREFIX} Current settings:`, settings);
    }

    await notificationService.notify({
      title: 'Plugin Documentation',
      body: '✅ Plugin activé! Consultez les actions disponibles.',
    });
  },

  async onDisable() {
    console.log(`${LOG_PREFIX} onDisable() called`);
    console.log(`${LOG_PREFIX} Use this hook to stop services, unregister listeners, etc.`);

    await notificationService.notify({
      title: 'Plugin Documentation',
      body: 'Plugin désactivé.',
    });
  },

  async onUpdate(oldVersion: string, newVersion: string) {
    console.log(`${LOG_PREFIX} onUpdate() called: ${oldVersion} -> ${newVersion}`);
    console.log(`${LOG_PREFIX} Use this hook to migrate data between versions`);

    // Exemple de migration
    if (oldVersion === '1.0.0' && newVersion === '2.0.0') {
      console.log(`${LOG_PREFIX} Migrating from v1 to v2...`);
      // Migration logic here
    }

    await notificationService.notify({
      title: 'Plugin Documentation',
      body: `📦 Mis à jour vers ${newVersion}`,
    });
  },

  // === Actions ===
  // Les actions sont exposées dans l'interface utilisateur

  actions: [
    // Action globale - disponible partout
    {
      id: 'show-docs',
      label: '📚 Voir la documentation',
      icon: 'DocumentTextRegular',
      context: 'global',
      onClick: async () => {
        console.log(`${LOG_PREFIX} Opening documentation...`);

        const docs = `
📚 DOCUMENTATION DES PLUGINS STOMY

Fichiers disponibles dans dummy-plugin/:

1. PLUGIN_SPEC.md
   - Spécifications complètes du système
   - Interface Plugin et ses propriétés
   - Hooks, actions, settings, permissions

2. DEVELOPMENT_GUIDE.md
   - Guide pas-à-pas pour créer un plugin
   - De la structure de base aux features avancées
   - Backend Rust, Sidebar, Base de données

3. EXAMPLES.md
   - 8+ exemples de plugins complets
   - Simple, Export, Sync, API, etc.
   - Code prêt à copier-coller

4. BEST_PRACTICES.md
   - Conventions de code
   - Gestion d'erreurs
   - Performance, sécurité, tests
   - Checklist de publication

Consultez ces fichiers pour créer vos propres plugins!
        `.trim();

        alert(docs);

        await notificationService.notify({
          title: 'Plugin Documentation',
          body: 'Documentation affichée',
        });
      },
    },

    // Action de démonstration des settings
    {
      id: 'demo-settings',
      label: '⚙️ Démo Settings',
      icon: 'SettingsRegular',
      context: 'settings',
      onClick: async function () {
        const settings = pluginDocsPlugin.settings as DocPluginSettings;

        // Incrémenter le compteur
        settings.exampleCounter++;

        console.log(`${LOG_PREFIX} Counter incremented:`, settings.exampleCounter);
        console.log(`${LOG_PREFIX} This demonstrates persistent settings`);

        await notificationService.notify({
          title: 'Plugin Documentation',
          body: `Compteur: ${settings.exampleCounter}`,
        });
      },
    },

    // Action de démonstration des logs
    {
      id: 'demo-logging',
      label: '📝 Démo Logging',
      icon: 'DocumentBulletListRegular',
      context: 'settings',
      onClick: () => {
        const timestamp = new Date().toISOString();

        console.log(`${LOG_PREFIX} [INFO] Regular log message`);
        console.warn(`${LOG_PREFIX} [WARN] Warning message`);
        console.error(`${LOG_PREFIX} [ERROR] Error message`);
        console.debug(`${LOG_PREFIX} [DEBUG] Debug data:`, {
          timestamp,
          example: 'data',
        });

        alert(
          `Logs générés à ${timestamp}\n\n` +
          'Vérifiez la console DevTools:\n' +
          '- INFO: message normal\n' +
          '- WARN: avertissement\n' +
          '- ERROR: erreur\n' +
          '- DEBUG: données de debug'
        );
      },
    },

    // Action de démonstration des erreurs
    {
      id: 'demo-error-handling',
      label: '⚠️ Démo Gestion d\'Erreurs',
      icon: 'ErrorCircleRegular',
      context: 'settings',
      onClick: async () => {
        try {
          console.log(`${LOG_PREFIX} Simulating an error...`);

          // Simuler une erreur
          throw new Error('Ceci est une erreur de démonstration');
        } catch (error) {
          console.error(`${LOG_PREFIX} Error caught:`, error);

          await notificationService.notify({
            title: 'Plugin Documentation',
            body: `Erreur gérée correctement: ${error}`,
          });

          alert(
            '❌ Démonstration de gestion d\'erreur\n\n' +
            'Cette action démontre:\n' +
            '1. Try-catch pour capturer les erreurs\n' +
            '2. Logging de l\'erreur\n' +
            '3. Notification à l\'utilisateur\n' +
            '4. Pas de crash de l\'application'
          );
        }
      },
    },

    // Action de démonstration des hooks
    {
      id: 'demo-lifecycle',
      label: '🔄 Démo Lifecycle Hooks',
      icon: 'ArrowRepeatAllRegular',
      context: 'settings',
      onClick: async () => {
        const lifecycleInfo = `
🔄 LIFECYCLE HOOKS DISPONIBLES

1. onInstall()
   - Appelé à l'installation
   - Initialiser les données
   - Créer les tables DB

2. onEnable()
   - Appelé à l'activation
   - Démarrer les services
   - Enregistrer les listeners

3. onDisable()
   - Appelé à la désactivation
   - Arrêter les services
   - Nettoyer les listeners

4. onUninstall()
   - Appelé à la désinstallation
   - Supprimer les données
   - Nettoyer complètement

5. onUpdate(old, new)
   - Appelé lors d'une mise à jour
   - Migrer les données
   - Adapter aux breaking changes

Testez en activant/désactivant ce plugin et
vérifiez la console pour voir les logs!
        `.trim();

        alert(lifecycleInfo);
      },
    },
  ],

  // === Menu Items ===
  menuItems: [
    {
      id: 'open-spec',
      label: '📋 Voir les spécifications',
      icon: 'DocumentRegular',
      action: async () => {
        alert(
          '📋 PLUGIN_SPEC.md\n\n' +
          'Ouvrez le fichier PLUGIN_SPEC.md pour voir:\n' +
          '- Interface Plugin complète\n' +
          '- Types de plugins (Standard, Export, Sync)\n' +
          '- Hooks du cycle de vie\n' +
          '- Actions et menu items\n' +
          '- Settings management\n' +
          '- Services disponibles\n' +
          '- Backend Rust\n' +
          '- Permissions'
        );
      },
    },
    {
      id: 'open-guide',
      label: '📖 Guide de développement',
      icon: 'BookRegular',
      action: async () => {
        alert(
          '📖 DEVELOPMENT_GUIDE.md\n\n' +
          'Guide pas-à-pas pour créer un plugin:\n' +
          '1. Démarrage rapide\n' +
          '2. Définir les types\n' +
          '3. Implémenter les settings\n' +
          '4. Ajouter des actions\n' +
          '5. Features avancées\n' +
          '6. Testing\n' +
          '7. Publication'
        );
      },
    },
    {
      id: 'open-examples',
      label: '💡 Voir les exemples',
      icon: 'LightbulbRegular',
      action: async () => {
        alert(
          '💡 EXAMPLES.md\n\n' +
          'Exemples de plugins:\n' +
          '- Plugin Simple\n' +
          '- Plugin avec Settings\n' +
          '- Plugin Export\n' +
          '- Plugin Sync\n' +
          '- Plugin avec Backend Rust\n' +
          '- Plugin avec Sidebar\n' +
          '- Plugin avec BDD\n' +
          '- Plugin avec API externe'
        );
      },
    },
  ],
};

// Alias pour compatibilité
export const dummyPlugin = pluginDocsPlugin;

// Export par défaut
export default pluginDocsPlugin;
