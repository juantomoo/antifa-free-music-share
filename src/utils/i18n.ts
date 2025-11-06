/**
 * Internationalization (i18n) System
 * Supporting English, Spanish, and Portuguese
 * 
 * Liberating music through multilingual access ✊
 */

export type Language = 'en' | 'es' | 'pt';

export interface Translations {
  // Banner and intro
  banner: string;
  welcome: string;
  liberationMessage: string;
  concept: string;
  supportArtists: string;
  
  // Menu options
  menuTitle: string;
  searchAndDownload: string;
  downloadPlaylist: string;
  separator: string;
  fixMetadata: string;
  addCoverArt: string;
  addLyrics: string;
  batchProcess: string;
  configuration: string;
  exit: string;
  
  // Actions
  whatToDo: string;
  enterUrl: string;
  enterSearchQuery: string;
  enterDirectory: string;
  selectOperations: string;
  processing: string;
  complete: string;
  downloading: string;
  
  // Liberation messages
  liberationMessages: {
    startup: string;
    beforeDownload: string;
    afterDownload: string;
    artistSupport: string;
    antiMonopoly: string;
    bandcampMessage: string;
    zionistWarning: string;
  };
  
  // Configuration
  currentConfig: string;
  downloadDir: string;
  audioQuality: string;
  audioFormat: string;
  maxConcurrent: string;
  changeConfig: string;
  
  // Errors and warnings
  errorOccurred: string;
  noFilesFound: string;
  operationCancelled: string;
  
  // Progress
  analyzing: string;
  searching: string;
  found: string;
  alreadyExists: string;
  willDownload: string;
  confirm: string;
  
  // Metadata
  artist: string;
  title: string;
  album: string;
  year: string;
  genre: string;
  
  // Success messages
  metadataFixed: string;
  coverArtAdded: string;
  lyricsAdded: string;
  allComplete: string;
}

