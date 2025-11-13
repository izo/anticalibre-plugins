# Fake Sync Plugin

Un plugin de développement pour Stomy qui simule la synchronisation avec des liseuses électroniques et périphériques USB sans avoir besoin d'un vrai appareil connecté.

## 🎯 Objectif

Ce plugin est un **outil de développement** conçu pour :
- Tester la fonctionnalité de synchronisation sans appareil physique
- Développer et déboguer les workflows de sync
- Simuler différents types d'appareils (Kobo, Kindle, clés USB)
- Tester les scénarios d'erreur et de déconnexion
- Former les utilisateurs sur les fonctionnalités de sync

## 📱 Appareils Simulés

### Kobo
- **Kobo Clara HD** - 8 GB (EPUB, PDF, CBZ, MOBI)
- **Kobo Libra 2** - 32 GB (EPUB, PDF, CBZ, MOBI)
- **Kobo Sage** - 32 GB (EPUB, PDF, CBZ, MOBI)
- **Kobo Nia** - 8 GB (EPUB, PDF, CBZ)
- **Kobo Elipsa 2E** - 32 GB (EPUB, PDF, CBZ, MOBI)

### Kindle
- **Kindle Paperwhite (11th Gen)** - 8 GB (MOBI, AZW, AZW3, PDF)
- **Kindle Oasis** - 32 GB (MOBI, AZW, AZW3, PDF)
- **Kindle Basic** - 8 GB (MOBI, AZW, AZW3, PDF)
- **Kindle Scribe** - 16 GB (MOBI, AZW, AZW3, PDF)

### USB
- **USB Drive Generic** - 32 GB (tous formats)
- **USB Drive 64GB** - 64 GB (tous formats)
- **SD Card 16GB** - 16 GB (tous formats)

## ⚙️ Configuration

### Paramètres du Plugin

| Paramètre | Description | Par défaut |
|-----------|-------------|------------|
| **Device Type** | Type d'appareil à simuler (`kobo`, `kindle`, `usb`, `none`) | `none` |
| **Auto Connect** | Connexion automatique au démarrage | `false` |
| **Simulate Delays** | Ajouter des délais réalistes | `true` |
| **Sync Duration** | Durée de simulation (ms) | `5000` |
| **Failure Rate** | Taux d'échec simulé (0-100%) | `0` |
| **Show Notifications** | Afficher les notifications | `true` |
| **Verbose Mode** | Logs et infos détaillés | `false` |

## 🚀 Utilisation

### 1. Configuration Initiale

1. Activer le plugin dans **Settings > Plugins**
2. Configurer le **Device Type** (Kobo, Kindle ou USB)
3. Ajuster les autres paramètres selon vos besoins

### 2. Détecter un Appareil Simulé

Cliquez sur **"Detect Fake Device"** :
- Un appareil aléatoire du type sélectionné sera créé
- Numéro de série unique généré
- Espace de stockage simulé (10-50% utilisé)
- Formats supportés selon le modèle

### 3. Synchroniser des Livres

Cliquez sur **"Sync to Fake Device"** :
- Simule le transfert de livres vers l'appareil
- Affiche la progression si **Verbose Mode** est activé
- Respecte les délais configurés
- Peut échouer aléatoirement selon le **Failure Rate**

### 4. Obtenir les Infos de l'Appareil

Cliquez sur **"Get Device Info"** :
- Affiche le nom, modèle, numéro de série
- Montre l'espace de stockage (total, utilisé, libre)
- Liste les formats supportés

### 5. Déconnecter l'Appareil

Cliquez sur **"Disconnect Device"** :
- Simule la déconnexion de l'appareil
- Réinitialise l'état du plugin

## 🎮 Actions Disponibles

### Actions Globales
- **🔍 Detect Fake Device** - Détecter un appareil simulé
- **❌ Disconnect Device** - Déconnecter l'appareil actuel

### Actions Bibliothèque
- **⬇️ Sync to Fake Device** - Synchroniser des livres

### Actions Paramètres
- **ℹ️ Get Device Info** - Afficher les informations détaillées

## 🧪 Scénarios de Test

### Test de Synchronisation Normale
```typescript
// Configuration recommandée
deviceType: 'kobo'
simulateDelays: true
syncDuration: 5000
failureRate: 0
```

