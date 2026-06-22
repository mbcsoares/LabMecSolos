import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.ufrn.labmecsolos',
  appName: 'LabMecSolos',
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      androidDatabaseLocation: 'default',
    },
  },
};

export default config;
