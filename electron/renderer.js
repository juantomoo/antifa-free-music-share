// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initLanguage === 'function') {
    initLanguage();
  }
  
  // Initialize storage manager and request permissions on Android
  if (window.storageManager && window.storageManager.isAndroid) {
    setTimeout(async () => {
      const hasPermission = await window.storageManager.requestPermissions();
      if (hasPermission) {
        // Set default download path
        const defaultPath = window.storageManager.defaultPath;
        document.getElementById('download-path').value = defaultPath;
        // Ensure directory exists
        await window.storageManager.ensureDirectory(defaultPath);
      } else {
        window.storageManager.showPermissionMessage();
      }
    }, 1000);
  }
  
  // Language selector
  document.getElementById('language-select').addEventListener('change', (e) => {
    if (typeof setLanguage === 'function') {
      setLanguage(e.target.value);
      updateDynamicContent();
      
      // Notify main process of language change
      if (window.electronAPI && window.electronAPI.setLanguage) {
        window.electronAPI.setLanguage(e.target.value);
      }
    }
  });

  // Disclaimer link
  const disclaimerLink = document.getElementById('disclaimer-link');
  if (disclaimerLink) {
    disclaimerLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal('disclaimer.html');
      } else {
        // En Android/Web, abrir en la misma ventana
        window.location.href = 'disclaimer.html';
      }
    });
  }
});

// Update dynamic content after language change
function updateDynamicContent() {
  // Update search results if any
  const resultsContainer = document.getElementById('search-results');
  if (resultsContainer.innerHTML.includes('No se encontraron')) {
    resultsContainer.innerHTML = `<p style="color: var(--text-tertiary);">${t('noResults')}</p>`;
  }
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab') + '-tab';
    document.getElementById(tabId).classList.add('active');
  });
});

// Select download folder (for downloads)
document.getElementById('select-path-btn').addEventListener('click', async () => {
  try {
    let path;
    if (window.storageManager) {
      path = await window.storageManager.selectFolder();
    } else if (window.electronAPI) {
      path = await window.electronAPI.selectDownloadFolder();
    }
    
    if (path) {
      document.getElementById('download-path').value = path;
      // Ensure directory exists
      if (window.storageManager) {
        await window.storageManager.ensureDirectory(path);
      }
      showNotification('✅ Carpeta seleccionada: ' + path, 'success');
    }
  } catch (error) {
    console.error('Error selecting folder:', error);
    if (window.storageManager && window.storageManager.isAndroid) {
      window.storageManager.showPermissionMessage();
    } else {
      showNotification('❌ Error: ' + error.message, 'error');
    }
  }
});

// Select metadata folder
document.getElementById('select-metadata-btn').addEventListener('click', async () => {
  try {
    let path;
    if (window.storageManager) {
      path = await window.storageManager.selectFolder();
    } else if (window.electronAPI) {
      path = await window.electronAPI.selectFolder();
    }
    
    if (path) {
      document.getElementById('metadata-folder').value = path;
    }
  } catch (error) {
    console.error('Error selecting folder:', error);
    if (window.storageManager && window.storageManager.isAndroid) {
      window.storageManager.showPermissionMessage();
    }
  }
});

// Select cover art folder
document.getElementById('select-coverart-btn').addEventListener('click', async () => {
  try {
    let path;
    if (window.storageManager) {
      path = await window.storageManager.selectFolder();
    } else if (window.electronAPI) {
      path = await window.electronAPI.selectFolder();
    }
    
    if (path) {
      document.getElementById('coverart-folder').value = path;
    }
  } catch (error) {
    console.error('Error selecting folder:', error);
    if (window.storageManager && window.storageManager.isAndroid) {
      window.storageManager.showPermissionMessage();
    }
  }
});

// Select lyrics folder
document.getElementById('select-lyrics-btn').addEventListener('click', async () => {
  try {
    let path;
    if (window.storageManager) {
      path = await window.storageManager.selectFolder();
    } else if (window.electronAPI) {
      path = await window.electronAPI.selectFolder();
    }
    
    if (path) {
      document.getElementById('lyrics-folder').value = path;
    }
  } catch (error) {
    console.error('Error selecting folder:', error);
    if (window.storageManager && window.storageManager.isAndroid) {
      window.storageManager.showPermissionMessage();
    }
  }
});

