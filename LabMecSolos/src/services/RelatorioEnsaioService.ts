import { LogService } from './LogService';
import { gerarPdf, gerarPdfFallback, criarCabecalho, criarTabelaResumo, criarTabelaDados, PRIMARY_COLOR } from './PdfBaseService';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { EnsaioDetalhado, DeterminacaoTeorUmidade } from '../models/types';

export class RelatorioEnsaioService {
  static async gerarRelatorioEnsaio(ensaio: EnsaioDetalhado, determinacoes?: DeterminacaoTeorUmidade[], idUsuario?: string): Promise<string> {
    const content: Content[] = [
      ...criarCabecalho('Relatorio de Ensaio'),
      { text: 'Dados do Ensaio', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
      criarTabelaResumo([
        ['Tipo de Ensaio', ensaio.tipo_ensaio],
        ['Norma de Referencia', ensaio.norma_referencia || '\u2014'],
        ['Executante', ensaio.nome_executante || '\u2014'],
        ['Status', ensaio.status],
        ['Data de Inicio', ensaio.data_inicio ? new Date(ensaio.data_inicio).toLocaleDateString('pt-BR') : '\u2014'],
        ['Data de Fim', ensaio.data_fim ? new Date(ensaio.data_fim).toLocaleDateString('pt-BR') : '\u2014'],
        ['Temperatura Ambiente', ensaio.temperatura_ambiente ? `${ensaio.temperatura_ambiente}\u00B0C` : '\u2014'],
        ['Umidade Ambiente', ensaio.umidade_ambiente ? `${ensaio.umidade_ambiente}%` : '\u2014'],
      ]),
    ];

    if (ensaio.tipo_ensaio === 'teor_umidade' && determinacoes && determinacoes.length > 0) {
      content.push(
        { text: 'Resultados \u2014 Teor de Umidade (ABNT NBR 6457)', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['N\u00BA', 'Tara (g)', 'M1 (g)', 'M2 (g)', 'h (%)', 'fc'],
          determinacoes.map((d) => [
            d.numero_determinacao.toString(),
            d.tara.toFixed(2),
            d.m1.toFixed(2),
            d.m2.toFixed(2),
            d.h_calculado?.toFixed(2) ?? '\u2014',
            d.fc_individual?.toFixed(4) ?? '\u2014',
          ])
        ),
        { text: 'Sumario', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaResumo([
          ['h medio (%)', ensaio.h_medio?.toFixed(2) ?? '\u2014'],
          ['Desvio Padrao', ensaio.desvio_padrao?.toFixed(4) ?? '\u2014'],
          ['fc medio', ensaio.fc_medio?.toFixed(4) ?? '\u2014'],
          ['Numero de Determinacoes', determinacoes.length.toString()],
        ]),
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
      if (idUsuario) {
        await LogService.registrar('ensaios', 'relatorio_ensaio_emitido', idUsuario, null, null,
          JSON.stringify({ id_ensaio: ensaio.id }), null);
      }
      return dataUrl;
    } catch {
      return gerarPdfFallback('Relatorio de Ensaio', {
        'Tipo de Ensaio': ensaio.tipo_ensaio,
        'Status': ensaio.status,
        'Executante': ensaio.nome_executante || '-',
        'Determinacoes': determinacoes ? String(determinacoes.length) : '0',
      });
    }
  }

  static async gerarRelatorioPesquisa(pesquisa: any, programas: any[], ensaios: EnsaioDetalhado[], idUsuario?: string): Promise<string> {
    const content: Content[] = [
      ...criarCabecalho('Relatorio Consolidado de Pesquisa'),
      { text: 'Dados da Pesquisa', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
      criarTabelaResumo([
        ['Titulo', pesquisa.titulo],
        ['Contexto', pesquisa.contexto],
        ['Responsavel', pesquisa.nome_responsavel || '\u2014'],
        ['Status', pesquisa.status],
        ['Data de Criacao', new Date(pesquisa.data_criacao).toLocaleDateString('pt-BR')],
        ['Total de Programas', programas.length.toString()],
        ['Total de Ensaios', ensaios.length.toString()],
      ]),
    ];

    if (ensaios.length > 0) {
      content.push(
        { text: 'Resumo dos Ensaios', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Tipo de Ensaio', 'Norma', 'Status', 'Data'],
          ensaios.map((e) => [
            e.tipo_ensaio,
            e.norma_referencia || '\u2014',
            e.status,
            e.data_fim ? new Date(e.data_fim).toLocaleDateString('pt-BR') : '\u2014',
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
      if (idUsuario) {
        await LogService.registrar('ensaios', 'relatorio_pesquisa_emitido', idUsuario, null, null,
          JSON.stringify({ id_pesquisa: pesquisa.id }), null);
      }
      return dataUrl;
    } catch {
      return gerarPdfFallback('Relatorio de Pesquisa', {
        'Titulo': pesquisa.titulo,
        'Status': pesquisa.status,
        'Programas': String(programas.length),
        'Ensaios': String(ensaios.length),
      });
    }
  }
}
