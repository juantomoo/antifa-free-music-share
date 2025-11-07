# 📱 Antifa Free Music Share - Android

## ✊ Sobre la App

Aplicación Android creada colectivamente entre múltiples colectivos del Sur Global para democratizar el acceso a la música y la cultura.

**Licencia:** GPL-3.0 | **Contacto:** legal.dmca.globalsouth@proton.me

---

## 🚀 Instalación

### Requisitos
- Android 7.0 (API 24) o superior
- 50 MB de espacio libre
- Conexión a Internet

### Pasos
1. Descarga el APK desde [Releases](https://github.com/juantomoo/antifa-free-music-share/releases)
2. Habilita "Instalar desde fuentes desconocidas" en Configuración
3. Abre el APK y toca "Instalar"
4. Abre la app y concede permisos de almacenamiento

---

## 🎵 Funcionalidades

### ✅ Búsqueda de Música
- **Sin backend requerido**: Búsqueda directa en YouTube
- **Sin API key**: Parse de HTML de YouTube
- **Cache inteligente**: Resultados almacenados 1 hora
- **Fallback automático**: Google Suggest API si falla el método principal
- **20 resultados** con título, artista, duración y miniatura

### ✅ Gestión de Almacenamiento
- **Permisos automáticos**: Solicitud al iniciar
- **Ruta predeterminada**: `/storage/emulated/0/Music/AntifaFreeMusic`
- **Creación automática** de carpetas
- **Mensajes en 3 idiomas**: ES, EN, PT

### ✅ Características Visuales
- **Logo personalizado**: Puño levantado en colores cian/magenta
- **Splash screen**: 2 segundos con spinner cyan
- **Tema cyberpunk**: Fondo oscuro (#050A1E)
- **UI responsive**: Adaptada para móviles
- **Footer compacto**: 11px, no tapa contenido

### ✅ Idiomas Soportados
- 🇲🇽 Español
- 🏴 English
- 🇧🇷 Português

---

## 📋 Permisos Requeridos

La app solicita los siguientes permisos:

```xml
INTERNET                    - Buscar y descargar música
READ_EXTERNAL_STORAGE       - Leer archivos MP3
WRITE_EXTERNAL_STORAGE      - Guardar descargas (Android ≤8)
MANAGE_EXTERNAL_STORAGE     - Acceso completo (Android 10+)
ACCESS_NETWORK_STATE        - Verificar conexión
```

### ¿Por qué estos permisos?

- **INTERNET**: Buscar videos en YouTube sin APIs de pago
- **Almacenamiento**: Guardar música en tu dispositivo
- **Red**: Verificar si hay conexión antes de buscar

---

## 🔧 Características Técnicas

### Arquitectura
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Framework**: Capacitor 7.4.4
- **Plugins**:
  - `@capacitor/filesystem` 7.1.4 - Gestión de archivos
  - `@capacitor/app` 7.1.0 - Ciclo de vida de la app
- **Búsqueda**: Cliente JavaScript (sin backend)

### Diferencias con Electron
| Característica | Electron | Android |
|----------------|----------|---------|
| Búsqueda | Python backend + JS fallback | Solo JavaScript |
| Descargas | yt-dlp nativo | **Por implementar** |
| Selector carpetas | Dialog nativo | Capacitor Filesystem |
| Metadata | node-id3 | **Por implementar** |
| Cover art | Búsqueda + download | **Por implementar** |
| Lyrics | APIs múltiples | **Por implementar** |

### ⚠️ Limitaciones Actuales en Android

#### Funcionalidades NO Disponibles:
1. **Descarga de música**: Requiere backend o implementación nativa
2. **Actualizar metadata**: node-id3 no funciona en Android
3. **Agregar portadas**: Requiere acceso a archivos locales
4. **Agregar letras**: Requiere manipulación de archivos MP3
5. **Playlists**: Depende de yt-dlp

#### ¿Por qué?
Android no puede ejecutar comandos de sistema (yt-dlp, ffmpeg, Python). Necesitarías:
- **Opción A**: Servidor backend que procese descargas
- **Opción B**: Librerías nativas Android (Java/Kotlin)
- **Opción C**: WebAssembly (experimental)

---

## 🛠️ Desarrollo

### Compilar APK desde el código

#### Requisitos
- Node.js 18+
- Java JDK 21
- Android SDK (API 34)
- Gradle

#### Pasos

1. **Clonar repositorio**:
```bash
git clone https://github.com/juantomoo/antifa-free-music-share.git
cd antifa-free-music-share
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Compilar TypeScript**:
```bash
npm run build
```

4. **Sincronizar Capacitor**:
```bash
npx cap sync android
```

5. **Compilar APK**:
```bash
# Debug (para testing)
npm run android:build-debug

# Release (para producción)
npm run android:build
```

**APK output**: `android/app/build/outputs/apk/`

### Abrir en Android Studio
```bash
npm run android:open
```

---

## 📖 Uso de la App

### Primera vez
1. Abre la app
2. Concede permisos de almacenamiento cuando se soliciten
3. La carpeta `/storage/emulated/0/Music/AntifaFreeMusic` se crea automáticamente

### Buscar música
1. Toca pestaña "🔍 Buscar"
2. Escribe: `London After Midnight - Are You Feeling Fascist`
3. Toca "Buscar"
4. Resultados aparecen con miniaturas

### Seleccionar carpeta
1. Toca "Seleccionar" en cualquier sección
2. Si los permisos no están concedidos, verás un mensaje
3. Ve a: **Configuración > Aplicaciones > Antifa Free Music Share > Permisos**
4. Habilita "Almacenamiento"

---

## 🐛 Solución de Problemas

### "Error: Cannot read properties of undefined"
- **Solución**: Actualiza a la última versión del APK
- **Causa**: Versión anterior sin cliente de búsqueda JavaScript

### "Permisos denegados"
1. Abre **Configuración** de Android
2. **Aplicaciones** → **Antifa Free Music Share**
3. **Permisos** → Habilita **Almacenamiento**
4. Reinicia la app

### "No se encontraron resultados"
- Verifica conexión a Internet
- Intenta con otro término de búsqueda
- Limpia caché: Configuración > Apps > Limpiar datos

### Footer tapa contenido
- **Ya corregido** en última versión
- Footer ahora es compacto (11px) y deja espacio

---

## 🤝 Contribuir

Este proyecto es **colectivo y abierto**. Todos pueden contribuir:

### Formas de contribuir
- 💻 **Código**: Mejoras, nuevas funcionalidades
- 🐛 **Issues**: Reportar bugs
- 📖 **Documentación**: Mejorar guías
- 🌍 **Traducción**: Más idiomas
- 🎨 **Diseño**: Mejorar UI/UX
- 🗣️ **Difusión**: Compartir con otros colectivos

### Roadmap Android
- [ ] Implementar descarga real de música
- [ ] Backend opcional para procesamiento
- [ ] Soporte para metadata en Android
- [ ] Integración con reproductores locales
- [ ] Modo offline con caché
- [ ] Compartir música P2P
- [ ] Sincronización entre dispositivos

---

## ⚖️ Legal

### Licencia
**GNU GPL-3.0** - Software libre, siempre.

### Exención de Responsabilidad
Esta app se proporciona "tal cual". Los colectivos creadores no se hacen responsables del uso que terceros hagan de esta herramienta. Uso personal y educativo recomendado.

### DMCA
Para reclamaciones legales, consulta [disclaimer.html](disclaimer.html) o contacta:
**legal.dmca.globalsouth@proton.me**

*(Requisitos: documentación notariada en 3 idiomas, prueba de salarios justos, certificaciones de no explotación laboral, 180 días de respuesta)*

---

## 💪 Filosofía

**"¡Ningún ser humano es ilegal! ¡Ninguna cultura es mercancía!"**

Esta app nace de la convicción de que:
- El acceso a la cultura es un derecho humano
- El conocimiento y el arte deben circular libremente
- Las herramientas tecnológicas deben servir al pueblo
- La colaboración colectiva > individualismo capitalista

### Sur Global
Creado entre múltiples colectivos de Latinoamérica, África y Asia. Invitamos a otros colectivos a compartir, mejorar y distribuir libremente.

---

## 🔗 Enlaces

- **Código fuente**: https://github.com/juantomoo/antifa-free-music-share
- **Issues**: https://github.com/juantomoo/antifa-free-music-share/issues
- **Releases**: https://github.com/juantomoo/antifa-free-music-share/releases
- **Documentación Electron**: [ELECTRON-README.md](ELECTRON-README.md)

---

## 📱 Capturas

*(Próximamente)*

---

**✊ Construido colectivamente | GPL-3.0 | Sur Global**
