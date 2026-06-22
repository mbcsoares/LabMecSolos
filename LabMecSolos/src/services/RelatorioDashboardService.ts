import { getDatabase } from './DatabaseService';
import { LogService } from './LogService';
import { gerarPdf, gerarPdfFallback, criarCabecalho, criarTabelaResumo, criarTabelaDados, PRIMARY_COLOR, MEDIUM_COLOR } from './PdfBaseService';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

export class RelatorioDashboardService {
  static async gerarRelatorioCalibracoes(idUsuario: string): Promise<string> {
    const db = await getDatabase();

    const result = await db.query(`
      SELECT i.nome, i.codigo, e.numero_serie, e.marca, e.modelo,
             e.data_ultima_calibracao, e.frequencia_calibracao_dias, e.estado,
             CAST(julianday(e.data_ultima_calibracao, '+' || e.frequencia_calibracao_dias || ' days') - julianday('now') AS INTEGER) AS dias_restantes
      FROM equipamentos e
      INNER JOIN itens i ON e.id = i.id
      WHERE i.status = 'ativo' AND e.data_ultima_calibracao IS NOT NULL AND e.frequencia_calibracao_dias IS NOT NULL
      ORDER BY dias_restantes ASC
    `);

    const equipamentos = (result.values || []) as Record<string, unknown>[];
    const total = equipamentos.length;
    const vencidos = equipamentos.filter((e) => (e.dias_restantes as number) <= 0).length;
    const proximos = equipamentos.filter((e) => (e.dias_restantes as number) > 0 && (e.dias_restantes as number) <= 30).length;
    const emDia = total - vencidos - proximos;

    const content: Content[] = [
      ...criarCabecalho('Relatorio de Calibracoes'),
      { text: 'Resumo', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
      criarTabelaResumo([
        ['Total de Equipamentos Calibraveis', total.toString()],
        ['Calibracoes em Dia', emDia.toString()],
        ['Calibracoes Vencidas', vencidos.toString()],
        ['Proximos 30 Dias', proximos.toString()],
      ]),
    ];

    if (equipamentos.length > 0) {
      content.push(
        { text: 'Equipamentos', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Nome', 'Codigo', 'Ultima Calibracao', 'Frequencia (dias)', 'Dias Restantes'],
          equipamentos.map((e) => [
            e.nome as string,
            e.codigo as string,
            e.data_ultima_calibracao
              ? new Date(e.data_ultima_calibracao as string).toLocaleDateString('pt-BR')
              : '\u2014',
            String(e.frequencia_calibracao_dias as number),
            String(e.dias_restantes as number),
          ])
        ),
      );
    }

    const docDefinition: TDocumentDefinitions = {
      defaultStyle: { font: 'Roboto' },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content,
    };

    try {
      const dataUrl = await gerarPdf(docDefinition);
      await LogService.registrar('estoque', 'relatorio_emitido', idUsuario, null, null,
        JSON.stringify({ tipo_relatorio: 'calibracoes' }), null);
      return dataUrl;
    } catch {
      return gerarPdfFallback('Relatorio de Calibracoes', {
        'Total': String(total),
        'Vencidas': String(vencidos),
        'Proximos 30 dias': String(proximos),
      });
    }
  }

  static async gerarRelatorioOcorrencias(dataInicio: string, dataFim: string, idUsuario: string): Promise<string> {
    const db = await getDatabase();

    const result = await db.query(`
      SELECT o.*, i.nome AS nome_item, i.codigo AS codigo_item,
             u_ab.nome || ' ' || u_ab.sobrenome AS nome_abertura,
             u_resp.nome || ' ' || u_resp.sobrenome AS nome_responsavel
      FROM ocorrencias o
      LEFT JOIN itens i ON o.id_item = i.id
      INNER JOIN usuarios u_ab ON o.id_usuario_abertura = u_ab.id
      LEFT JOIN usuarios u_resp ON o.id_usuario_responsavel = u_resp.id
      WHERE o.data_abertura >= ? AND o.data_abertura <= ?
      ORDER BY o.data_abertura DESC
    `, [dataInicio, dataFim]);

    const ocorrencias = (result.values || []) as Record<string, unknown>[];
    const total = ocorrencias.length;
    const abertas = ocorrencias.filter((o) => o.status === 'aberta').length;
    const emAnalise = ocorrencias.filter((o) => o.status === 'em_analise').length;
    const resolvidas = ocorrencias.filter((o) => o.status === 'resolvida').length;
    const fechadas = ocorrencias.filter((o) => o.status === 'fechada').length;

    const dataInicioBR = new Date(dataInicio).toLocaleDateString('pt-BR');
    const dataFimBR = new Date(dataFim).toLocaleDateString('pt-BR');

    const content: Content[] = [
      ...criarCabecalho('Relatorio de Ocorrencias', `Periodo: ${dataInicioBR} a ${dataFimBR}`),
      { text: 'Resumo', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
      criarTabelaResumo([
        ['Total de Ocorrencias', total.toString()],
        ['Abertas', abertas.toString()],
        ['Em Analise', emAnalise.toString()],
        ['Resolvidas', resolvidas.toString()],
        ['Fechadas', fechadas.toString()],
      ]),
    ];

    if (ocorrencias.length > 0) {
      content.push(
        { text: 'Ocorrencias', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Data', 'Titulo / Item', 'Tipo', 'Status'],
          ocorrencias.map((o) => [
            new Date(o.data_abertura as string).toLocaleDateString('pt-BR'),
            `${o.titulo as string}${o.nome_item ? ` (${o.nome_item as string})` : ''}`,
            (o.tipo as string).replace(/_/g, ' '),
            (o.status as string).replace(/_/g, ' '),
          ])
        ),
      );
    } else {
      content.push({ text: '\nNenhuma ocorrencia registrada no periodo.', fontSize: 11, color: MEDIUM_COLOR });
    }

    const docDefinition: TDocumentDefinitions = {
      defaultStyle: { font: 'Roboto' },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content,
    };

    try {
      const dataUrl = await gerarPdf(docDefinition);
      await LogService.registrar('estoque', 'relatorio_emitido', idUsuario, null, null,
        JSON.stringify({ tipo_relatorio: 'ocorrencias', periodo: `${dataInicio} a ${dataFim}` }), null);
      return dataUrl;
    } catch {
      return gerarPdfFallback('Relatorio de Ocorrencias', {
        'Total': String(total),
        'Abertas': String(abertas),
        'Em Analise': String(emAnalise),
        'Resolvidas': String(resolvidas),
      });
    }
  }

  static async gerarRelatorioAgendamentos(dataInicio: string, dataFim: string, idUsuario: string): Promise<string> {
    const db = await getDatabase();

    const result = await db.query(`
      SELECT a.*, u.nome || ' ' || u.sobrenome AS nome_solicitante,
             p.titulo AS pesquisa_titulo, COUNT(ad.id) AS total_datas
      FROM agendamentos a
      INNER JOIN usuarios u ON a.id_usuario_solicitante = u.id
      INNER JOIN pesquisas p ON a.id_pesquisa = p.id
      LEFT JOIN agendamento_datas ad ON a.id = ad.id_agendamento
      WHERE a.data_solicitacao >= ? AND a.data_solicitacao <= ?
      GROUP BY a.id
      ORDER BY a.data_solicitacao DESC
    `, [dataInicio, dataFim]);

    const agendamentos = (result.values || []) as Record<string, unknown>[];
    const total = agendamentos.length;
    const aprovados = agendamentos.filter((a) => a.status === 'aprovado').length;
    const finalizados = agendamentos.filter((a) => a.status === 'finalizado').length;
    const negados = agendamentos.filter((a) => a.status === 'negado').length;
    const cancelados = agendamentos.filter((a) => a.status === 'cancelado').length;

    const dataInicioBR = new Date(dataInicio).toLocaleDateString('pt-BR');
    const dataFimBR = new Date(dataFim).toLocaleDateString('pt-BR');

    const content: Content[] = [
      ...criarCabecalho('Relatorio de Agendamentos', `Periodo: ${dataInicioBR} a ${dataFimBR}`),
      { text: 'Resumo', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
      criarTabelaResumo([
        ['Total de Agendamentos', total.toString()],
        ['Aprovados', aprovados.toString()],
        ['Finalizados', finalizados.toString()],
        ['Negados', negados.toString()],
        ['Cancelados', cancelados.toString()],
      ]),
    ];

    if (agendamentos.length > 0) {
      content.push(
        { text: 'Agendamentos', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Data Solicitacao', 'Solicitante / Pesquisa', 'Status', 'Datas'],
          agendamentos.map((a) => [
            new Date(a.data_solicitacao as string).toLocaleDateString('pt-BR'),
            `${a.nome_solicitante as string} \u2014 ${a.pesquisa_titulo as string}`,
            (a.status as string).replace(/_/g, ' '),
            String(a.total_datas as number),
          ])
        ),
      );
    } else {
      content.push({ text: '\nNenhum agendamento registrado no periodo.', fontSize: 11, color: MEDIUM_COLOR });
    }

    const docDefinition: TDocumentDefinitions = {
      defaultStyle: { font: 'Roboto' },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content,
    };

    try {
      const dataUrl = await gerarPdf(docDefinition);
      await LogService.registrar('agendamento', 'relatorio_emitido', idUsuario, null, null,
        JSON.stringify({ tipo_relatorio: 'agendamentos', periodo: `${dataInicio} a ${dataFim}` }), null);
      return dataUrl;
    } catch {
      return gerarPdfFallback('Relatorio de Agendamentos', {
        'Total': String(total),
        'Aprovados': String(aprovados),
        'Finalizados': String(finalizados),
        'Negados': String(negados),
        'Cancelados': String(cancelados),
      });
    }
  }

  static async gerarRelatorioOcupacao(dataInicio: string, dataFim: string, idUsuario: string): Promise<string> {
    const db = await getDatabase();

    const result = await db.query(`
      SELECT cd.data_agendada, cd.hora_inicio, cd.hora_fim,
             cm.capacidade AS capacidade_dia,
             u.nome || ' ' || u.sobrenome AS nome_solicitante,
             p.titulo AS pesquisa_titulo, cd.comparecimento
      FROM agendamento_datas cd
      INNER JOIN agendamentos a ON cd.id_agendamento = a.id
      INNER JOIN usuarios u ON a.id_usuario_solicitante = u.id
      INNER JOIN pesquisas p ON a.id_pesquisa = p.id
      LEFT JOIN calendario_dias cm ON cd.data_agendada = cm.data
      LEFT JOIN calendario_mensal cal ON cm.id_calendario = cal.id
      WHERE a.status = 'aprovado' AND cd.data_agendada >= ? AND cd.data_agendada <= ?
      ORDER BY cd.data_agendada ASC, cd.hora_inicio ASC
    `, [dataInicio, dataFim]);

    const datas = (result.values || []) as Record<string, unknown>[];

    const diasMap = new Map<string, {
      data: string;
      capacidade: number;
      agendamentos: number;
      compareceram: number;
      naoCompareceram: number;
      horasOcupadas: number;
    }>();

    for (const d of datas) {
      const data = d.data_agendada as string;
      if (!diasMap.has(data)) {
        diasMap.set(data, {
          data,
          capacidade: (d.capacidade_dia as number) || 0,
          agendamentos: 0,
          compareceram: 0,
          naoCompareceram: 0,
          horasOcupadas: 0,
        });
      }
      const dia = diasMap.get(data)!;
      dia.agendamentos++;
      if (d.comparecimento === 'compareceu') dia.compareceram++;
      if (d.comparecimento === 'nao_compareceu') dia.naoCompareceram++;

      const [hIni, mIni] = ((d.hora_inicio as string) || '00:00').split(':').map(Number);
      const [hFim, mFim] = ((d.hora_fim as string) || '00:00').split(':').map(Number);
      dia.horasOcupadas += (hFim && hIni !== undefined ? (hFim * 60 + (mFim || 0)) - (hIni * 60 + (mIni || 0)) : 0) / 60;
    }

    const diasArray = Array.from(diasMap.values());
    const dataInicioBR = new Date(dataInicio).toLocaleDateString('pt-BR');
    const dataFimBR = new Date(dataFim).toLocaleDateString('pt-BR');

    const totalCompareceram = diasArray.reduce((s, d) => s + d.compareceram, 0);
    const totalNaoCompareceram = diasArray.reduce((s, d) => s + d.naoCompareceram, 0);
    const totalAgendamentos = diasArray.reduce((s, d) => s + d.agendamentos, 0);
    const totalHoras = diasArray.reduce((s, d) => s + d.horasOcupadas, 0);

    const content: Content[] = [
      ...criarCabecalho('Relatorio de Ocupacao', `Periodo: ${dataInicioBR} a ${dataFimBR}`),
      { text: 'Resumo', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
      criarTabelaResumo([
        ['Dias com Agendamentos', diasArray.length.toString()],
        ['Total de Agendamentos no Periodo', totalAgendamentos.toString()],
        ['Compareceram', totalCompareceram.toString()],
        ['Nao Compareceram', totalNaoCompareceram.toString()],
        ['Horas Ocupadas', totalHoras.toFixed(1)],
      ]),
    ];

    if (diasArray.length > 0) {
      content.push(
        { text: 'Ocupacao por Dia', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Data', 'Agendamentos', 'Compareceram', 'Nao Compareceram', 'Horas'],
          diasArray.map((d) => [
            new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR'),
            d.agendamentos.toString(),
            d.compareceram.toString(),
            d.naoCompareceram.toString(),
            d.horasOcupadas.toFixed(1),
          ])
        ),
      );
    } else {
      content.push({ text: '\nNenhum agendamento aprovado no periodo.', fontSize: 11, color: MEDIUM_COLOR });
    }

    const docDefinition: TDocumentDefinitions = {
      defaultStyle: { font: 'Roboto' },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content,
    };

    try {
      const dataUrl = await gerarPdf(docDefinition);
      await LogService.registrar('agendamento', 'relatorio_emitido', idUsuario, null, null,
        JSON.stringify({ tipo_relatorio: 'ocupacao', periodo: `${dataInicio} a ${dataFim}` }), null);
      return dataUrl;
    } catch {
      return gerarPdfFallback('Relatorio de Ocupacao', {
        'Dias': String(diasArray.length),
        'Total Agendamentos': String(totalAgendamentos),
        'Compareceram': String(totalCompareceram),
        'Horas Ocupadas': totalHoras.toFixed(1),
      });
    }
  }
}
