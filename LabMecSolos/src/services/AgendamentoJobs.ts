import { CalendarioService } from './CalendarioService';
import { LogService } from './LogService';
import { queryRows } from './DatabaseService';
import { AGENDAMENTO_CONFIG } from '../config/agendamento.config';

export class AgendamentoJobs {
  private static readonly DIA_ALERTA = AGENDAMENTO_CONFIG.DIAS_CALENDARIO_PENDENTE_ALERTA;

  static async verificarCalendariosPendentes(): Promise<void> {
    try {
      const hoje = new Date();
      if (hoje.getDate() < AgendamentoJobs.DIA_ALERTA) return;

      const pendentes = await CalendarioService.verificarCalendariosPendentes();
      for (const mesAno of pendentes) {
        await LogService.registrar(
          'agendamento',
          'notificacao_calendario_pendente',
          null,
          null,
          null,
          JSON.stringify({ mes_ano: mesAno }),
          null
        );
      }
    } catch (err) {
      console.error('[AgendamentoJobs] Erro ao verificar calendários pendentes:', err);
    }
  }

  static async enviarLembretesAgendamento(): Promise<void> {
    try {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataAmanha = amanha.toISOString().split('T')[0];

      const rows = await queryRows<{ id: string; id_usuario_solicitante: string; primeiro_horario: string; total_datas: number }>(
        `SELECT a.id, a.id_usuario_solicitante,
          MIN(ad.hora_inicio) as primeiro_horario,
          COUNT(ad.id) as total_datas
         FROM agendamentos a
         INNER JOIN agendamento_datas ad ON a.id = ad.id_agendamento
         WHERE a.status = 'aprovado'
           AND ad.data_agendada = ?
           AND ad.comparecimento IS NULL
         GROUP BY a.id`,
        [dataAmanha]
      );

      for (const row of rows) {
        await LogService.registrar(
          'agendamento',
          'notificacao_calendario_pendente',
          null,
          row.id_usuario_solicitante,
          null,
          JSON.stringify({ data: dataAmanha, horario: row.primeiro_horario }),
          null
        );
      }
    } catch (err) {
      console.error('[AgendamentoJobs] Erro ao enviar lembretes:', err);
    }
  }

  static async executarTodos(): Promise<void> {
    await AgendamentoJobs.verificarCalendariosPendentes();
    await AgendamentoJobs.enviarLembretesAgendamento();
  }
}
