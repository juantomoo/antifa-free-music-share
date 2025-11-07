# 🚩 Antifa Free Music Share

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🚩 ANTIFA FREE MUSIC SHARE 🚩                       ║
║                                                           ║
║      "Libera el Arte de las Cadenas Capitalistas"        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**La música pertenece al pueblo, no a las corporaciones.**

*Disponible en: [Español](#) | [English](README-en.md) | [Português](README-pt.md)*

---

## 🎵 Nuestra Misión

**Antifa Free Music Share** es una herramienta comunitaria diseñada para liberar la música de los monopolios del streaming que explotan a los artistas y financian la opresión global. Este proyecto lucha contra:

- 🚫 **Plataformas de streaming** que pagan $0.003-0.005 por reproducción mientras se quedan con billones
- 🚫 **Monopolios corporativos** como Spotify que financian la ocupación y genocidio sionista
- 🚫 **Guardianes capitalistas** que controlan, censuran y explotan voces independientes
- 🚫 **Feudalismo digital** que te hace pagar renta para acceder a la cultura

### ✊ Por Qué Luchamos

La música y el arte son **patrimonio humano**. Deben ser accesibles para todos, no encerrados detrás de muros de pago que enriquecen a billonarios mientras los artistas luchan por sobrevivir.

Las plataformas principales de streaming:
- Pagan centavos a los artistas mientras lucran billones
- Financian regímenes opresivos y ocupación militar
- Censuran artistas políticos e independientes
- Controlan la distribución cultural mediante algoritmos
- Te hacen pagar renta mensual por acceso a la cultura

**Esto está mal. Nosotros contraatacamos.**

---

## 🔓 Qué Hace Esta Herramienta

Antifa Free Music Share te permite:

✅ **Construir colecciones personales** libres del control corporativo  
✅ **Descargar desde YouTube Music** con metadatos completos  
✅ **Procesar playlists** con descargas paralelas inteligentes  
✅ **Arreglar bibliotecas existentes** (metadatos, portadas, letras)  
✅ **Soportar múltiples idiomas** (inglés, español, portugués)  
✅ **Acceder a metadatos precisos** de MusicBrainz, Spotify, Deezer  
✅ **Incrustar portadas de alta calidad** de múltiples fuentes  
✅ **Agregar letras automáticamente** desde Genius y AZLyrics  

### Especialista en Música Underground

Esta herramienta destaca en encontrar metadatos precisos para:
- Artistas underground e independientes
- Géneros de nicho (darkwave, industrial, noise, experimental)
- Música no angloparlante
- Artistas ignorados por plataformas mainstream

---

## 💰 Cómo Apoyar a los Artistas REALMENTE

**Esta herramienta NO se trata de robar a los artistas.** Se trata de liberar la música de plataformas que roban A LOS artistas.

### ✅ Apoya a los Artistas Directamente:

1. **Bandcamp** - Los artistas reciben 80-90% de las ventas (vs. $0.003 por stream de Spotify)
2. **Sitios web de artistas** - Compra música y merch directamente
3. **Medios físicos** - Vinilos, CDs, cassettes de tiendas independientes
4. **Shows en vivo** - Asiste a conciertos y compra merch en los venues
5. **Patreon/Ko-fi** - Apoyo directo a tus creadores favoritos
6. **Sellos independientes** - Apoya sellos que respetan a los artistas

### 🚫 Boicotea Plataformas Explotadoras:

- **Spotify** - $0.003-0.004 por stream, financia tech sionista, censura artistas
- **Apple Music** - $0.01 por stream (aún explotador), ecosistema cerrado
- **Amazon Music** - Explotación de trabajadores + explotación de artistas
- **YouTube Music** - Monopolio de Google que censura documentales de derechos humanos palestinos

#### 🚨 Censura Activa de YouTube contra Palestina

En noviembre de 2025, YouTube eliminó más de **700 vídeos que documentaban crímenes de guerra israelíes** en Gaza y Cisjordania, clausurando las cuentas de tres organizaciones palestinas de derechos humanos: Al-Haq, el Centro Al Mezan y el Centro Palestino para los Derechos Humanos.

El contenido eliminado incluía:
- 📹 Documental con testimonios de madres supervivientes del genocidio en Gaza
- 🎥 Investigación sobre el asesinato de la periodista Shireen Abu Akleh
- 📸 Evidencia de destrucción de viviendas palestinas en Cisjordania

**YouTube actuó bajo presión del gobierno de Trump y sus sanciones contra organizaciones que colaboraron con la Corte Penal Internacional** en casos de crímenes de guerra israelíes.

> "La eliminación por parte de YouTube representa una grave violación de principios y un alarmante retroceso para los derechos humanos y la libertad de expresión." - Portavoz de Al-Haq

**Por esto también boicoteamos YouTube:** No solo explotan artistas, sino que activamente silencian voces palestinas y encubren genocidio.

📰 Fuente: [HispanTV - YouTube borra 700 vídeos que documentan crímenes de guerra israelíes](https://www.hispantv.com/noticias/palestina/634255/youtube-borra-videos-crimenes-israelies) (5 de noviembre de 2025)

### 📊 Las Matemáticas:

- **1,000 streams de Spotify** = $3-4 para el artista  
- **1 álbum en Bandcamp** = $7-9 para el artista  
- **1 entrada de concierto** = $15-30 para el artista  
- **1 playera** = $10-20 para el artista  

**Usa esta herramienta + compra directo = Los artistas ganan**

---

## 🛠️ Instalación

### Prerequisitos

- **Node.js 18+** ([Descargar](https://nodejs.org/))
- **yt-dlp** ([Guía de instalación](https://github.com/yt-dlp/yt-dlp#installation))
- **ffmpeg** (para conversión de audio)

```bash
# Ubuntu/Debian
sudo apt install ffmpeg
pip install yt-dlp

# macOS
brew install ffmpeg yt-dlp

# Fedora
sudo dnf install ffmpeg
pip install yt-dlp
```

### Instalar Antifa Free Music Share

```bash
# Clonar el repositorio
git clone https://github.com/juantomoo/antifa-free-music-share.git
cd antifa-free-music-share

# Instalar dependencias
npm install

# Compilar el proyecto
npm run build

# Ejecutar la aplicación
npm start
```

### Configuración

1. Copiar plantilla de entorno:
```bash
cp .env.example .env
```

2. (Opcional) Agregar claves API a `.env`:
```env
# Para mejores portadas (opcional)
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret

# Para letras (opcional)
GENIUS_ACCESS_TOKEN=tu_token

# Contacto MusicBrainz (recomendado)
MUSICBRAINZ_CONTACT=tu-email@ejemplo.com
```

---

## 🚀 Uso

### Modo Interactivo

Ejecuta la aplicación:
```bash
npm start
```

Serás recibido con selección de idioma y un mensaje de liberación. Luego elige entre:

```
🚩 Antifa Free Music Share

? ¿Qué te gustaría hacer?
  🔍 Buscar y descargar pistas
  📋 Descargar playlist
  ──────────────
  🏷️  Arreglar metadatos de archivos existentes
  🖼️  Agregar portadas a archivos existentes
  📝 Agregar letras a archivos existentes
  🔧 Procesar archivos en lote (todas las operaciones)
  ──────────────
  ⚙️  Configuración
  ❌ Salir
```

### Descargar Playlist

1. Selecciona **"📋 Descargar playlist"**
2. Pega la URL de la playlist de YouTube Music
3. La herramienta:
   - Extraerá todas las pistas con metadatos
   - Verificará archivos existentes
   - Mostrará lo que se descargará
   - Pedirá confirmación
   - Descargará 5 pistas en paralelo
   - Incrustará metadatos, portadas y letras

### Arreglar Biblioteca Existente

#### 🏷️ Arreglar Metadatos
- Apunta a tu directorio de música
- La herramienta escanea archivos MP3/FLAC/M4A/OGG
- Usa MusicBrainz para encontrar metadatos precisos
- Corrige tags de artista, álbum, año, género

#### 🖼️ Agregar Portadas
- Busca en múltiples fuentes (MusicBrainz, Spotify, Deezer, iTunes, Last.fm)
- Descarga la mayor calidad disponible (hasta 1200x1200)
- Incrusta en archivos de audio

#### 📝 Agregar Letras
- Obtiene de Genius y AZLyrics
- Incrusta como letras no sincronizadas (tag USLT)
- Omite archivos que ya tienen letras

#### 🔧 Procesamiento por Lotes
- Combina todas las operaciones anteriores
- Procesa biblioteca completa de una vez
- Elige qué operaciones ejecutar

---

## ⚙️ Configuración

### Ajustes de Audio

Edita `.env`:
```env
DOWNLOAD_DIR=./downloads
AUDIO_QUALITY=320k          # Opciones: 96k, 192k, 320k, flac
AUDIO_FORMAT=mp3            # Opciones: mp3, flac, m4a, ogg
MAX_CONCURRENT_DOWNLOADS=5  # Descargas paralelas
```

---

## 🌍 Soporte Multilingüe

La herramienta soporta:
- 🇬🇧 **English** - [Read documentation in English](README.md)
- 🇪🇸 **Español**
- 🇧🇷 **Português** - [Ler documentação em português](README.pt.md)

El idioma se selecciona al inicio. Todos los mensajes, menús y textos de liberación están traducidos.

---

## 📖 Cómo Funciona

### Proceso de Descarga

1. **Extraer metadatos** de YouTube Music (fuente primaria)
2. **Verificar archivos existentes** para evitar duplicados
3. **Descargar audio** usando yt-dlp (320kbps por defecto)
4. **Enriquecer metadatos** de MusicBrainz, Spotify, Deezer
5. **Encontrar portada** de múltiples fuentes (prioridad: iTunes > Deezer > Spotify)
6. **Obtener letras** de Genius o AZLyrics
7. **Incrustar todo** en archivo de audio (tags ID3v2.4)
8. **Guardar en biblioteca** con nombre limpio: `Artista - Título.mp3`

---

## 🤝 Contribuir

¡Damos la bienvenida a contribuciones de la comunidad!

### Cómo Contribuir

1. **Haz fork del repositorio**
2. **Crea una rama**: `git checkout -b feature/mejora-antifascista`
3. **Haz tus cambios** (código, traducciones, documentación)
4. **Prueba tus cambios**: `npm run build && npm start`
5. **Commit con mensaje claro**: `git commit -m "Agrega: nueva función de liberación"`
6. **Push a tu fork**: `git push origin feature/mejora-antifascista`
7. **Abre un Pull Request** con descripción

### Código de Conducta

- ✅ Anti-fascista, anti-racista, anti-opresión
- ✅ Respeto por artistas y comunidades
- ✅ Inclusivo y accesible para todos
- 🚫 No fascistas, no racistas, no intolerantes
- 🚫 No defensores corporativos o de plataformas

---

## � Documentación

- **[Arquitectura de Descargas](ARQUITECTURA-DESCARGAS.md)** - Cómo funciona el sistema 100% local
- **[Guía Android](ANDROID-README.md)** - Instalación y uso en Android
- **[Guía Electron](ELECTRON-README.md)** - Instalación y uso en Desktop
- **[APIs Usadas](APIs.md)** - MusicBrainz, Cover Art Archive, etc.

---

## �📄 Licencia

**GPL-3.0-or-later**

Este proyecto es software libre: puedes redistribuirlo y/o modificarlo bajo los términos de la Licencia Pública General GNU publicada por la Free Software Foundation, ya sea la versión 3 de la Licencia, o (a tu elección) cualquier versión posterior.

Esto asegura:
- ✅ Libertad de usar, estudiar, modificar y compartir
- ✅ Protección copyleft (modificaciones deben permanecer libres)
- ✅ Sin apropiación corporativa
- ✅ Propiedad comunitaria

Ver archivo [LICENSE](LICENSE) para detalles completos.

---

## 🙏 Agradecimientos

Construido con:
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Motor de descarga de YouTube
- [MusicBrainz](https://musicbrainz.org/) - Enciclopedia comunitaria de música
- [Cover Art Archive](https://coverartarchive.org/) - Base de datos libre de portadas
- [Genius](https://genius.com/) - Base de datos de letras

Inspirado por:
- **Movimiento de cultura libre**
- **Colectivos tech anti-capitalistas**
- **Comunidades de música underground**
- **Artistas luchando por sus derechos**

Agradecimientos especiales a todos los artistas, sellos y plataformas independientes que respetan a los creadores.

---

## ⚠️ Aviso Legal

Esta herramienta se proporciona solo para **uso educativo y personal**. Los usuarios son responsables de cumplir con las leyes de derechos de autor en su jurisdicción.

**Te alentamos a:**
- Usar esto para descubrir artistas, luego apoyarlos directamente
- Construir colecciones personales para uso privado
- Compartir música en tus comunidades de forma no comercial
- Siempre comprar música cuando puedas pagarla
- Priorizar el apoyo directo a artistas sobre streaming

**Recuerda:**
- La piratería de contenido corporativo es un deber moral cuando las corporaciones son inmorales
- Pero siempre apoya a artistas independientes directamente
- El arte es para el pueblo, no para el lucro

---

## 🚩 Poder para el Pueblo

*"Lo único necesario para el triunfo del mal es que las personas buenas no hagan nada."*

Las plataformas de streaming son feudalismo moderno. Los artistas merecen mejor. Las comunidades merecen acceso a la cultura.

**Contraataca. Comparte libremente. Apoya directamente.**

---

**Hecho con ✊ por [Eonaria Project](https://github.com/juantomoo)**

*Libera el arte. Libera la cultura. Libera la humanidad.*

🚩 **Música libre para gente libre** 🚩

---

*Si esta herramienta te ayuda, por favor dale una estrella ⭐ al repositorio y compártelo en tus comunidades!*
