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
      // En Android, usar directorio de la app (no requiere permisos)
      // Capacitor lo mapea automáticamente a la carpeta Music de la app
      return 'AntifaFreeMusic';
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

      // Check current permission status
      const checkResult = await Filesystem.checkPermissions();
      console.log('Permission status:', checkResult);

      if (checkResult.publicStorage === 'granted') {
        return true;
      }

      // Request permissions
      const permission = await Filesystem.requestPermissions();
      console.log('Permission result:', permission);
      
      if (permission.publicStorage === 'granted') {
        return true;
      } else if (permission.publicStorage === 'denied') {
        // Show message to open settings
        this.showSettingsMessage();
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      this.showSettingsMessage();
      return false;
    }
  }

  /**
   * Open Android settings to allow permissions manually
   */
  async openAppSettings() {
    if (!this.isAndroid) return;

    try {
      // Try to use Capacitor App plugin to open settings
      if (typeof App !== 'undefined' && App.openSettings) {
        await App.openSettings();
      } else {
        // Fallback: show instructions
        alert('Por favor, ve a:\nConfiguracion > Aplicaciones > Antifa Free Music Share > Permisos\n\nY habilita el permiso de Almacenamiento.');
      }
    } catch (error) {
      console.error('Error opening settings:', error);
      alert('No se pudo abrir la configuración. Por favor, abre manualmente:\nConfiguracion > Aplicaciones > Antifa Free Music Share > Permisos');
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
      // On Android, use app's Documents directory (no permissions needed)
      return this.defaultPath;
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
        // Use Documents directory (no special permissions needed)
        await Filesystem.mkdir({
          path: path,
          directory: Directory.Documents,
          recursive: true
        });
        return true;
      } catch (error) {
        if (error.message && error.message.includes('exists')) {
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
        
        // Save file using Documents directory
        const result = await Filesystem.writeFile({
          path: `${path}/${filename}`,
          data: base64Data,
          directory: Directory.Documents
        });
        
        console.log('File saved successfully:', result.uri);
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
   * Show permission denied message with button to open settings
   */
  showPermissionMessage() {
    const messages = {
      es: '⚠️ Permisos de almacenamiento necesarios.\n\n¿Deseas abrir la configuración para habilitarlos?',
      en: '⚠️ Storage permissions required.\n\nDo you want to open settings to enable them?',
      pt: '⚠️ Permissões de armazenamento necessárias.\n\nDeseja abrir as configurações para habilitá-las?'
    };
    
    const lang = document.getElementById('language-select')?.value || 'es';
    const message = messages[lang] || messages.es;
    
    if (confirm(message)) {
      this.openAppSettings();
    }
  }

  /**
   * Show settings message (when permissions are permanently denied)
   */
  showSettingsMessage() {
    const messages = {
      es: '⚠️ Los permisos fueron denegados.\n\nPara usar esta función, debes habilitarlos manualmente en:\nConfiguración > Aplicaciones > Antifa Free Music Share > Permisos\n\n¿Abrir configuración ahora?',
      en: '⚠️ Permissions were denied.\n\nTo use this feature, you must enable them manually at:\nSettings > Apps > Antifa Free Music Share > Permissions\n\nOpen settings now?',
      pt: '⚠️ As permissões foram negadas.\n\nPara usar este recurso, você deve habilitá-las manualmente em:\nConfigurações > Aplicativos > Antifa Free Music Share > Permissões\n\nAbrir configurações agora?'
    };
    
    const lang = document.getElementById('language-select')?.value || 'es';
    const message = messages[lang] || messages.es;
    
    if (confirm(message)) {
      this.openAppSettings();
    }
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
