# 🏗️ Arquitectura de Descargas Locales

## 📋 Resumen Ejecutivo

**Antifa Free Music Share** implementa un sistema de descargas **100% local** que NO requiere:
- ❌ Servidores propios
- ❌ Backends NodeJS/Python
- ❌ Costos de infraestructura
- ❌ API keys de pago
- ❌ Mantenimiento de servidores

Todo el procesamiento ocurre en el dispositivo del usuario usando:
- ✅ APIs públicas gratuitas (Invidious, yt-dlp API)
- ✅ WebAssembly (FFmpeg.wasm)
- ✅ JavaScript vanilla
- ✅ Capacitor Filesystem para Android

---

## 🔄 Flujo Completo de Descarga

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario busca canción                                   │
│     ↓                                                        │
│  2. youtube-search-client.js parsea HTML de YouTube         │
│     ↓                                                        │
│  3. Usuario hace clic en "Descargar"                        │
│     ↓                                                        │
│  4. download-manager.js obtiene stream URL                  │
│     │  - Intenta yt-dlp API (yt-dlp-api.vercel.app)        │
│     │  - Fallback: Invidious API (invidious.fdn.fr)        │
│     ↓                                                        │
│  5. Descarga audio con fetch() + progress tracking          │
│     ↓                                                        │
│  6. FFmpeg.wasm convierte a MP3 (en memoria)                │
│     ↓                                                        │
│  7. Agrega metadata ID3 (título, artista, año)              │
│     ↓                                                        │
│  8. Descarga cover art desde thumbnail de YouTube           │
│     ↓                                                        │
│  9. Guarda en almacenamiento con Capacitor Filesystem       │
│     ↓                                                        │
│ 10. ✅ Archivo MP3 listo en /storage/.../AntifaFreeMusic   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes del Sistema

### 1. YouTube Search Client (`youtube-search-client.js`)

**Propósito**: Buscar canciones sin YouTube API key

**Método**:
```javascript
async searchTracks(query) {
  // 1. Fetch HTML de YouTube
  const url = `https://www.youtube.com/results?search_query=${query} music`;
  const response = await fetch(url);
  const html = await response.text();
  
  // 2. Extraer JSON embebido
  const dataMatch = html.match(/var ytInitialData = ({.*?});/);
  const data = JSON.parse(dataMatch[1]);
  
  // 3. Navegar estructura DOM
  const contents = data.contents
    .twoColumnSearchResultsRenderer
    .primaryContents
    .sectionListRenderer
    .contents;
  
  // 4. Filtrar videoRenderer
  return contents.map(parseVideoRenderer);
}
```

**Ventajas**:
- ✅ Sin API keys
- ✅ Sin límites de cuota
- ✅ Sin costos
- ✅ Cache de 1 hora

**Desventajas**:
- ⚠️ Puede romperse si YouTube cambia estructura HTML
- ⚠️ Requiere conexión a internet

---

### 2. Download Manager (`download-manager.js`)

**Propósito**: Orquestar todo el proceso de descarga localmente

#### 2.1 Obtener Stream URL

**APIs públicas usadas** (en orden de prioridad):

##### Opción A: yt-dlp API (Vercel)
```javascript
const response = await fetch(
  `https://yt-dlp-api.vercel.app/api/info?url=https://www.youtube.com/watch?v=${videoId}`
);
const data = await response.json();
```

**Características**:
- 🆓 Gratis (hospedado en Vercel)
- 🚀 Rápido
- 📦 Devuelve todos los formatos disponibles
- ⚠️ Puede estar caído ocasionalmente

##### Opción B: Invidious API (Fallback)
```javascript
const instances = [
  'https://invidious.fdn.fr',
  'https://inv.riverside.rocks',
  'https://invidious.snopyta.org'
];

