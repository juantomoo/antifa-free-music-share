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

// Reflective messages from Martha Nussbaum
const reflexiveMessages = [
  {
    message: "🌱 El acceso a la cultura es una capacidad humana fundamental.",
    context: "Martha Nussbaum nos enseña que cada persona merece poder disfrutar de la belleza, el arte y la expresión creativa como parte de una vida digna."
  },
  {
    message: "🤝 La tecnología puede ser un puente, no una barrera.",
    context: "Cuando usamos herramientas como esta, ejercemos nuestra capacidad de agencia - de tomar decisiones informadas sobre cómo accedemos al conocimiento y la cultura."
  },
  {
    message: "🌍 Los derechos culturales son derechos humanos.",
    context: "No se trata de extremos políticos, sino de reconocer que tod@s merecemos participar en la vida cultural de nuestras comunidades."
  },
  {
    message: "💡 El conocimiento compartido nos hace libres.",
    context: "Desde las bibliotecas públicas hasta las plataformas abiertas, compartir cultura ha sido siempre un acto de construcción comunitaria y solidaridad."
  },
  {
    message: "🌿 Apoyemos economías que cuiden a las personas y al planeta.",
    context: "Las empresas de triple impacto (social, ambiental, económico) demuestran que es posible prosperar mientras cuidamos del bien común."
  },
  {
    message: "🕊️ El diálogo construye, la violencia destruye.",
    context: "Podemos pensar distinto y aun así trabajar juntos por un mundo más justo. La diversidad de ideas nos enriquece cuando dialogamos con respeto."
  },
  {
    message: "✨ Las capacidades humanas florecen en libertad.",
    context: "Nussbaum nos recuerda: no basta con tener derechos en papel. Necesitamos las condiciones reales para ejercerlos: educación, salud, cultura, participación."
  },
  {
    message: "🎵 La cultura nos conecta con nuestra humanidad compartida.",
    context: "La música, el arte, las historias - son lenguajes universales que nos permiten reconocernos en el otr@, más allá de nuestras diferencias."
  },
  {
    message: "🌈 Ni extremos: busquemos el equilibrio y la justicia.",
    context: "Los extremismos - de izquierda o derecha - empobrecen el debate. La vida buena requiere compasión, razón práctica y espacio para el florecimiento de tod@s."
  },
  {
    message: "🌻 Algunas grandes empresas también eligen el bien común.",
    context: "Hay corporaciones que están transformándose, entendiendo que su éxito depende de un planeta sano y comunidades prósperas. Apoyémoslas cuando actúen éticamente."
  },
  {
    message: "🔓 La soberanía tecnológica es dignidad humana.",
    context: "Tener control sobre nuestras herramientas y datos no es radicalismo - es ejercer nuestra capacidad de autodeterminación, fundamental en la filosofía de Nussbaum."
  },
  {
    message: "💚 Cada acción cuenta, por pequeña que parezca.",
    context: "Desde tu rincón del mundo, tus elecciones importan. Apoyar artistas directamente, usar software libre, compartir conocimiento - todo suma."
  },
  {
    message: "📚 El acceso a la información es poder, y el poder debe ser de tod@s.",
    context: "Democratizar el conocimiento no significa robar - significa construir un mundo donde nadie quede excluido del banquete de la cultura humana."
  },
  {
    message: "🤲 Cuando mejoren sus políticas, las plataformas merecen apoyo.",
    context: "No estamos en contra de las empresas, sino de prácticas injustas. Si Spotify, Apple o YouTube pagan justamente y respetan la privacidad, merecen nuestro uso."
  },
  {
    message: "🌟 La prosperidad con justicia es posible.",
    context: "No hay contradicción entre vivir bien y que otr@s vivan bien. La economía solidaria y las cooperativas lo demuestran cada día."
  }
];

// Send reflective messages periodically
let messageIndex = 0;
setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const message = reflexiveMessages[messageIndex];
    mainWindow.webContents.send('reflective-message', message);
    messageIndex = (messageIndex + 1) % reflexiveMessages.length;
  }
}, 15000); // Every 15 seconds
