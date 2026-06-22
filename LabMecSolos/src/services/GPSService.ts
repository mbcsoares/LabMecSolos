import { Geolocation } from '@capacitor/geolocation';

export class GPSService {
  static async capturarCoordenadas(): Promise<{ latitude: number; longitude: number; precisao: number }> {
    try {
      const permission = await Geolocation.checkPermissions();

      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          throw new Error('Permissao de localizacao negada pelo usuario.');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        precisao: position.coords.accuracy,
      };
    } catch (error: any) {
      throw new Error(`Falha ao capturar coordenadas: ${error.message}`);
    }
  }

  static formatarParaArmazenamento(lat: number, lng: number): string {
    return `${lat},${lng}`;
  }

  static isPrecisaoAceitavel(precisao: number): boolean {
    return precisao <= 20;
  }
}