// Search tracks
document.getElementById('search-btn').addEventListener('click', async () => {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    showNotification(t('notifySearchEmpty'), 'warning');
    return;
  }

  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '<div class="loading"></div> <span style="margin-left: 10px;">Buscando...</span>';

  try {
    let tracks = [];
    
    // Try Electron API first (if available)
    if (window.electronAPI && window.electronAPI.searchTracks) {
      try {
        const result = await window.electronAPI.searchTracks(query);
        if (result.success && result.tracks.length > 0) {
          tracks = result.tracks;
        }
      } catch (electronError) {
        console.log('Electron search failed, falling back to client search:', electronError);
      }
    }
    
    // Fallback to client-side search (works in Android/Web)
    if (tracks.length === 0 && window.youtubeSearchClient) {
      console.log('Using client-side YouTube search');
      tracks = await window.youtubeSearchClient.searchTracks(query);
    }
    
    if (tracks.length > 0) {
      displaySearchResults(tracks);
    } else {
      resultsContainer.innerHTML = `<p style="color: var(--text-tertiary);">${t('noResults')}</p>`;
    }
  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = `<p style="color: var(--accent-red);">${t('notifyError')}: ${error.message}</p>`;
  }
});

// Allow Enter key to trigger search
document.getElementById('search-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('search-btn').click();
  }
});

// Download playlist
document.getElementById('playlist-btn').addEventListener('click', async () => {
  const url = document.getElementById('playlist-input').value.trim();
  const downloadPath = document.getElementById('download-path').value;

  if (!url) {
    showNotification(t('notifyPlaylistEmpty'), 'warning');
    return;
  }

  if (!downloadPath) {
    showNotification(t('notifyPathEmpty'), 'warning');
    return;
  }

  // Show progress section
  const progressSection = document.getElementById('progress-section');
  progressSection.style.display = 'block';
  
  // Disable button during download
  const btn = document.getElementById('playlist-btn');
  btn.disabled = true;
  btn.setAttribute('data-original-text', btn.textContent);
  btn.textContent = t('playlistProcessing');

  try {
    const result = await window.electronAPI.downloadPlaylist(url, downloadPath);
    
    if (result.success) {
      showNotification(result.message || t('notifyCompleted'), 'success');
    } else {
      showNotification(`${t('notifyError')}: ${result.error}`, 'error');
    }
  } catch (error) {
    showNotification(`${t('notifyError')}: ${error.message}`, 'error');
  } finally {
    setTimeout(() => {
      progressSection.style.display = 'none';
    }, 2000);
    btn.disabled = false;
    btn.textContent = btn.getAttribute('data-original-text');
  }
});

// Update metadata
document.getElementById('update-metadata-btn').addEventListener('click', async () => {
  const folderPath = document.getElementById('metadata-folder').value;

  if (!folderPath) {
    showNotification(t('notifyPathEmpty'), 'warning');
    return;
  }

  // Show modal
  showModal('🏷️ Actualizando Metadata');
  
  const btn = document.getElementById('update-metadata-btn');
  btn.disabled = true;
  btn.setAttribute('data-original-text', btn.textContent);
  btn.textContent = t('metadataProcessing');

  try {
    const result = await window.electronAPI.updateMetadata(folderPath);
    
    if (result.success) {
      showNotification(`✅ Metadata actualizada: ${result.completed} archivos`, 'success');
    } else {
      showNotification(`${t('notifyError')}: ${result.error}`, 'error');
    }
  } catch (error) {
    showNotification(`${t('notifyError')}: ${error.message}`, 'error');
  } finally {
    setTimeout(() => {
      hideModal();
    }, 2000);
    btn.disabled = false;
    btn.textContent = btn.getAttribute('data-original-text');
  }
});

// Add cover art
document.getElementById('add-coverart-btn').addEventListener('click', async () => {
  const folderPath = document.getElementById('coverart-folder').value;

  if (!folderPath) {
    showNotification(t('notifyPathEmpty'), 'warning');
    return;
  }

  // Show modal
  showModal('🖼️ Agregando Portadas');
  
  const btn = document.getElementById('add-coverart-btn');
  btn.disabled = true;
  btn.setAttribute('data-original-text', btn.textContent);
  btn.textContent = t('coverProcessing');

  try {
    const result = await window.electronAPI.addCoverArt(folderPath);
    
    if (result.success) {
      showNotification(`✅ Portadas agregadas: ${result.completed} archivos`, 'success');
    } else {
      showNotification(`${t('notifyError')}: ${result.error}`, 'error');
    }
  } catch (error) {
    showNotification(`${t('notifyError')}: ${error.message}`, 'error');
  } finally {
    setTimeout(() => {
      hideModal();
    }, 2000);
    btn.disabled = false;
    btn.textContent = btn.getAttribute('data-original-text');
  }
});

// Add lyrics
document.getElementById('add-lyrics-btn').addEventListener('click', async () => {
  const folderPath = document.getElementById('lyrics-folder').value;

  if (!folderPath) {
    showNotification(t('notifyPathEmpty'), 'warning');
    return;
  }

  // Show modal
  showModal('📝 Agregando Letras');
  
  const btn = document.getElementById('add-lyrics-btn');
  btn.disabled = true;
  btn.setAttribute('data-original-text', btn.textContent);
  btn.textContent = t('lyricsProcessing');

  try {
    const result = await window.electronAPI.addLyrics(folderPath);
    
    if (result.success) {
      showNotification(`✅ Letras agregadas: ${result.completed} archivos`, 'success');
    } else {
      showNotification(`${t('notifyError')}: ${result.error}`, 'error');
    }
  } catch (error) {
    showNotification(`${t('notifyError')}: ${error.message}`, 'error');
  } finally {
    setTimeout(() => {
      hideModal();
    }, 2000);
    btn.disabled = false;
    btn.textContent = btn.getAttribute('data-original-text');
  }
});

