/**
 * Plugin Dummy - Plugin de test
 * Démontre tous les hooks du cycle de vie et les capacités de base
 */

import type { Plugin } from '../../types';
import { notificationService } from '../../../services/notificationService';

export const dummyPlugin: Plugin = {
  // Métadonnées
  id: 'dummy-plugin',
  name: 'Plugin Dummy',
  description: 'Plugin de test pour démonstration',
  version: '1.0.0',
  author: 'Stomy Team',
  icon: 'TestTube',

  // Configuration
  enabled: false,
  settings: {
    clickCount: 0,
  },

  // Hooks du cycle de vie
  async onInstall() {
    console.log('[DummyPlugin] Installation hook called');
    await notificationService.notify({
      title: 'Plugin Dummy',
      body: 'Plugin installé avec succès !',
    });
  },

  async onUninstall() {
    console.log('[DummyPlugin] Uninstall hook called');
    await notificationService.notify({
      title: 'Plugin Dummy',
      body: 'Plugin désinstallé.',
    });
  },

  async onEnable() {
    console.log('[DummyPlugin] Enable hook called');
    await notificationService.notify({
      title: 'Plugin Dummy',
      body: 'Plugin activé !',
    });
  },

  async onDisable() {
    console.log('[DummyPlugin] Disable hook called');
    await notificationService.notify({
      title: 'Plugin Dummy',
      body: 'Plugin désactivé.',
    });
  },

  async onUpdate(oldVersion: string, newVersion: string) {
    console.log(
      `[DummyPlugin] Update hook called: ${oldVersion} -> ${newVersion}`
    );
    await notificationService.notify({
      title: 'Plugin Dummy',
      body: `Mis à jour vers la version ${newVersion}`,
    });
  },

  // Actions exposées dans l'UI
  actions: [
    {
      id: 'test-notification',
      label: 'Tester la notification',
      icon: 'Bell',
      context: 'global',
      onClick: async function () {
        // Incrémenter le compteur de clics
        const currentPlugin = dummyPlugin;
        if (!currentPlugin.settings) {
          currentPlugin.settings = {};
        }
        currentPlugin.settings.clickCount =
          (currentPlugin.settings.clickCount || 0) + 1;

        console.log(
          `[DummyPlugin] Action clicked (count: ${currentPlugin.settings.clickCount})`
        );

        await notificationService.notify({
          title: 'Plugin Dummy',
          body: `Action exécutée ${currentPlugin.settings.clickCount} fois`,
        });
      },
    },
    {
      id: 'log-message',
      label: 'Logger un message',
      icon: 'FileText',
      context: 'settings',
      onClick: () => {
        const timestamp = new Date().toISOString();
        console.log(`[DummyPlugin] ${timestamp} - Test log message`);
        alert(`Message loggé à ${timestamp}\nVérifiez la console !`);
      },
    },
  ],
};
