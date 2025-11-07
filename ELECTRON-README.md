# 🚩 Antifa Free Music Share - Aplicación de Escritorio

## Interfaz Gráfica Cyberpunk Cross-Platform

Esta es la versión de escritorio con interfaz gráfica de **Antifa Free Music Share**, manteniendo la estética terminal cyberpunk pero accesible para cualquier persona.

---

## ✨ Características

- 🎨 **Interfaz Cyberpunk Terminal**: Estética retro-futurista con neón verde/cyan
- 🌍 **Cross-Platform**: Windows, macOS, Linux
- 📦 **Plug & Play**: Un solo ejecutable, sin instalación compleja
- 🔍 **Búsqueda Intuitiva**: Busca canciones por nombre o artista
- 📋 **Descargas de Playlists**: Pega la URL y descarga toda la playlist
- 💭 **Mensajes Reflexivos**: Filosofía de Martha Nussbaum durante las descargas
- ⚡ **Procesamiento Paralelo**: 10x más rápido que versión secuencial
- 📊 **Progreso en Tiempo Real**: Barras de progreso y estadísticas

---

## 🚀 Inicio Rápido

### Modo Desarrollo

```bash
# Instalar dependencias (solo primera vez)
npm install

# Compilar TypeScript
npm run build

# Ejecutar app Electron
npm run electron
```

### Construir Ejecutables

```bash
# Para todas las plataformas
npm run package

# Solo para tu plataforma
npm run package-linux   # AppImage, deb, rpm
npm run package-win     # .exe instalador y portable
npm run package-mac     # .dmg y .zip
```

Los ejecutables se generarán en la carpeta `release/`

### Construir para Android

```bash
# Sincronizar archivos web con proyecto Android
npm run android:sync

# Abrir proyecto en Android Studio
npm run android:open

# Construir APK debug (para testing)
npm run android:build-debug

# Construir APK release (para distribución)
npm run android:build

# Ejecutar en dispositivo/emulador conectado
npm run android:run
```

**Requisitos para Android:**
- Android SDK instalado (puedes usar el script `./install-android-sdk.sh`)
- Java JDK 21 (compatible con Gradle 8.11.1)
- Variables de entorno configuradas:
  ```bash
  export ANDROID_HOME="$HOME/Android/Sdk"
  export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
  ```

**Instalación automática del SDK:**
```bash
./install-android-sdk.sh
source ~/.bashrc  # Cargar variables de entorno
```

**Cambiar versión de Java (Fedora/RHEL):**
```bash
# Instalar Java 21
sudo dnf install java-21-openjdk java-21-openjdk-devel -y

# Configurar como predeterminado
sudo alternatives --config java
sudo alternatives --config javac
```

Los APKs se generan en: `android/app/build/outputs/apk/`

---

## 📱 Distribución

### Linux

**AppImage** (recomendado):
```bash
chmod +x Antifa-Free-Music-Share-*.AppImage
./Antifa-Free-Music-Share-*.AppImage
```

**DEB** (Debian/Ubuntu):
```bash
sudo dpkg -i antifa-free-music-share_*.deb
```

**RPM** (Fedora/RHEL):
```bash
sudo rpm -i antifa-free-music-share-*.rpm
```

### Windows

1. Descarga `Antifa-Free-Music-Share-Setup-*.exe`
2. Ejecuta el instalador
3. Sigue las instrucciones
4. Icono en escritorio y menú inicio

**Versión Portable** (sin instalación):
- Descarga `Antifa-Free-Music-Share-*-portable.exe`
- Ejecuta directamente, sin instalación

### macOS

1. Descarga `Antifa-Free-Music-Share-*.dmg`
2. Abre el DMG
3. Arrastra la app a la carpeta Applications
4. Primera vez: Click derecho → Abrir (por seguridad de macOS)

---

## 🎨 Interfaz

### Pantallas

1. **Búsqueda**: 
   - Campo de búsqueda
   - Resultados en tiempo real
   - Click para descargar

2. **Playlist**:
   - Pega URL de YouTube Music
   - Procesa toda la playlist
   - Progreso track por track

