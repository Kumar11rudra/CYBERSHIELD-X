import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cybershieldx.nexus',
  appName: 'CyberShield X',
  // CRA (react-scripts) builds to 'build/', NOT 'dist/'
  // 'dist' is for Vite — using 'dist' here would break mobile builds!
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    // Uncomment for live reload during dev (replace with your machine's IP):
    // url: 'http://192.168.1.X:3001',
    // cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020814',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#020814',
    },
  },
};

export default config;

