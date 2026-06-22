import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { queryRows, executeSql } from './DatabaseService';
import { LogService } from './LogService';
import {
  AmostraBruta,
  AmostraPreparada,
  AmostraEnsaiada,
  AmostraIndeformada,
  ProgramaAmostragem,
  PontoColeta,
  RegistrarAmostraBrutaDTO,
  PrepararAmostraDTO,
  FracionarDTO,
  RegistrarIndeformadaDTO,
  CriarProgramaDTO,
  CriarPontoDTO,
  EditarProgramaDTO,
  EditarPontoDTO,
  Rastreabilidade,
} from '../models/types';

export class AmostragemService {
  static async criarPrograma(dados: CriarProgramaDTO, idUsuario: string): Promise<ProgramaAmostragem> {
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO programas_amostragem (id, id_pesquisa, endereco_coleta, coordenadas, objetivo, descricao, status, data_criacao, id_criado_por)
       VALUES (?, ?, ?, ?, ?, ?, 'ativo', ?, ?)`,
      [id, dados.idPesquisa, dados.enderecoColeta || null, dados.coordenadas || null, dados.objetivo, dados.descricao || null, agora, idUsuario]
    );

    await LogService.registrar('ensaios', 'programa_criado', idUsuario, null, null, JSON.stringify({ objetivo: dados.objetivo }), null);

    return {
      id,
      id_pesquisa: dados.idPesquisa,
      endereco_coleta: dados.enderecoColeta || null,
      coordenadas: dados.coordenadas || null,
      objetivo: dados.objetivo,
      descricao: dados.descricao || null,
      status: 'ativo',
      data_criacao: agora,
      data_atualizacao: null,
      finalizado: 0,
      id_criado_por: idUsuario,
    };
  }

  static async criarPontoColeta(dados: CriarPontoDTO, idUsuario: string): Promise<PontoColeta> {
    const prog = await queryRows<{ finalizado: number }>(
      'SELECT finalizado FROM programas_amostragem WHERE id = ? AND finalizado = 1',
      [dados.idProgramaAmostragem]
    );
    if (prog.length === 0) throw new Error('O programa de amostragem precisa estar finalizado para criar pontos.');
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO pontos_coleta (id, id_programa_amostragem, identificacao_plano, coordenadas, descricao_local, data_criacao, id_criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, dados.idProgramaAmostragem, dados.identificacaoPlano, dados.coordenadas || null, dados.descricaoLocal || null, agora, idUsuario]
    );

    await LogService.registrar('ensaios', 'ponto_coleta_criado', idUsuario, null, null, JSON.stringify({ identificacao: dados.identificacaoPlano }), null);

    return {
      id,
      id_programa_amostragem: dados.idProgramaAmostragem,
      identificacao_plano: dados.identificacaoPlano,
      coordenadas: dados.coordenadas || null,
      descricao_local: dados.descricaoLocal || null,
      data_criacao: agora,
      id_criado_por: idUsuario,
      finalizado: 0,
    };
  }

  static async listarPontosColeta(idProgramaAmostragem: string): Promise<PontoColeta[]> {
    return queryRows<PontoColeta>(
      'SELECT * FROM pontos_coleta WHERE id_programa_amostragem = ? ORDER BY identificacao_plano ASC',
      [idProgramaAmostragem]
    );
  }

  static async obterPontoColeta(id: string): Promise<PontoColeta | null> {
    const rows = await queryRows<PontoColeta>('SELECT * FROM pontos_coleta WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async obterPrograma(id: string): Promise<ProgramaAmostragem | null> {
    const rows = await queryRows<ProgramaAmostragem>('SELECT * FROM programas_amostragem WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async editarPrograma(id: string, dados: EditarProgramaDTO, idUsuario: string): Promise<ProgramaAmostragem> {
    const prog = await queryRows<ProgramaAmostragem>('SELECT * FROM programas_amostragem WHERE id = ?', [id]);
    if (prog.length === 0) throw new Error('Programa nao encontrado.');

    const pesquisa = await queryRows<{ status: string }>('SELECT status FROM pesquisas WHERE id = ?', [prog[0].id_pesquisa]);
    if (pesquisa.length === 0 || pesquisa[0].status !== 'em_andamento') {
      throw new Error('Pesquisa nao encontrada ou nao esta em andamento.');
    }

    const agora = nowISO();

    await executeSql(
      `UPDATE programas_amostragem SET endereco_coleta = ?, coordenadas = ?, objetivo = ?, descricao = ?, data_atualizacao = ? WHERE id = ?`,
      [dados.enderecoColeta || null, dados.coordenadas || null, dados.objetivo, dados.descricao || null, agora, id]
    );

    await LogService.registrar('ensaios', 'programa_editado', idUsuario, null,
      JSON.stringify({ objetivo: prog[0].objetivo }), JSON.stringify({ objetivo: dados.objetivo }), null);

    return { ...prog[0], ...dados, data_atualizacao: agora };
  }

  static async editarPontoColeta(id: string, dados: EditarPontoDTO, idUsuario: string): Promise<PontoColeta> {
    const ponto = await queryRows<PontoColeta>('SELECT * FROM pontos_coleta WHERE id = ?', [id]);
    if (ponto.length === 0) throw new Error('Ponto de coleta nao encontrado.');

    const programa = await queryRows<{ id_pesquisa: string }>(
      'SELECT id_pesquisa FROM programas_amostragem WHERE id = ?', [ponto[0].id_programa_amostragem]
    );
    if (programa.length === 0) throw new Error('Programa nao encontrado.');

    const pesquisa = await queryRows<{ status: string }>(
      'SELECT status FROM pesquisas WHERE id = ?', [programa[0].id_pesquisa]
    );
    if (pesquisa.length === 0 || pesquisa[0].status !== 'em_andamento') {
      throw new Error('Pesquisa nao encontrada ou nao esta em andamento.');
    }

    if (dados.identificacaoPlano !== ponto[0].identificacao_plano) {
      const duplicado = await queryRows<{ id: string }>(
        'SELECT id FROM pontos_coleta WHERE id_programa_amostragem = ? AND identificacao_plano = ? AND id != ?',
        [ponto[0].id_programa_amostragem, dados.identificacaoPlano, id]
      );
      if (duplicado.length > 0) throw new Error('Ja existe um ponto com esta identificacao neste programa.');
    }

    await executeSql(
      `UPDATE pontos_coleta SET identificacao_plano = ?, coordenadas = ?, descricao_local = ? WHERE id = ?`,
      [dados.identificacaoPlano, dados.coordenadas || null, dados.descricaoLocal || null, id]
    );

    await LogService.registrar('ensaios', 'ponto_coleta_editado', idUsuario, null,
      JSON.stringify({ identificacao: ponto[0].identificacao_plano }),
      JSON.stringify({ identificacao: dados.identificacaoPlano }), null);

    return {
      ...ponto[0],
      identificacao_plano: dados.identificacaoPlano,
      coordenadas: dados.coordenadas || null,
      descricao_local: dados.descricaoLocal || null,
    };
  }

  static async listarAmostrasBrutas(idPontoColeta: string): Promise<AmostraBruta[]> {
    return queryRows<AmostraBruta>(
      'SELECT * FROM amostras_brutas WHERE id_ponto_coleta = ? ORDER BY data_criacao DESC',
      [idPontoColeta]
    );
  }

  /**
   * R104: tipo_amostra define o fluxo e NÃO pode ser alterado após criação.
   */
  static async registrarAmostraBruta(dados: RegistrarAmostraBrutaDTO, idUsuario: string): Promise<AmostraBruta> {
    const ponto = await queryRows<{ finalizado: number }>(
      'SELECT finalizado FROM pontos_coleta WHERE id = ? AND finalizado = 1',
      [dados.idPontoColeta]
    );
    if (ponto.length === 0) throw new Error('O ponto de coleta precisa estar finalizado para registrar amostras.');
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO amostras_brutas (id, id_ponto_coleta, numero_identificacao_campo, tipo_amostra, classificacao, metodo_coleta, data_coleta, operador_coleta, profundidade_coleta, descricao, peso_bruto_campo, coordenadas_gps, status, data_criacao, id_criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'coletada', ?, ?)`,
      [id, dados.idPontoColeta, dados.numeroIdentificacaoCampo, dados.tipoAmostra, dados.classificacao, dados.metodoColeta || null, dados.dataColeta, dados.operadorColeta || null, dados.profundidadeColeta || null, dados.descricao || null, dados.pesoBrutoCampo || null, dados.coordenadasGps || null, agora, idUsuario]
    );

