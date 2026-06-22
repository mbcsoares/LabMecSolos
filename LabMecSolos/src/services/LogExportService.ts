import { Filesystem, Directory } from '@capacitor/filesystem';
import { queryRows, getDatabase } from './DatabaseService';
import { LogService } from './LogService';
import { ConfiguracaoSistemaService } from './ConfiguracaoSistemaService';
import { nowISO } from '../utils/dateUtils';

export class LogExportService {
  static async exportarLogs(
    dataInicio: string,
    dataFim: string,
    modulos: string[],
    idUsuario: string
  ): Promise<string> {
    const placeholders = modulos.map(() => '?').join(',');

    const logs = await queryRows<any>(
      `SELECT ls.data_criacao, ls.modulo, ls.acao,
         ue.nome || ' ' || ue.sobrenome AS nome_executor,
         ua.nome || ' ' || ua.sobrenome AS nome_afetado,
         ls.detalhes
       FROM logs_sistema ls
       LEFT JOIN usuarios ue ON ls.id_usuario_executor = ue.id
       LEFT JOIN usuarios ua ON ls.id_usuario_afetado = ua.id
       WHERE ls.data_criacao BETWEEN ? AND ?
         AND ls.modulo IN (${placeholders})
       ORDER BY ls.data_criacao ASC`,
      [dataInicio, dataFim, ...modulos]
    );

    let conteudo = 'LabMecSolos — Exportação de Logs\n';
    conteudo += `Período: ${dataInicio} a ${dataFim}\n`;
    conteudo += `Módulos: ${modulos.join(', ')}\n`;
    conteudo += `Gerado em: ${nowISO()}\n`;
    conteudo += `${'='.repeat(80)}\n\n`;

    for (const log of logs) {
      conteudo += `[${log.data_criacao}] [${log.modulo}] ${log.acao}\n`;
      conteudo += `  Executor: ${log.nome_executor || 'Sistema'}\n`;
      if (log.nome_afetado) conteudo += `  Afetado: ${log.nome_afetado}\n`;
      if (log.detalhes) conteudo += `  Detalhes: ${log.detalhes}\n`;
      conteudo += '\n';
    }

    conteudo += `${'='.repeat(80)}\n`;
    conteudo += `Total de registros: ${logs.length}\n`;

    const nomeArquivo = `logs_labmecsolos_${dataInicio}_${dataFim}.txt`;

    try {
      const result = await Filesystem.writeFile({
        path: `Download/${nomeArquivo}`,
        data: conteudo,
        directory: Directory.ExternalStorage,
        recursive: true,
      });
      await LogService.registrar(
        'sistema', 'logs_exportados', idUsuario, null, null,
        JSON.stringify({ periodo: `${dataInicio} - ${dataFim}`, modulos: modulos.join(', ') }),
        { total_registros: logs.length }
      );
      return result.uri;
    } catch {
      // Fallback for web: trigger download
      const blob = new Blob([conteudo], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await LogService.registrar(
        'sistema', 'logs_exportados', idUsuario, null, null,
        JSON.stringify({ periodo: `${dataInicio} - ${dataFim}`, modulos: modulos.join(',') }),
        { total_registros: logs.length }
      );
      return url;
    }
  }

  static async forcarLimpezaLogs(idUsuario: string): Promise<number> {
    const diasRetencao = await ConfiguracaoSistemaService.obterTempoRetencaoLogs();
    return LogExportService.executarLimpeza(diasRetencao, idUsuario, 'limpeza_logs_manual');
  }

  static async verificarELimparLogsAutomatico(idUsuario: string): Promise<void> {
    const deveExecutar = await ConfiguracaoSistemaService.deveExecutarLimpeza();
    if (!deveExecutar) return;

    const diasRetencao = await ConfiguracaoSistemaService.obterTempoRetencaoLogs();
    const logsParaExcluir = await LogExportService.contarLogsParaExcluir(diasRetencao);

    if (logsParaExcluir > 0) {
      const dataFim = new Date().toISOString().split('T')[0];
      await LogExportService.exportarLogs('2000-01-01', dataFim, ['autenticacao', 'administracao', 'estoque', 'ensaios', 'agendamento', 'sistema'], idUsuario);
    }

    await LogExportService.executarLimpeza(diasRetencao, idUsuario, 'limpeza_logs_automatica');
    await ConfiguracaoSistemaService.registrarLimpezaLogs();
  }

  private static async executarLimpeza(diasRetencao: number, idUsuario: string, acao: string): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasRetencao);
    const dataLimiteStr = dataLimite.toISOString();

    const contagem = await queryRows<{ total: number }>(
      'SELECT COUNT(*) as total FROM logs_sistema WHERE data_criacao < ?',
      [dataLimiteStr]
    );
    const total = contagem[0]?.total || 0;

    const db = await getDatabase();
    await db.run('DELETE FROM logs_sistema WHERE data_criacao < ?', [dataLimiteStr]);

    await LogService.registrar(
      'sistema', acao, idUsuario, null, null,
      JSON.stringify({ registros_removidos: total }), null
    );

    return total;
  }

  private static async contarLogsParaExcluir(diasRetencao: number): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasRetencao);
    const rows = await queryRows<{ total: number }>(
      'SELECT COUNT(*) as total FROM logs_sistema WHERE data_criacao < ?',
      [dataLimite.toISOString()]
    );
    return rows[0]?.total || 0;
  }
}
