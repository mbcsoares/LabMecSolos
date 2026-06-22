import { queryRows, executeSql, getDatabase } from './DatabaseService';
import { LogService } from './LogService';
import { SenhaService } from './SenhaService';
import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import type {
  CategoriaItem,
  EstadoEquipamento,
  StatusLote,
  StatusOcorrencia,
  FiltrosItem,
  FiltrosOcorrencia,
  CriarCategoriaDTO,
  CriarItemDTO,
  RegistrarEntradaDTO,
  RegistrarSaidaDTO,
  CriarLoteDTO,
  CriarOcorrenciaDTO,
  ResultadoVerificacaoCalibracao,
  AlertaEstoque,
  AlertaValidade,
  ItemDetalhado,
  ItemResumo,
  OcorrenciaResumo,
  HistoricoEstadoEquipamento,
  RegistroEquipamento,
  LoteMaterial,
} from '../models/types';

export const TRANSICOES_ESTADO_EQUIPAMENTO: Record<EstadoEquipamento, EstadoEquipamento[]> = {
  disponivel: ['em_manutencao', 'inoperante', 'calibracao_vencida'],
  em_manutencao: ['disponivel', 'inoperante'],
  inoperante: ['disponivel', 'em_manutencao'],
  calibracao_vencida: ['disponivel', 'em_manutencao', 'inoperante'],
};

export const TRANSICOES_OCORRENCIA: Record<StatusOcorrencia, StatusOcorrencia[]> = {
  aberta: ['em_analise', 'fechada'],
  em_analise: ['resolvida', 'fechada', 'aberta'],
  resolvida: ['fechada', 'aberta'],
  fechada: ['aberta'],
};

export class InventarioService {
  static async listarCategorias(apenasAtivas: boolean = true): Promise<CategoriaItem[]> {
    return queryRows<CategoriaItem>(
      `SELECT * FROM categorias_item${apenasAtivas ? " WHERE status = 'ativa'" : ''} ORDER BY nome ASC`
    );
  }

  static async criarCategoria(dados: CriarCategoriaDTO, idUsuario: string): Promise<CategoriaItem> {
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      'INSERT INTO categorias_item (id, nome, descricao, status, data_criacao) VALUES (?, ?, ?, ?, ?)',
      [id, dados.nome.trim(), dados.descricao?.trim() || null, 'ativa', agora]
    );

    await LogService.registrar(
      'estoque', 'categoria_criada', idUsuario, null, null,
      JSON.stringify({ nome: dados.nome }), null
    );

