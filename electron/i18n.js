// Internationalization for Electron GUI
const translations = {
  es: {
    // Header
    languageLabel: '🌍 Idioma / Language:',
    title: '🚩 ANTIFA FREE MUSIC SHARE 🚩',
    subtitle: '"Libera el Arte de las Cadenas Capitalistas"',
    
    // Liberation Message
    liberationTitle: '✊ MÚSICA LIBRE PARA GENTE LIBRE',
    liberationText: 'Esta herramienta existe para liberar la música de monopolios capitalistas que explotan artistas y financian opresión.',
    warningTitle: '🚫 Spotify, Apple Music y otras plataformas:',
    warningItems: [
      'Pagan a artistas $0.003-0.005 por reproducción',
      'Financian ocupación sionista y genocidio',
      'Controlan y censuran voces independientes'
    ],
    useTitle: '✅ USA ESTA HERRAMIENTA PARA:',
    useItems: [
      'Construir tu colección personal',
      'Apoyar artistas a través de canales directos',
      'Compartir música en tus comunidades',
      'Descubrir artistas underground e independientes'
    ],
    
    // Tabs
    tabSearch: '🔍 Buscar y Descargar',
    tabPlaylist: '📋 Descargar Playlist',
    tabMetadata: '🏷️ Actualizar Metadata',
    tabCoverArt: '🖼️ Agregar Portadas',
    tabLyrics: '📝 Agregar Letras',
    
    // Search
    searchLabel: '🎵 Buscar canción o artista:',
    searchPlaceholder: 'Ej: London After Midnight - Are You Feeling Fascist',
    searchButton: 'Buscar',
    
    // Playlist
    playlistLabel: '🔗 URL de la playlist:',
    playlistPlaceholder: 'https://music.youtube.com/playlist?list=...',
    playlistButton: 'Descargar Playlist',
    playlistProcessing: '⏳ Procesando...',
    
    // Metadata
    metadataLabel: '📁 Selecciona carpeta con archivos MP3:',
    metadataButton: 'Actualizar Metadata',
    metadataProcessing: '⏳ Actualizando...',
    
    // Cover Art
    coverLabel: '📁 Selecciona carpeta con archivos MP3:',
    coverButton: 'Agregar Portadas',
    coverProcessing: '⏳ Agregando...',
    
    // Lyrics
    lyricsLabel: '📁 Selecciona carpeta con archivos MP3:',
    lyricsButton: 'Agregar Letras',
    lyricsProcessing: '⏳ Agregando...',
    
    // Download Path
    downloadLabel: '📁 Carpeta de descarga:',
    downloadPlaceholder: 'Selecciona una carpeta...',
    selectButton: 'Seleccionar',
    
    // Progress
    progressMessage: 'Iniciando...',
    
    // Notifications
    notifySearchEmpty: '⚠️ Por favor ingresa una búsqueda',
    notifyPlaylistEmpty: '⚠️ Por favor ingresa una URL de playlist',
    notifyPathEmpty: '⚠️ Por favor selecciona una carpeta',
    notifyDownloading: '📥 Iniciando descarga...',
    notifyCompleted: '✅ Descarga completada',
    notifyError: '❌ Error',
    
    // Results
    noResults: 'No se encontraron resultados.',
    downloadTrack: '📥 Descargar',
    
    // Footer
    footerBuilt: '✊ Creado colectivamente entre múltiples colectivos del Sur Global',
    footerQuote: '🌱 Invitamos a otros colectivos a compartir y colaborar | GPL-3.0',
    footerDisclaimer: '⚖️ Ver Términos y Exención de Responsabilidad'
  },
  
  en: {
    // Header
    languageLabel: '🌍 Language / Idioma:',
    title: '🚩 ANTIFA FREE MUSIC SHARE 🚩',
    subtitle: '"Free Art from Capitalist Chains"',
    
    // Liberation Message
    liberationTitle: '✊ FREE MUSIC FOR FREE PEOPLE',
    liberationText: 'This tool exists to liberate music from capitalist monopolies that exploit artists and fund oppression.',
    warningTitle: '🚫 Spotify, Apple Music and other platforms:',
    warningItems: [
      'Pay artists $0.003-0.005 per stream',
      'Finance Zionist occupation and genocide',
      'Control and censor independent voices'
    ],
    useTitle: '✅ USE THIS TOOL TO:',
    useItems: [
      'Build your personal collection',
      'Support artists through direct channels',
      'Share music in your communities',
      'Discover underground and independent artists'
    ],
    
    // Tabs
    tabSearch: '🔍 Search and Download',
    tabPlaylist: '📋 Download Playlist',
    tabMetadata: '🏷️ Update Metadata',
    tabCoverArt: '🖼️ Add Cover Art',
    tabLyrics: '📝 Add Lyrics',
    
    // Search
    searchLabel: '🎵 Search song or artist:',
    searchPlaceholder: 'E.g: London After Midnight - Are You Feeling Fascist',
    searchButton: 'Search',
    
    // Playlist
    playlistLabel: '🔗 Playlist URL:',
    playlistPlaceholder: 'https://music.youtube.com/playlist?list=...',
    playlistButton: 'Download Playlist',
    playlistProcessing: '⏳ Processing...',
    
    // Metadata
    metadataLabel: '📁 Select folder with MP3 files:',
    metadataButton: 'Update Metadata',
    metadataProcessing: '⏳ Updating...',
    
    // Cover Art
    coverLabel: '📁 Select folder with MP3 files:',
    coverButton: 'Add Cover Art',
    coverProcessing: '⏳ Adding...',
    
    // Lyrics
    lyricsLabel: '📁 Select folder with MP3 files:',
    lyricsButton: 'Add Lyrics',
    lyricsProcessing: '⏳ Adding...',
    
    // Download Path
    downloadLabel: '📁 Download folder:',
    downloadPlaceholder: 'Select a folder...',
    selectButton: 'Select',
    
    // Progress
    progressMessage: 'Starting...',
    
    // Notifications
    notifySearchEmpty: '⚠️ Please enter a search query',
    notifyPlaylistEmpty: '⚠️ Please enter a playlist URL',
    notifyPathEmpty: '⚠️ Please select a folder',
    notifyDownloading: '📥 Starting download...',
    notifyCompleted: '✅ Download completed',
    notifyError: '❌ Error',
    
    // Results
    noResults: 'No results found.',
    downloadTrack: '📥 Download',
    
    // Footer
    footerBuilt: '✊ Collectively created among multiple collectives from the Global South',
    footerQuote: '🌱 We invite other collectives to share and collaborate | GPL-3.0',
    footerDisclaimer: '⚖️ View Terms and Disclaimer'
  },
  
  pt: {
    // Header
    languageLabel: '🌍 Idioma / Language:',
    title: '🚩 ANTIFA FREE MUSIC SHARE 🚩',
    subtitle: '"Liberte a Arte das Correntes Capitalistas"',
    
    // Liberation Message
    liberationTitle: '✊ MÚSICA LIVRE PARA PESSOAS LIVRES',
    liberationText: 'Esta ferramenta existe para liberar a música de monopólios capitalistas que exploram artistas e financiam opressão.',
    warningTitle: '🚫 Spotify, Apple Music e outras plataformas:',
    warningItems: [
      'Pagam aos artistas $0.003-0.005 por reprodução',
      'Financiam ocupação sionista e genocídio',
      'Controlam e censuram vozes independentes'
    ],
    useTitle: '✅ USE ESTA FERRAMENTA PARA:',
    useItems: [
      'Construir sua coleção pessoal',
      'Apoiar artistas através de canais diretos',
      'Compartilhar música em suas comunidades',
      'Descobrir artistas underground e independentes'
    ],
    
    // Tabs
    tabSearch: '🔍 Buscar e Baixar',
    tabPlaylist: '📋 Baixar Playlist',
    tabMetadata: '🏷️ Atualizar Metadata',
    tabCoverArt: '🖼️ Adicionar Capas',
    tabLyrics: '📝 Adicionar Letras',
    
    // Search
    searchLabel: '🎵 Buscar música ou artista:',
    searchPlaceholder: 'Ex: London After Midnight - Are You Feeling Fascist',
    searchButton: 'Buscar',
    
    // Playlist
    playlistLabel: '🔗 URL da playlist:',
    playlistPlaceholder: 'https://music.youtube.com/playlist?list=...',
    playlistButton: 'Baixar Playlist',
    playlistProcessing: '⏳ Processando...',
    
    // Metadata
    metadataLabel: '📁 Selecione pasta com arquivos MP3:',
    metadataButton: 'Atualizar Metadata',
    metadataProcessing: '⏳ Atualizando...',
    
    // Cover Art
    coverLabel: '📁 Selecione pasta com arquivos MP3:',
    coverButton: 'Adicionar Capas',
    coverProcessing: '⏳ Adicionando...',
    
    // Lyrics
    lyricsLabel: '📁 Selecione pasta com arquivos MP3:',
    lyricsButton: 'Adicionar Letras',
    lyricsProcessing: '⏳ Adicionando...',
    
    // Download Path
    downloadLabel: '📁 Pasta de download:',
    downloadPlaceholder: 'Selecione uma pasta...',
    selectButton: 'Selecionar',
    
    // Progress
    progressMessage: 'Iniciando...',
    
    // Notifications
    notifySearchEmpty: '⚠️ Por favor, insira uma busca',
    notifyPlaylistEmpty: '⚠️ Por favor, insira uma URL de playlist',
    notifyPathEmpty: '⚠️ Por favor, selecione uma pasta',
    notifyDownloading: '📥 Iniciando download...',
    notifyCompleted: '✅ Download concluído',
    notifyError: '❌ Erro',
    
    // Results
    noResults: 'Nenhum resultado encontrado.',
    downloadTrack: '📥 Baixar',
    
    // Footer
    footerBuilt: '✊ Criado coletivamente entre múltiplos coletivos do Sul Global',
    footerQuote: '🌱 Convidamos outros coletivos a compartilhar e colaborar | GPL-3.0',
    footerDisclaimer: '⚖️ Ver Termos e Isenção de Responsabilidade'
  }
};

let currentLanguage = 'es';

function t(key) {
  return translations[currentLanguage][key] || key;
}

function setLanguage(lang) {
  currentLanguage = lang;
  updateUIText();
  localStorage.setItem('language', lang);
}

function updateUIText() {
  // Update all text elements
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    
    if (element.tagName === 'INPUT' && element.placeholder) {
      element.placeholder = t(key);
    } else {
      element.textContent = t(key);
    }
  });
  
  // Update lists
  updateList('warning-list', t('warningItems'));
  updateList('use-list', t('useItems'));
}

function updateList(id, items) {
  const list = document.getElementById(id);
  if (list && Array.isArray(items)) {
    list.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
}

// Initialize language from localStorage or default
function initLanguage() {
  const saved = localStorage.getItem('language');
  if (saved && translations[saved]) {
    currentLanguage = saved;
    document.getElementById('language-select').value = saved;
  }
  updateUIText();
}

// Export for CommonJS (Node.js/Electron)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { t, setLanguage, initLanguage };
}
