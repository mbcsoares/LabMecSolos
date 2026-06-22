import { ConfiguracaoSistemaService } from './ConfiguracaoSistemaService';
import type { ConfiguracaoLaboratorio, AtualizarConfiguracaoDTO } from '../models/types';

export class ConfiguracaoLaboratorioService {
  static async obter(): Promise<ConfiguracaoLaboratorio> {
    const min = await ConfiguracaoSistemaService.obterAntecedenciaMinima();
    const max = await ConfiguracaoSistemaService.obterAntecedenciaMaxima();
    const prazo = await ConfiguracaoSistemaService.obterPrazoCancelamento();

    return {
      id: '',
      antecedencia_minima_dias: min,
      antecedencia_maxima_dias: max,
      prazo_cancelamento_horas: prazo,
      data_atualizacao: '',
      id_atualizado_por: '',
    };
  }

  static async atualizar(dados: AtualizarConfiguracaoDTO, idUsuario: string): Promise<void> {
    await ConfiguracaoSistemaService.definir('antecedencia_minima_dias', String(dados.antecedenciaMinimaDias), idUsuario);
    await ConfiguracaoSistemaService.definir('antecedencia_maxima_dias', String(dados.antecedenciaMaximaDias), idUsuario);
    await ConfiguracaoSistemaService.definir('prazo_cancelamento_horas', String(dados.prazoCancelamentoHoras), idUsuario);
  }
}
