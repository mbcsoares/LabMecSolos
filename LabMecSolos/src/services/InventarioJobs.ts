import { InventarioService } from './InventarioService';
import { LogService } from './LogService';
import { queryRows } from './DatabaseService';
import { INVENTARIO_CONFIG } from '../config/inventario.config';
import type { ResultadoVerificacaoCalibracao } from '../models/types';

export class InventarioJobs {
  static async verificarCalibracaoJob(idUsuario: string | null): Promise<ResultadoVerificacaoCalibracao> {
    const resultado = await InventarioService.verificarCalibracoes();

    try {
      const logRows = await queryRows<{ data_criacao: string }>(
        "SELECT data_criacao FROM logs_sistema WHERE modulo = 'estoque' AND acao = 'calibracao_verificada' ORDER BY data_criacao DESC LIMIT 1"
      );

      let deveLogar = true;
      if (logRows.length > 0) {
        const ultimaVerificacao = new Date(logRows[0].data_criacao);
        const horasDesdeUltima = (Date.now() - ultimaVerificacao.getTime()) / 3600000;
        if (horasDesdeUltima < INVENTARIO_CONFIG.INTERVALO_VERIFICACAO_CALIBRACAO_HORAS) {
          deveLogar = false;
        }
      }

      if (deveLogar) {
        await LogService.registrar(
          'estoque', 'calibracao_verificada', idUsuario, null, null,
          JSON.stringify({ total: resultado.totalEquipamentos, vencidos: resultado.vencidos }), null
        );
      }
    } catch (err) {
      console.error('[InventarioJobs] Erro ao registrar log de calibracao:', err);
    }

    return resultado;
  }

  static async verificarEstoqueMinimoJob(_idUsuario: string | null): Promise<void> {
    try {
      const alertas = await InventarioService.verificarEstoqueMinimo();

      for (const alerta of alertas) {
        console.log(`[InventarioJobs] Estoque baixo: ${alerta.nome} — ${alerta.quantidadeAtual} ${alerta.unidadeMedida}`);

        await LogService.registrar(
          'estoque', 'notificacao_estoque_minimo', _idUsuario, null, null,
          JSON.stringify({ item: alerta.nome, quantidade: alerta.quantidadeAtual, ponto_pedido: alerta.pontoPedido }), null
        );
      }
    } catch (err) {
      console.error('[InventarioJobs] Erro ao verificar estoque minimo:', err);
    }
  }

  static async verificarValidadesProximasJob(): Promise<void> {
    try {
      const alertas = await InventarioService.verificarValidadesProximas(
        INVENTARIO_CONFIG.INTERVALOS_VALIDADE_PROXIMA as unknown as number[]
      );

      for (const alerta of alertas) {
        console.log(`[InventarioJobs] Validade proxima: ${alerta.nomeMaterial} (Lote ${alerta.numeroLote}) — ${alerta.diasRestantes} dias`);
      }
    } catch (err) {
      console.error('[InventarioJobs] Erro ao verificar validades:', err);
    }
  }

  static async executarTodos(idUsuario: string | null): Promise<void> {
    await this.verificarCalibracaoJob(idUsuario);
    await this.verificarEstoqueMinimoJob(idUsuario);
    await this.verificarValidadesProximasJob();
  }
}
