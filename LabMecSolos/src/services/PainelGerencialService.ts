import { queryRows } from './DatabaseService';
import type { PeriodoFiltro, IndicadoresVisaoGeral, DadosPesquisasEnsaios, DadosUsoLaboratorio, DadosInventarioResumo } from '../models/types';

export class PainelGerencialService {
  static async obterIndicadoresVisaoGeral(periodo: PeriodoFiltro): Promise<IndicadoresVisaoGeral> {
    const { dataInicio, dataFim } = periodo;

    const pesquisasAtivas = await queryRows<{ total: number }>(
      "SELECT COUNT(*) as total FROM pesquisas WHERE status = 'em_andamento'"
    );

    const ensaiosPeriodo = await queryRows<{ total: number }>(
      'SELECT COUNT(*) as total FROM ensaios WHERE data_criacao BETWEEN ? AND ?',
      [dataInicio, dataFim]
    );

    const comparecimento = await queryRows<{ compareceram: number; total_avaliados: number }>(
      `SELECT
         COUNT(CASE WHEN ad.comparecimento = 'compareceu' THEN 1 END) as compareceram,
         COUNT(CASE WHEN ad.comparecimento IS NOT NULL THEN 1 END) as total_avaliados
       FROM agendamento_datas ad
       INNER JOIN agendamentos a ON ad.id_agendamento = a.id
       WHERE ad.data_agendada BETWEEN ? AND ?
         AND a.status IN ('aprovado', 'finalizado')`,
      [dataInicio, dataFim]
    );

    const equipamentosCriticos = await queryRows<{ total: number }>(
      `SELECT COUNT(*) as total FROM equipamentos e
       INNER JOIN itens i ON e.id = i.id
       WHERE i.status = 'ativo' AND e.estado IN ('inoperante', 'calibracao_vencida')`
    );

    const ocorrenciasAbertas = await queryRows<{ total: number }>(
      "SELECT COUNT(*) as total FROM ocorrencias WHERE status = 'aberta'"
    );

    const ensaiosPorMes = await queryRows<{ mes: string; total: number }>(
      `SELECT SUBSTR(data_criacao, 1, 7) as mes, COUNT(*) as total
       FROM ensaios WHERE data_criacao BETWEEN ? AND ?
       GROUP BY mes ORDER BY mes ASC`,
      [dataInicio, dataFim]
    );

    const dadosComparecimento = await queryRows<{ comparecimento: string; total: number }>(
      `SELECT ad.comparecimento, COUNT(*) as total
       FROM agendamento_datas ad
       INNER JOIN agendamentos a ON ad.id_agendamento = a.id
       WHERE ad.data_agendada BETWEEN ? AND ?
         AND a.status IN ('aprovado', 'finalizado')
         AND ad.comparecimento IS NOT NULL
       GROUP BY ad.comparecimento`,
      [dataInicio, dataFim]
    );

    const pesquisasPorContexto = await queryRows<{ contexto: string; total: number }>(
      `SELECT contexto, COUNT(*) as total
       FROM pesquisas WHERE data_criacao BETWEEN ? AND ?
       GROUP BY contexto ORDER BY total DESC`,
      [dataInicio, dataFim]
    );

    const totalComp = comparecimento.length > 0 ? comparecimento[0].compareceram : 0;
    const totalAv = comparecimento.length > 0 ? comparecimento[0].total_avaliados : 0;

    return {
      pesquisasAtivas: pesquisasAtivas.length > 0 ? pesquisasAtivas[0].total : 0,
      ensaiosPeriodo: ensaiosPeriodo.length > 0 ? ensaiosPeriodo[0].total : 0,
      ocupacaoMedia: 0,
      taxaComparecimento: totalAv > 0 ? Math.round((totalComp / totalAv) * 100) : 0,
      equipamentosCriticos: equipamentosCriticos.length > 0 ? equipamentosCriticos[0].total : 0,
      ocorrenciasAbertas: ocorrenciasAbertas.length > 0 ? ocorrenciasAbertas[0].total : 0,
      ensaiosPorMes,
      comparecimento: dadosComparecimento,
      pesquisasPorContexto,
    };
  }