    await LogService.registrar('ensaios', 'amostra_bruta_registrada', idUsuario, null, null, JSON.stringify({ numero_campo: dados.numeroIdentificacaoCampo, tipo: dados.tipoAmostra }), null);

    return {
      id,
      id_ponto_coleta: dados.idPontoColeta,
      numero_identificacao_campo: dados.numeroIdentificacaoCampo,
      tipo_amostra: dados.tipoAmostra,
      classificacao: dados.classificacao,
      metodo_coleta: dados.metodoColeta || null,
      data_coleta: dados.dataColeta,
      operador_coleta: dados.operadorColeta || null,
      profundidade_coleta: dados.profundidadeColeta || null,
      descricao: dados.descricao || null,
      peso_bruto_campo: dados.pesoBrutoCampo || null,
      coordenadas_gps: dados.coordenadasGps || null,
      status: 'coletada',
      data_criacao: agora,
      id_criado_por: idUsuario,
      finalizado: 0,
    };
  }

  static async obterAmostraBruta(id: string): Promise<AmostraBruta | null> {
    const rows = await queryRows<AmostraBruta>('SELECT * FROM amostras_brutas WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async obterAmostraPreparada(id: string): Promise<AmostraPreparada | null> {
    const rows = await queryRows<AmostraPreparada>('SELECT * FROM amostras_preparadas WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async obterAmostraEnsaiada(id: string): Promise<AmostraEnsaiada | null> {
    const rows = await queryRows<AmostraEnsaiada>('SELECT * FROM amostras_ensaiadas WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async obterAmostraIndeformada(id: string): Promise<AmostraIndeformada | null> {
    const rows = await queryRows<AmostraIndeformada>('SELECT * FROM amostras_indeformadas WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * R108: Vincula-se exclusivamente a amostras brutas do tipo deformada.
   * R109: quantidade_pos_quarteamento <= quantidade_pre_quarteamento.
   */
  static async prepararAmostra(dados: PrepararAmostraDTO, idUsuario: string): Promise<AmostraPreparada> {
    const bruta = await queryRows<{ tipo_amostra: string; finalizado: number; peso_bruto_campo: number | null }>(
      "SELECT tipo_amostra, finalizado, peso_bruto_campo FROM amostras_brutas WHERE id = ?",
      [dados.idAmostraBruta]
    );
    if (bruta.length === 0) throw new Error('Amostra bruta nao encontrada.');
    if (bruta[0].tipo_amostra !== 'deformada') throw new Error('Amostra bruta nao e do tipo deformada.');
    if (bruta[0].finalizado !== 1) throw new Error('A amostra bruta precisa estar finalizada para ser preparada.');

    if (bruta[0].peso_bruto_campo != null && dados.quantidadePreQuarteamento > bruta[0].peso_bruto_campo) {
      throw new Error(`Quantidade pre-quarteamento (${dados.quantidadePreQuarteamento}g) excede o peso bruto da amostra (${bruta[0].peso_bruto_campo}g).`);
    }

    if (dados.quantidadePosQuarteamento > dados.quantidadePreQuarteamento) {
      throw new Error('Quantidade pos-quarteamento nao pode exceder a quantidade pre-quarteamento.');
    }

    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO amostras_preparadas (id, id_amostra_bruta, numero_amostra, descricao_inicial, normatizacao, metodo_preparo, metodo_secagem, data_preparo, id_responsavel_preparo, quantidade_pre_quarteamento, quantidade_pos_quarteamento, observacoes, data_criacao, id_criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dados.idAmostraBruta, dados.numeroAmostra, dados.descricaoInicial || null, dados.normatizacao || null, dados.metodoPreparo, dados.metodoSecagem, dados.dataPreparo, dados.idResponsavelPreparo, dados.quantidadePreQuarteamento, dados.quantidadePosQuarteamento, dados.observacoes || null, agora, idUsuario]
    );

    await executeSql("UPDATE amostras_brutas SET status = 'preparada' WHERE id = ?", [dados.idAmostraBruta]);

    await LogService.registrar('ensaios', 'amostra_preparada', idUsuario, null, null, JSON.stringify({ numero: dados.numeroAmostra, metodo: dados.metodoPreparo }), null);

    return {
      id,
      id_amostra_bruta: dados.idAmostraBruta,
      numero_amostra: dados.numeroAmostra,
      descricao_inicial: dados.descricaoInicial || null,
      normatizacao: dados.normatizacao || null,
      metodo_preparo: dados.metodoPreparo,
      metodo_secagem: dados.metodoSecagem,
      data_preparo: dados.dataPreparo,
      id_responsavel_preparo: dados.idResponsavelPreparo,
      quantidade_pre_quarteamento: dados.quantidadePreQuarteamento,
      quantidade_pos_quarteamento: dados.quantidadePosQuarteamento,
      observacoes: dados.observacoes || null,
      data_criacao: agora,
      id_criado_por: idUsuario,
      finalizado: 0,
    };
  }

  static async listarAmostrasPreparadas(idAmostraBruta: string): Promise<AmostraPreparada[]> {
    return queryRows<AmostraPreparada>(
      'SELECT * FROM amostras_preparadas WHERE id_amostra_bruta = ? ORDER BY data_criacao DESC',
      [idAmostraBruta]
    );
  }

  static async fracionarAmostra(dados: FracionarDTO, idUsuario: string): Promise<AmostraEnsaiada> {
    const preparada = await queryRows<{ finalizado: number; quantidade_pos_quarteamento: number }>(
      'SELECT finalizado, quantidade_pos_quarteamento FROM amostras_preparadas WHERE id = ? AND finalizado = 1',
      [dados.idAmostraPreparada]
    );
    if (preparada.length === 0) throw new Error('A amostra preparada precisa estar finalizada para ser fracionada.');

    const usado = await queryRows<{ total: number }>(
      'SELECT COALESCE(SUM(quantidade_inicial), 0) as total FROM amostras_ensaiadas WHERE id_amostra_preparada = ?',
      [dados.idAmostraPreparada]
    );
    const disponivel = preparada[0].quantidade_pos_quarteamento - (usado[0]?.total || 0);
    if (dados.quantidadeInicial > disponivel) {
      throw new Error(`Massa indisponivel. Disponivel: ${disponivel}g, ja fracionado: ${usado[0]?.total || 0}g.`);
    }
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO amostras_ensaiadas (id, id_amostra_preparada, numero_amostra, tipo_ensaio_destino, quantidade_inicial, descricao, observacoes, data_criacao, id_criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dados.idAmostraPreparada, dados.numeroAmostra, dados.tipoEnsaioDestino, dados.quantidadeInicial, dados.descricao || null, dados.observacoes || null, agora, idUsuario]
    );

    await LogService.registrar('ensaios', 'amostra_ensaiada_criada', idUsuario, null, null, JSON.stringify({ numero: dados.numeroAmostra, ensaio_destino: dados.tipoEnsaioDestino }), null);

    return {
      id,
      id_amostra_preparada: dados.idAmostraPreparada,
      numero_amostra: dados.numeroAmostra,
      tipo_ensaio_destino: dados.tipoEnsaioDestino,
      quantidade_inicial: dados.quantidadeInicial,
      quantidade_final: null,
      descricao: dados.descricao || null,
      observacoes: dados.observacoes || null,
      data_criacao: agora,
      id_criado_por: idUsuario,
      finalizado: 0,
    };
  }

  static async listarAmostrasEnsaiadas(idAmostraPreparada: string): Promise<AmostraEnsaiada[]> {
    return queryRows<AmostraEnsaiada>(
      'SELECT * FROM amostras_ensaiadas WHERE id_amostra_preparada = ? ORDER BY data_criacao DESC',
      [idAmostraPreparada]
    );
  }

  /**
   * R115: Vincula-se exclusivamente a amostras brutas do tipo indeformada.
   */
  static async registrarIndeformada(dados: RegistrarIndeformadaDTO, idUsuario: string): Promise<AmostraIndeformada> {
    const bruta = await queryRows<{ tipo_amostra: string; finalizado: number }>(
      "SELECT tipo_amostra, finalizado FROM amostras_brutas WHERE id = ?",
      [dados.idAmostraBruta]
    );
    if (bruta.length === 0) throw new Error('Amostra bruta nao encontrada.');
    if (bruta[0].tipo_amostra !== 'indeformada') throw new Error('Amostra bruta nao e do tipo indeformada.');
    if (bruta[0].finalizado !== 1) throw new Error('A amostra bruta precisa estar finalizada.');

    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO amostras_indeformadas (id, id_amostra_bruta, numero_amostra, tipo_indeformada, formato, altura, largura, comprimento, condicao, observacoes, data_criacao, id_criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dados.idAmostraBruta, dados.numeroAmostra, dados.tipoIndeformada, dados.formato, dados.altura || null, dados.largura || null, dados.comprimento || null, dados.condicao || null, dados.observacoes || null, agora, idUsuario]
    );

    await executeSql("UPDATE amostras_brutas SET status = 'preparada' WHERE id = ?", [dados.idAmostraBruta]);

    await LogService.registrar('ensaios', 'amostra_indeformada_criada', idUsuario, null, null, JSON.stringify({ numero: dados.numeroAmostra, tipo: dados.tipoIndeformada }), null);

    return {
      id,
      id_amostra_bruta: dados.idAmostraBruta,
      numero_amostra: dados.numeroAmostra,
      tipo_indeformada: dados.tipoIndeformada,
      formato: dados.formato,
      altura: dados.altura || null,
      largura: dados.largura || null,
      comprimento: dados.comprimento || null,
      condicao: dados.condicao || null,
      observacoes: dados.observacoes || null,
      data_criacao: agora,
      id_criado_por: idUsuario,
      finalizado: 0,
    };
  }

  static async finalizarPrograma(id: string, idUsuario: string): Promise<void> {
    const prog = await queryRows<ProgramaAmostragem>('SELECT * FROM programas_amostragem WHERE id = ?', [id]);
    if (prog.length === 0) throw new Error('Programa nao encontrado.');
    if (prog[0].finalizado === 1) throw new Error('Programa ja esta finalizado.');
    if (!prog[0].objetivo) throw new Error('Preencha o objetivo antes de finalizar.');
    await executeSql('UPDATE programas_amostragem SET finalizado = 1 WHERE id = ?', [id]);
    await LogService.registrar('ensaios', 'programa_finalizado', idUsuario, null, JSON.stringify({ finalizado: 0 }), JSON.stringify({ finalizado: 1 }), null);
  }

  static async finalizarPontoColeta(id: string, idUsuario: string): Promise<void> {
    const ponto = await queryRows<PontoColeta>('SELECT * FROM pontos_coleta WHERE id = ?', [id]);
    if (ponto.length === 0) throw new Error('Ponto nao encontrado.');
    if (ponto[0].finalizado === 1) throw new Error('Ponto ja esta finalizado.');
    if (!ponto[0].identificacao_plano.trim()) throw new Error('Preencha a identificacao antes de finalizar.');
    await executeSql('UPDATE pontos_coleta SET finalizado = 1 WHERE id = ?', [id]);
    await LogService.registrar('ensaios', 'ponto_finalizado', idUsuario, null, JSON.stringify({ finalizado: 0 }), JSON.stringify({ finalizado: 1 }), null);
  }

  static async finalizarAmostraBruta(id: string, idUsuario: string): Promise<void> {
    const ab = await queryRows<AmostraBruta>('SELECT * FROM amostras_brutas WHERE id = ?', [id]);
    if (ab.length === 0) throw new Error('Amostra nao encontrada.');
    if (ab[0].finalizado === 1) throw new Error('Amostra ja esta finalizada.');
    if (!ab[0].numero_identificacao_campo.trim()) throw new Error('Preencha o numero de campo antes de finalizar.');
    if (!ab[0].tipo_amostra) throw new Error('Preencha o tipo de amostra antes de finalizar.');
    if (!ab[0].data_coleta) throw new Error('Preencha a data de coleta antes de finalizar.');
    await executeSql('UPDATE amostras_brutas SET finalizado = 1 WHERE id = ?', [id]);
    await LogService.registrar('ensaios', 'amostra_finalizada', idUsuario, null, JSON.stringify({ finalizado: 0 }), JSON.stringify({ finalizado: 1 }), null);
  }

  static async finalizarPreparada(id: string, idUsuario: string): Promise<void> {
    const ap = await queryRows<AmostraPreparada>('SELECT * FROM amostras_preparadas WHERE id = ?', [id]);
    if (ap.length === 0) throw new Error('Amostra preparada nao encontrada.');
    if (ap[0].finalizado === 1) throw new Error('Amostra ja esta finalizada.');
    if (!ap[0].numero_amostra.trim()) throw new Error('Preencha o numero da amostra.');
    if (!ap[0].metodo_preparo) throw new Error('Preencha o metodo de preparo.');
    if (!ap[0].data_preparo) throw new Error('Preencha a data de preparo.');
    if (!ap[0].quantidade_pre_quarteamento) throw new Error('Preencha a quantidade pre-quarteamento.');
    await executeSql('UPDATE amostras_preparadas SET finalizado = 1 WHERE id = ?', [id]);
    await LogService.registrar('ensaios', 'preparada_finalizada', idUsuario, null, JSON.stringify({ finalizado: 0 }), JSON.stringify({ finalizado: 1 }), null);
  }

  static async finalizarEnsaiada(id: string, idUsuario: string): Promise<void> {
    const ae = await queryRows<AmostraEnsaiada>('SELECT * FROM amostras_ensaiadas WHERE id = ?', [id]);
    if (ae.length === 0) throw new Error('Amostra ensaiada nao encontrada.');
    if (ae[0].finalizado === 1) throw new Error('Amostra ja esta finalizada.');
    if (!ae[0].numero_amostra.trim()) throw new Error('Preencha o numero da amostra.');
    if (!ae[0].tipo_ensaio_destino) throw new Error('Preencha o tipo de ensaio destino.');
    if (!ae[0].quantidade_inicial) throw new Error('Preencha a quantidade inicial.');
    await executeSql('UPDATE amostras_ensaiadas SET finalizado = 1 WHERE id = ?', [id]);
    await LogService.registrar('ensaios', 'ensaiada_finalizada', idUsuario, null, JSON.stringify({ finalizado: 0 }), JSON.stringify({ finalizado: 1 }), null);
  }

  static async finalizarIndeformada(id: string, idUsuario: string): Promise<void> {
    const ai = await queryRows<AmostraIndeformada>('SELECT * FROM amostras_indeformadas WHERE id = ?', [id]);
    if (ai.length === 0) throw new Error('Amostra indeformada nao encontrada.');
    if (ai[0].finalizado === 1) throw new Error('Amostra ja esta finalizada.');
    if (!ai[0].numero_amostra.trim()) throw new Error('Preencha o numero da amostra.');
    if (!ai[0].tipo_indeformada) throw new Error('Preencha o tipo de amostra.');
    if (!ai[0].formato) throw new Error('Preencha o formato.');
    await executeSql('UPDATE amostras_indeformadas SET finalizado = 1 WHERE id = ?', [id]);
    await LogService.registrar('ensaios', 'indeformada_finalizada', idUsuario, null, JSON.stringify({ finalizado: 0 }), JSON.stringify({ finalizado: 1 }), null);
  }

  static async editarAmostraBruta(id: string, dados: RegistrarAmostraBrutaDTO, idUsuario: string): Promise<AmostraBruta> {
    const ab = await queryRows<AmostraBruta>('SELECT * FROM amostras_brutas WHERE id = ?', [id]);
    if (ab.length === 0) throw new Error('Amostra nao encontrada.');
    if (ab[0].finalizado === 1) throw new Error('Amostra ja finalizada, nao pode ser editada.');
    await executeSql(
      `UPDATE amostras_brutas SET numero_identificacao_campo = ?, tipo_amostra = ?, classificacao = ?, metodo_coleta = ?, data_coleta = ?, operador_coleta = ?, profundidade_coleta = ?, descricao = ?, peso_bruto_campo = ?, coordenadas_gps = ? WHERE id = ?`,
      [dados.numeroIdentificacaoCampo, dados.tipoAmostra, dados.classificacao, dados.metodoColeta || null, dados.dataColeta, dados.operadorColeta || null, dados.profundidadeColeta || null, dados.descricao || null, dados.pesoBrutoCampo || null, dados.coordenadasGps || null, id]
    );
    await LogService.registrar('ensaios', 'amostra_bruta_editada', idUsuario, null, null, JSON.stringify({ numero_campo: dados.numeroIdentificacaoCampo }), null);
    return { ...ab[0], ...dados, operador_coleta: dados.operadorColeta || null, profundidade_coleta: dados.profundidadeColeta || null, descricao: dados.descricao || null, peso_bruto_campo: dados.pesoBrutoCampo || null, coordenadas_gps: dados.coordenadasGps || null };
  }

  static async editarPreparada(id: string, dados: PrepararAmostraDTO, idUsuario: string): Promise<AmostraPreparada> {
    const ap = await queryRows<AmostraPreparada>('SELECT * FROM amostras_preparadas WHERE id = ?', [id]);
    if (ap.length === 0) throw new Error('Amostra preparada nao encontrada.');
    if (ap[0].finalizado === 1) throw new Error('Amostra ja finalizada, nao pode ser editada.');
    await executeSql(
      `UPDATE amostras_preparadas SET numero_amostra = ?, descricao_inicial = ?, normatizacao = ?, metodo_preparo = ?, metodo_secagem = ?, data_preparo = ?, id_responsavel_preparo = ?, quantidade_pre_quarteamento = ?, quantidade_pos_quarteamento = ?, observacoes = ? WHERE id = ?`,
      [dados.numeroAmostra, dados.descricaoInicial || null, dados.normatizacao || null, dados.metodoPreparo, dados.metodoSecagem, dados.dataPreparo, dados.idResponsavelPreparo, dados.quantidadePreQuarteamento, dados.quantidadePosQuarteamento, dados.observacoes || null, id]
    );
    await LogService.registrar('ensaios', 'preparada_editada', idUsuario, null, null, JSON.stringify({ numero: dados.numeroAmostra }), null);
    return { ...ap[0], ...dados, descricao_inicial: dados.descricaoInicial || null, normatizacao: dados.normatizacao || null, observacoes: dados.observacoes || null };
  }

  static async editarEnsaiada(id: string, dados: FracionarDTO, idUsuario: string): Promise<AmostraEnsaiada> {
    const ae = await queryRows<AmostraEnsaiada>('SELECT * FROM amostras_ensaiadas WHERE id = ?', [id]);
    if (ae.length === 0) throw new Error('Amostra ensaiada nao encontrada.');
    if (ae[0].finalizado === 1) throw new Error('Amostra ja finalizada, nao pode ser editada.');

    const preparada = await queryRows<{ quantidade_pos_quarteamento: number }>(
      'SELECT quantidade_pos_quarteamento FROM amostras_preparadas WHERE id = ?',
      [ae[0].id_amostra_preparada]
    );
    if (preparada.length > 0) {
      const usadoOutros = await queryRows<{ total: number }>(
        'SELECT COALESCE(SUM(quantidade_inicial), 0) as total FROM amostras_ensaiadas WHERE id_amostra_preparada = ? AND id != ?',
        [ae[0].id_amostra_preparada, id]
      );
      const disponivel = preparada[0].quantidade_pos_quarteamento - (usadoOutros[0]?.total || 0);
      if (dados.quantidadeInicial > disponivel) {
        throw new Error(`Massa indisponivel. Disponivel: ${disponivel}g, ja utilizado por outras fracoes: ${usadoOutros[0]?.total || 0}g.`);
      }
    }

    await executeSql(
      `UPDATE amostras_ensaiadas SET numero_amostra = ?, tipo_ensaio_destino = ?, quantidade_inicial = ?, descricao = ?, observacoes = ? WHERE id = ?`,
      [dados.numeroAmostra, dados.tipoEnsaioDestino, dados.quantidadeInicial, dados.descricao || null, dados.observacoes || null, id]
    );
    await LogService.registrar('ensaios', 'ensaiada_editada', idUsuario, null, null, JSON.stringify({ numero: dados.numeroAmostra }), null);
    return { ...ae[0], ...dados, descricao: dados.descricao || null, observacoes: dados.observacoes || null };
  }

  static async editarIndeformada(id: string, dados: RegistrarIndeformadaDTO, idUsuario: string): Promise<AmostraIndeformada> {
    const ai = await queryRows<AmostraIndeformada>('SELECT * FROM amostras_indeformadas WHERE id = ?', [id]);
    if (ai.length === 0) throw new Error('Amostra indeformada nao encontrada.');
    if (ai[0].finalizado === 1) throw new Error('Amostra ja finalizada, nao pode ser editada.');
    await executeSql(
      `UPDATE amostras_indeformadas SET numero_amostra = ?, tipo_indeformada = ?, formato = ?, altura = ?, largura = ?, comprimento = ?, condicao = ?, observacoes = ? WHERE id = ?`,
      [dados.numeroAmostra, dados.tipoIndeformada, dados.formato, dados.altura || null, dados.largura || null, dados.comprimento || null, dados.condicao || null, dados.observacoes || null, id]
    );
    await LogService.registrar('ensaios', 'indeformada_editada', idUsuario, null, null, JSON.stringify({ numero: dados.numeroAmostra }), null);
    return { ...ai[0], ...dados, altura: dados.altura || null, largura: dados.largura || null, comprimento: dados.comprimento || null, condicao: dados.condicao || null, observacoes: dados.observacoes || null };
  }

  static async listarAmostrasIndeformadas(idAmostraBruta: string): Promise<AmostraIndeformada[]> {
    return queryRows<AmostraIndeformada>(
      'SELECT * FROM amostras_indeformadas WHERE id_amostra_bruta = ? ORDER BY data_criacao DESC',
      [idAmostraBruta]
    );
  }

  /**
   * Rastreabilidade completa de uma amostra bruta.
   */
  static async obterRastreabilidade(idAmostraBruta: string): Promise<Rastreabilidade | null> {
    const query = `
      SELECT
        pesq.id AS pesquisa_id, pesq.titulo AS pesquisa_titulo,
        prog.id AS programa_id, prog.objetivo AS programa_objetivo,
        pt.id AS ponto_id, pt.identificacao_plano,
        ab.numero_identificacao_campo, ab.tipo_amostra, ab.data_coleta, ab.coordenadas_gps, ab.status,
        ap.id AS preparada_id, ap.numero_amostra AS preparada_numero, ap.metodo_preparo,
        ae.id AS ensaiada_id, ae.numero_amostra AS ensaiada_numero, ae.tipo_ensaio_destino,
        ai.id AS indeformada_id, ai.numero_amostra AS indeformada_numero,
        e.id AS ensaio_id, e.tipo_ensaio, e.status AS ensaio_status, e.data_inicio, e.data_fim
      FROM amostras_brutas ab
      INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id
      INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id
      INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
      LEFT JOIN amostras_preparadas ap ON ab.id = ap.id_amostra_bruta
      LEFT JOIN amostras_ensaiadas ae ON ap.id = ae.id_amostra_preparada
      LEFT JOIN amostras_indeformadas ai ON ab.id = ai.id_amostra_bruta
      LEFT JOIN ensaios e ON (ae.id = e.id_amostra_ensaiada OR ai.id = e.id_amostra_indeformada)
      WHERE ab.id = ?
    `;

    const rows = await queryRows<Rastreabilidade>(query, [idAmostraBruta]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async contarAmostrasMes(idUsuario: string): Promise<number> {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
    const rows = await queryRows<{ total: number }>(
      `SELECT COUNT(DISTINCT ab.id) as total
       FROM amostras_brutas ab
       INNER JOIN pontos_coleta pc ON ab.id_ponto_coleta = pc.id
       INNER JOIN programas_amostragem pa ON pc.id_programa_amostragem = pa.id
       INNER JOIN pesquisas p ON pa.id_pesquisa = p.id
       LEFT JOIN pesquisa_colaboradores pcol ON p.id = pcol.id_pesquisa AND pcol.id_usuario = ?
       WHERE (p.id_responsavel = ? OR pcol.id_usuario IS NOT NULL)
         AND ab.data_criacao >= ?`,
      [idUsuario, idUsuario, inicioMes]
    );
    return rows.length > 0 ? rows[0].total : 0;
  }
}
