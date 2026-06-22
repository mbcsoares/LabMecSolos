import { getDatabase } from './DatabaseService';
import { LogService } from './LogService';
import { gerarPdf, gerarPdfFallback, criarCabecalho, criarTabelaResumo, criarTabelaDados, PRIMARY_COLOR, MEDIUM_COLOR } from './PdfBaseService';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

const ESTADO_LABELS: Record<string, string> = {
  disponivel: 'Disponivel',
  em_manutencao: 'Em Manutencao',
  inoperante: 'Inoperante',
  calibracao_vencida: 'Calibracao Vencida',
};

export class RelatorioInventarioService {
  static async gerarRelatorioInventario(idUsuario: string): Promise<string> {
    const db = await getDatabase();

    const materiaisResult = await db.query(`
      SELECT i.nome, i.codigo, c.nome AS categoria, i.status, m.unidade_medida,
             m.quantidade_atual, m.ponto_pedido
      FROM itens i
      INNER JOIN materiais m ON i.id = m.id
      LEFT JOIN categorias_item c ON i.id_categoria = c.id
      WHERE i.status = 'ativo'
      ORDER BY i.nome ASC
    `);

    const utensiliosResult = await db.query(`
      SELECT i.nome, i.codigo, c.nome AS categoria, i.status, u.unidade_medida,
             u.quantidade_atual, u.ponto_pedido, u.local_armazenamento
      FROM itens i
      INNER JOIN utensilios u ON i.id = u.id
      LEFT JOIN categorias_item c ON i.id_categoria = c.id
      WHERE i.status = 'ativo'
      ORDER BY i.nome ASC
    `);

    const equipamentosResult = await db.query(`
      SELECT i.nome, i.codigo, c.nome AS categoria, e.estado, e.numero_serie, e.marca, e.modelo,
             e.data_ultima_calibracao, e.frequencia_calibracao_dias
      FROM itens i
      INNER JOIN equipamentos e ON i.id = e.id
      LEFT JOIN categorias_item c ON i.id_categoria = c.id
      WHERE i.status = 'ativo'
      ORDER BY i.nome ASC
    `);

    const alertasResult = await db.query(`
      SELECT i.nome, i.codigo, m.unidade_medida, m.quantidade_atual, m.ponto_pedido
      FROM itens i
      INNER JOIN materiais m ON i.id = m.id
      WHERE i.status = 'ativo' AND m.ponto_pedido IS NOT NULL AND m.quantidade_atual <= m.ponto_pedido
      UNION ALL
      SELECT i.nome, i.codigo, u.unidade_medida, u.quantidade_atual, u.ponto_pedido
      FROM itens i
      INNER JOIN utensilios u ON i.id = u.id
      WHERE i.status = 'ativo' AND u.ponto_pedido IS NOT NULL AND u.quantidade_atual <= u.ponto_pedido
    `);

    const materiais = (materiaisResult.values || []) as Record<string, unknown>[];
    const utensilios = (utensiliosResult.values || []) as Record<string, unknown>[];
    const equipamentos = (equipamentosResult.values || []) as Record<string, unknown>[];
    const alertas = (alertasResult.values || []) as Record<string, unknown>[];

    const content: Content[] = [
      ...criarCabecalho('Relatorio de Inventario'),
      { text: 'Resumo', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
      criarTabelaResumo([
        ['Total de Materiais', materiais.length.toString()],
        ['Total de Utensilios', utensilios.length.toString()],
        ['Total de Equipamentos', equipamentos.length.toString()],
        ['Alertas de Estoque Baixo', alertas.length.toString()],
      ]),
    ];

    if (materiais.length > 0) {
      content.push(
        { text: 'Materiais', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Nome', 'Codigo', 'Unidade', 'Qtd. Atual', 'Estoque Min.'],
          materiais.map((m) => [
            m.nome as string,
            m.codigo as string,
            m.unidade_medida as string,
            String(m.quantidade_atual as number),
            m.ponto_pedido ? String(m.ponto_pedido as number) : '\u2014',
          ])
        ),
      );
    }

    if (utensilios.length > 0) {
      content.push(
        { text: 'Utensilios', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Nome', 'Codigo', 'Unidade', 'Qtd. Atual'],
          utensilios.map((u) => [
            u.nome as string,
            u.codigo as string,
            u.unidade_medida as string,
            String(u.quantidade_atual as number),
          ])
        ),
      );
    }

    if (equipamentos.length > 0) {
      content.push(
        { text: 'Equipamentos', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Nome', 'Codigo', 'Estado', 'Ultima Calibracao'],
          equipamentos.map((e) => [
            e.nome as string,
            e.codigo as string,
            ESTADO_LABELS[e.estado as string] || (e.estado as string),
            e.data_ultima_calibracao
              ? new Date(e.data_ultima_calibracao as string).toLocaleDateString('pt-BR')
              : '\u2014',
          ])
        ),
      );
    }

    if (alertas.length > 0) {
      content.push(
        { text: 'Alertas de Estoque Baixo', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Item', 'Unidade', 'Qtd. Atual', 'Estoque Min.'],
          alertas.map((a) => [
            `${a.nome as string} (${a.codigo as string})`,
            a.unidade_medida as string,
            String(a.quantidade_atual as number),
            String(a.ponto_pedido as number),
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
        JSON.stringify({ tipo_relatorio: 'inventario' }), null);
      return dataUrl;
    } catch {
      return gerarPdfFallback('Relatorio de Inventario', {
        'Materiais': String(materiais.length),
        'Utensilios': String(utensilios.length),
        'Equipamentos': String(equipamentos.length),
        'Alertas': String(alertas.length),
      });
    }
  }

  static async gerarRelatorioMovimentacoes(dataInicio: string, dataFim: string, idUsuario: string): Promise<string> {
    const db = await getDatabase();

    const result = await db.query(`
      SELECT m.*, i.nome AS nome_item, i.codigo AS codigo_item, i.tipo AS tipo_item,
             u_reg.nome || ' ' || u_reg.sobrenome AS nome_registrador,
             u_sol.nome || ' ' || u_sol.sobrenome AS nome_solicitante,
             lm.numero_lote
      FROM movimentacoes_estoque m
      INNER JOIN itens i ON m.id_item = i.id
      INNER JOIN usuarios u_reg ON m.id_usuario_registrador = u_reg.id
      LEFT JOIN usuarios u_sol ON m.id_usuario_solicitante = u_sol.id
      LEFT JOIN lotes_material lm ON m.id_lote = lm.id
      WHERE m.data_movimentacao >= ? AND m.data_movimentacao <= ?
      ORDER BY m.data_movimentacao DESC
    `, [dataInicio, dataFim]);

    const movimentacoes = (result.values || []) as Record<string, unknown>[];

    const totalEntradas = movimentacoes
      .filter((m) => m.tipo === 'entrada')
      .reduce((s, m) => s + (m.quantidade as number), 0);
    const totalSaidas = movimentacoes
      .filter((m) => m.tipo === 'saida')
      .reduce((s, m) => s + (m.quantidade as number), 0);

    const dataInicioBR = new Date(dataInicio).toLocaleDateString('pt-BR');
    const dataFimBR = new Date(dataFim).toLocaleDateString('pt-BR');

    const content: Content[] = [
      ...criarCabecalho('Relatorio de Movimentacoes', `Periodo: ${dataInicioBR} a ${dataFimBR}`),
      { text: 'Resumo', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
      criarTabelaResumo([
        ['Total de Movimentacoes', movimentacoes.length.toString()],
        ['Total de Entradas', totalEntradas.toString()],
        ['Total de Saidas', totalSaidas.toString()],
        ['Saldo Liquido', (totalEntradas - totalSaidas).toString()],
      ]),
    ];

    if (movimentacoes.length > 0) {
      content.push(
        { text: 'Movimentacoes', fontSize: 14, bold: true, color: PRIMARY_COLOR, margin: [0, 14, 0, 8] },
        criarTabelaDados(
          ['Data', 'Item', 'Tipo', 'Qtd.', 'Lote', 'Registrador'],
          movimentacoes.map((m) => [
            new Date(m.data_movimentacao as string).toLocaleDateString('pt-BR'),
            `${m.nome_item as string} (${m.codigo_item as string})`,
            m.tipo === 'entrada' ? 'Entrada' : 'Saida',
            String(m.quantidade as number),
            (m.numero_lote as string) || '\u2014',
            (m.nome_registrador as string) || '\u2014',
          ])
        ),
      );
    } else {
      content.push({ text: '\nNenhuma movimentacao registrada no periodo.', fontSize: 11, color: MEDIUM_COLOR });
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
        JSON.stringify({ tipo_relatorio: 'movimentacoes', periodo: `${dataInicio} a ${dataFim}` }), null);
      return dataUrl;
    } catch {
      return gerarPdfFallback('Relatorio de Movimentacoes', {
        'Periodo': `${dataInicio.split('T')[0]} a ${dataFim.split('T')[0]}`,
        'Total': String(movimentacoes.length),
        'Entradas': String(totalEntradas),
        'Saidas': String(totalSaidas),
      });
    }
  }
}