  static async obterDadosPesquisasEnsaios(periodo: PeriodoFiltro): Promise<DadosPesquisasEnsaios> {
    const { dataInicio, dataFim } = periodo;

    const ensaiosPorTipo = await queryRows<{ tipo_ensaio: string; total: number }>(
      `SELECT tipo_ensaio, COUNT(*) as total FROM ensaios
       WHERE data_criacao BETWEEN ? AND ?
       GROUP BY tipo_ensaio ORDER BY total DESC`,
      [dataInicio, dataFim]
    );

    const pesquisasRecentes = await queryRows(
      `SELECT * FROM pesquisas WHERE data_criacao BETWEEN ? AND ?
       ORDER BY data_criacao DESC LIMIT 10`,
      [dataInicio, dataFim]
    );

    const resultadosEnsaios = await queryRows(
      `SELECT p.titulo AS pesquisa_titulo, ab.numero_identificacao_campo AS numero_amostra,
        e.tipo_ensaio, etu.h_medio, etu.desvio_padrao, e.data_fim
       FROM ensaios_teor_umidade etu
       INNER JOIN ensaios e ON etu.id = e.id
       INNER JOIN amostras_ensaiadas ae ON e.id_amostra_ensaiada = ae.id
       INNER JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id
       INNER JOIN amostras_brutas ab ON ap.id_amostra_bruta = ab.id
       INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id
       INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id
       INNER JOIN pesquisas p ON prog.id_pesquisa = p.id
       WHERE e.status = 'concluido' AND e.data_fim BETWEEN ? AND ?
       ORDER BY e.data_fim DESC`,
      [dataInicio, dataFim]
    );

    return { ensaiosPorTipo, pesquisasRecentes, resultadosEnsaios };
  }

  static async obterDadosUsoLaboratorio(periodo: PeriodoFiltro): Promise<DadosUsoLaboratorio> {
    const { dataInicio, dataFim } = periodo;

    const ocupacaoPorDiaSemana = await queryRows<{ dia_semana: string; total: number; ordem: number }>(
      `SELECT
         CASE CAST(strftime('%w', ad.data_agendada) AS INTEGER)
           WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça'
           WHEN 3 THEN 'Quarta' WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta'
           WHEN 6 THEN 'Sábado'
         END AS dia_semana,
         COUNT(DISTINCT ad.id_agendamento) as total,
         CAST(strftime('%w', ad.data_agendada) AS INTEGER) as ordem
       FROM agendamento_datas ad
       INNER JOIN agendamentos a ON ad.id_agendamento = a.id
       WHERE ad.data_agendada BETWEEN ? AND ?
         AND a.status IN ('aprovado', 'finalizado')
       GROUP BY dia_semana, ordem ORDER BY ordem ASC`,
      [dataInicio, dataFim]
    );

    const usuariosFrequentes = await queryRows<{ nome: string; total: number }>(
      `SELECT u.nome || ' ' || u.sobrenome AS nome, COUNT(DISTINCT a.id) as total
       FROM agendamentos a
       INNER JOIN usuarios u ON a.id_usuario_solicitante = u.id
       INNER JOIN agendamento_datas ad ON a.id = ad.id_agendamento
       WHERE ad.data_agendada BETWEEN ? AND ? AND a.status IN ('aprovado', 'finalizado')
       GROUP BY u.id ORDER BY total DESC LIMIT 10`,
      [dataInicio, dataFim]
    );

    const tecnicosSupervisoes = await queryRows<{ nome: string; total: number }>(
      `SELECT u.nome || ' ' || u.sobrenome AS nome, COUNT(DISTINCT a.id) as total
       FROM agendamentos a
       INNER JOIN usuarios u ON a.id_tecnico_responsavel = u.id
       INNER JOIN agendamento_datas ad ON a.id = ad.id_agendamento
       WHERE ad.data_agendada BETWEEN ? AND ?
         AND a.status IN ('aprovado', 'finalizado')
         AND a.id_tecnico_responsavel IS NOT NULL
       GROUP BY u.id ORDER BY total DESC LIMIT 10`,
      [dataInicio, dataFim]
    );

    return {
      ocupacaoPorDiaSemana,
      usuariosFrequentes,
      tecnicosSupervisoes,
      estatisticas: await PainelGerencialService.obterEstatisticasAgendamento(periodo),
    };
  }

