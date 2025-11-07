#!/bin/bash

# Script para instalar Android SDK Command Line Tools
# Compatible con Fedora/Linux

set -e

echo "🤖 Instalando Android SDK Command Line Tools..."

# Directorio de instalación
ANDROID_HOME="$HOME/Android/Sdk"
mkdir -p "$ANDROID_HOME"

# URL de las herramientas de línea de comandos (versión más reciente)
CMDTOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
CMDTOOLS_ZIP="/tmp/cmdtools.zip"

# Descargar
echo "📥 Descargando Android Command Line Tools..."
curl -L -o "$CMDTOOLS_ZIP" "$CMDTOOLS_URL"

# Extraer
echo "📦 Extrayendo archivos..."
unzip -q "$CMDTOOLS_ZIP" -d "$ANDROID_HOME"
rm "$CMDTOOLS_ZIP"

# Mover cmdline-tools a la ubicación correcta
mkdir -p "$ANDROID_HOME/cmdline-tools"
mv "$ANDROID_HOME/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest" 2>/dev/null || \
   mv "$ANDROID_HOME/cmdline-tools-linux" "$ANDROID_HOME/cmdline-tools/latest" 2>/dev/null || \
   true

# Instalar componentes necesarios
echo "📦 Instalando componentes del SDK..."
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses || true
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "emulator" || true

# Crear local.properties
echo "📝 Creando archivo local.properties..."
LOCAL_PROPS="$(dirname "$0")/android/local.properties"
echo "sdk.dir=$ANDROID_HOME" > "$LOCAL_PROPS"

# Agregar al bashrc si no existe
if ! grep -q "ANDROID_HOME" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Android SDK" >> ~/.bashrc
    echo "export ANDROID_HOME=\"$ANDROID_HOME\"" >> ~/.bashrc
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools\"" >> ~/.bashrc
fi

echo ""
echo "✅ ¡Android SDK instalado correctamente!"
echo ""
echo "📍 Ubicación: $ANDROID_HOME"
echo "📄 local.properties creado en: $LOCAL_PROPS"
echo ""
echo "⚠️  IMPORTANTE: Ejecuta esto para aplicar las variables de entorno:"
echo "    source ~/.bashrc"
echo ""
echo "Luego intenta nuevamente:"
echo "    npm run android:build-debug"