    return { id, nome: dados.nome, descricao: dados.descricao || null, status: 'ativa', data_criacao: agora, data_atualizacao: null };
  }

  static async editarCategoria(id: string, dados: CriarCategoriaDTO, idUsuario: string): Promise<CategoriaItem> {
    const rows = await queryRows<CategoriaItem>('SELECT * FROM categorias_item WHERE id = ?', [id]);
    if (rows.length === 0) {
      throw new Error('Categoria nao encontrada.');
    }

    const nomeAnterior = rows[0].nome;
    const agora = nowISO();

    await executeSql(
      'UPDATE categorias_item SET nome = ?, descricao = ?, data_atualizacao = ? WHERE id = ?',
      [dados.nome.trim(), dados.descricao?.trim() || null, agora, id]
    );

    await LogService.registrar(
      'estoque', 'categoria_editada', idUsuario, null,
      JSON.stringify({ nome: nomeAnterior }), JSON.stringify({ nome: dados.nome }), null
    );

    return { ...rows[0], nome: dados.nome, descricao: dados.descricao || null, data_atualizacao: agora };
  }

  static async desativarCategoria(id: string, idUsuario: string): Promise<void> {
    const agora = nowISO();

    await executeSql(
      "UPDATE categorias_item SET status = 'inativa', data_atualizacao = ? WHERE id = ?",
      [agora, id]
    );

    await executeSql(
      'UPDATE itens SET id_categoria = NULL, data_atualizacao = ? WHERE id_categoria = ?',
      [agora, id]
    );

    await LogService.registrar(
      'estoque', 'categoria_desativada', idUsuario, null,
      JSON.stringify({ status: 'ativa' }), JSON.stringify({ status: 'inativa' }),
      { id_categoria: id }
    );
  }

  static async listarItens(
    filtros: FiltrosItem,
    pagina: number,
    itensPorPagina: number = 20
  ): Promise<{ itens: ItemResumo[]; total: number }> {
    const offset = (pagina - 1) * itensPorPagina;
    const condicoes: string[] = [];
    const params: (string | null)[] = [];

    condicoes.push('(i.status = ? OR ? IS NULL)');
    params.push(filtros.status || 'ativo', filtros.status || null);

    if (filtros.tipo) {
      condicoes.push('i.tipo = ?');
      params.push(filtros.tipo);
    }

    if (filtros.idCategoria) {
      condicoes.push('i.id_categoria = ?');
      params.push(filtros.idCategoria);
    }

    if (filtros.busca && filtros.busca.trim().length > 0) {
      condicoes.push('(i.nome LIKE ? OR i.codigo LIKE ?)');
      const termo = `%${filtros.busca.trim()}%`;
      params.push(termo, termo);
    }

    if (filtros.estoqueBaixo) {
      condicoes.push(`i.id IN (
        SELECT m.id FROM materiais m WHERE m.quantidade_atual <= m.ponto_pedido AND m.ponto_pedido IS NOT NULL
        UNION
        SELECT u.id FROM utensilios u WHERE u.quantidade_atual <= u.ponto_pedido AND u.ponto_pedido IS NOT NULL
      )`);
    }

    const whereClause = condicoes.join(' AND ');

    const queryTotal = `SELECT COUNT(*) as total FROM itens i WHERE ${whereClause}`;
    const resultadoTotal = await queryRows<{ total: number }>(queryTotal, params);
    const total = resultadoTotal.length > 0 ? resultadoTotal[0].total : 0;

    const queryDados = `
      SELECT i.*, c.nome as categoria_nome
      FROM itens i
      LEFT JOIN categorias_item c ON i.id_categoria = c.id
      WHERE ${whereClause}
      ORDER BY i.nome ASC
      LIMIT ? OFFSET ?
    `;
    const itens = await queryRows<ItemResumo>(queryDados, [...params, itensPorPagina, offset]);

    return { itens, total };
  }

  static async obterItem(id: string): Promise<ItemDetalhado | null> {
    const rows = await queryRows<ItemResumo>(
      `SELECT i.*, c.nome as categoria_nome
       FROM itens i
       LEFT JOIN categorias_item c ON i.id_categoria = c.id
       WHERE i.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const base = rows[0];
    let especializado: Record<string, unknown> = {};

    switch (base.tipo) {
      case 'material': {
        const mat = await queryRows('SELECT * FROM materiais WHERE id = ?', [id]);
        especializado = mat.length > 0 ? (mat[0] as Record<string, unknown>) : {};
        break;
      }
      case 'utensilio': {
        const ute = await queryRows('SELECT * FROM utensilios WHERE id = ?', [id]);
        especializado = ute.length > 0 ? (ute[0] as Record<string, unknown>) : {};
        break;
      }
      case 'equipamento': {
        const equi = await queryRows('SELECT * FROM equipamentos WHERE id = ?', [id]);
        especializado = equi.length > 0 ? (equi[0] as Record<string, unknown>) : {};
        break;
      }
    }

    return { ...base, ...especializado } as ItemDetalhado;
  }

  static async criarItem(dados: CriarItemDTO, idUsuario: string): Promise<ItemDetalhado> {
    const existente = await queryRows<{ id: string }>('SELECT id FROM itens WHERE codigo = ?', [dados.codigo]);
    if (existente.length > 0) {
      throw new Error('Ja existe um item com este codigo.');
    }

    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      'INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, dados.tipo, dados.nome.trim(), dados.codigo.trim(), dados.idCategoria || null, 'ativo', agora]
    );

    switch (dados.tipo) {
      case 'material':
        await executeSql(
          'INSERT INTO materiais (id, unidade_medida, ponto_pedido, quantidade_atual) VALUES (?, ?, ?, 0)',
          [id, dados.unidadeMedida, dados.pontoPedido || null]
        );
        break;
      case 'utensilio':
        await executeSql(
          'INSERT INTO utensilios (id, unidade_medida, ponto_pedido, local_armazenamento, quantidade_atual) VALUES (?, ?, ?, ?, 0)',
          [id, dados.unidadeMedida || 'unidade', dados.pontoPedido || null, dados.localArmazenamento || null]
        );
        break;
      case 'equipamento':
        await executeSql(
          `INSERT INTO equipamentos (id, numero_serie, marca, modelo, especificacao_tecnica, estado, data_ultima_calibracao, frequencia_calibracao_dias, data_criacao)
           VALUES (?, ?, ?, ?, ?, 'disponivel', ?, ?, ?)`,
          [id, dados.numeroSerie || null, dados.marca || null, dados.modelo || null, dados.especificacaoTecnica || null, agora, dados.frequenciaCalibracaoDias || null, agora]
        );
        await executeSql(
          'INSERT INTO historico_estado_equipamento (id, id_equipamento, estado_anterior, estado_novo, id_usuario, data_alteracao) VALUES (?, ?, NULL, ?, ?, ?)',
          [generateUUID(), id, 'disponivel', idUsuario, agora]
        );
        break;
    }

    await LogService.registrar(
      'estoque', 'item_criado', idUsuario, null, null,
      JSON.stringify({ tipo: dados.tipo, nome: dados.nome, codigo: dados.codigo }), null
    );

    return (await this.obterItem(id))!;
  }

  static async desativarItem(id: string, idUsuario: string, senha: string): Promise<void> {
    const userRow = await queryRows<{ senha_hash: string }>(
      'SELECT senha_hash FROM usuarios WHERE id = ?', [idUsuario]
    );
    if (userRow.length === 0 || !(await SenhaService.verificarSenha(senha, userRow[0].senha_hash))) {
      throw new Error('Senha incorreta.');
    }

    const agora = nowISO();

    await executeSql(
      "UPDATE itens SET status = 'inativo', data_atualizacao = ? WHERE id = ?",
      [agora, id]
    );

    await LogService.registrar(
      'estoque', 'item_desativado', idUsuario, null,
      JSON.stringify({ status: 'ativo' }), JSON.stringify({ status: 'inativo' }),
      { id_item: id }
    );
  }

  static async reativarItem(id: string, idUsuario: string): Promise<void> {
    const agora = nowISO();

    await executeSql(
      "UPDATE itens SET status = 'ativo', data_atualizacao = ? WHERE id = ?",
      [agora, id]
    );

    await LogService.registrar(
      'estoque', 'status_ativado', idUsuario, null,
      JSON.stringify({ status: 'inativo' }), JSON.stringify({ status: 'ativo' }),
      { id_item: id }
    );
  }

  static async registrarEntrada(dados: RegistrarEntradaDTO, idUsuarioRegistrador: string): Promise<void> {
    await this.validarItemAtivo(dados.idItem);

    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO movimentacoes_estoque (id, id_item, tipo, quantidade, id_lote, id_usuario_registrador, data_movimentacao, observacao)
       VALUES (?, ?, 'entrada', ?, ?, ?, ?, ?)`,
      [id, dados.idItem, dados.quantidade, dados.idLote || null, idUsuarioRegistrador, agora, dados.observacao || null]
    );

    await this.atualizarQuantidadeItem(dados.idItem, dados.quantidade, 'entrada');

    if (dados.idLote) {
      await executeSql(
        'UPDATE lotes_material SET quantidade_atual = quantidade_atual + ? WHERE id = ?',
        [dados.quantidade, dados.idLote]
      );
    }

    const quantidadeAtual = await this.obterQuantidadeAtual(dados.idItem);

    await LogService.registrar(
      'estoque', 'movimentacao_entrada', idUsuarioRegistrador, null,
      JSON.stringify({ quantidade: quantidadeAtual - dados.quantidade }),
      JSON.stringify({ quantidade: quantidadeAtual }),
      { id_item: dados.idItem, quantidade: dados.quantidade, id_lote: dados.idLote }
    );
  }

  static async registrarSaida(dados: RegistrarSaidaDTO, idUsuarioRegistrador: string): Promise<void> {
    await this.validarItemAtivo(dados.idItem);

    const saldoAtual = await this.obterQuantidadeAtual(dados.idItem);

    if (!dados.idLote) {
      const lotesAtivos = await queryRows<{ total: number }>(
        "SELECT COALESCE(SUM(quantidade_atual), 0) as total FROM lotes_material WHERE id_material = ? AND status = 'ativo'",
        [dados.idItem]
      );
      const nullAvailable = saldoAtual - (lotesAtivos.length > 0 ? lotesAtivos[0].total : 0);

      if (nullAvailable < dados.quantidade) {
        const msg = lotesAtivos[0]?.total > 0
          ? `Saldo insuficiente sem lote. Disponivel sem lote: ${nullAvailable}. O restante de ${lotesAtivos[0].total} esta alocado em lotes ativos.`
          : `Saldo insuficiente. Disponivel: ${saldoAtual}.`;
        throw new Error(msg);
      }
    } else {
      if (saldoAtual < dados.quantidade) {
        throw new Error(`Saldo insuficiente. Disponivel: ${saldoAtual}.`);
      }
    }

    if (!dados.motivo || dados.motivo.trim().length === 0) {
      throw new Error('Motivo e obrigatorio para saida de estoque.');
    }

    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO movimentacoes_estoque (id, id_item, tipo, quantidade, id_lote, motivo, id_usuario_solicitante, id_usuario_registrador, data_movimentacao, observacao)
       VALUES (?, ?, 'saida', ?, ?, ?, ?, ?, ?, ?)`,
      [id, dados.idItem, dados.quantidade, dados.idLote || null, dados.motivo.trim(), dados.idUsuarioSolicitante || null, idUsuarioRegistrador, agora, dados.observacao || null]
    );

    await this.atualizarQuantidadeItem(dados.idItem, dados.quantidade, 'saida');

    if (dados.idLote) {
      await executeSql(
        'UPDATE lotes_material SET quantidade_atual = MAX(0, quantidade_atual - ?) WHERE id = ?',
        [dados.quantidade, dados.idLote]
      );
      await this.verificarStatusLote(dados.idLote);
    }

    await LogService.registrar(
      'estoque', 'movimentacao_saida', idUsuarioRegistrador, dados.idUsuarioSolicitante || null,
      JSON.stringify({ quantidade: saldoAtual }),
      JSON.stringify({ quantidade: saldoAtual - dados.quantidade }),
      { id_item: dados.idItem, quantidade: dados.quantidade, motivo: dados.motivo }
    );
  }

  static async alterarEstado(
    idEquipamento: string,
    novoEstado: EstadoEquipamento,
    observacao: string | null,
    idUsuario: string
  ): Promise<void> {
    const rows = await queryRows<{ estado: string; nome: string }>(
      'SELECT e.estado, i.nome FROM equipamentos e INNER JOIN itens i ON e.id = i.id WHERE e.id = ?',
      [idEquipamento]
    );

    if (rows.length === 0) {
      throw new Error('Equipamento nao encontrado.');
    }

    const estadoAnterior = rows[0].estado;
    const nomeEquipamento = rows[0].nome;

    if (estadoAnterior === novoEstado) {
      throw new Error('O equipamento ja esta neste estado.');
    }

    const agora = nowISO();

    await executeSql(
      'UPDATE equipamentos SET estado = ?, data_atualizacao = ? WHERE id = ?',
      [novoEstado, agora, idEquipamento]
    );

    await executeSql(
      `INSERT INTO historico_estado_equipamento (id, id_equipamento, estado_anterior, estado_novo, observacao, id_usuario, data_alteracao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), idEquipamento, estadoAnterior, novoEstado, observacao, idUsuario, agora]
    );

    await LogService.registrar(
      'estoque', 'estado_equipamento_alterado', idUsuario, null,
      JSON.stringify({ estado: estadoAnterior }),
      JSON.stringify({ estado: novoEstado }),
      { id_equipamento: idEquipamento, nome: nomeEquipamento, observacao }
    );
  }

  static async registrarCalibracao(
    idEquipamento: string,
    idUsuario: string,
    dados: {
      dataCalibracao: string;
      profissional: string;
      empresa: string;
      certificado: string;
      frequenciaDias: number;
      observacao: string;
    }
  ): Promise<void> {
    const rows = await queryRows<{ estado: string; nome: string }>(
      'SELECT e.estado, i.nome FROM equipamentos e INNER JOIN itens i ON e.id = i.id WHERE e.id = ?',
      [idEquipamento]
    );

    if (rows.length === 0) {
      throw new Error('Equipamento nao encontrado.');
    }

    const estadoAnterior = rows[0].estado;
    const agora = nowISO();

    await executeSql(
      'UPDATE equipamentos SET data_ultima_calibracao = ?, frequencia_calibracao_dias = ?, data_atualizacao = ? WHERE id = ?',
      [dados.dataCalibracao, dados.frequenciaDias, agora, idEquipamento]
    );

    const detalhes = [
      dados.profissional ? `Profissional: ${dados.profissional}` : null,
      dados.empresa ? `Empresa: ${dados.empresa}` : null,
      dados.certificado ? `Certificado: ${dados.certificado}` : null,
      dados.observacao || null,
    ].filter(Boolean).join(' | ');

    if (estadoAnterior === 'calibracao_vencida') {
      await executeSql(
        "UPDATE equipamentos SET estado = 'disponivel', data_atualizacao = ? WHERE id = ?",
        [agora, idEquipamento]
      );

      await executeSql(
        `INSERT INTO historico_estado_equipamento (id, id_equipamento, estado_anterior, estado_novo, observacao, id_usuario, data_alteracao)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateUUID(), idEquipamento, estadoAnterior, 'disponivel', detalhes, idUsuario, agora]
      );

      await LogService.registrar(
        'estoque', 'estado_equipamento_alterado', idUsuario, null,
        JSON.stringify({ estado: estadoAnterior }),
        JSON.stringify({ estado: 'disponivel' }),
        { id_equipamento: idEquipamento, motivo: 'recalibracao', detalhes }
      );
    }

    await LogService.registrar(
      'estoque', 'calibracao_verificada', idUsuario, null, null,
      JSON.stringify({
        id_equipamento: idEquipamento, recalibrado: true,
        profissional: dados.profissional, empresa: dados.empresa,
        certificado: dados.certificado, frequencia_dias: dados.frequenciaDias,
      }), null
    );
  }

  static async verificarCalibracoes(): Promise<ResultadoVerificacaoCalibracao> {
    const db = await getDatabase();
    const result = await db.query(`
      SELECT
        e.id, i.nome, e.data_ultima_calibracao, e.frequencia_calibracao_dias,
        CAST(julianday(e.data_ultima_calibracao, '+' || e.frequencia_calibracao_dias || ' days') - julianday('now') AS INTEGER) AS dias_restantes
      FROM equipamentos e
      INNER JOIN itens i ON e.id = i.id
      WHERE i.status = 'ativo'
        AND e.data_ultima_calibracao IS NOT NULL
        AND e.frequencia_calibracao_dias IS NOT NULL
    `);

    const equipamentos = (result.values || []) as { id: string; nome: string; dias_restantes: number }[];
    const vencidos = equipamentos.filter((e) => e.dias_restantes <= 0);
    const proximosVencimento = equipamentos.filter((e) => [30, 15, 7, 3, 1].includes(e.dias_restantes));

    return {
      totalEquipamentos: equipamentos.length,
      vencidos: vencidos.length,
      proximosVencimento: proximosVencimento.map((e) => ({
        id: e.id,
        nome: e.nome,
        diasRestantes: e.dias_restantes,
      })),
      todosItens: equipamentos.map((e) => ({
        id: e.id,
        nome: e.nome,
        diasRestantes: e.dias_restantes,
      })),
    };
  }

  static async criarLote(dados: CriarLoteDTO, idUsuario: string): Promise<{ id: string }> {
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO lotes_material (id, id_material, numero_lote, data_recebimento, data_validade, quantidade_inicial, quantidade_atual, status, data_criacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo', ?)`,
      [id, dados.idMaterial, dados.numeroLote, dados.dataRecebimento, dados.dataValidade || null, dados.quantidadeInicial, dados.quantidadeInicial, agora]
    );

    await executeSql(
      'UPDATE materiais SET quantidade_atual = quantidade_atual + ? WHERE id = ?',
      [dados.quantidadeInicial, dados.idMaterial]
    );

    await LogService.registrar(
      'estoque', 'lote_criado', idUsuario, null, null,
      JSON.stringify({ numero_lote: dados.numeroLote, quantidade: dados.quantidadeInicial }),
      { id_material: dados.idMaterial }
    );

    return { id };
  }

  static async listarOcorrencias(
    filtros: FiltrosOcorrencia,
    pagina: number,
    idUsuario?: string,
    apenasProprias: boolean = false
  ): Promise<{ ocorrencias: OcorrenciaResumo[]; total: number }> {
    const itensPorPagina = 20;
    const offset = (pagina - 1) * itensPorPagina;
    const condicoes: string[] = [];
    const params: (string | null)[] = [];

    if (filtros.status) {
      condicoes.push('o.status = ?');
      params.push(filtros.status);
    }

    if (filtros.tipo) {
      condicoes.push('o.tipo = ?');
      params.push(filtros.tipo);
    }

    if (apenasProprias && idUsuario) {
      condicoes.push('o.id_usuario_abertura = ?');
      params.push(idUsuario);
    }

    const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

    const queryTotal = `SELECT COUNT(*) as total FROM ocorrencias o ${whereClause}`;
    const resultadoTotal = await queryRows<{ total: number }>(queryTotal, params);
    const total = resultadoTotal.length > 0 ? resultadoTotal[0].total : 0;

    const queryDados = `
      SELECT o.*, i.nome as nome_item, u.nome || ' ' || u.sobrenome as nome_abertura
      FROM ocorrencias o
      LEFT JOIN itens i ON o.id_item = i.id
      INNER JOIN usuarios u ON o.id_usuario_abertura = u.id
      ${whereClause}
      ORDER BY o.data_abertura DESC
      LIMIT ? OFFSET ?
    `;
    const ocorrencias = await queryRows<OcorrenciaResumo>(queryDados, [...params, itensPorPagina, offset]);

    return { ocorrencias, total };
  }

  static async criarOcorrencia(dados: CriarOcorrenciaDTO, idUsuario: string): Promise<{ id: string }> {
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO ocorrencias (id, tipo, id_item, titulo, descricao, fotos, status, id_usuario_abertura, data_abertura)
       VALUES (?, ?, ?, ?, ?, ?, 'aberta', ?, ?)`,
      [id, dados.tipo, dados.idItem || null, dados.titulo.trim(), dados.descricao.trim(), dados.fotos ? JSON.stringify(dados.fotos) : null, idUsuario, agora]
    );

    await LogService.registrar(
      'estoque', 'ocorrencia_aberta', idUsuario, null, null,
      JSON.stringify({ tipo: dados.tipo, titulo: dados.titulo }), null
    );

    return { id };
  }

  static async alterarStatusOcorrencia(
    idOcorrencia: string,
    novoStatus: StatusOcorrencia,
    idResponsavel: string,
    resolucao?: string
  ): Promise<void> {
    const rows = await queryRows('SELECT * FROM ocorrencias WHERE id = ?', [idOcorrencia]);
    if (rows.length === 0) {
      throw new Error('Ocorrencia nao encontrada.');
    }

    const ocorrencia = rows[0] as Record<string, unknown>;
    const statusAnterior = ocorrencia.status as string;
    const agora = nowISO();
    let dataResolucao = ocorrencia.data_resolucao as string | null;
    let idUsuarioResponsavel = ocorrencia.id_usuario_responsavel as string | null;

    if (novoStatus === 'em_analise') {
      idUsuarioResponsavel = idResponsavel;
    }

    if ((novoStatus === 'resolvida' || novoStatus === 'fechada') && (!resolucao || resolucao.trim().length === 0)) {
      throw new Error('Resolucao e obrigatoria ao resolver ou fechar uma ocorrencia.');
    }

    if (novoStatus === 'resolvida' || novoStatus === 'fechada') {
      dataResolucao = agora;
    }

    await executeSql(
      'UPDATE ocorrencias SET status = ?, id_usuario_responsavel = ?, resolucao = ?, data_resolucao = ?, data_atualizacao = ? WHERE id = ?',
      [novoStatus, idUsuarioResponsavel, resolucao || null, dataResolucao, agora, idOcorrencia]
    );

    const acao = novoStatus === 'resolvida' ? 'ocorrencia_resolvida' :
                 novoStatus === 'fechada' ? 'ocorrencia_fechada' : 'ocorrencia_status_alterado';

    await LogService.registrar(
      'estoque', acao, idResponsavel, ocorrencia.id_usuario_abertura as string,
      JSON.stringify({ status: statusAnterior }),
      JSON.stringify({ status: novoStatus }),
      resolucao ? { resolucao } : null
    );
  }

  static async verificarEstoqueMinimo(): Promise<AlertaEstoque[]> {
    const db = await getDatabase();
    const result = await db.query(`
      SELECT i.id, i.nome, i.codigo, m.unidade_medida, m.quantidade_atual, m.ponto_pedido
      FROM itens i
      INNER JOIN materiais m ON i.id = m.id
      WHERE i.status = 'ativo' AND m.ponto_pedido IS NOT NULL AND m.quantidade_atual <= m.ponto_pedido
      UNION ALL
      SELECT i.id, i.nome, i.codigo, u.unidade_medida, u.quantidade_atual, u.ponto_pedido
      FROM itens i
      INNER JOIN utensilios u ON i.id = u.id
      WHERE i.status = 'ativo' AND u.ponto_pedido IS NOT NULL AND u.quantidade_atual <= u.ponto_pedido
    `);

    return ((result.values || []) as Record<string, unknown>[]).map((row) => ({
      idItem: row.id as string,
      nome: row.nome as string,
      codigo: row.codigo as string,
      unidadeMedida: row.unidade_medida as string,
      quantidadeAtual: row.quantidade_atual as number,
      pontoPedido: row.ponto_pedido as number,
    }));
  }

  static async verificarValidadesProximas(dias: number[]): Promise<AlertaValidade[]> {
    const alertas: AlertaValidade[] = [];

    for (const dia of dias) {
      const dataAlvo = new Date();
      dataAlvo.setDate(dataAlvo.getDate() + dia);
      const dataAlvoStr = dataAlvo.toISOString().split('T')[0];

      const db = await getDatabase();
      const result = await db.query(
        `SELECT i.nome AS nome_material, lm.numero_lote, lm.data_validade, lm.quantidade_atual
         FROM lotes_material lm
         INNER JOIN materiais m ON lm.id_material = m.id
         INNER JOIN itens i ON m.id = i.id
         WHERE lm.status = 'ativo' AND DATE(lm.data_validade) = DATE(?)`,
        [dataAlvoStr]
      );

      for (const row of (result.values || []) as Record<string, unknown>[]) {
        alertas.push({
          nomeMaterial: row.nome_material as string,
          numeroLote: row.numero_lote as string,
          dataValidade: row.data_validade as string,
          diasRestantes: dia,
          quantidadeAtual: row.quantidade_atual as number,
        });
      }
    }

    return alertas;
  }

  private static async validarItemAtivo(idItem: string): Promise<void> {
    const rows = await queryRows<{ id: string }>(
      "SELECT id FROM itens WHERE id = ? AND status = 'ativo'",
      [idItem]
    );
    if (rows.length === 0) {
      throw new Error('Item nao encontrado ou inativo.');
    }
  }

  private static async obterQuantidadeAtual(idItem: string): Promise<number> {
    const item = await queryRows<{ tipo: string }>('SELECT tipo FROM itens WHERE id = ?', [idItem]);
    if (item.length === 0) {
      throw new Error('Item nao encontrado.');
    }

    const tipo = item[0].tipo;
    const tabela = tipo === 'material' ? 'materiais' : 'utensilios';

    const result = await queryRows<{ quantidade_atual: number }>(
      `SELECT quantidade_atual FROM ${tabela} WHERE id = ?`,
      [idItem]
    );

    return result.length > 0 ? result[0].quantidade_atual : 0;
  }

  private static async atualizarQuantidadeItem(
    idItem: string,
    quantidade: number,
    tipoMov: 'entrada' | 'saida'
  ): Promise<void> {
    const item = await queryRows<{ tipo: string }>('SELECT tipo FROM itens WHERE id = ?', [idItem]);
    if (item.length === 0) return;

    const tipoItem = item[0].tipo;
    const tabela = tipoItem === 'material' ? 'materiais' : 'utensilios';
    const operador = tipoMov === 'entrada' ? '+' : '-';

    await executeSql(
      `UPDATE ${tabela} SET quantidade_atual = MAX(0, quantidade_atual ${operador} ?) WHERE id = ?`,
      [quantidade, idItem]
    );
  }

  private static async atualizarQuantidadeMaterialPorLotes(idMaterial: string): Promise<void> {
    const rows = await queryRows<{ total: number }>(
      "SELECT COALESCE(SUM(quantidade_atual), 0) as total FROM lotes_material WHERE id_material = ? AND status = 'ativo'",
      [idMaterial]
    );
    const total = rows.length > 0 ? rows[0].total : 0;

    await executeSql(
      'UPDATE materiais SET quantidade_atual = ? WHERE id = ?',
      [total, idMaterial]
    );
  }

  private static async verificarStatusLote(idLote: string): Promise<void> {
    const rows = await queryRows('SELECT * FROM lotes_material WHERE id = ?', [idLote]);
    if (rows.length === 0) return;

    const dados = rows[0] as Record<string, unknown>;
    let novoStatus: StatusLote = 'ativo';

    if ((dados.quantidade_atual as number) <= 0) {
      novoStatus = 'esgotado';
    } else if (dados.data_validade && new Date(dados.data_validade as string) < new Date()) {
      novoStatus = 'vencido';
    }

    if (novoStatus !== dados.status) {
      await executeSql('UPDATE lotes_material SET status = ? WHERE id = ?', [novoStatus, idLote]);
    }
  }

  static async editarItem(id: string, dados: CriarItemDTO, idUsuario: string): Promise<void> {
    const agora = nowISO();

    await executeSql(
      'UPDATE itens SET nome = ?, codigo = ?, id_categoria = ?, data_atualizacao = ? WHERE id = ?',
      [dados.nome.trim(), dados.codigo.trim(), dados.idCategoria || null, agora, id]
    );

    if (dados.tipo === 'material') {
      await executeSql(
        'UPDATE materiais SET unidade_medida = ?, ponto_pedido = ? WHERE id = ?',
        [dados.unidadeMedida, dados.pontoPedido || null, id]
      );
    } else if (dados.tipo === 'utensilio') {
      await executeSql(
        'UPDATE utensilios SET unidade_medida = ?, ponto_pedido = ?, local_armazenamento = ? WHERE id = ?',
        [dados.unidadeMedida || 'unidade', dados.pontoPedido || null, dados.localArmazenamento || null, id]
      );
    } else if (dados.tipo === 'equipamento') {
      await executeSql(
        'UPDATE equipamentos SET numero_serie = ?, marca = ?, modelo = ?, especificacao_tecnica = ?, frequencia_calibracao_dias = ?, data_atualizacao = ? WHERE id = ?',
        [dados.numeroSerie || null, dados.marca || null, dados.modelo || null, dados.especificacaoTecnica || null, dados.frequenciaCalibracaoDias || null, agora, id]
      );
    }

    await LogService.registrar(
      'estoque', 'item_editado', idUsuario, null, null,
      JSON.stringify({ nome: dados.nome, tipo: dados.tipo, codigo: dados.codigo }), null
    );
  }

  static async listarMovimentacoes(
    idItem: string,
    pagina: number,
    itensPorPagina: number = 20
  ): Promise<{ movimentacoes: Record<string, unknown>[]; total: number }> {
    const offset = (pagina - 1) * itensPorPagina;
    const totalRows = await queryRows<{ total: number }>(
      'SELECT COUNT(*) as total FROM movimentacoes_estoque WHERE id_item = ?', [idItem]
    );
    const total = totalRows.length > 0 ? totalRows[0].total : 0;

    const rows = await queryRows(
      `SELECT * FROM movimentacoes_estoque WHERE id_item = ? ORDER BY data_movimentacao DESC LIMIT ? OFFSET ?`,
      [idItem, itensPorPagina, offset]
    );

    return { movimentacoes: rows as Record<string, unknown>[], total };
  }

  static async obterHistoricoEstado(idEquipamento: string): Promise<HistoricoEstadoEquipamento[]> {
    return queryRows<HistoricoEstadoEquipamento>(
      'SELECT * FROM historico_estado_equipamento WHERE id_equipamento = ? ORDER BY data_alteracao DESC',
      [idEquipamento]
    );
  }

  static async registrarVerificacaoReparo(
    dados: { idEquipamento: string; tipo: string; descricao: string; resultado: string; observacao?: string; dataProximaVerificacao?: string },
    idUsuario: string
  ): Promise<void> {
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO registros_equipamento (id, id_equipamento, tipo, descricao, resultado, observacao, id_usuario, data_registro, data_proxima_verificacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dados.idEquipamento, dados.tipo, dados.descricao.trim(), dados.resultado, dados.observacao || null, idUsuario, agora, dados.dataProximaVerificacao || null]
    );

    await LogService.registrar(
      'estoque', 'registro_equipamento_criado', idUsuario, null, null,
      JSON.stringify({ tipo: dados.tipo, resultado: dados.resultado }),
      { id_equipamento: dados.idEquipamento }
    );
  }

  static async listarRegistrosEquipamento(idEquipamento: string): Promise<RegistroEquipamento[]> {
    return queryRows<RegistroEquipamento>(
      'SELECT * FROM registros_equipamento WHERE id_equipamento = ? ORDER BY data_registro DESC',
      [idEquipamento]
    );
  }

  static async listarLotes(idMaterial: string): Promise<LoteMaterial[]> {
    return queryRows<LoteMaterial>(
      'SELECT * FROM lotes_material WHERE id_material = ? ORDER BY data_criacao DESC',
      [idMaterial]
    );
  }

  static async obterOcorrencia(id: string): Promise<Record<string, unknown> | null> {
    const rows = await queryRows(
      'SELECT o.*, i.nome as nome_item, u.nome || \' \' || u.sobrenome as nome_abertura FROM ocorrencias o LEFT JOIN itens i ON o.id_item = i.id INNER JOIN usuarios u ON o.id_usuario_abertura = u.id WHERE o.id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] as Record<string, unknown> : null;
  }

  static async gerarQRCode(idEquipamento: string, idUsuario: string): Promise<string> {
    const qrModule = await import('qrcode');
    const QRCode = qrModule.default || qrModule;
    const dataUrl = await QRCode.toDataURL(idEquipamento, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    await LogService.registrar(
      'estoque', 'qr_code_gerado', idUsuario, null, null, null,
      { id_equipamento: idEquipamento }
    );

    return dataUrl;
  }

  static async listarHistoricoCalibracoes(
    idEquipamento: string,
    pagina: number,
    itensPorPagina: number = 20
  ): Promise<{ calibracoes: Record<string, unknown>[]; total: number }> {
    const rows = await queryRows<Record<string, unknown>>(
      "SELECT * FROM logs_sistema WHERE modulo = 'estoque' AND acao = 'calibracao_verificada' ORDER BY data_criacao DESC"
    );

    const calibracoes = rows
      .filter((row) => {
        try {
          const dados = JSON.parse((row.valor_novo as string) || '{}');
          return dados.id_equipamento === idEquipamento || dados.recalibrado === true;
        } catch { return false; }
      })
      .map((row) => {
        let dados: Record<string, unknown> = {};
        try { dados = JSON.parse((row.valor_novo as string) || '{}'); } catch { /* */ }
        return { ...row, _dados: dados };
      });

    const total = calibracoes.length;
    const offset = (pagina - 1) * itensPorPagina;
    return { calibracoes: calibracoes.slice(offset, offset + itensPorPagina), total };
  }
}