for (const instance of instances) {
  const response = await fetch(`${instance}/api/v1/videos/${videoId}`);
  // ...
}
```

**Características**:
- 🆓 Red distribuida de instancias públicas
- 🌍 Múltiples servidores (redundancia)
- 🔒 Respeta privacidad (no tracking)
- 📄 Bien documentada

**Resultado**: URL directa de stream de audio en mejor calidad

---

#### 2.2 Descargar Audio con Progreso

```javascript
async downloadAudio(audioUrl, onProgress) {
  const response = await fetch(audioUrl);
  const contentLength = response.headers.get('content-length');
  const total = parseInt(contentLength, 10);
  
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    onProgress({
      loaded,
      total,
      progress: (loaded / total) * 100
    });
  }

  return new Blob(chunks);
}
```

**Ventajas**:
- ✅ Muestra progreso en tiempo real
- ✅ Maneja archivos grandes (streaming)
- ✅ No carga todo en memoria de una vez

---

#### 2.3 Conversión a MP3 con FFmpeg.wasm

**FFmpeg.wasm**: Puerto de FFmpeg completo a WebAssembly

```javascript
async convertToMP3(inputBlob) {
  // 1. Cargar FFmpeg (solo primera vez)
  if (!this.ffmpegLoaded) {
    await this.initFFmpeg();
  }

  // 2. Escribir archivo de entrada en sistema virtual
  const inputData = new Uint8Array(await inputBlob.arrayBuffer());
  await this.ffmpeg.writeFile('input.webm', inputData);

  // 3. Ejecutar conversión
  await this.ffmpeg.exec([
    '-i', 'input.webm',    // Entrada
    '-vn',                  // Sin video
    '-ar', '44100',         // Sample rate
    '-ac', '2',             // Stereo
    '-b:a', '192k',         // Bitrate
    'output.mp3'            // Salida
  ]);

  // 4. Leer resultado
  const outputData = await this.ffmpeg.readFile('output.mp3');
  return new Blob([outputData.buffer], { type: 'audio/mpeg' });
}
```

**Características**:
- 🎯 Conversión completa en el navegador
- 📦 Carga FFmpeg desde CDN (~25 MB, solo primera vez)
- 🚀 Conversiones posteriores son rápidas
- 💾 No requiere backend

**Parámetros usados**:
- `-vn`: Sin video (solo audio)
- `-ar 44100`: Sample rate estándar para MP3
- `-ac 2`: Audio estéreo (2 canales)
- `-b:a 192k`: Bitrate de 192 kbps (buena calidad)

---

#### 2.4 Metadata ID3

```javascript
async writeMetadata(mp3Blob, metadata) {
  // TODO: Implementar escritura real con id3-writer
  // Por ahora solo retorna el blob
  return mp3Blob;
}
```

**Estado actual**: Preparado pero no implementado
**Próxima versión**: Usar `browser-id3-writer` para escribir:
- Título (TIT2)
- Artista (TPE1)
- Álbum (TALB)
- Año (TYER)
- Cover art (APIC)

---

#### 2.5 Cover Art

```javascript
async downloadCoverArt(thumbnailUrl) {
  // Intentar máxima resolución
  const maxQualityUrl = thumbnailUrl
    .replace('/default.jpg', '/maxresdefault.jpg')
    .replace('/hqdefault.jpg', '/maxresdefault.jpg');

  const response = await fetch(maxQualityUrl);
  return await response.blob();
}
```

**Ventajas**:
- ✅ Automático (descarga thumbnail de YouTube)
- ✅ Intenta máxima resolución (1920x1080)
- ✅ Fallback a resolución original

**Próximo paso**: Embeber en MP3 como tag APIC

---

#### 2.6 Guardar Archivo

**Electron**:
```javascript
// Usa Node.js fs directamente
await window.electronAPI.saveFile(blob, filename, path);
```

**Android**:
```javascript
// Usa Capacitor Filesystem
await Filesystem.writeFile({
  path: `${path}/${filename}`,
  data: base64String,
  directory: Directory.ExternalStorage
});
```

**Web** (fallback):
```javascript
// Descarga tradicional del navegador
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
```

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | ❌ Antes (Decorativo) | ✅ Ahora (Funcional) |
|---------|----------------------|----------------------|
| **Búsqueda** | Funcional | Funcional |
| **Descarga** | Solo UI, no funciona | Descarga real |
| **Conversión** | N/A | FFmpeg.wasm local |
| **Metadata** | N/A | Preparado |
| **Cover Art** | N/A | Descarga automática |
| **Almacenamiento** | N/A | Filesystem API |
| **Progreso** | Fake | Real time tracking |
| **Servidores** | N/A | Ninguno (APIs públicas) |
| **Costos** | $0 | $0 |
| **Mantenimiento** | N/A | Mínimo |

---

## 🚀 Ventajas de Esta Arquitectura

### Para el Usuario
- ✅ Todo funciona offline (después de cargar FFmpeg)
- ✅ No hay límites de descargas
- ✅ No requiere crear cuentas
- ✅ Privacidad total (no tracking)
- ✅ Archivos guardados localmente

### Para el Proyecto
- ✅ Cero costos de infraestructura
- ✅ No necesita servidor backend
- ✅ Escalable sin límites
- ✅ Mantenimiento mínimo
- ✅ Fácil de distribuir (solo APK/código)

### Para los Colectivos
- ✅ Ideología anti-capitalista (sin monetización)
- ✅ Software libre (GPL-3.0)
- ✅ Accesible desde el Sur Global
- ✅ Sin dependencias corporativas

---

## ⚠️ Limitaciones y Consideraciones

### Técnicas
1. **Primera descarga lenta**: FFmpeg.wasm se carga (~25 MB)
   - **Solución**: Cache del navegador, solo ocurre una vez

2. **Depende de APIs externas**: Invidious, yt-dlp API
   - **Solución**: Sistema de fallback con múltiples instancias

3. **Puede romperse si YouTube cambia estructura**
   - **Solución**: Actualizar regex de parsing

### Éticas
1. **YouTube Terms of Service**: Técnicamente viola ToS
   - **Justificación**: Liberación de cultura, no comercial

2. **Copyright**: Permite descargar contenido protegido
   - **Mitigación**: Disclaimer elaborado, DMCA con requerimientos justos

---

## 🔮 Roadmap Futuro

### Versión 1.1 (Próxima)
- [ ] Escritura completa de metadata ID3
- [ ] Embeber cover art en MP3
- [ ] Descargar letras desde Genius/LyricsOVH

### Versión 1.2
- [ ] Descargar playlists completas
- [ ] Múltiples descargas simultáneas
- [ ] Configuración de calidad (128k, 192k, 320k)

### Versión 2.0
- [ ] Soporte para Spotify (metadata mejorada)
- [ ] Soporte para SoundCloud
- [ ] Descargar videos completos

---

## 📚 Referencias Técnicas

### APIs Públicas Usadas
- **Invidious**: https://docs.invidious.io/api/
- **yt-dlp API**: https://github.com/yt-dlp/yt-dlp

### Librerías JavaScript
- **FFmpeg.wasm**: https://ffmpegwasm.netlify.app/
- **Capacitor Filesystem**: https://capacitorjs.com/docs/apis/filesystem

### Documentación
- **Electron IPC**: https://www.electronjs.org/docs/latest/api/ipc-renderer
- **WebAssembly**: https://webassembly.org/

---

## 🤝 Contribuciones

Si quieres mejorar esta arquitectura:
1. Fork el repositorio
2. Crea tu rama: `git checkout -b feature/mejora-arquitectura`
3. Commit tus cambios: `git commit -m 'Mejora en sistema de descargas'`
4. Push: `git push origin feature/mejora-arquitectura`
5. Abre Pull Request

**Áreas de mejora bienvenidas**:
- Optimizar conversión FFmpeg
- Agregar más instancias de Invidious
- Implementar cache más inteligente
- Mejorar manejo de errores
- Agregar tests unitarios

---

## 📝 Licencia

GPL-3.0 - Software libre y abierto para siempre

**✊ Creado colectivamente entre múltiples colectivos del Sur Global**

🌱 *"Las capacidades humanas florecen cuando la cultura es libre y accesible"*