### Test de Synchronisation Rapide
```typescript
// Configuration recommandée
deviceType: 'kindle'
simulateDelays: false
syncDuration: 1000
failureRate: 0
```

### Test de Gestion d'Erreurs
```typescript
// Configuration recommandée
deviceType: 'usb'
simulateDelays: true
syncDuration: 5000
failureRate: 30  // 30% d'échec
```

### Test avec Logs Détaillés
```typescript
// Configuration recommandée
verboseMode: true
showNotifications: true
```

## 📊 Informations Techniques

### Structure des Données

Chaque appareil simulé contient :
- **ID unique** - Identifiant de l'appareil
- **Nom et modèle** - Ex: "Kobo Libra 2"
- **Numéro de série** - Généré aléatoirement (12 caractères)
- **Chemin de montage** - Ex: `/Volumes/Kobo_Libra_2`
- **Capacité** - Espace total en MB
- **Espace utilisé** - Entre 10% et 50% de la capacité
- **Formats supportés** - Liste des extensions de fichier

### Progression de la Synchronisation

Le plugin simule 4 états :
1. **Connecting** - Connexion à l'appareil
2. **Syncing** - Transfert des fichiers
3. **Completed** - Synchronisation réussie
4. **Failed** - Échec de la synchronisation

## 🔧 API Programmatique

Le plugin expose des fonctions pour l'utilisation programmatique :

```typescript
import {
  detectFakeDevice,
  getCurrentFakeDevice,
  setCurrentFakeDevice,
  isSyncInProgress,
} from './core/fake-sync';

// Détecter un appareil
const device = await detectFakeDevice('kobo', true);

// Obtenir l'appareil actuel
const current = getCurrentFakeDevice();

// Définir un appareil manuellement
setCurrentFakeDevice(myDevice);

// Vérifier si une sync est en cours
if (isSyncInProgress()) {
  console.log('Sync in progress...');
}
```

## 🎯 Cas d'Usage

### Développement
- Tester les flux de synchronisation
- Déboguer les erreurs sans appareil physique
- Développer de nouvelles fonctionnalités de sync

### Tests Automatisés
- Créer des tests end-to-end
- Valider la gestion d'erreurs
- Tester les performances

### Démonstration
- Montrer les fonctionnalités aux utilisateurs
- Créer des tutoriels vidéo
- Formation des nouveaux utilisateurs

### Débogage
- Reproduire des bugs signalés
- Tester différents modèles d'appareils
- Simuler des conditions réseau variables

## ⚠️ Avertissements

1. **Plugin de Développement** : Ce plugin ne doit pas être utilisé en production
2. **Pas de Transfert Réel** : Aucun fichier n'est réellement copié
3. **Données Simulées** : Toutes les informations d'appareil sont fictives
4. **État Volatile** : L'appareil simulé est perdu au redémarrage

## 🐛 Débogage

### Mode Verbose

Activer **Verbose Mode** pour voir :
- Logs détaillés dans la console
- Progression de la synchronisation
- Informations complètes sur l'appareil
- Messages de notification étendus

### Console du Navigateur

Tous les événements sont loggés avec le préfixe `[FakeSyncPlugin]` :
```javascript
[FakeSyncPlugin] Fake device created: {...}
[FakeSyncPlugin] Sync progress: {...}
[FakeSyncPlugin] Sync result: {...}
```

## 📝 Notes pour les Développeurs

- L'appareil simulé est stocké dans une variable globale `currentFakeDevice`
- Les modèles d'appareils sont définis dans `types.ts` (`DEVICE_MODELS`)
- La synchronisation utilise `setTimeout` pour simuler les délais
- Les numéros de série sont générés aléatoirement à chaque détection
- L'espace de stockage est calculé entre 10% et 50% d'utilisation
- Les tailles de fichiers simulées sont entre 1 et 11 MB

## 🚀 Améliorations Futures

- Support de plusieurs appareils simultanés
- Simulation de métadonnées de livres
- Interface de configuration UI avancée
- Historique des synchronisations
- Export/Import de configurations de test
- Simulation de problèmes réseau spécifiques
- Support de formats de fichiers personnalisés

## 📄 Licence

Internal use only - Stomy Team
