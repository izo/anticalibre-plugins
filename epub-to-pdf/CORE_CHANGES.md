# Modifications requises dans Stomy Core

Ce document liste **toutes les modifications** à apporter au projet principal Stomy pour intégrer le plugin EPUB to PDF.

## ⚠️ Résumé des changements

| Fichier | Action | Description |
|---------|--------|-------------|
| `src-tauri/src/epub_converter.rs` | **CRÉER** | Module Rust pour la conversion |
| `src-tauri/src/main.rs` | **MODIFIER** | Ajouter le module et enregistrer les commandes |
| `src/plugins/index.ts` | **MODIFIER** | Enregistrer le plugin |
| `src-tauri/Cargo.toml` | **VÉRIFIER** | Dépendances (déjà présentes) |

---

## 1️⃣ Fichier à CRÉER : `src-tauri/src/epub_converter.rs`

**Emplacement :** `src-tauri/src/epub_converter.rs`

**Action :** Copier le fichier `epub-to-pdf/epub_converter.rs` depuis ce dépôt vers le core de Stomy.

**Commande :**
```bash
# Depuis le dépôt stomy-plugins
cp epub-to-pdf/epub_converter.rs ../Stomy/src-tauri/src/epub_converter.rs
```

**Contenu :**
- Module Rust complet (~350 lignes)
- Fonctions de détection de Calibre et Pandoc
- Commandes Tauri pour la conversion
- Gestion d'erreurs complète

---

## 2️⃣ Fichier à MODIFIER : `src-tauri/src/main.rs`

**Emplacement :** `src-tauri/src/main.rs`

### Modification 1 : Déclarer le module

**Ajouter en haut du fichier, avec les autres déclarations `mod` :**

```rust
mod epub_converter;
```

**Exemple de contexte :**
```rust
// ... autres modules existants
mod kindle;
mod kobo;
mod epub_converter;  // ← AJOUTER ICI

fn main() {
    // ...
}
```

### Modification 2 : Enregistrer les commandes Tauri

**Dans la fonction `main()`, localiser `tauri::Builder::default().invoke_handler()`**

**Ajouter les 3 commandes dans `tauri::generate_handler![]` :**

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        // ... commandes existantes (detect_kindle_devices, etc.)

        // Commandes EPUB to PDF
        epub_converter::check_epub_converter,
        epub_converter::convert_epub_to_pdf,
        epub_converter::convert_multiple_epub_to_pdf,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

**⚠️ Important :** Ne pas oublier les virgules entre les commandes !

**Exemple complet :**
```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Commandes Kindle existantes
            detect_kindle_devices,
            get_kindle_info,
            convert_epub_to_mobi,
            convert_mobi_to_epub,
            copy_file_to_kindle,

            // Commandes Kobo existantes
            detect_kobo_devices,
            get_kobo_info,
            copy_file_to_device,

            // Commandes EPUB to PDF - NOUVELLES
            epub_converter::check_epub_converter,
            epub_converter::convert_epub_to_pdf,
            epub_converter::convert_multiple_epub_to_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 3️⃣ Fichier à MODIFIER : `src/plugins/index.ts`

**Emplacement :** `src/plugins/index.ts`

### Modification 1 : Importer le plugin

**Ajouter l'import en haut du fichier, avec les autres imports de plugins :**

```typescript
import { epubToPdfPlugin } from './core/epub-to-pdf';
```

**Exemple de contexte :**
```typescript
// Imports existants
import { pluginManager } from './PluginManager';
import { dummyPlugin } from './core/dummy-plugin';
import { csvExportPlugin } from './core/csv-export';
import { koboSyncPlugin } from './core/kobo-sync';
import { kindleSyncPlugin } from './core/kindle-sync';
import { epubToPdfPlugin } from './core/epub-to-pdf';  // ← AJOUTER ICI

export async function initializePlugins(): Promise<void> {
    // ...
}
```

### Modification 2 : Enregistrer le plugin

**Dans la fonction `initializePlugins()`, ajouter l'enregistrement :**

```typescript
export async function initializePlugins(): Promise<void> {
  await pluginManager.initialize();

  // Enregistrement des plugins existants
  await pluginManager.registerPlugin(dummyPlugin);
  await pluginManager.registerPlugin(csvExportPlugin);
  await pluginManager.registerPlugin(koboSyncPlugin);
  await pluginManager.registerPlugin(kindleSyncPlugin);

  // Enregistrement du plugin EPUB to PDF - NOUVEAU
  await pluginManager.registerPlugin(epubToPdfPlugin);
}
```

---

## 4️⃣ Fichier à VÉRIFIER : `src-tauri/Cargo.toml`

**Emplacement :** `src-tauri/Cargo.toml`

**Action :** Vérifier que ces dépendances sont présentes (elles devraient déjà l'être)

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri = { version = "2.1", features = ["protocol-asset"] }
```

