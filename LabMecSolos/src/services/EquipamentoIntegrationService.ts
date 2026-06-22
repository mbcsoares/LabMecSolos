import { queryRows } from './DatabaseService';
import { EquipamentoEnsaio, CalibracaoStatus } from '../models/types';

export class EquipamentoIntegrationService {
  static async buscarEquipamentos(): Promise<EquipamentoEnsaio[]> {
    const query = `
      SELECT e.id, i.nome, e.estado, e.data_ultima_calibracao, e.frequencia_calibracao_dias,
        CAST(julianday(e.data_ultima_calibracao, '+' || e.frequencia_calibracao_dias || ' days') - julianday('now') AS INTEGER) AS diasRestantes
      FROM equipamentos e
      INNER JOIN itens i ON e.id = i.id
      WHERE i.status = 'ativo'
      ORDER BY i.nome ASC
    `;

    const rows = await queryRows<any>(query);
    return rows.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      estado: row.estado,
      calibracaoVencida: row.diasRestantes <= 0,
      diasRestantes: row.diasRestantes,
    }));
  }

  static async verificarCalibracaoEquipamento(idEquipamento: string): Promise<CalibracaoStatus> {
    const query = `
      SELECT CAST(julianday(e.data_ultima_calibracao, '+' || e.frequencia_calibracao_dias || ' days') - julianday('now') AS INTEGER) AS diasRestantes
      FROM equipamentos e
      WHERE e.id = ? AND e.data_ultima_calibracao IS NOT NULL AND e.frequencia_calibracao_dias IS NOT NULL
    `;

    const rows = await queryRows<{ diasRestantes: number }>(query, [idEquipamento]);

    if (rows.length === 0) {
      return { vencida: false, diasRestantes: null };
    }

    const diasRestantes = rows[0].diasRestantes;
    return {
      vencida: diasRestantes <= 0,
      diasRestantes,
    };
  }
}
