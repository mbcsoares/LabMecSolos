import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { getDatabase, queryRows } from './DatabaseService';
import { LogSistema } from '../models/types';

export class LogService {
  static async registrar(
    modulo: string,
    acao: string,
    idUsuarioExecutor: string | null,
    idUsuarioAfetado: string | null = null,
    valorAnterior: string | null = null,
    valorNovo: string | null = null,
    detalhes: Record<string, unknown> | null = null,
    ipOrigem?: string | null
  ): Promise<void> {
    const db = await getDatabase();
    await db.run(
      `INSERT INTO logs_sistema (id, modulo, acao, id_usuario_executor, id_usuario_afetado, valor_anterior, valor_novo, detalhes, ip_origem, data_criacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateUUID(),
        modulo,
        acao,
        idUsuarioExecutor,
        idUsuarioAfetado,
        valorAnterior,
        valorNovo,
        detalhes ? JSON.stringify(detalhes) : null,
        ipOrigem || null,
        nowISO(),
      ]
    );
  }

  static async limparLogsAntigos(): Promise<void> {
    const db = await getDatabase();
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
    await db.run('DELETE FROM logs_sistema WHERE data_criacao < ?', [umAnoAtras.toISOString()]);
  }

  static async buscarPorUsuario(
    idUsuario: string,
    modulos: string[],
    pagina: number,
    itensPorPagina: number
  ): Promise<{ logs: LogSistema[]; total: number }> {
    const offset = (pagina - 1) * itensPorPagina;
    const placeholders = modulos.map(() => '?').join(',');

    const queryTotal = `
      SELECT COUNT(*) as total
      FROM logs_sistema
      WHERE (id_usuario_afetado = ? OR id_usuario_executor = ?)
        AND modulo IN (${placeholders})
    `;
    const queryDados = `
      SELECT *
      FROM logs_sistema
      WHERE (id_usuario_afetado = ? OR id_usuario_executor = ?)
        AND modulo IN (${placeholders})
      ORDER BY data_criacao DESC
      LIMIT ? OFFSET ?
    `;

    const paramsTotal = [idUsuario, idUsuario, ...modulos];
    const paramsDados = [idUsuario, idUsuario, ...modulos, itensPorPagina, offset];

    const resultadoTotal = await queryRows<{ total: number }>(queryTotal, paramsTotal);
    const total = resultadoTotal.length > 0 ? resultadoTotal[0].total : 0;

    const logs = await queryRows<LogSistema>(queryDados, paramsDados);

    return { logs, total };
  }

  static async contarNotificacoesRecentes(dias: number = 7, modulosExcluidos: string[] = []): Promise<number> {
    let query = `SELECT COUNT(*) as total FROM logs_sistema
       WHERE acao LIKE 'notificacao_%'
         AND data_criacao >= ?`;
    const params: (string | number)[] = [new Date(Date.now() - dias * 86400000).toISOString()];
    if (modulosExcluidos.length > 0) {
      query += ` AND modulo NOT IN (${modulosExcluidos.map(() => '?').join(',')})`;
      params.push(...modulosExcluidos);
    }
    const rows = await queryRows<{ total: number }>(query, params);
    return rows.length > 0 ? rows[0].total : 0;
  }

  static async listarNotificacoes(pagina: number, itensPorPagina: number = 20, modulosExcluidos: string[] = []): Promise<{ logs: LogSistema[]; total: number }> {
    const offset = (pagina - 1) * itensPorPagina;
    let whereClause = "acao LIKE 'notificacao_%'";
    const params: (string | number)[] = [];
    if (modulosExcluidos.length > 0) {
      whereClause += ` AND modulo NOT IN (${modulosExcluidos.map(() => '?').join(',')})`;
      params.push(...modulosExcluidos);
    }
    const rows = await queryRows<{ total: number }>(
      `SELECT COUNT(*) as total FROM logs_sistema WHERE ${whereClause}`, params
    );
    const total = rows.length > 0 ? rows[0].total : 0;
    const logs = await queryRows<LogSistema>(
      `SELECT * FROM logs_sistema WHERE ${whereClause} ORDER BY data_criacao DESC LIMIT ? OFFSET ?`,
      [...params, itensPorPagina, offset]
    );
    return { logs, total };
  }

  static async contarNotificacoesNaoLidas(desde: string, modulosExcluidos: string[] = []): Promise<number> {
    let query = `SELECT COUNT(*) as total FROM logs_sistema
       WHERE acao LIKE 'notificacao_%'
         AND data_criacao > ?`;
    const params: (string | number)[] = [desde];
    if (modulosExcluidos.length > 0) {
      query += ` AND modulo NOT IN (${modulosExcluidos.map(() => '?').join(',')})`;
      params.push(...modulosExcluidos);
    }
    const rows = await queryRows<{ total: number }>(query, params);
    return rows.length > 0 ? rows[0].total : 0;
  }
}
