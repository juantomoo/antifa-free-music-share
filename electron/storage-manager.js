/**
 * Storage Manager - Cross-platform file storage
 * Works in Electron, Android, and Web
 */

class StorageManager {
  constructor() {
    this.isAndroid = this.detectAndroid();
    this.isElectron = this.detectElectron();
    this.defaultPath = this.getDefaultDownloadPath();
  }

  detectAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  detectElectron() {
    return typeof window !== 'undefined' && 
           window.electronAPI !== undefined;
  }

  getDefaultDownloadPath() {
    if (this.isAndroid) {
      return '/storage/emulated/0/Music/AntifaFreeMusic';
    } else if (this.isElectron) {
      return ''; // Will be set by Electron
    } else {
      return 'downloads'; // Browser
    }
  }

  /**
   * Request storage permissions (Android only)
   */
  async requestPermissions() {
    if (!this.isAndroid) {
      return true; // Not needed on other platforms
    }

    try {
      // Check if Capacitor Filesystem is available
      if (typeof Filesystem === 'undefined') {
        console.warn('Capacitor Filesystem not available');
        return false;
      }

      // Request permissions
      const permission = await Filesystem.requestPermissions();
      return permission.publicStorage === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Select download folder
   * Returns path or null
   */
  async selectFolder() {
    if (this.isElectron && window.electronAPI) {
      // Use Electron dialog
      return await window.electronAPI.selectDownloadFolder();
    } else if (this.isAndroid) {
      // On Android, use fixed path after requesting permissions
      const hasPermission = await this.requestPermissions();
      if (hasPermission) {
        return this.defaultPath;
      } else {
        throw new Error('Storage permission denied');
      }
    } else {
      // Browser - use download folder
      return this.defaultPath;
    }
  }

  /**
   * Check if path exists and create if needed
   */
  async ensureDirectory(path) {
    if (this.isElectron && window.electronAPI) {
      // Electron handles this
      return true;
    } else if (this.isAndroid && typeof Filesystem !== 'undefined') {
      try {
        // Try to create directory
        await Filesystem.mkdir({
          path: path,
          directory: Directory.ExternalStorage,
          recursive: true
        });
        return true;
      } catch (error) {
        if (error.message.includes('exists')) {
          return true; // Directory already exists
        }
        console.error('Error creating directory:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Save file to downloads
   */
  async saveFile(blob, filename, path) {
    if (this.isElectron && window.electronAPI) {
      // Electron handles file saving
      return { success: true, path: `${path}/${filename}` };
    } else if (this.isAndroid && typeof Filesystem !== 'undefined') {
      try {
        // Convert blob to base64
        const base64Data = await this.blobToBase64(blob);
        
        // Save file
        const result = await Filesystem.writeFile({
          path: `${path}/${filename}`,
          data: base64Data,
          directory: Directory.ExternalStorage
        });
        
        return { success: true, path: result.uri };
      } catch (error) {
        console.error('Error saving file on Android:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Browser - trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true, path: filename };
    }
  }

  /**
   * Helper: Convert Blob to Base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Show permission denied message
   */
  showPermissionMessage() {
    const messages = {
      es: '⚠️ Permisos de almacenamiento necesarios. Por favor, habilítalos en Configuración > Aplicaciones > Antifa Free Music Share > Permisos.',
      en: '⚠️ Storage permissions required. Please enable them in Settings > Apps > Antifa Free Music Share > Permissions.',
      pt: '⚠️ Permissões de armazenamento necessárias. Por favor, habilite-as em Configurações > Aplicativos > Antifa Free Music Share > Permissões.'
    };
    
    const lang = document.getElementById('language-select')?.value || 'es';
    alert(messages[lang] || messages.es);
  }
}

// Create singleton instance
const storageManager = new StorageManager();

// Export
if (typeof window !== 'undefined') {
  window.storageManager = storageManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = storageManager;
}
