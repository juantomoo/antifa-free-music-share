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

// Select download folder
document.getElementById('select-folder-btn').addEventListener('click', async () => {
  const path = await window.electronAPI.selectDownloadFolder();
  if (path) {
    document.getElementById('download-path').value = path;
  }
});

// Search tracks
document.getElementById('search-btn').addEventListener('click', async () => {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    showNotification('⚠️ Por favor ingresa una búsqueda', 'warning');
    return;
  }

  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '<div class="loading"></div> <span style="margin-left: 10px;">Buscando...</span>';

  try {
    const result = await window.electronAPI.searchTracks(query);
    
    if (result.success && result.tracks.length > 0) {
      displaySearchResults(result.tracks);
    } else {
      resultsContainer.innerHTML = '<p style="color: var(--text-tertiary);">No se encontraron resultados.</p>';
    }
  } catch (error) {
    resultsContainer.innerHTML = `<p style="color: var(--accent-red);">Error: ${error.message}</p>`;
  }
});

// Download playlist
document.getElementById('playlist-btn').addEventListener('click', async () => {
  const url = document.getElementById('playlist-input').value.trim();
  const downloadPath = document.getElementById('download-path').value;

  if (!url) {
    showNotification('⚠️ Por favor ingresa una URL de playlist', 'warning');
    return;
  }

  if (!downloadPath) {
    showNotification('⚠️ Por favor selecciona una carpeta de descarga', 'warning');
    return;
  }

  // Show progress section
  const progressSection = document.getElementById('progress-section');
  progressSection.classList.remove('hidden');

  try {
    const result = await window.electronAPI.downloadPlaylist(url, downloadPath);
    
    if (result.success) {
      showNotification(`✅ ${result.message}`, 'success');
    } else {
      showNotification(`❌ Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showNotification(`❌ Error: ${error.message}`, 'error');
  } finally {
    progressSection.classList.add('hidden');
  }
});

// Display search results
function displaySearchResults(tracks) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  tracks.forEach(track => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    resultItem.innerHTML = `
      <div class="result-info">
        <div class="result-title">${track.title}</div>
        <div class="result-artist">${track.artist} ${track.album ? `• ${track.album}` : ''}</div>
      </div>
      <button class="btn btn-primary" onclick="downloadTrack('${track.id}')">📥 Descargar</button>
    `;
    
    resultsContainer.appendChild(resultItem);
  });
}

// Download single track
async function downloadTrack(trackId) {
  const downloadPath = document.getElementById('download-path').value;
  
  if (!downloadPath) {
    showNotification('⚠️ Por favor selecciona una carpeta de descarga', 'warning');
    return;
  }

  showNotification('📥 Iniciando descarga...', 'info');
  
  // Here you would call the download API
  // await window.electronAPI.downloadTracks([track], downloadPath);
}

// Listen for download progress
window.electronAPI.onDownloadProgress((data) => {
  const progressBar = document.getElementById('progress-bar');
  const progressMessage = document.getElementById('progress-message');
  const progressPercentage = document.getElementById('progress-percentage');
  const progressCount = document.getElementById('progress-count');

  progressBar.style.width = data.percentage + '%';
  progressMessage.textContent = data.message;
  progressPercentage.textContent = data.percentage + '%';
  
  if (data.current && data.total) {
    progressCount.textContent = `${data.current}/${data.total}`;
  }
});

// Listen for reflective messages
window.electronAPI.onReflectiveMessage((message) => {
  const title = document.getElementById('reflective-title');
  const context = document.getElementById('reflective-context');
  
  title.textContent = message.message;
  context.textContent = message.context;
  
  // Add fade animation
  const container = document.querySelector('.reflective-message');
  container.style.animation = 'none';
  setTimeout(() => {
    container.style.animation = 'message-fade-in 1s ease';
  }, 10);
});

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-secondary);
    border: 2px solid var(--text-primary);
    padding: 15px 25px;
    border-radius: 5px;
    color: var(--text-primary);
    font-family: 'Share Tech Mono', monospace;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 0 20px var(--shadow-glow);
  `;

  if (type === 'error') {
    notification.style.borderColor = 'var(--accent-red)';
    notification.style.color = 'var(--accent-red)';
  } else if (type === 'success') {
    notification.style.borderColor = 'var(--text-primary)';
  } else if (type === 'warning') {
    notification.style.borderColor = 'var(--accent-yellow)';
    notification.style.color = 'var(--accent-yellow)';
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Set default download path on load
window.addEventListener('DOMContentLoaded', () => {
  const defaultPath = require('os').homedir() + '/Music/AntifaFreeMusic';
  document.getElementById('download-path').value = defaultPath;
});
