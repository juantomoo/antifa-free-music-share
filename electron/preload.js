const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  searchTracks: (query) => ipcRenderer.invoke('search-tracks', query),
  downloadPlaylist: (url, downloadPath) => ipcRenderer.invoke('download-playlist', url, downloadPath),
  downloadTracks: (tracks, downloadPath) => ipcRenderer.invoke('download-tracks', tracks, downloadPath),
  updateMetadata: (folderPath) => ipcRenderer.invoke('update-metadata', folderPath),
  addCoverArt: (folderPath) => ipcRenderer.invoke('add-cover-art', folderPath),
  addLyrics: (folderPath) => ipcRenderer.invoke('add-lyrics', folderPath),
  setLanguage: (lang) => ipcRenderer.send('set-language', lang),
  
  // Listeners
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
  onReflectiveMessage: (callback) => ipcRenderer.on('reflective-message', (event, message) => callback(message)),
  onMetadataProgress: (callback) => ipcRenderer.on('metadata-progress', (event, data) => callback(data)),
  
  // Remove listeners
  removeDownloadProgressListener: () => ipcRenderer.removeAllListeners('download-progress'),
  removeReflectiveMessageListener: () => ipcRenderer.removeAllListeners('reflective-message'),
  removeMetadataProgressListener: () => ipcRenderer.removeAllListeners('metadata-progress')
});
