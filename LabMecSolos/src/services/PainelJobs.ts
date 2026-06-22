import { LogExportService } from './LogExportService';
import { ConfiguracaoSistemaService } from './ConfiguracaoSistemaService';
import { NotificacaoGerencialService } from './NotificacaoGerencialService';
import { LogService } from './LogService';

export class PainelJobs {
  static async executarJobsInicializacao(idUsuario: string | null): Promise<void> {
    if (!idUsuario) return;
    try {
      await LogExportService.verificarELimparLogsAutomatico(idUsuario);
    } catch (err) {
      console.error('[PainelJobs] Erro na limpeza de logs:', err);
    }

    try {
      const deveVerificar = await ConfiguracaoSistemaService.deveVerificarNotificacoes();
      if (deveVerificar) {
        const notificacoes = await NotificacaoGerencialService.verificarNotificacoes();
        for (const notif of notificacoes) {
          await LogService.registrar(
            'sistema', 'notificacao_gerencial_gerada', idUsuario, null, null,
            JSON.stringify({ tipo: notif.tipo }), null
          );
        }
        await ConfiguracaoSistemaService.registrarVerificacaoNotificacoes();
      }
    } catch (err) {
      console.error('[PainelJobs] Erro nas notificações gerenciais:', err);
    }
  }
}
