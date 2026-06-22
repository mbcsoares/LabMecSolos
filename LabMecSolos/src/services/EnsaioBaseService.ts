import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { queryRows, executeSql, getDatabase } from './DatabaseService';
import { LogService } from './LogService';
import {
  Ensaio,
  EnsaioDetalhado,
  CriarEnsaioDTO,
} from '../models/types';

export class EnsaioBaseService {
  static async criarEnsaio(dados: CriarEnsaioDTO, idUsuario: string): Promise<Ensaio> {
    if (!dados.idAmostraEnsaiada && !dados.idAmostraIndeformada) {
      throw new Error('Selecione uma amostra (fracionada ou indeformada) para o ensaio.');
    }
    if (dados.idAmostraEnsaiada) {
      const emUso = await queryRows<{ id: string }>(
        'SELECT id FROM ensaios WHERE id_amostra_ensaiada = ?', [dados.idAmostraEnsaiada]
      );
      if (emUso.length > 0) throw new Error('Esta amostra ensaiada ja esta vinculada a outro ensaio.');
    }
    if (dados.idAmostraIndeformada) {
      const emUso = await queryRows<{ id: string }>(
        'SELECT id FROM ensaios WHERE id_amostra_indeformada = ?', [dados.idAmostraIndeformada]
      );
      if (emUso.length > 0) throw new Error('Esta amostra indeformada ja esta vinculada a outro ensaio.');
    }

    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO ensaios (id, tipo_ensaio, norma_referencia, id_amostra_ensaiada, id_amostra_indeformada, id_executante, status, temperatura_ambiente, umidade_ambiente, data_criacao, id_criado_por)
       VALUES (?, ?, ?, ?, ?, ?, 'nao_iniciado', ?, ?, ?, ?)`,
      [id, dados.tipoEnsaio, dados.normaReferencia || null, dados.idAmostraEnsaiada || null, dados.idAmostraIndeformada || null, dados.idExecutante, dados.temperaturaAmbiente || null, dados.umidadeAmbiente || null, agora, idUsuario]
    );

    if (dados.tipoEnsaio === 'teor_umidade') {
      await executeSql(
        `INSERT INTO ensaios_teor_umidade (id, temperatura_estufa, id_estufa, id_balanca, numero_determinacoes)
         VALUES (?, NULL, NULL, NULL, 0)`,
        [id]
      );
    }

    await LogService.registrar(
      'ensaios',
      'ensaio_criado',
      idUsuario,
      null,
      null,
      JSON.stringify({ tipo: dados.tipoEnsaio, norma: dados.normaReferencia || '' }),
      null
    );

    return {
      id,
      tipo_ensaio: dados.tipoEnsaio,
      norma_referencia: dados.normaReferencia || null,
      id_amostra_ensaiada: dados.idAmostraEnsaiada || null,
      id_amostra_indeformada: dados.idAmostraIndeformada || null,
      id_executante: dados.idExecutante,
      status: 'nao_iniciado',
      data_inicio: null,
      data_fim: null,
      temperatura_ambiente: dados.temperaturaAmbiente || null,
      umidade_ambiente: dados.umidadeAmbiente || null,
      observacoes: dados.observacoes || null,
      data_criacao: agora,
      id_criado_por: idUsuario,
      finalizado: 0,
    };
  }

  static async finalizarEnsaio(idEnsaio: string, idUsuario: string): Promise<void> {
    const ensaio = await queryRows<{ tipo_ensaio: string; id_executante: string; finalizado: number }>(
      'SELECT tipo_ensaio, id_executante, finalizado FROM ensaios WHERE id = ?', [idEnsaio]
    );
    if (ensaio.length === 0) throw new Error('Ensaio nao encontrado.');
    if (ensaio[0].finalizado === 1) throw new Error('Ensaio ja esta finalizado.');
    if (!ensaio[0].tipo_ensaio) throw new Error('Preencha o tipo de ensaio.');
    if (!ensaio[0].id_executante) throw new Error('Selecione o executante.');
    await executeSql('UPDATE ensaios SET finalizado = 1 WHERE id = ?', [idEnsaio]);
    await LogService.registrar('ensaios', 'ensaio_finalizado', idUsuario, null,
      JSON.stringify({ finalizado: 0 }), JSON.stringify({ finalizado: 1 }), null);
  }

  static async editarEnsaio(id: string, dados: CriarEnsaioDTO, idUsuario: string): Promise<void> {
    const ensaio = await queryRows<{ status: string; finalizado: number }>(
      'SELECT status, finalizado FROM ensaios WHERE id = ?', [id]
    );
    if (ensaio.length === 0) throw new Error('Ensaio nao encontrado.');
    if (ensaio[0].status !== 'nao_iniciado') throw new Error('Apenas ensaios nao iniciados podem ser editados.');
    if (ensaio[0].finalizado === 1) throw new Error('Ensaio ja finalizado, nao pode ser editado.');
    await executeSql(
      `UPDATE ensaios SET tipo_ensaio = ?, norma_referencia = ?, id_amostra_ensaiada = ?, id_amostra_indeformada = ?, id_executante = ?, temperatura_ambiente = ?, umidade_ambiente = ?, observacoes = ? WHERE id = ?`,
      [dados.tipoEnsaio, dados.normaReferencia || null, dados.idAmostraEnsaiada || null, dados.idAmostraIndeformada || null, dados.idExecutante, dados.temperaturaAmbiente || null, dados.umidadeAmbiente || null, dados.observacoes || null, id]
    );
    await LogService.registrar('ensaios', 'ensaio_editado', idUsuario, null,
      JSON.stringify({ tipo: ensaio[0].status }), JSON.stringify({ alterado: dados.tipoEnsaio }), null);
  }

  static async iniciarEnsaio(idEnsaio: string, idUsuario: string): Promise<void> {
    const ensaio = await queryRows<{ status: string; finalizado: number }>(
      "SELECT status, finalizado FROM ensaios WHERE id = ?", [idEnsaio]
    );
    if (ensaio.length === 0) throw new Error('Ensaio nao encontrado.');
    if (ensaio[0].status !== 'nao_iniciado') throw new Error('Ensaio nao esta em estado nao iniciado.');
    if (ensaio[0].finalizado !== 1) throw new Error('O ensaio precisa estar finalizado antes de ser iniciado.');

    const agora = nowISO();
    await executeSql(
      "UPDATE ensaios SET status = 'em_andamento', data_inicio = ? WHERE id = ?",
      [agora, idEnsaio]
    );

    await LogService.registrar(
      'ensaios',
      'ensaio_iniciado',
      idUsuario,
      null,
      JSON.stringify({ status: 'nao_iniciado' }),
      JSON.stringify({ status: 'em_andamento' }),
      null
    );
  }

  static async cancelarEnsaio(idEnsaio: string, motivo: string, idUsuario: string): Promise<void> {
    if (!motivo || motivo.trim().length === 0) {
      throw new Error('Motivo é obrigatório para cancelar o ensaio.');
    }

    const db = await getDatabase();
    const result = await db.run(
      "UPDATE ensaios SET status = 'cancelado', data_fim = ?, observacoes = COALESCE(observacoes || '; ', '') || ? WHERE id = ? AND status IN ('nao_iniciado', 'em_andamento')",
      [nowISO(), `Cancelado: ${motivo}`, idEnsaio]
    );
    if (!result.changes?.changes || result.changes.changes === 0) {
      throw new Error('Ensaio não encontrado ou não pode ser cancelado.');
    }

    await LogService.registrar(
      'ensaios',
      'ensaio_cancelado',
      idUsuario,
      null,
      null,
      JSON.stringify({ status: 'cancelado', motivo }),
      null
    );
  }

  static async obterEnsaio(id: string): Promise<Ensaio | null> {
    const rows = await queryRows<Ensaio>('SELECT * FROM ensaios WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async obterEnsaioDetalhado(id: string): Promise<EnsaioDetalhado | null> {
    const query = `
      SELECT e.*, u.nome || ' ' || u.sobrenome AS nome_executante,
        etu.h_medio, etu.desvio_padrao, etu.fc_medio, etu.numero_determinacoes,
        etu.temperatura_estufa, etu.id_estufa, etu.id_balanca
      FROM ensaios e
      LEFT JOIN usuarios u ON e.id_executante = u.id
      LEFT JOIN ensaios_teor_umidade etu ON e.id = etu.id
      WHERE e.id = ?
    `;
    const rows = await queryRows<EnsaioDetalhado>(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async listarPorAmostra(
    idAmostraEnsaiada: string | null,
    idAmostraIndeformada: string | null
  ): Promise<Ensaio[]> {
    if (idAmostraEnsaiada) {
      return queryRows<Ensaio>(
        'SELECT * FROM ensaios WHERE id_amostra_ensaiada = ? ORDER BY data_criacao DESC',
        [idAmostraEnsaiada]
      );
    }
    if (idAmostraIndeformada) {
      return queryRows<Ensaio>(
        'SELECT * FROM ensaios WHERE id_amostra_indeformada = ? ORDER BY data_criacao DESC',
        [idAmostraIndeformada]
      );
    }
    return [];
  }

  static async listarPorUsuario(idUsuario: string): Promise<EnsaioDetalhado[]> {
    const query = `
      SELECT e.*, u.nome || ' ' || u.sobrenome AS nome_executante,
        etu.h_medio, etu.desvio_padrao, etu.fc_medio, etu.numero_determinacoes
      FROM ensaios e
      LEFT JOIN usuarios u ON e.id_executante = u.id
      LEFT JOIN ensaios_teor_umidade etu ON e.id = etu.id
      WHERE e.id_executante = ? OR e.id_criado_por = ?
      ORDER BY e.data_criacao DESC
    `;
    return queryRows<EnsaioDetalhado>(query, [idUsuario, idUsuario]);
  }

  static async atualizarParametrosTeorUmidade(
    idEnsaio: string,
    temperaturaEstufa: number,
    idEstufa: string | null,
    idBalanca: string | null
  ): Promise<void> {
    await executeSql(
      'UPDATE ensaios_teor_umidade SET temperatura_estufa = ?, id_estufa = ?, id_balanca = ? WHERE id = ?',
      [temperaturaEstufa, idEstufa, idBalanca, idEnsaio]
    );
  }
}