// Display search results
function displaySearchResults(tracks) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  if (tracks.length === 0) {
    resultsContainer.innerHTML = `<p style="color: var(--text-tertiary);">${t('noResults')}</p>`;
    return;
  }

  tracks.forEach((track, index) => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.setAttribute('data-track-index', index);
    
    resultItem.innerHTML = `
      <div class="result-info">
        <div class="result-title">🎵 ${track.title}</div>
        <div class="result-details">
          <span>👤 ${track.artist}</span>
          ${track.album && track.album !== 'Unknown Album' ? `<span>💿 ${track.album}</span>` : ''}
          ${track.duration ? `<span>⏱️ ${track.duration}</span>` : ''}
        </div>
      </div>
      <button class="btn btn-small download-track-btn" data-track-index="${index}">
        ${t('downloadTrack')}
      </button>
    `;
    
    resultsContainer.appendChild(resultItem);
  });

  // Add event listeners to download buttons
  document.querySelectorAll('.download-track-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => downloadSingleTrack(tracks[index]));
  });
}

// Download single track
async function downloadSingleTrack(track) {
  const downloadPath = document.getElementById('download-path').value;
  
  if (!downloadPath) {
    showNotification(t('notifyPathEmpty'), 'warning');
    return;
  }

  showNotification(t('notifyDownloading'), 'info');
  
  const progressSection = document.getElementById('progress-section');
  progressSection.style.display = 'block';

  try {
    const result = await window.electronAPI.downloadTracks([track], downloadPath);
    
    if (result.success) {
      showNotification(`✅ ${track.title}`, 'success');
    } else {
      showNotification(`${t('notifyError')}: ${result.error}`, 'error');
    }
  } catch (error) {
    showNotification(`${t('notifyError')}: ${error.message}`, 'error');
  } finally {
    setTimeout(() => {
      progressSection.style.display = 'none';
    }, 2000);
  }
}

// Progress listeners
window.electronAPI.onDownloadProgress((data) => {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressMessage = document.getElementById('progress-message');

  if (progressFill && progressText && progressMessage) {
    progressFill.style.width = `${data.percentage}%`;
    progressText.textContent = `${data.percentage}%`;
    
    if (data.current && data.total) {
      progressMessage.textContent = `${data.message} (${data.current}/${data.total})`;
    } else {
      progressMessage.textContent = data.message;
    }
  }
});

window.electronAPI.onMetadataProgress((data) => {
  const progressFill = document.getElementById('modal-progress-fill');
  const progressText = document.getElementById('modal-progress-text');
  const progressMessage = document.getElementById('modal-message');
  const filesList = document.getElementById('modal-files-list');

  if (progressFill && progressText && progressMessage) {
    progressFill.style.width = `${data.percentage}%`;
    progressText.textContent = `${data.percentage}%`;
    
    if (data.current && data.total) {
      progressMessage.textContent = `${data.message} (${data.current}/${data.total})`;
    } else {
      progressMessage.textContent = data.message;
    }
    
    // Update files list if provided
    if (data.files && data.files.length > 0 && filesList) {
      filesList.innerHTML = data.files.map(file => 
        `<div class="file-item ${file.status}">${file.name}</div>`
      ).join('');
    }
  }
});

// Reflexive messages
window.electronAPI.onReflectiveMessage((message) => {
  const reflexiveElement = document.getElementById('reflexive-message');
  if (reflexiveElement) {
    reflexiveElement.innerHTML = `
      <p><strong>${message.message}</strong></p>
      <p class="reflexive-context">${message.context}</p>
    `;
  }
});

// Toast notification system
function showNotification(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 4000);
}

// Modal functions
function showModal(title) {
  const modal = document.getElementById('progress-modal');
  const modalTitle = document.getElementById('modal-title');
  const progressFill = document.getElementById('modal-progress-fill');
  const progressText = document.getElementById('modal-progress-text');
  const message = document.getElementById('modal-message');
  const filesList = document.getElementById('modal-files-list');
  
  modalTitle.textContent = title || '📊 Procesando...';
  progressFill.style.width = '0%';
  progressText.textContent = '0%';
  message.textContent = 'Iniciando...';
  filesList.innerHTML = '';
  
  modal.classList.add('active');
}

function hideModal() {
  const modal = document.getElementById('progress-modal');
  modal.classList.remove('active');
}

// Hide progress button
document.getElementById('hide-progress-btn').addEventListener('click', () => {
  document.getElementById('progress-section').style.display = 'none';
});