  private static async obterEstatisticasAgendamento(periodo: PeriodoFiltro): Promise<any> {
    const { dataInicio, dataFim } = periodo;
    const rows = await queryRows<any>(
      `SELECT
         COUNT(DISTINCT a.id) as total_agendamentos,
         COUNT(ad.id) as total_datas,
         COUNT(CASE WHEN ad.comparecimento = 'compareceu' THEN 1 END) as compareceram,
         COUNT(CASE WHEN ad.comparecimento = 'nao_compareceu' THEN 1 END) as nao_compareceram,
         COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END) as cancelados
       FROM agendamentos a
       LEFT JOIN agendamento_datas ad ON a.id = ad.id_agendamento
         AND ad.data_agendada BETWEEN ? AND ?
       WHERE a.data_solicitacao BETWEEN ? AND ?`,
      [dataInicio, dataFim, dataInicio, dataFim]
    );

    const dados = rows[0] || {};
    const totalAvaliados = (dados.compareceram || 0) + (dados.nao_compareceram || 0);

    return {
      totalAgendamentos: dados.total_agendamentos || 0,
      totalDatas: dados.total_datas || 0,
      compareceram: dados.compareceram || 0,
      naoCompareceram: dados.nao_compareceram || 0,
      cancelados: dados.cancelados || 0,
      taxaComparecimento: totalAvaliados > 0 ? Math.round((dados.compareceram / totalAvaliados) * 100) : 0,
      ocupacaoMedia: 0,
    };
  }

  static async obterDadosInventarioResumo(): Promise<DadosInventarioResumo> {
    const equipamentosPorEstado = await queryRows<{ estado: string; total: number }>(
      `SELECT e.estado, COUNT(*) as total FROM equipamentos e
       INNER JOIN itens i ON e.id = i.id WHERE i.status = 'ativo'
       GROUP BY e.estado ORDER BY total DESC`
    );

    const equipamentosCalibracaoVencida = await queryRows(
      `SELECT i.nome, e.data_ultima_calibracao,
         CAST(julianday('now') - julianday(e.data_ultima_calibracao, '+' || e.frequencia_calibracao_dias || ' days') AS INTEGER) AS dias_vencido,
         e.estado
       FROM equipamentos e
       INNER JOIN itens i ON e.id = i.id
       WHERE i.status = 'ativo'
         AND e.estado IN ('calibracao_vencida', 'inoperante')
         AND e.data_ultima_calibracao IS NOT NULL
         AND e.frequencia_calibracao_dias IS NOT NULL
       ORDER BY dias_vencido DESC`
    );

    const materiaisEstoqueBaixo = await queryRows(
      `SELECT i.nome, m.quantidade_atual, m.ponto_pedido, m.unidade_medida
       FROM materiais m INNER JOIN itens i ON m.id = i.id
       WHERE i.status = 'ativo' AND m.ponto_pedido IS NOT NULL AND m.quantidade_atual <= m.ponto_pedido
       UNION ALL
       SELECT i.nome, u.quantidade_atual, u.ponto_pedido, u.unidade_medida
       FROM utensilios u INNER JOIN itens i ON u.id = i.id
       WHERE i.status = 'ativo' AND u.ponto_pedido IS NOT NULL AND u.quantidade_atual <= u.ponto_pedido
       ORDER BY nome ASC`
    );

    const ocorrenciasAbertasResumo = await queryRows(
      `SELECT * FROM ocorrencias WHERE status = 'aberta' ORDER BY data_abertura DESC`
    );

    return {
      equipamentosPorEstado,
      equipamentosCalibracaoVencida,
      materiaisEstoqueBaixo,
      ocorrenciasAbertasResumo,
    };
  }
}
