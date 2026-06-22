import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { GEOTECNICO_CONFIG } from '../config/geotecnico.config';

export class ExportacaoGeotecnicoService {
  private static async salvarArquivo(
    nomeArquivo: string,
    conteudo: string
  ): Promise<string> {
    const isNative = Capacitor.getPlatform() !== 'web';

    if (isNative) {
      const result = await Filesystem.writeFile({
        path: `Download/${nomeArquivo}`,
        data: conteudo,
        directory: Directory.ExternalStorage,
        recursive: true,
      });
      return result.uri;
    } else {
      const blob = new Blob([conteudo], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return url;
    }
  }

  static async salvarGeoJSON(conteudo: string): Promise<string> {
    return ExportacaoGeotecnicoService.salvarArquivo(
      GEOTECNICO_CONFIG.EXPORT_GEOJSON_FILENAME,
      conteudo
    );
  }

  static async salvarCSV(conteudo: string): Promise<string> {
    return ExportacaoGeotecnicoService.salvarArquivo(
      GEOTECNICO_CONFIG.EXPORT_CSV_FILENAME,
      conteudo
    );
  }
}
