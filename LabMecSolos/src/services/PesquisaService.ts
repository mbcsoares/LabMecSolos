import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { getDatabase, queryRows, executeSql } from './DatabaseService';
import { LogService } from './LogService';
import {
  Pesquisa,
  PesquisaResumo,
  CriarPesquisaDTO,
  EditarPesquisaDTO,
} from '../models/types';

export class PesquisaService {
  /**
   * R84: Qualquer usuário ativo pode criar uma pesquisa.
   * O criador torna-se automaticamente o Responsável Principal (R85: fixo).
   */
  static async criar(dados: CriarPesquisaDTO, idUsuario: string): Promise<Pesquisa> {
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO pesquisas (id, titulo, descricao, contexto, descricao_contexto, id_responsavel, status, data_criacao)
       VALUES (?, ?, ?, ?, ?, ?, 'em_andamento', ?)`,
      [id, dados.titulo.trim(), dados.descricao?.trim() || null, dados.contexto, dados.descricaoContexto?.trim() || null, idUsuario, agora]
    );

    await LogService.registrar(
      'ensaios',
      'pesquisa_criada',
      idUsuario,
      null,
      null,
      JSON.stringify({ titulo: dados.titulo, contexto: dados.contexto }),
      null
    );

    return {
      id,
      titulo: dados.titulo,
      descricao: dados.descricao?.trim() || null,
      contexto: dados.contexto,
      descricao_contexto: dados.descricaoContexto?.trim() || null,
      id_responsavel: idUsuario,
      status: 'em_andamento',
      data_inicio: null,
      data_fim: null,
      data_criacao: agora,
      data_atualizacao: null,
      finalizado: 0,
    };
  }

  /**
   * Lista pesquisas do usuário (como responsável ou membro da equipe).
   */
  static async listarPorUsuario(idUsuario: string): Promise<PesquisaResumo[]> {
    const query = `
      SELECT DISTINCT p.*,
        CASE WHEN p.id_responsavel = ? THEN 'responsavel_principal'
             WHEN pc.papel IS NOT NULL THEN pc.papel
             ELSE NULL
        END AS meu_papel
      FROM pesquisas p
      LEFT JOIN pesquisa_colaboradores pc ON p.id = pc.id_pesquisa AND pc.id_usuario = ?
      WHERE p.id_responsavel = ? OR pc.id_usuario = ?
      ORDER BY p.data_criacao DESC
    `;

    return queryRows<PesquisaResumo>(query, [idUsuario, idUsuario, idUsuario, idUsuario]);
  }

  static async obterPorId(idPesquisa: string): Promise<Pesquisa | null> {
    const rows = await queryRows<Pesquisa>('SELECT * FROM pesquisas WHERE id = ?', [idPesquisa]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Obtém o papel do usuário em uma pesquisa específica.
   * Retorna: 'responsavel_principal', 'responsavel_secundario', 'colaborador' ou null.
   */
  static async obterPapelUsuario(idPesquisa: string, idUsuario: string): Promise<string | null> {
    const query = `
      SELECT
        CASE
          WHEN p.id_responsavel = ? THEN 'responsavel_principal'
          WHEN pc.papel IS NOT NULL THEN pc.papel
          ELSE NULL
        END AS papel
      FROM pesquisas p
      LEFT JOIN pesquisa_colaboradores pc ON p.id = pc.id_pesquisa AND pc.id_usuario = ?
      WHERE p.id = ?
    `;

    const rows = await queryRows<{ papel: string | null }>(query, [idUsuario, idUsuario, idPesquisa]);
    return rows.length > 0 ? rows[0].papel : null;
  }

  /**
   * Verifica se o usuário tem permissão para uma ação na pesquisa.
   */
  static async validarPermissao(
    idPesquisa: string,
    idUsuario: string,
    acao: 'editar' | 'gerenciar_equipe' | 'promover' | 'concluir' | 'cancelar' | 'excluir'
  ): Promise<boolean> {
    const papel = await PesquisaService.obterPapelUsuario(idPesquisa, idUsuario);

    const permissoes: Record<string, string[]> = {
      editar: ['responsavel_principal', 'responsavel_secundario'],
      gerenciar_equipe: ['responsavel_principal', 'responsavel_secundario'],
      promover: ['responsavel_principal'],
      concluir: ['responsavel_principal', 'responsavel_secundario'],
      cancelar: ['responsavel_principal', 'responsavel_secundario'],
      excluir: ['responsavel_principal'],
    };

    return papel ? permissoes[acao].includes(papel) : false;
  }

  /**
   * Edita os dados básicos da pesquisa (título, descrição, contexto).
   * R90: Apenas Responsável Principal ou Secundário podem editar.
   * R91: Apenas pesquisas em andamento podem ser editadas.
   */
  static async editar(idPesquisa: string, dados: EditarPesquisaDTO, idUsuario: string): Promise<Pesquisa> {
    const temPermissao = await PesquisaService.validarPermissao(idPesquisa, idUsuario, 'editar');
    if (!temPermissao) {
      throw new Error('Sem permissão para editar esta pesquisa.');
    }

    const rows = await queryRows<Pesquisa>('SELECT * FROM pesquisas WHERE id = ?', [idPesquisa]);
    if (rows.length === 0) {
      throw new Error('Pesquisa não encontrada.');
    }

    if (rows[0].status !== 'em_andamento') {
      throw new Error('Apenas pesquisas em andamento podem ser editadas.');
    }

    const agora = nowISO();
    await executeSql(
      'UPDATE pesquisas SET titulo = ?, descricao = ?, contexto = ?, descricao_contexto = ?, data_atualizacao = ? WHERE id = ?',
      [dados.titulo.trim(), dados.descricao?.trim() || null, dados.contexto, dados.descricaoContexto?.trim() || null, agora, idPesquisa]
    );

    await LogService.registrar(
      'ensaios',
      'pesquisa_editada',
      idUsuario,
      null,
      null,
      JSON.stringify({ titulo: dados.titulo, contexto: dados.contexto }),
      null
    );

    return {
      ...rows[0],
      titulo: dados.titulo,
      descricao: dados.descricao?.trim() || null,
      contexto: dados.contexto,
      descricao_contexto: dados.descricaoContexto?.trim() || null,
      data_atualizacao: agora,
    };
  }

  /**
   * R94: Pesquisa concluída ou cancelada não pode ser reativada.
   */
  static async concluir(idPesquisa: string, idUsuario: string): Promise<void> {
    const temPermissao = await PesquisaService.validarPermissao(idPesquisa, idUsuario, 'concluir');
    if (!temPermissao) {
      throw new Error('Sem permissão para concluir esta pesquisa.');
    }

    const rows = await queryRows<{ status: string }>('SELECT status FROM pesquisas WHERE id = ?', [idPesquisa]);
    if (rows.length === 0) {
      throw new Error('Pesquisa não encontrada.');
    }

    if (rows[0].status !== 'em_andamento') {
      throw new Error('Apenas pesquisas em andamento podem ser concluídas.');
    }

    const agora = nowISO();
    await executeSql(
      "UPDATE pesquisas SET status = 'concluida', data_fim = ?, data_atualizacao = ? WHERE id = ?",
      [agora, agora, idPesquisa]
    );

    await LogService.registrar(
      'ensaios',
      'pesquisa_concluida',
      idUsuario,
      null,
      JSON.stringify({ status: 'em_andamento' }),
      JSON.stringify({ status: 'concluida' }),
      null
    );
  }

  /**
   * Cancela uma pesquisa (motivo obrigatório).
   */
  static async cancelar(idPesquisa: string, motivo: string, idUsuario: string): Promise<void> {
    const temPermissao = await PesquisaService.validarPermissao(idPesquisa, idUsuario, 'cancelar');
    if (!temPermissao) {
      throw new Error('Sem permissão para cancelar esta pesquisa.');
    }

    if (!motivo || motivo.trim().length === 0) {
      throw new Error('Motivo é obrigatório para cancelar uma pesquisa.');
    }

    const db = await getDatabase();
    const pesquisaExiste = await db.query('SELECT id FROM pesquisas WHERE id = ?', [idPesquisa]);
    if (!pesquisaExiste.values || pesquisaExiste.values.length === 0) {
      throw new Error('Pesquisa não encontrada.');
    }

    const agora = nowISO();
    const result = await db.run(
      "UPDATE pesquisas SET status = 'cancelada', data_fim = ?, data_atualizacao = ? WHERE id = ? AND status = 'em_andamento'",
      [agora, agora, idPesquisa]
    );

    if (!result.changes?.changes || result.changes.changes === 0) {
      throw new Error('Apenas pesquisas em andamento podem ser canceladas.');
    }

    await LogService.registrar(
      'ensaios',
      'pesquisa_cancelada',
      idUsuario,
      null,
      JSON.stringify({ status: 'em_andamento' }),
      JSON.stringify({ status: 'cancelada', motivo }),
      null
    );
  }

  static async finalizarPesquisa(idPesquisa: string, idUsuario: string): Promise<void> {
    const pesquisa = await queryRows<Pesquisa>('SELECT * FROM pesquisas WHERE id = ?', [idPesquisa]);
    if (pesquisa.length === 0) throw new Error('Pesquisa nao encontrada.');
    if (pesquisa[0].finalizado === 1) throw new Error('Pesquisa ja esta finalizada.');
    if (!pesquisa[0].titulo.trim()) throw new Error('Preencha o titulo antes de finalizar.');

    await executeSql('UPDATE pesquisas SET finalizado = 1, data_atualizacao = ? WHERE id = ?', [nowISO(), idPesquisa]);
    await LogService.registrar('ensaios', 'pesquisa_finalizada', idUsuario, null,
      JSON.stringify({ finalizado: 0 }), JSON.stringify({ finalizado: 1 }), null);
  }

  /**
   * R96: Apenas o Responsável Principal pode excluir permanentemente.
   */
  static async excluir(idPesquisa: string, idUsuario: string): Promise<void> {
    const temPermissao = await PesquisaService.validarPermissao(idPesquisa, idUsuario, 'excluir');
    if (!temPermissao) {
      throw new Error('Apenas o Responsável Principal pode excluir a pesquisa.');
    }

    const rows = await queryRows<{ titulo: string }>('SELECT titulo FROM pesquisas WHERE id = ?', [idPesquisa]);
    const titulo = rows.length > 0 ? rows[0].titulo : '';

    await executeSql('DELETE FROM pesquisas WHERE id = ?', [idPesquisa]);

    await LogService.registrar(
      'ensaios',
      'pesquisa_excluida',
      idUsuario,
      null,
      null,
      null,
      { titulo }
    );
  }

  /**
   * R86: Responsável Principal pode adicionar colaboradores.
   * R87: Responsável Secundário também pode adicionar.
   * R93: Responsável Principal não pode ser adicionado à tabela pesquisa_colaboradores.
   */
  static async adicionarColaborador(idPesquisa: string, idUsuarioAdicionar: string, idExecutor: string): Promise<void> {
    const temPermissao = await PesquisaService.validarPermissao(idPesquisa, idExecutor, 'gerenciar_equipe');
    if (!temPermissao) {
      throw new Error('Sem permissão para gerenciar a equipe.');
    }

    const pesquisa = await queryRows<{ id_responsavel: string }>('SELECT id_responsavel FROM pesquisas WHERE id = ?', [idPesquisa]);
    if (pesquisa.length > 0 && pesquisa[0].id_responsavel === idUsuarioAdicionar) {
      throw new Error('O Responsável Principal não pode ser adicionado como colaborador.');
    }

    const usuario = await queryRows<{ id: string }>("SELECT id FROM usuarios WHERE id = ? AND status = 'ativo'", [idUsuarioAdicionar]);
    if (usuario.length === 0) {
      throw new Error('Usuário não encontrado ou inativo.');
    }

    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      'INSERT INTO pesquisa_colaboradores (id, id_pesquisa, id_usuario, papel, data_adicao) VALUES (?, ?, ?, ?, ?)',
      [id, idPesquisa, idUsuarioAdicionar, 'colaborador', agora]
    );

    await LogService.registrar(
      'ensaios',
      'colaborador_adicionado',
      idExecutor,
      idUsuarioAdicionar,
      null,
      JSON.stringify({ papel: 'colaborador' }),
      null
    );
  }

  static async removerColaborador(idPesquisa: string, idUsuarioRemover: string, idExecutor: string): Promise<void> {
    const temPermissao = await PesquisaService.validarPermissao(idPesquisa, idExecutor, 'gerenciar_equipe');
    if (!temPermissao) {
      throw new Error('Sem permissão para gerenciar a equipe.');
    }

    await executeSql(
      'DELETE FROM pesquisa_colaboradores WHERE id_pesquisa = ? AND id_usuario = ?',
      [idPesquisa, idUsuarioRemover]
    );

    await LogService.registrar(
      'ensaios',
      'colaborador_removido',
      idExecutor,
      idUsuarioRemover,
      JSON.stringify({ papel: 'colaborador' }),
      null,
      null
    );
  }

  /**
   * R88: Apenas Responsável Principal pode promover a secundário.
   */
  static async promoverSecundario(idPesquisa: string, idUsuario: string, idExecutor: string): Promise<void> {
    const temPermissao = await PesquisaService.validarPermissao(idPesquisa, idExecutor, 'promover');
    if (!temPermissao) {
      throw new Error('Apenas o Responsável Principal pode promover membros.');
    }

    await executeSql(
      "UPDATE pesquisa_colaboradores SET papel = 'responsavel_secundario' WHERE id_pesquisa = ? AND id_usuario = ? AND papel = 'colaborador'",
      [idPesquisa, idUsuario]
    );

    await LogService.registrar(
      'ensaios',
      'colaborador_promovido',
      idExecutor,
      idUsuario,
      JSON.stringify({ papel: 'colaborador' }),
      JSON.stringify({ papel: 'responsavel_secundario' }),
      null
    );
  }

  /**
   * R89: Apenas Responsável Principal pode rebaixar secundário.
   */
  static async rebaixarSecundario(idPesquisa: string, idUsuario: string, idExecutor: string): Promise<void> {
    const temPermissao = await PesquisaService.validarPermissao(idPesquisa, idExecutor, 'promover');
    if (!temPermissao) {
      throw new Error('Apenas o Responsável Principal pode rebaixar membros.');
    }

    await executeSql(
      "UPDATE pesquisa_colaboradores SET papel = 'colaborador' WHERE id_pesquisa = ? AND id_usuario = ? AND papel = 'responsavel_secundario'",
      [idPesquisa, idUsuario]
    );

    await LogService.registrar(
      'ensaios',
      'colaborador_rebaixado',
      idExecutor,
      idUsuario,
      JSON.stringify({ papel: 'responsavel_secundario' }),
      JSON.stringify({ papel: 'colaborador' }),
      null
    );
  }

  static async listarColaboradores(idPesquisa: string): Promise<{ id: string; id_usuario: string; papel: string; nome?: string; sobrenome?: string }[]> {
    const query = `
      SELECT pc.*, u.nome, u.sobrenome
      FROM pesquisa_colaboradores pc
      INNER JOIN usuarios u ON pc.id_usuario = u.id
      WHERE pc.id_pesquisa = ?
      ORDER BY pc.papel DESC, u.nome ASC
    `;
    return queryRows(query, [idPesquisa]);
  }

  static async listarProgramas(idPesquisa: string): Promise<any[]> {
    return queryRows(
      'SELECT * FROM programas_amostragem WHERE id_pesquisa = ? ORDER BY data_criacao DESC',
      [idPesquisa]
    );
  }

  static async listarAmostrasBrutas(idPesquisa: string): Promise<any[]> {
    return queryRows(
      `SELECT ab.*, pc.identificacao_plano AS ponto_plano
       FROM amostras_brutas ab
       INNER JOIN pontos_coleta pc ON ab.id_ponto_coleta = pc.id
       INNER JOIN programas_amostragem pa ON pc.id_programa_amostragem = pa.id
       WHERE pa.id_pesquisa = ?
       ORDER BY ab.data_coleta DESC`,
      [idPesquisa]
    );
  }

  static async listarEnsaios(idPesquisa: string): Promise<any[]> {
    return queryRows(
      `SELECT e.*,
              COALESCE(ae.numero_amostra, ai.numero_amostra) AS amostra_numero,
              COALESCE(ab1.numero_identificacao_campo, ab2.numero_identificacao_campo) AS amostra_campo
       FROM ensaios e
       LEFT JOIN amostras_ensaiadas ae ON e.id_amostra_ensaiada = ae.id
       LEFT JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id
       LEFT JOIN amostras_brutas ab1 ON ap.id_amostra_bruta = ab1.id
       LEFT JOIN amostras_indeformadas ai ON e.id_amostra_indeformada = ai.id
       LEFT JOIN amostras_brutas ab2 ON ai.id_amostra_bruta = ab2.id
       INNER JOIN pontos_coleta pc ON (ab1.id_ponto_coleta = pc.id OR ab2.id_ponto_coleta = pc.id)
       INNER JOIN programas_amostragem pa ON pc.id_programa_amostragem = pa.id
       WHERE pa.id_pesquisa = ?
       ORDER BY e.data_criacao DESC`,
      [idPesquisa]
    );
  }
}