const translations: Record<Language, Translations> = {
  en: {
    banner: `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🚩 ANTIFA FREE MUSIC SHARE 🚩                       ║
║                                                           ║
║      "Liberate Art from Capitalist Chains"               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`,
    welcome: 'Welcome to Antifa Free Music Share',
    liberationMessage: '✊ Fighting streaming monopolies, one download at a time',
    concept: `
🎵 Our Mission:
   Music belongs to the people, not corporations.
   We fight against streaming platforms that exploit artists,
   paying them pennies while funding fascist regimes.
   
   Support artists directly through Bandcamp and independent platforms!
`,
    supportArtists: '💡 Always visit artist websites, buy their merch, attend their shows!',
    
    menuTitle: '🚩 Antifa Free Music Share',
    searchAndDownload: '🔍 Search and download tracks',
    downloadPlaylist: '📋 Download playlist',
    separator: '──────────────',
    fixMetadata: '🏷️  Fix metadata for existing files',
    addCoverArt: '🖼️  Add cover art to existing files',
    addLyrics: '📝 Add lyrics to existing files',
    batchProcess: '🔧 Batch process existing files (all operations)',
    configuration: '⚙️  Configuration',
    exit: '❌ Exit',
    
    whatToDo: 'What would you like to do?',
    enterUrl: 'Enter the YouTube Music playlist URL:',
    enterSearchQuery: 'Enter artist/song to search:',
    enterDirectory: 'Enter directory path (or press Enter for default):',
    selectOperations: 'Select operations to perform:',
    processing: 'Processing...',
    complete: 'Complete!',
    downloading: 'Downloading',
    
    liberationMessages: {
      startup: `
╔════════════════════════════════════════════════════════════════╗
║  ✊ FREE MUSIC FOR FREE PEOPLE                                 ║
║                                                                ║
║  This tool exists to liberate music from capitalist monopolies║
║  that exploit artists and fund oppression worldwide.          ║
║                                                                ║
║  🚫 Spotify, Apple Music, and other platforms:                ║
║     • Pay artists $0.003-0.005 per stream                     ║
║     • Fund Zionist occupation and genocide                    ║
║     • Control and censor independent voices                   ║
║                                                                ║
║  ✅ USE THIS TOOL TO:                                         ║
║     • Build your personal collection                          ║
║     • Support artists through direct channels                 ║
║     • Share music in your communities                         ║
║     • Discover underground and independent artists            ║
║                                                                ║
║  💰 SUPPORT ARTISTS DIRECTLY:                                 ║
║     • Bandcamp (artists get 80-90%)                           ║
║     • Artist websites and independent stores                  ║
║     • Physical media and merch                                ║
║     • Live shows and events                                   ║
║                                                                ║
║  Remember: Piracy is a moral duty when corporations are       ║
║  immoral. Art is for the people! 🚩                           ║
╚════════════════════════════════════════════════════════════════╝
`,
      beforeDownload: '🔓 Liberating music from corporate chains...',
      afterDownload: '✊ Music liberated! Share it with your community!',
      artistSupport: '💡 Remember to support this artist directly through Bandcamp or their website!',
      antiMonopoly: '🚫 Fuck Spotify and their pennies. Support independent platforms!',
      bandcampMessage: '🎵 Search for this artist on Bandcamp.com - they get 80-90% of sales there!',
      zionistWarning: '⚠️  Major streaming platforms fund Zionist occupation and genocide. Boycott them!',
    },
    
    currentConfig: 'Current Configuration',
    downloadDir: 'Download Directory',
    audioQuality: 'Audio Quality',
    audioFormat: 'Audio Format',
    maxConcurrent: 'Max Concurrent Downloads',
    changeConfig: 'Change configuration',
    
    errorOccurred: 'An error occurred',
    noFilesFound: 'No music files found in directory',
    operationCancelled: 'Operation cancelled',
    
    analyzing: 'Analyzing',
    searching: 'Searching',
    found: 'Found',
    alreadyExists: 'Already exists',
    willDownload: 'Will download',
    confirm: 'Proceed with download?',
    
    artist: 'Artist',
    title: 'Title',
    album: 'Album',
    year: 'Year',
    genre: 'Genre',
    
    metadataFixed: 'Metadata fixed successfully',
    coverArtAdded: 'Cover art added successfully',
    lyricsAdded: 'Lyrics added successfully',
    allComplete: 'All operations completed! Power to the people! ✊',
  },
  
  es: {
    banner: `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🚩 ANTIFA FREE MUSIC SHARE 🚩                       ║
║                                                           ║
║      "Libera el Arte de las Cadenas Capitalistas"        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`,
    welcome: 'Bienvenido a Antifa Free Music Share',
    liberationMessage: '✊ Luchando contra los monopolios del streaming, una descarga a la vez',
    concept: `
🎵 Nuestra Misión:
   La música pertenece al pueblo, no a las corporaciones.
   Luchamos contra plataformas que explotan a los artistas,
   pagándoles centavos mientras financian regímenes fascistas.
   
   ¡Apoya a los artistas directamente a través de Bandcamp y plataformas independientes!
`,
    supportArtists: '💡 ¡Siempre visita los sitios web de los artistas, compra su merch, asiste a sus shows!',
    
    menuTitle: '🚩 Antifa Free Music Share',
    searchAndDownload: '🔍 Buscar y descargar pistas',
    downloadPlaylist: '📋 Descargar playlist',
    separator: '──────────────',
    fixMetadata: '🏷️  Arreglar metadatos de archivos existentes',
    addCoverArt: '🖼️  Agregar portadas a archivos existentes',
    addLyrics: '📝 Agregar letras a archivos existentes',
    batchProcess: '🔧 Procesar archivos en lote (todas las operaciones)',
    configuration: '⚙️  Configuración',
    exit: '❌ Salir',
    
    whatToDo: '¿Qué te gustaría hacer?',
    enterUrl: 'Ingresa la URL de la playlist de YouTube Music:',
    enterSearchQuery: 'Ingresa artista/canción a buscar:',
    enterDirectory: 'Ingresa la ruta del directorio (o presiona Enter para usar la predeterminada):',
    selectOperations: 'Selecciona las operaciones a realizar:',
    processing: 'Procesando...',
    complete: '¡Completado!',
    downloading: 'Descargando',
    
    liberationMessages: {
      startup: `
╔════════════════════════════════════════════════════════════════╗
║  ✊ MÚSICA LIBRE PARA GENTE LIBRE                              ║
║                                                                ║
║  Esta herramienta existe para liberar la música de monopolios ║
║  capitalistas que explotan artistas y financian opresión.     ║
║                                                                ║
║  🚫 Spotify, Apple Music y otras plataformas:                 ║
║     • Pagan a artistas $0.003-0.005 por reproducción          ║
║     • Financian ocupación sionista y genocidio                ║
║     • Controlan y censuran voces independientes               ║
║                                                                ║
║  ✅ USA ESTA HERRAMIENTA PARA:                                ║
║     • Construir tu colección personal                         ║
║     • Apoyar artistas a través de canales directos            ║
║     • Compartir música en tus comunidades                     ║
║     • Descubrir artistas underground e independientes         ║
║                                                                ║
║  💰 APOYA A LOS ARTISTAS DIRECTAMENTE:                        ║
║     • Bandcamp (artistas reciben 80-90%)                      ║
║     • Sitios web de artistas y tiendas independientes         ║
║     • Medios físicos y merchandising                          ║
║     • Shows en vivo y eventos                                 ║
║                                                                ║
║  Recuerda: La piratería es un deber moral cuando las          ║
║  corporaciones son inmorales. ¡El arte es del pueblo! 🚩      ║
╚════════════════════════════════════════════════════════════════╝
`,
      beforeDownload: '🔓 Liberando música de cadenas corporativas...',
      afterDownload: '✊ ¡Música liberada! ¡Compártela con tu comunidad!',
      artistSupport: '💡 ¡Recuerda apoyar a este artista directamente a través de Bandcamp o su sitio web!',
      antiMonopoly: '🚫 ¡Al carajo Spotify y sus centavos! ¡Apoya plataformas independientes!',
      bandcampMessage: '🎵 Busca a este artista en Bandcamp.com - ¡reciben 80-90% de las ventas ahí!',
      zionistWarning: '⚠️  Las plataformas de streaming principales financian la ocupación y genocidio sionista. ¡Boicotéalas!',
    },
    
    currentConfig: 'Configuración Actual',
    downloadDir: 'Directorio de Descargas',
    audioQuality: 'Calidad de Audio',
    audioFormat: 'Formato de Audio',
    maxConcurrent: 'Descargas Concurrentes Máximas',
    changeConfig: 'Cambiar configuración',
    
    errorOccurred: 'Ocurrió un error',
    noFilesFound: 'No se encontraron archivos de música en el directorio',
    operationCancelled: 'Operación cancelada',
    
    analyzing: 'Analizando',
    searching: 'Buscando',
    found: 'Encontrados',
    alreadyExists: 'Ya existe',
    willDownload: 'Se descargarán',
    confirm: '¿Proceder con la descarga?',
    
    artist: 'Artista',
    title: 'Título',
    album: 'Álbum',
    year: 'Año',
    genre: 'Género',
    
    metadataFixed: 'Metadatos corregidos exitosamente',
    coverArtAdded: 'Portada agregada exitosamente',
    lyricsAdded: 'Letras agregadas exitosamente',
    allComplete: '¡Todas las operaciones completadas! ¡Poder para el pueblo! ✊',
  },
  
  pt: {
    banner: `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🚩 ANTIFA FREE MUSIC SHARE 🚩                       ║
║                                                           ║
║      "Liberte a Arte das Correntes Capitalistas"         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`,
    welcome: 'Bem-vindo ao Antifa Free Music Share',
    liberationMessage: '✊ Lutando contra monopólios de streaming, um download por vez',
    concept: `
🎵 Nossa Missão:
   A música pertence ao povo, não às corporações.
   Lutamos contra plataformas que exploram artistas,
   pagando-lhes centavos enquanto financiam regimes fascistas.
   
   Apoie artistas diretamente através do Bandcamp e plataformas independentes!
`,
    supportArtists: '💡 Sempre visite os sites dos artistas, compre seus produtos, vá aos shows!',
    
    menuTitle: '🚩 Antifa Free Music Share',
    searchAndDownload: '🔍 Buscar e baixar faixas',
    downloadPlaylist: '📋 Baixar playlist',
    separator: '──────────────',
    fixMetadata: '🏷️  Corrigir metadados de arquivos existentes',
    addCoverArt: '🖼️  Adicionar capas a arquivos existentes',
    addLyrics: '📝 Adicionar letras a arquivos existentes',
    batchProcess: '🔧 Processar arquivos em lote (todas as operações)',
    configuration: '⚙️  Configuração',
    exit: '❌ Sair',
    
    whatToDo: 'O que você gostaria de fazer?',
    enterUrl: 'Digite a URL da playlist do YouTube Music:',
    enterSearchQuery: 'Digite artista/música para buscar:',
    enterDirectory: 'Digite o caminho do diretório (ou pressione Enter para o padrão):',
    selectOperations: 'Selecione as operações a realizar:',
    processing: 'Processando...',
    complete: 'Completo!',
    downloading: 'Baixando',
    
    liberationMessages: {
      startup: `
╔════════════════════════════════════════════════════════════════╗
║  ✊ MÚSICA LIVRE PARA PESSOAS LIVRES                           ║
║                                                                ║
║  Esta ferramenta existe para liberar a música de monopólios   ║
║  capitalistas que exploram artistas e financiam opressão.     ║
║                                                                ║
║  🚫 Spotify, Apple Music e outras plataformas:                ║
║     • Pagam aos artistas $0.003-0.005 por stream              ║
║     • Financiam ocupação sionista e genocídio                 ║
║     • Controlam e censuram vozes independentes                ║
║                                                                ║
║  ✅ USE ESTA FERRAMENTA PARA:                                 ║
║     • Construir sua coleção pessoal                           ║
║     • Apoiar artistas através de canais diretos               ║
║     • Compartilhar música em suas comunidades                 ║
║     • Descobrir artistas underground e independentes          ║
║                                                                ║
║  💰 APOIE ARTISTAS DIRETAMENTE:                               ║
║     • Bandcamp (artistas recebem 80-90%)                      ║
║     • Sites de artistas e lojas independentes                 ║
║     • Mídia física e merchandising                            ║
║     • Shows ao vivo e eventos                                 ║
║                                                                ║
║  Lembre-se: Pirataria é um dever moral quando corporações     ║
║  são imorais. Arte é para o povo! 🚩                          ║
╚════════════════════════════════════════════════════════════════╝
`,
      beforeDownload: '🔓 Libertando música de correntes corporativas...',
      afterDownload: '✊ Música libertada! Compartilhe com sua comunidade!',
      artistSupport: '💡 Lembre-se de apoiar este artista diretamente através do Bandcamp ou seu site!',
      antiMonopoly: '🚫 Foda-se o Spotify e seus centavos! Apoie plataformas independentes!',
      bandcampMessage: '🎵 Procure este artista no Bandcamp.com - eles recebem 80-90% das vendas lá!',
      zionistWarning: '⚠️  Plataformas de streaming principais financiam ocupação e genocídio sionista. Boicote-as!',
    },
    
    currentConfig: 'Configuração Atual',
    downloadDir: 'Diretório de Downloads',
    audioQuality: 'Qualidade de Áudio',
    audioFormat: 'Formato de Áudio',
    maxConcurrent: 'Downloads Concorrentes Máximos',
    changeConfig: 'Mudar configuração',
    
    errorOccurred: 'Ocorreu um erro',
    noFilesFound: 'Nenhum arquivo de música encontrado no diretório',
    operationCancelled: 'Operação cancelada',
    
    analyzing: 'Analisando',
    searching: 'Buscando',
    found: 'Encontrados',
    alreadyExists: 'Já existe',
    willDownload: 'Serão baixados',
    confirm: 'Prosseguir com o download?',
    
    artist: 'Artista',
    title: 'Título',
    album: 'Álbum',
    year: 'Ano',
    genre: 'Gênero',
    
    metadataFixed: 'Metadados corrigidos com sucesso',
    coverArtAdded: 'Capa adicionada com sucesso',
    lyricsAdded: 'Letras adicionadas com sucesso',
    allComplete: 'Todas as operações concluídas! Poder para o povo! ✊',
  },
};

class I18nManager {
  private currentLanguage: Language = 'en';
  
  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
  }
  
  getLanguage(): Language {
    return this.currentLanguage;
  }
  
  t(): Translations {
    return translations[this.currentLanguage];
  }
  
  getAvailableLanguages(): Array<{ name: string; code: Language }> {
    return [
      { name: 'English', code: 'en' },
      { name: 'Español', code: 'es' },
      { name: 'Português', code: 'pt' },
    ];
  }
}

export const i18n = new I18nManager();
export default i18n;
