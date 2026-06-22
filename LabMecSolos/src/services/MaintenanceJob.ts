import { nowISO } from '../utils/dateUtils';
import { getDatabase } from './DatabaseService';

export class MaintenanceJob {
  static async limparPreCadastrosExpirados(): Promise<void> {
    const db = await getDatabase();
    await db.run('DELETE FROM pre_cadastro WHERE data_expiracao_codigo < ?', [nowISO()]);
  }

  static async limparCodigosExpirados(): Promise<void> {
    const db = await getDatabase();
    const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await db.run('DELETE FROM codigos_verificacao WHERE data_criacao < ?', [vinteQuatroHorasAtras]);
  }

  static async limparSessoesExpiradas(): Promise<void> {
    const db = await getDatabase();
    await db.run('DELETE FROM sessoes WHERE data_expiracao < ?', [nowISO()]);
  }

  static async limparLogsAntigos(): Promise<void> {
    const db = await getDatabase();
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
    await db.run('DELETE FROM logs_sistema WHERE data_criacao < ?', [umAnoAtras.toISOString()]);
  }

  static async executarTodos(): Promise<void> {
    try {
      await this.limparPreCadastrosExpirados();
      await this.limparCodigosExpirados();
      await this.limparSessoesExpiradas();
      await this.limparLogsAntigos();

      const { PainelJobs } = await import('./PainelJobs');
      await PainelJobs.executarJobsInicializacao(null);

      console.log('Jobs de manutencao executados com sucesso.');
    } catch (err) {
      console.error('Erro ao executar jobs de manutencao:', err);
    }
  }
}
