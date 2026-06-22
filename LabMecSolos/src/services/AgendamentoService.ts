import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { queryRows, executeSql } from './DatabaseService';
import { LogService } from './LogService';
import { CalendarioService } from './CalendarioService';
import { ConfiguracaoLaboratorioService } from './ConfiguracaoLaboratorioService';
import type {
  Agendamento,
  StatusAgendamento,
  StatusCalendario,
  ComparecimentoStatus,
  SolicitarAgendamentoDTO,
  AprovarAgendamentoDTO,
  NegarAgendamentoDTO,
} from '../models/types';

export const TRANSICOES_AGENDAMENTO: Record<StatusAgendamento, StatusAgendamento[]> = {
  solicitado: ['aprovado', 'negado', 'cancelado'],
  aprovado: ['cancelado', 'finalizado'],
  negado: [],
  cancelado: [],
  finalizado: [],
};

export const TRANSICOES_CALENDARIO: Record<StatusCalendario, StatusCalendario[]> = {
  em_configuracao: ['publicado'],
  publicado: ['em_configuracao'],
};

export class AgendamentoService {
  static async solicitar(dados: SolicitarAgendamentoDTO, idUsuario: string): Promise<Agendamento> {
    const pesquisa = await queryRows<{ id: string; titulo: string }>(
      "SELECT id, titulo FROM pesquisas WHERE id = ? AND status = 'em_andamento'",
      [dados.idPesquisa]
    );
    if (pesquisa.length === 0) {
      throw new Error('Pesquisa não encontrada ou não está em andamento.');
    }

    const membro = await queryRows<{ c: number }>(
      `SELECT 1 as c FROM pesquisas WHERE id = ? AND id_responsavel = ?
       UNION
       SELECT 1 as c FROM pesquisa_colaboradores WHERE id_pesquisa = ? AND id_usuario = ?`,
      [dados.idPesquisa, idUsuario, dados.idPesquisa, idUsuario]
    );
    if (membro.length === 0) {
      throw new Error('Você não é membro desta pesquisa.');
    }

    if (!dados.objetivo || dados.objetivo.trim().length === 0) {
      throw new Error('Objetivo é obrigatório.');
    }

    if (!dados.ensaios || dados.ensaios.length === 0) {
      throw new Error('Informe ao menos um tipo de ensaio.');
    }

    if (!dados.datas || dados.datas.length === 0) {
      throw new Error('Selecione ao menos uma data.');
    }

    const config = await ConfiguracaoLaboratorioService.obter();
    const agora = new Date();

    for (const data of dados.datas) {
      const dataAgendada = new Date(data.dataAgendada + 'T00:00:00');
      const diffDias = Math.ceil((dataAgendada.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDias < config.antecedencia_minima_dias) {
        throw new Error(`Antecedência mínima de ${config.antecedencia_minima_dias} dias. Data: ${data.dataAgendada}.`);
      }
      if (diffDias > config.antecedencia_maxima_dias) {
        throw new Error(`Antecedência máxima de ${config.antecedencia_maxima_dias} dias. Data: ${data.dataAgendada}.`);
      }

      if (data.horaInicio >= data.horaFim) {
        throw new Error('Horário de início deve ser anterior ao horário de fim.');
      }

      const [ano, mes] = data.dataAgendada.split('-');
      const mesAno = `${ano}-${mes}`;
      const dia = parseInt(data.dataAgendada.split('-')[2]);

      const disponibilidade = await CalendarioService.verificarDisponibilidade(mesAno, dia);

      if (!disponibilidade.disponivel) {
        throw new Error(`Data ${data.dataAgendada} indisponível: ${disponibilidade.motivo}`);
      }

      if (data.horaInicio < disponibilidade.horaAbertura! || data.horaFim > disponibilidade.horaFechamento!) {
        throw new Error(`Horário fora do funcionamento do dia ${data.dataAgendada} (${disponibilidade.horaAbertura} - ${disponibilidade.horaFechamento}).`);
      }

      const temVaga = await AgendamentoService.verificarConflito(
        data.dataAgendada,
        data.horaInicio,
        data.horaFim,
        disponibilidade.capacidade!
      );
      if (!temVaga) {
        throw new Error(`Capacidade esgotada para o horário ${data.horaInicio}-${data.horaFim} em ${data.dataAgendada}.`);
      }
    }

    const idAgendamento = generateUUID();
    const dataSolicitacao = nowISO();

    await executeSql(
      `INSERT INTO agendamentos (id, id_pesquisa, id_usuario_solicitante, objetivo, contexto, status, data_solicitacao)
       VALUES (?, ?, ?, ?, ?, 'solicitado', ?)`,
      [idAgendamento, dados.idPesquisa, idUsuario, dados.objetivo.trim(), dados.contexto, dataSolicitacao]
    );

    for (const data of dados.datas) {
      await executeSql(
        `INSERT INTO agendamento_datas (id, id_agendamento, data_agendada, hora_inicio, hora_fim)
         VALUES (?, ?, ?, ?, ?)`,
        [generateUUID(), idAgendamento, data.dataAgendada, data.horaInicio, data.horaFim]
      );
    }

    for (const ensaio of dados.ensaios) {
      await executeSql(
        `INSERT INTO agendamento_ensaios (id, id_agendamento, tipo_ensaio, descricao)
         VALUES (?, ?, ?, ?)`,
        [generateUUID(), idAgendamento, ensaio.tipoEnsaio, ensaio.descricao || null]
      );
    }

    if (dados.itens && dados.itens.length > 0) {
      for (const idItem of dados.itens) {
        await executeSql(
          `INSERT INTO agendamento_itens (id, id_agendamento, id_item)
           VALUES (?, ?, ?)`,
          [generateUUID(), idAgendamento, idItem]
        );
      }
    }

    await LogService.registrar(
      'agendamento',
      'agendamento_solicitado',
      idUsuario,
      null,
      null,
      JSON.stringify({
        datas: dados.datas.map(d => d.dataAgendada).join(', '),
        ensaios: dados.ensaios.map(e => e.tipoEnsaio).join(', '),
      }),
      { total_datas: dados.datas.length }
    );

    return {
      id: idAgendamento,
      id_pesquisa: dados.idPesquisa,
      id_usuario_solicitante: idUsuario,
      id_tecnico_responsavel: null,
      objetivo: dados.objetivo.trim(),
      contexto: dados.contexto,
      status: 'solicitado',
      id_aprovador: null,
      justificativa_aprovacao: null,
      motivo_cancelamento: null,
      data_solicitacao: dataSolicitacao,
      data_aprovacao: null,
      data_cancelamento: null,
      data_finalizacao: null,
    };
  }

  static async aprovar(idAgendamento: string, dados: AprovarAgendamentoDTO, idAprovador: string): Promise<void> {
    const agendamento = await queryRows<Agendamento>(
      "SELECT * FROM agendamentos WHERE id = ? AND status = 'solicitado'",
      [idAgendamento]
    );
    if (agendamento.length === 0) {
      throw new Error('Agendamento não encontrado ou não está pendente de aprovação.');
    }

    const tecnico = await queryRows<{ id: string }>(
      "SELECT id FROM usuarios WHERE id = ? AND status = 'ativo'",
      [dados.idTecnicoResponsavel]
    );
    if (tecnico.length === 0) {
      throw new Error('Técnico responsável não encontrado ou inativo.');
    }

    const agora = nowISO();

    await executeSql(
      `UPDATE agendamentos SET status = 'aprovado', id_tecnico_responsavel = ?, id_aprovador = ?, justificativa_aprovacao = ?, data_aprovacao = ?
       WHERE id = ?`,
      [dados.idTecnicoResponsavel, idAprovador, dados.justificativa.trim(), agora, idAgendamento]
    );

    await LogService.registrar(
      'agendamento',
      'agendamento_aprovado',
      idAprovador,
      agendamento[0].id_usuario_solicitante,
      JSON.stringify({ status: 'solicitado' }),
      JSON.stringify({ status: 'aprovado', tecnico: dados.idTecnicoResponsavel }),
      null
    );
  }

  static async negar(idAgendamento: string, dados: NegarAgendamentoDTO, idAprovador: string): Promise<void> {
    const agendamento = await queryRows<Agendamento>(
      "SELECT * FROM agendamentos WHERE id = ? AND status = 'solicitado'",
      [idAgendamento]
    );
    if (agendamento.length === 0) {
      throw new Error('Agendamento não encontrado ou não está pendente.');
    }

    const agora = nowISO();

    await executeSql(
      `UPDATE agendamentos SET status = 'negado', id_aprovador = ?, justificativa_aprovacao = ?, data_aprovacao = ?
       WHERE id = ?`,
      [idAprovador, dados.justificativa.trim(), agora, idAgendamento]
    );

    await LogService.registrar(
      'agendamento',
      'agendamento_negado',
      idAprovador,
      agendamento[0].id_usuario_solicitante,
      JSON.stringify({ status: 'solicitado' }),
      JSON.stringify({ status: 'negado', justificativa: dados.justificativa }),
      null
    );
  }

  static async cancelarPeloUsuario(idAgendamento: string, motivo: string, idUsuario: string): Promise<void> {
    if (!motivo || motivo.trim().length === 0) {
      throw new Error('Motivo é obrigatório para cancelamento.');
    }

    const agendamento = await queryRows<Agendamento>(
      "SELECT * FROM agendamentos WHERE id = ? AND id_usuario_solicitante = ? AND status = 'aprovado'",
      [idAgendamento, idUsuario]
    );
    if (agendamento.length === 0) {
      throw new Error('Agendamento não encontrado ou não pode ser cancelado.');
    }

    const config = await ConfiguracaoLaboratorioService.obter();
    const primeiraData = await queryRows<{ primeira: string }>(
      'SELECT MIN(data_agendada) as primeira FROM agendamento_datas WHERE id_agendamento = ?',
      [idAgendamento]
    );

    if (primeiraData.length > 0 && primeiraData[0].primeira) {
      const agora = new Date();
      const dataLimite = new Date(`${primeiraData[0].primeira}T00:00:00`);
      dataLimite.setHours(dataLimite.getHours() - config.prazo_cancelamento_horas);

      if (agora > dataLimite) {
        throw new Error(`Prazo de cancelamento expirado (${config.prazo_cancelamento_horas}h antes da primeira data).`);
      }
    }

    const agoraISO = nowISO();
    await executeSql(
      "UPDATE agendamentos SET status = 'cancelado', motivo_cancelamento = ?, data_cancelamento = ? WHERE id = ?",
      [motivo.trim(), agoraISO, idAgendamento]
    );

    await LogService.registrar(
      'agendamento',
      'agendamento_cancelado_usuario',
      idUsuario,
      null,
      JSON.stringify({ status: 'aprovado' }),
      JSON.stringify({ status: 'cancelado', motivo }),
      null
    );
  }

  static async cancelarPeloLaboratorio(idAgendamento: string, motivo: string, idUsuario: string): Promise<void> {
    if (!motivo || motivo.trim().length === 0) {
      throw new Error('Motivo é obrigatório para cancelamento.');
    }

    const agendamento = await queryRows<Agendamento>(
      "SELECT * FROM agendamentos WHERE id = ? AND status IN ('solicitado', 'aprovado')",
      [idAgendamento]
    );
    if (agendamento.length === 0) {
      throw new Error('Agendamento não encontrado ou não pode ser cancelado.');
    }

    const statusAnterior = agendamento[0].status;
    const agora = nowISO();

    await executeSql(
      "UPDATE agendamentos SET status = 'cancelado', motivo_cancelamento = ?, data_cancelamento = ? WHERE id = ?",
      [motivo.trim(), agora, idAgendamento]
    );

    await LogService.registrar(
      'agendamento',
      'agendamento_cancelado_laboratorio',
      idUsuario,
      agendamento[0].id_usuario_solicitante,
      JSON.stringify({ status: statusAnterior }),
      JSON.stringify({ status: 'cancelado', motivo }),
      null
    );
  }

  static async registrarComparecimento(
    idData: string,
    compareceu: boolean,
    observacao?: string,
    idUsuario?: string
  ): Promise<void> {
    const dataAgendamento = await queryRows<{ id_agendamento: string; data_agendada: string }>(
      'SELECT * FROM agendamento_datas WHERE id = ?',
      [idData]
    );
    if (dataAgendamento.length === 0) {
      throw new Error('Data de agendamento não encontrada.');
    }

    const statusComparecimento: ComparecimentoStatus = compareceu ? 'compareceu' : 'nao_compareceu';

    await executeSql(
      'UPDATE agendamento_datas SET comparecimento = ?, observacao_finalizacao = ? WHERE id = ?',
      [statusComparecimento, observacao || null, idData]
    );

    if (idUsuario) {
      await LogService.registrar(
        'agendamento',
        'agendamento_data_comparecimento',
        idUsuario,
        null,
        JSON.stringify({ comparecimento: null }),
        JSON.stringify({ comparecimento: statusComparecimento }),
        { data: dataAgendamento[0].data_agendada }
      );
    }

    await AgendamentoService.verificarFinalizacao(dataAgendamento[0].id_agendamento, idUsuario);
  }

  static async verificarFinalizacao(idAgendamento: string, idUsuario?: string): Promise<void> {
    const pendentes = await queryRows<{ total: number }>(
      'SELECT COUNT(*) as total FROM agendamento_datas WHERE id_agendamento = ? AND comparecimento IS NULL',
      [idAgendamento]
    );

    if (pendentes.length > 0 && pendentes[0].total === 0) {
      const agora = nowISO();

      await executeSql(
        "UPDATE agendamentos SET status = 'finalizado', data_finalizacao = ? WHERE id = ?",
        [agora, idAgendamento]
      );

      if (idUsuario) {
        await LogService.registrar(
          'agendamento',
          'agendamento_finalizado',
          idUsuario,
          null,
          JSON.stringify({ status: 'aprovado' }),
          JSON.stringify({ status: 'finalizado' }),
          null
        );
      }
    }
  }

  static async verificarConflito(
    data: string,
    horaInicio: string,
    horaFim: string,
    capacidade: number
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(DISTINCT ad.id_agendamento) as total
      FROM agendamento_datas ad
      INNER JOIN agendamentos a ON ad.id_agendamento = a.id
      WHERE ad.data_agendada = ?
        AND a.status = 'aprovado'
        AND (
          (ad.hora_inicio < ? AND ad.hora_fim > ?)
          OR
          (ad.hora_inicio >= ? AND ad.hora_inicio < ?)
        )
    `;

    const rows = await queryRows<{ total: number }>(query, [data, horaFim, horaInicio, horaInicio, horaFim]);
    const total = rows.length > 0 ? rows[0].total : 0;

    return total < capacidade;
  }

  static async obterProximoAgendamento(idUsuario: string): Promise<{ data: string; horaInicio: string; horaFim: string; pesquisa: string; tecnico: string } | null> {
    const hoje = new Date().toISOString().split('T')[0];
    const rows = await queryRows<{ data_agendada: string; hora_inicio: string; hora_fim: string; pesquisa: string; tecnico: string }>(
      `SELECT ad.data_agendada, ad.hora_inicio, ad.hora_fim,
              p.titulo AS pesquisa,
              COALESCE(u.nome || ' ' || u.sobrenome, '—') AS tecnico
       FROM agendamento_datas ad
       INNER JOIN agendamentos a ON ad.id_agendamento = a.id
       INNER JOIN pesquisas p ON a.id_pesquisa = p.id
       LEFT JOIN usuarios u ON a.id_tecnico_responsavel = u.id
       WHERE a.id_usuario_solicitante = ?
         AND a.status = 'aprovado'
         AND ad.data_agendada >= ?
       ORDER BY ad.data_agendada ASC, ad.hora_inicio ASC
       LIMIT 1`,
      [idUsuario, hoje]
    );
    if (rows.length === 0) return null;
    return { data: rows[0].data_agendada, horaInicio: rows[0].hora_inicio, horaFim: rows[0].hora_fim, pesquisa: rows[0].pesquisa, tecnico: rows[0].tecnico };
  }

  static async contarSolicitacoesPendentes(): Promise<number> {
    const rows = await queryRows<{ total: number }>(
      "SELECT COUNT(*) as total FROM agendamentos WHERE status = 'solicitado'"
    );
    return rows.length > 0 ? rows[0].total : 0;
  }

  static async obterResumoDoDia(): Promise<{ totalAgendamentos: number; tecnicoPlantao: string | null }> {
    const hoje = new Date().toISOString().split('T')[0];
    const countRows = await queryRows<{ total: number }>(
      `SELECT COUNT(*) as total FROM agendamento_datas ad
       INNER JOIN agendamentos a ON ad.id_agendamento = a.id
       WHERE ad.data_agendada = ? AND a.status = 'aprovado'`,
      [hoje]
    );
    const total = countRows.length > 0 ? countRows[0].total : 0;

    const tecRows = await queryRows<{ nome: string }>(
      `SELECT u.nome || ' ' || u.sobrenome AS nome
       FROM agendamento_datas ad
       INNER JOIN agendamentos a ON ad.id_agendamento = a.id
       INNER JOIN usuarios u ON a.id_tecnico_responsavel = u.id
       WHERE ad.data_agendada = ? AND a.status = 'aprovado'
       GROUP BY a.id_tecnico_responsavel
       ORDER BY COUNT(*) DESC LIMIT 1`,
      [hoje]
    );
    return { totalAgendamentos: total, tecnicoPlantao: tecRows.length > 0 ? tecRows[0].nome : null };
  }
}
