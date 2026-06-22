import { nowISO } from '../utils/dateUtils';
import { queryRows, executeSql } from './DatabaseService';
import { LogService } from './LogService';
import type { ConfiguracaoSistema } from '../models/types';

export class ConfiguracaoSistemaService {
  static async obter(chave: string): Promise<string | null> {
    const rows = await queryRows<{ valor: string }>(
      'SELECT valor FROM configuracoes_sistema WHERE chave = ?',
      [chave]
    );
    return rows.length > 0 ? rows[0].valor : null;
  }

  static async obterTodas(): Promise<Record<string, string>> {
    const rows = await queryRows<{ chave: string; valor: string }>(
      'SELECT chave, valor FROM configuracoes_sistema'
    );
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.chave] = row.valor;
    }
    return config;
  }

  static async definir(chave: string, valor: string, idUsuario: string): Promise<void> {
    const anterior = await ConfiguracaoSistemaService.obter(chave);
    const agora = nowISO();

    await executeSql(
      'UPDATE configuracoes_sistema SET valor = ?, data_atualizacao = ?, id_atualizado_por = ? WHERE chave = ?',
      [valor, agora, idUsuario, chave]
    );

    await LogService.registrar(
      'sistema',
      'configuracao_alterada',
      idUsuario,
      null,
      JSON.stringify({ chave, valor: anterior }),
      JSON.stringify({ chave, valor }),
      null
    );
  }

  private static async obterNumerico(chave: string, padrao: number): Promise<number> {
    const valor = await ConfiguracaoSistemaService.obter(chave);
    return valor ? parseInt(valor, 10) : padrao;
  }

  static async obterAntecedenciaMinima(): Promise<number> {
    return ConfiguracaoSistemaService.obterNumerico('antecedencia_minima_dias', 2);
  }

  static async obterAntecedenciaMaxima(): Promise<number> {
    return ConfiguracaoSistemaService.obterNumerico('antecedencia_maxima_dias', 60);
  }

  static async obterPrazoCancelamento(): Promise<number> {
    return ConfiguracaoSistemaService.obterNumerico('prazo_cancelamento_horas', 24);
  }

  static async obterTempoRetencaoLogs(): Promise<number> {
    return ConfiguracaoSistemaService.obterNumerico('tempo_retencao_logs_dias', 365);
  }

  static async registrarLimpezaLogs(): Promise<void> {
    const agora = nowISO();
    await executeSql(
      "UPDATE configuracoes_sistema SET valor = ? WHERE chave = 'ultima_limpeza_logs'",
      [agora]
    );
  }

  static async registrarVerificacaoNotificacoes(): Promise<void> {
    const agora = nowISO();
    await executeSql(
      "UPDATE configuracoes_sistema SET valor = ? WHERE chave = 'ultima_verificacao_notificacoes_gerenciais'",
      [agora]
    );
  }

  static async deveExecutarLimpeza(): Promise<boolean> {
    const ultima = await ConfiguracaoSistemaService.obter('ultima_limpeza_logs');
    if (!ultima) return true;
    const diffMs = Date.now() - new Date(ultima).getTime();
    return diffMs > 24 * 60 * 60 * 1000;
  }

  static async deveVerificarNotificacoes(): Promise<boolean> {
    const ultima = await ConfiguracaoSistemaService.obter('ultima_verificacao_notificacoes_gerenciais');
    if (!ultima) return true;
    const diffMs = Date.now() - new Date(ultima).getTime();
    return diffMs > 24 * 60 * 60 * 1000;
  }
}
