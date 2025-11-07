import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antifa.freemusicshare',
  appName: 'Antifa Free Music Share',
  webDir: 'electron',
  plugins: {
    Filesystem: {
      androidDisplayName: 'Antifa Free Music Share',
      androidNotificationDescription: 'Descargando música...'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#050A1E',
      showSpinner: true,
      spinnerColor: '#00FFFF'
    }
  },
  server: {
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
