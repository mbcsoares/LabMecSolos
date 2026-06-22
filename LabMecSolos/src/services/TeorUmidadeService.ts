import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { queryRows, executeSql, getDatabase } from './DatabaseService';
import { LogService } from './LogService';
import {
  DeterminacaoTeorUmidade,
  RegistrarDeterminacaoDTO,
  ResultadosTeorUmidade,
} from '../models/types';

export class TeorUmidadeService {
  /**
   * R127: Cálculo automático de h_calculado ao registrar cada determinação.
   * Fórmula: h = ((M1 - M2) / (M2 - Tara)) * 100
   */
  static calcularHC(m1: number, m2: number, tara: number): number {
    const denominador = m2 - tara;
    if (denominador <= 0) {
      throw new Error('M2 deve ser maior que a tara.');
    }
    return ((m1 - m2) / denominador) * 100;
  }

  /**
   * R127: Cálculo automático de fc_individual ao registrar cada determinação.
   * Fórmula: fc = 100 / (100 + h_calculado)
   */
  static calcularFCIndividual(hCalculado: number): number {
    return 100 / (100 + hCalculado);
  }

  /**
   * Registra uma determinação e calcula h_calculado e fc_individual automaticamente.
   */
  static async registrarDeterminacao(dados: RegistrarDeterminacaoDTO, idUsuario: string): Promise<DeterminacaoTeorUmidade> {
    const id = generateUUID();
    const agora = nowISO();

    const ensaioResult = await queryRows<{ status: string }>(
      "SELECT e.status FROM ensaios e WHERE e.id = ?",
      [dados.idEnsaioTeorUmidade]
    );
    if (ensaioResult.length === 0) {
      throw new Error('Ensaio não encontrado.');
    }
    if (ensaioResult[0].status !== 'em_andamento') {
      throw new Error('Só é possível registrar determinações em ensaios em andamento.');
    }

    const seqResult = await queryRows<{ prox: number }>(
      'SELECT COALESCE(MAX(numero_determinacao), 0) + 1 AS prox FROM determinacoes_teor_umidade WHERE id_ensaio_teor_umidade = ?',
      [dados.idEnsaioTeorUmidade]
    );
    const numeroDeterminacao = seqResult[0].prox;

    const temM2 = dados.m2 !== undefined && dados.m2 !== null;
    const m2Value = temM2 ? dados.m2! : 0;
    const hCalculado = temM2
      ? TeorUmidadeService.calcularHC(dados.m1, m2Value, dados.tara)
      : null;
    const fcIndividual = hCalculado !== null
      ? TeorUmidadeService.calcularFCIndividual(hCalculado)
      : null;

    await executeSql(
      `INSERT INTO determinacoes_teor_umidade (id, id_ensaio_teor_umidade, numero_determinacao, tara, m1, m2, tempo_estufa, h_calculado, fc_individual, observacao, data_criacao, id_criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dados.idEnsaioTeorUmidade, numeroDeterminacao, dados.tara, dados.m1, m2Value, dados.tempoEstufa || null, hCalculado, fcIndividual, dados.observacao || null, agora, idUsuario]
    );

    await LogService.registrar(
      'ensaios',
      'determinacao_registrada',
      idUsuario,
      null,
      null,
      JSON.stringify({ numero: numeroDeterminacao, h_calculado: hCalculado?.toFixed(2) ?? 'pendente' }),
      null
    );

    return {
      id,
      id_ensaio_teor_umidade: dados.idEnsaioTeorUmidade,
      numero_determinacao: numeroDeterminacao,
      tara: dados.tara,
      m1: dados.m1,
      m2: m2Value,
      tempo_estufa: dados.tempoEstufa || null,
      h_calculado: hCalculado,
      fc_individual: fcIndividual,
      observacao: dados.observacao || null,
      data_criacao: agora,
      id_criado_por: idUsuario,
    };
  }

  /**
   * Completa uma determinação pendente com M2 e tempo de estufa, recalculando h e fc.
   */
  static async editarDeterminacao(
    idDeterminacao: string,
    m2: number,
    tempoEstufa: number | null,
    observacao: string | null,
    idUsuario: string
  ): Promise<DeterminacaoTeorUmidade> {
    const rows = await queryRows<DeterminacaoTeorUmidade>(
      'SELECT * FROM determinacoes_teor_umidade WHERE id = ?',
      [idDeterminacao]
    );
    if (rows.length === 0) {
      throw new Error('Determinação não encontrada.');
    }

    const det = rows[0];
    const ensaioResult = await queryRows<{ status: string }>(
      "SELECT status FROM ensaios WHERE id = ?",
      [det.id_ensaio_teor_umidade]
    );
    if (ensaioResult.length === 0 || ensaioResult[0].status !== 'em_andamento') {
      throw new Error('Só é possível editar determinações de ensaios em andamento.');
    }

    const hCalculado = TeorUmidadeService.calcularHC(det.m1, m2, det.tara);
    const fcIndividual = TeorUmidadeService.calcularFCIndividual(hCalculado);

    await executeSql(
      'UPDATE determinacoes_teor_umidade SET m2 = ?, tempo_estufa = ?, h_calculado = ?, fc_individual = ?, observacao = COALESCE(?, observacao) WHERE id = ?',
      [m2, tempoEstufa, hCalculado, fcIndividual, observacao, idDeterminacao]
    );

    await LogService.registrar(
      'ensaios',
      'determinacao_registrada',
      idUsuario,
      null,
      null,
      JSON.stringify({ determinacao_id: idDeterminacao, h_calculado: hCalculado.toFixed(2) }),
      null
    );

    return {
      ...det,
      m2,
      tempo_estufa: tempoEstufa ?? det.tempo_estufa,
      h_calculado: hCalculado,
      fc_individual: fcIndividual,
      observacao: observacao ?? det.observacao,
    };
  }

  /**
   * Calcula h_medio (média aritmética de todos os h_calculado).
   */
  static async calcularHMedio(idEnsaio: string): Promise<number> {
    const rows = await queryRows<{ media: number }>(
      'SELECT AVG(h_calculado) as media FROM determinacoes_teor_umidade WHERE id_ensaio_teor_umidade = ?',
      [idEnsaio]
    );
    return rows.length > 0 ? rows[0].media : 0;
  }

  /**
   * Calcula desvio padrão amostral de todos os h_calculado.
   */
  static async calcularDesvioPadrao(idEnsaio: string): Promise<number> {
    const rows = await queryRows<{ h_calculado: number }>(
      'SELECT h_calculado FROM determinacoes_teor_umidade WHERE id_ensaio_teor_umidade = ?',
      [idEnsaio]
    );

    const valores = rows.map((r) => r.h_calculado);
    if (valores.length < 2) return 0;

    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const somaQuadrados = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0);
    return Math.sqrt(somaQuadrados / (valores.length - 1));
  }

  /**
   * Calcula fc_medio a partir do h_medio.
   * Fórmula: fc_medio = 100 / (100 + h_medio)
   */
  static calcularFCMedio(hMedio: number): number {
    return 100 / (100 + hMedio);
  }

  /**
   * R125: Mínimo de 3 determinações para concluir o ensaio.
   * R127: Cálculos automáticos disparados ao concluir.
   */
  static async concluirEnsaio(idEnsaio: string, idUsuario: string): Promise<ResultadosTeorUmidade> {
    const ensaio = await queryRows<{ id: string }>(
      "SELECT id FROM ensaios WHERE id = ? AND status = 'em_andamento'",
      [idEnsaio]
    );
    if (ensaio.length === 0) {
      throw new Error('Ensaio não encontrado ou não está em andamento.');
    }

    const countRows = await queryRows<{ total: number }>(
      'SELECT COUNT(*) as total FROM determinacoes_teor_umidade WHERE id_ensaio_teor_umidade = ? AND h_calculado IS NOT NULL',
      [idEnsaio]
    );
    const totalDeterminacoes = countRows.length > 0 ? countRows[0].total : 0;

    if (totalDeterminacoes < 3) {
      throw new Error(`Mínimo de 3 determinações exigido. Atual: ${totalDeterminacoes}.`);
    }

    const hMedio = await TeorUmidadeService.calcularHMedio(idEnsaio);
    const desvioPadrao = await TeorUmidadeService.calcularDesvioPadrao(idEnsaio);
    const fcMedio = TeorUmidadeService.calcularFCMedio(hMedio);

    const agora = nowISO();

    const db = await getDatabase();
    await db.executeSet([
      {
        statement: "UPDATE ensaios SET status = 'concluido', data_fim = ? WHERE id = ?",
        values: [agora, idEnsaio],
      },
      {
        statement: 'UPDATE ensaios_teor_umidade SET h_medio = ?, desvio_padrao = ?, fc_medio = ?, numero_determinacoes = ? WHERE id = ?',
        values: [hMedio, desvioPadrao, fcMedio, totalDeterminacoes, idEnsaio],
      },
    ], true);

    await LogService.registrar(
      'ensaios',
      'ensaio_concluido',
      idUsuario,
      null,
      JSON.stringify({ status: 'em_andamento' }),
      JSON.stringify({ status: 'concluido', h_medio: hMedio.toFixed(2), determinacoes: totalDeterminacoes }),
      null
    );

    return {
      hMedio,
      desvioPadrao,
      fcMedio,
      numeroDeterminacoes: totalDeterminacoes,
    };
  }

  static async listarDeterminacoes(idEnsaio: string): Promise<DeterminacaoTeorUmidade[]> {
    return queryRows<DeterminacaoTeorUmidade>(
      'SELECT * FROM determinacoes_teor_umidade WHERE id_ensaio_teor_umidade = ? ORDER BY numero_determinacao ASC',
      [idEnsaio]
    );
  }
}