**✅ Aucune modification nécessaire** - Ces dépendances sont déjà utilisées par les plugins Kindle et Kobo.

---

## 5️⃣ Fichier optionnel : `src-tauri/tauri.conf.json`

**Emplacement :** `src-tauri/tauri.conf.json`

**Action :** Vérifier que les permissions nécessaires sont présentes

**Permissions requises :**
```json
{
  "tauri": {
    "allowlist": {
      "dialog": {
        "all": true,
        "save": true
      },
      "fs": {
        "all": true,
        "readFile": true,
        "writeFile": true
      }
    }
  }
}
```

**✅ Probablement déjà configuré** - Les plugins existants utilisent déjà ces permissions.

---

## 📋 Checklist d'intégration

Cochez chaque étape une fois terminée :

### Backend (Rust)
- [ ] Copier `epub_converter.rs` dans `src-tauri/src/`
- [ ] Ajouter `mod epub_converter;` dans `src-tauri/src/main.rs`
- [ ] Ajouter les 3 commandes dans `invoke_handler` de `main.rs`
- [ ] Vérifier que les dépendances sont dans `Cargo.toml`
- [ ] Compiler le projet : `cargo build` (dans `src-tauri/`)

### Frontend (TypeScript)
- [ ] Importer le plugin dans `src/plugins/index.ts`
- [ ] Enregistrer avec `pluginManager.registerPlugin()`
- [ ] Vérifier que le dossier `epub-to-pdf` est dans `src/plugins/core/`
- [ ] Compiler le frontend : `npm run build`

### Tests
- [ ] Lancer l'application : `npm run tauri:dev`
- [ ] Aller dans **Settings > Plugins**
- [ ] Vérifier que "EPUB to PDF" apparaît dans la liste
- [ ] Activer le plugin
- [ ] Cliquer sur "Check Converter Availability"
- [ ] Sélectionner un EPUB et faire clic droit → "Convert to PDF"
- [ ] Vérifier que la conversion fonctionne

---

## 🔧 Commandes de build

### Development
```bash
# Terminal 1 - Backend
cd src-tauri
cargo build

# Terminal 2 - Full app
npm run tauri:dev
```

### Production
```bash
npm run tauri:build
```

---

## ⚠️ Dépendances externes

**L'utilisateur final doit installer l'un de ces outils :**

### Option 1 : Calibre (Recommandé)
- **Windows** : https://calibre-ebook.com/download
- **macOS** : `brew install calibre`
- **Linux** : `sudo apt install calibre`

### Option 2 : Pandoc (Alternative)
- **Windows** : https://pandoc.org/installing.html
- **macOS** : `brew install pandoc`
- **Linux** : `sudo apt install pandoc texlive-xetex`

---

## 🐛 Troubleshooting

### Erreur : "Cannot find module epub_converter"
**Solution :** Vérifier que `mod epub_converter;` est dans `main.rs`

### Erreur : "Command not found: check_epub_converter"
**Solution :** Vérifier que la commande est dans `invoke_handler`

### Erreur : "Cannot import epubToPdfPlugin"
**Solution :** Vérifier le chemin d'import et que le dossier existe

### Erreur de compilation Rust
**Solution :**
```bash
cd src-tauri
cargo clean
cargo build
```

### Le plugin n'apparaît pas dans l'UI
**Solution :** Vérifier que `registerPlugin()` est appelé dans `initializePlugins()`

---

## 📞 Support

Si vous rencontrez des problèmes d'intégration :
1. Vérifier que toutes les étapes de la checklist sont complétées
2. Consulter les logs de la console (DevTools)
3. Consulter les logs Rust (terminal)
4. Ouvrir une issue sur le dépôt stomy-plugins

---

## 📝 Résumé des changements

**Total : 3 fichiers à modifier/créer dans le core**

| Fichier | Lignes ajoutées | Complexité |
|---------|-----------------|------------|
| `src-tauri/src/epub_converter.rs` | ~350 (nouveau) | ⚠️ Copie de fichier |
| `src-tauri/src/main.rs` | 4 lignes | ✅ Simple |
| `src/plugins/index.ts` | 2 lignes | ✅ Simple |

**Temps estimé d'intégration : 10-15 minutes**
