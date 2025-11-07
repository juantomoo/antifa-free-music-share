const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  searchTracks: (query) => ipcRenderer.invoke('search-tracks', query),
  downloadPlaylist: (url, downloadPath) => ipcRenderer.invoke('download-playlist', url, downloadPath),
  downloadTracks: (tracks, downloadPath) => ipcRenderer.invoke('download-tracks', tracks, downloadPath),
  
  // Listeners
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
  onReflectiveMessage: (callback) => ipcRenderer.on('reflective-message', (event, message) => callback(message)),
  
  // Remove listeners
  removeDownloadProgressListener: () => ipcRenderer.removeAllListeners('download-progress'),
  removeReflectiveMessageListener: () => ipcRenderer.removeAllListeners('reflective-message')
});