3. **Mensajes Reflexivos**:
   - Rotan cada 15 segundos
   - Filosofía de Martha Nussbaum
   - Capacidades humanas y dignidad

### Estética Cyberpunk

- **Colores**: Verde neón (#00ff41), Cyan (#00ffff), Amarillo (#ffff00)
- **Fuente**: Share Tech Mono (monospace retro)
- **Efectos**: Glow, scanlines, animaciones suaves
- **Tema**: Terminal hacker, años 90, Matrix-style

---

## 🛠️ Requisitos del Sistema

### Todos los Sistemas

- **yt-dlp**: Instalado y en PATH
- **ffmpeg**: Instalado y en PATH
- **Python 3.8+**: Para ytmusicapi
- **Conexión a internet**: Para descargas

### Linux

```bash
# Fedora/RHEL
sudo dnf install python3-pip ffmpeg

# Ubuntu/Debian
sudo apt install python3-pip ffmpeg

# Arch
sudo pacman -S python-pip ffmpeg

# Instalar yt-dlp
pip install yt-dlp ytmusicapi
```

### Windows

1. Instalar Python: https://python.org/downloads
2. Instalar ffmpeg: https://ffmpeg.org/download.html
3. Agregar ffmpeg al PATH
4. Abrir CMD y ejecutar: `pip install yt-dlp ytmusicapi`

### macOS

```bash
# Con Homebrew
brew install python ffmpeg
pip3 install yt-dlp ytmusicapi
```

---

## 📂 Estructura del Proyecto

```
electron/
├── main.js          # Proceso principal de Electron
├── preload.js       # Comunicación segura IPC
├── index.html       # Interfaz HTML
├── styles.css       # Estilos cyberpunk
├── renderer.js      # Lógica del frontend
└── icon.png         # Icono de la app

dist/                # Código TypeScript compilado
src/                 # Código fuente CLI original
release/             # Ejecutables generados
```

---

## 🔧 Personalización

### Cambiar Concurrencia de Descargas

En `src/main.ts` línea 691:
```typescript
const limit = pLimit(10); // Cambiar 10 por otro número
```

### Cambiar Frecuencia de Mensajes

En `electron/main.js` línea 219:
```javascript
}, 15000); // Cambiar 15000 (15s) por otro valor en ms
```

### Modificar Colores

Edita `electron/styles.css` variables CSS:
```css
:root {
  --text-primary: #00ff41;    /* Verde principal */
  --accent-cyan: #00ffff;     /* Cyan */
  --accent-yellow: #ffff00;   /* Amarillo */
}
```

---

## 🌟 Filosofía

Esta herramienta mantiene los valores del proyecto CLI:

- ✊ **Liberación de la cultura** de monopolios capitalistas
- 🌱 **Martha Nussbaum**: Enfoque de capacidades humanas
- 🤝 **Tecnología como puente**, no como barrera
- 🕊️ **Diálogo sin extremismos**
- 💚 **Triple impacto**: Social, ambiental, económico
- 🔓 **Soberanía tecnológica** como dignidad humana

---

## 📄 Licencia

**GPL-3.0-or-later**

Software libre para gente libre. Comparte, modifica, mejora.

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/mejora-increible`
3. Commit: `git commit -m 'Feat: Mejora increíble'`
4. Push: `git push origin feature/mejora-increible`
5. Abre un Pull Request

---

## 💬 Soporte

- **Issues**: https://github.com/juantomoo/antifa-free-music-share/issues
- **Discusiones**: https://github.com/juantomoo/antifa-free-music-share/discussions

---

## 🙏 Agradecimientos

- **Martha Nussbaum**: Por su filosofía de capacidades humanas
- **yt-dlp**: La columna vertebral de este proyecto
- **Comunidad open source**: Por todas las bibliotecas usadas
- **Artistas independientes**: Que luchan por su libertad creativa

---

**✊ ¡Música libre para gente libre!**

*"Las capacidades humanas florecen en libertad"* - Martha Nussbaum
