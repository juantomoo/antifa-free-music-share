const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { DownloaderBridge } = require('./bridge');

let mainWindow;
let bridge;

function createWindow() {
  bridge = new DownloaderBridge();
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0a0e27',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    title: '🚩 Antifa Free Music Share',
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-download-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('search-tracks', async (event, query) => {
  try {
    console.log('[Main] Search request:', query);
    const result = await bridge.searchTracks(query, 15);
    console.log('[Main] Search result:', result.success, result.tracks.length);
    return result;
  } catch (error) {
    console.error('[Main] Search error:', error);
    return {
      success: false,
      error: error.message,
      tracks: []
    };
  }
});

ipcMain.handle('download-playlist', async (event, url, downloadPath) => {
  try {
    console.log('[Main] Playlist download request:', url);
    
    // Get playlist tracks with progress updates
    const playlistResult = await bridge.getPlaylistTracks(url, (progress) => {
      mainWindow.webContents.send('download-progress', progress);
    });

    if (!playlistResult.success || playlistResult.tracks.length === 0) {
      return {
        success: false,
        error: playlistResult.error || 'No se encontraron canciones en la playlist'
      };
    }

    console.log(`[Main] Starting download of ${playlistResult.tracks.length} tracks`);

    // Download all tracks
    const downloadResult = await bridge.downloadTracks(
      playlistResult.tracks,
      downloadPath,
      (progress) => {
        mainWindow.webContents.send('download-progress', progress);
      },
      3 // Concurrency
    );

    return {
      success: true,
      message: `✅ Descarga completada: ${downloadResult.completed} de ${downloadResult.total} canciones`,
      completed: downloadResult.completed,
      failed: downloadResult.failed,
      total: downloadResult.total
    };
  } catch (error) {
    console.error('[Main] Playlist download error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('download-tracks', async (event, tracks, downloadPath) => {
  try {
    console.log(`[Main] Downloading ${tracks.length} tracks`);
    
    const result = await bridge.downloadTracks(
      tracks,
      downloadPath,
      (progress) => {
        mainWindow.webContents.send('download-progress', progress);
      },
      3 // Concurrency
    );

    return {
      success: true,
      downloaded: result.completed,
      failed: result.failed,
      total: result.total
    };
  } catch (error) {
    console.error('[Main] Download tracks error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('update-metadata', async (event, folderPath) => {
  try {
    console.log('[Main] Update metadata request:', folderPath);
    const result = await bridge.updateMetadata(folderPath, (progress) => {
      mainWindow.webContents.send('metadata-progress', progress);
    });
    return result;
  } catch (error) {
    console.error('[Main] Update metadata error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-cover-art', async (event, folderPath) => {
  try {
    console.log('[Main] Add cover art request:', folderPath);
    const result = await bridge.addCoverArt(folderPath, (progress) => {
      mainWindow.webContents.send('metadata-progress', progress);
    });
    return result;
  } catch (error) {
    console.error('[Main] Add cover art error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-lyrics', async (event, folderPath) => {
  try {
    console.log('[Main] Add lyrics request:', folderPath);
    const result = await bridge.addLyrics(folderPath, (progress) => {
      mainWindow.webContents.send('metadata-progress', progress);
    });
    return result;
  } catch (error) {
    console.error('[Main] Add lyrics error:', error);
    return { success: false, error: error.message };
  }
});

// Reflective messages from Martha Nussbaum (multilingual)
const reflexiveMessages = require('./reflexive-messages');

// Send reflective messages periodically
let messageIndex = 0;
let currentLanguage = 'es'; // Default language

setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const messages = reflexiveMessages[currentLanguage] || reflexiveMessages.es;
    const message = messages[messageIndex];
    mainWindow.webContents.send('reflective-message', message);
    messageIndex = (messageIndex + 1) % messages.length;
  }
}, 15000); // Every 15 seconds

// Listen for language changes from renderer
ipcMain.on('set-language', (event, lang) => {
  if (reflexiveMessages[lang]) {
    currentLanguage = lang;
    messageIndex = 0; // Reset to first message in new language
  }
});
