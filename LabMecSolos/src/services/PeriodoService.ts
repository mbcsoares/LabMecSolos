import type { PeriodoPreset, PeriodoFiltro } from '../models/types';

export class PeriodoService {
  static resolverPreset(
    preset: PeriodoPreset,
    dataInicioPersonalizado?: string,
    dataFimPersonalizado?: string
  ): PeriodoFiltro {
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date;

    switch (preset) {
      case '7d':
        dataFim = new Date();
        dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case '30d':
        dataFim = new Date();
        dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - 30);
        break;
      case '90d':
        dataFim = new Date();
        dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - 90);
        break;
      case 'este_mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      case 'este_semestre':
        const semestre = Math.floor(hoje.getMonth() / 6);
        dataInicio = new Date(hoje.getFullYear(), semestre * 6, 1);
        dataFim = new Date(hoje.getFullYear(), (semestre + 1) * 6, 0);
        break;
      case 'este_ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataFim = new Date(hoje.getFullYear(), 11, 31);
        break;
      case 'personalizado':
        if (!dataInicioPersonalizado || !dataFimPersonalizado) {
          throw new Error('Datas personalizadas são obrigatórias.');
        }
        dataInicio = new Date(dataInicioPersonalizado);
        dataFim = new Date(dataFimPersonalizado);
        break;
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }

    return {
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: dataFim.toISOString().split('T')[0],
      preset,
    };
  }
}
