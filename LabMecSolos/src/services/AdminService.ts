import { queryRows, executeSql } from './DatabaseService';
import { LogService } from './LogService';
import { ValidacaoAdminService } from './ValidacaoAdminService';
import { SenhaService } from './SenhaService';
import { nowISO } from '../utils/dateUtils';
import type {
  FiltrosUsuario,
  UsuarioListItem,
  UsuarioDetalhado,
  OperacaoResult,
  LogSistema,
} from '../models/types';

export class AdminService {
  static async listarUsuarios(
    pagina: number,
    filtros: FiltrosUsuario,
    busca?: string
  ): Promise<{ usuarios: UsuarioListItem[]; total: number }> {
    const itensPorPagina = 20;
    const offset = (pagina - 1) * itensPorPagina;

    const condicoes: string[] = [];
    const params: (string | null)[] = [];

    condicoes.push('(status = ? OR ? IS NULL)');
    params.push(filtros.status, filtros.status);

    condicoes.push('(perfil = ? OR ? IS NULL)');
    params.push(filtros.perfil, filtros.perfil);

    condicoes.push('(permissao = ? OR ? IS NULL)');
    params.push(filtros.permissao, filtros.permissao);

    condicoes.push('(genero = ? OR ? IS NULL)');
    params.push(filtros.genero, filtros.genero);

    if (busca && busca.trim().length > 0) {
      condicoes.push(`(
        ? IS NULL
        OR nome LIKE '%' || ? || '%'
        OR sobrenome LIKE '%' || ? || '%'
        OR matricula LIKE '%' || ? || '%'
        OR email LIKE '%' || ? || '%'
      )`);
      const termoBusca = busca.trim();
      params.push(termoBusca, termoBusca, termoBusca, termoBusca, termoBusca);
    } else {
      condicoes.push('? IS NULL');
      params.push(null);
    }

    const whereClause = condicoes.join(' AND ');

    const queryTotal = `SELECT COUNT(*) as total FROM usuarios WHERE ${whereClause}`;
    const resultadoTotal = await queryRows<{ total: number }>(queryTotal, params);
    const total = resultadoTotal.length > 0 ? resultadoTotal[0].total : 0;

    const queryDados = `
      SELECT id, nome, sobrenome, matricula, perfil, permissao, status
      FROM usuarios
      WHERE ${whereClause}
      ORDER BY nome ASC
      LIMIT ? OFFSET ?
    `;
    const paramsDados: (string | number | null)[] = [...params, itensPorPagina, offset];
    const usuarios = await queryRows<UsuarioListItem>(queryDados, paramsDados);

    return { usuarios, total };
  }

  static async obterDetalhesUsuario(idUsuario: string): Promise<UsuarioDetalhado | null> {
    const rows = await queryRows<UsuarioDetalhado>(
      `SELECT id, nome, sobrenome, genero, matricula, email, perfil, permissao, status,
              data_criacao, data_atualizacao, data_exclusao
       FROM usuarios WHERE id = ?`,
      [idUsuario]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async concederColaborador(
    idUsuario: string,
    idChefeExecutor: string,
    senhaChefe: string
  ): Promise<OperacaoResult> {
    const chefeValido = await this.validarSenhaChefe(idChefeExecutor, senhaChefe);
    if (!chefeValido) {
      return { sucesso: false, erro: 'Senha incorreta.' };
    }

    const validacao = await ValidacaoAdminService.validarConcessaoColaborador(idUsuario);
    if (!validacao.valido) {
      return { sucesso: false, erro: validacao.erro };
    }

    const agora = nowISO();
    await executeSql(
      "UPDATE usuarios SET permissao = 'colaborador', data_atualizacao = ? WHERE id = ?",
      [agora, idUsuario]
    );

    await LogService.registrar(
      'administracao',
      'permissao_concedida',
      idChefeExecutor,
      idUsuario,
      JSON.stringify({ permissao: 'comum' }),
      JSON.stringify({ permissao: 'colaborador' }),
      null
    );

    return { sucesso: true };
  }

  static async concederChefia(
    idUsuario: string,
    idChefeExecutor: string,
    senhaChefe: string
  ): Promise<OperacaoResult> {
    const chefeValido = await this.validarSenhaChefe(idChefeExecutor, senhaChefe);
    if (!chefeValido) {
      return { sucesso: false, erro: 'Senha incorreta.' };
    }

    const validacao = await ValidacaoAdminService.validarConcessaoChefia(idUsuario);
    if (!validacao.valido) {
      return { sucesso: false, erro: validacao.erro };
    }

    const agora = nowISO();
    await executeSql(
      "UPDATE usuarios SET permissao = 'chefia', data_atualizacao = ? WHERE id = ?",
      [agora, idUsuario]
    );

    await LogService.registrar(
      'administracao',
      'chefia_concedida',
      idChefeExecutor,
      idUsuario,
      JSON.stringify({ permissao: 'comum' }),
      JSON.stringify({ permissao: 'chefia' }),
      null
    );

    return { sucesso: true };
  }

  static async revogarColaborador(
    idUsuario: string,
    idChefeExecutor: string,
    senhaChefe: string
  ): Promise<OperacaoResult> {
    const chefeValido = await this.validarSenhaChefe(idChefeExecutor, senhaChefe);
    if (!chefeValido) {
      return { sucesso: false, erro: 'Senha incorreta.' };
    }

    const usuario = await queryRows<{ permissao: string }>(
      "SELECT permissao FROM usuarios WHERE id = ? AND permissao = 'colaborador'",
      [idUsuario]
    );

    if (usuario.length === 0) {
      return { sucesso: false, erro: 'Este usuario nao possui permissao de colaborador.' };
    }

    const agora = nowISO();
    await executeSql(
      "UPDATE usuarios SET permissao = 'comum', data_atualizacao = ? WHERE id = ?",
      [agora, idUsuario]
    );

    await LogService.registrar(
      'administracao',
      'permissao_revogada',
      idChefeExecutor,
      idUsuario,
      JSON.stringify({ permissao: 'colaborador' }),
      JSON.stringify({ permissao: 'comum' }),
      null
    );

    return { sucesso: true };
  }

  static async transferirChefia(
    idChefeOrigem: string,
    idProfessorDestino: string,
    idChefeLogado: string,
    senhaChefe: string
  ): Promise<OperacaoResult> {
    const chefeValido = await this.validarSenhaChefe(idChefeLogado, senhaChefe);
    if (!chefeValido) {
      return { sucesso: false, erro: 'Senha incorreta.' };
    }

    const validacao = await ValidacaoAdminService.validarTransferenciaChefia(
      idChefeOrigem,
      idProfessorDestino,
      idChefeLogado
    );

    if (!validacao.valido) {
      return { sucesso: false, erro: validacao.erro };
    }

    if (validacao.alerta) {
      return { sucesso: true, alerta: validacao.alerta };
    }

    await this.executarTransferencia(idChefeOrigem, idProfessorDestino, idChefeLogado);

    return { sucesso: true };
  }

  private static async executarTransferencia(
    idChefeOrigem: string,
    idProfessorDestino: string,
    idChefeLogado: string
  ): Promise<void> {
    const agora = nowISO();

    await executeSql(
      "UPDATE usuarios SET permissao = 'comum', data_atualizacao = ? WHERE id = ?",
      [agora, idChefeOrigem]
    );

    await executeSql(
      "UPDATE usuarios SET permissao = 'chefia', data_atualizacao = ? WHERE id = ?",
      [agora, idProfessorDestino]
    );

    await LogService.registrar(
      'administracao',
      'chefia_transferida',
      idChefeLogado,
      idProfessorDestino,
      JSON.stringify({
        origem: { id: idChefeOrigem, permissao: 'chefia' },
        destino: { id: idProfessorDestino, permissao: 'comum' },
      }),
      JSON.stringify({
        origem: { id: idChefeOrigem, permissao: 'comum' },
        destino: { id: idProfessorDestino, permissao: 'chefia' },
      }),
      {
        id_chefe_origem: idChefeOrigem,
        id_professor_destino: idProfessorDestino,
        id_chefe_executor: idChefeLogado,
      }
    );
  }

  static async obterChefesAtuais(): Promise<UsuarioListItem[]> {
    return queryRows<UsuarioListItem>(
      "SELECT id, nome, sobrenome, matricula, perfil, permissao, status FROM usuarios WHERE permissao = 'chefia' AND status = 'ativo' ORDER BY nome ASC"
    );
  }

  static async obterProfessoresElegiveis(): Promise<UsuarioListItem[]> {
    return queryRows<UsuarioListItem>(
      `SELECT id, nome, sobrenome, matricula, perfil, permissao, status
       FROM usuarios
       WHERE perfil = 'professor'
         AND status = 'ativo'
         AND permissao <> 'chefia'
       ORDER BY nome ASC`
    );
  }

  static async ativarUsuario(
    idUsuario: string,
    idChefeExecutor: string
  ): Promise<OperacaoResult> {
    const usuario = await queryRows<{ status: string }>(
      "SELECT status FROM usuarios WHERE id = ? AND status = 'inativo'",
      [idUsuario]
    );

    if (usuario.length === 0) {
      return { sucesso: false, erro: 'Usuario nao encontrado ou ja esta ativo.' };
    }

    const agora = nowISO();
    await executeSql(
      "UPDATE usuarios SET status = 'ativo', data_atualizacao = ? WHERE id = ?",
      [agora, idUsuario]
    );

    await LogService.registrar(
      'administracao',
      'status_ativado',
      idChefeExecutor,
      idUsuario,
      JSON.stringify({ status: 'inativo' }),
      JSON.stringify({ status: 'ativo' }),
      null
    );

    return { sucesso: true };
  }

  static async desativarUsuario(
    idUsuario: string,
    idChefeExecutor: string,
    senhaChefe: string
  ): Promise<OperacaoResult> {
    const chefeValido = await this.validarSenhaChefe(idChefeExecutor, senhaChefe);
    if (!chefeValido) {
      return { sucesso: false, erro: 'Senha incorreta.' };
    }

    const validacaoProtecao = await ValidacaoAdminService.validarContaProtegida(idUsuario);
    if (!validacaoProtecao.valido) {
      return { sucesso: false, erro: validacaoProtecao.erro };
    }

    const usuario = await queryRows<{ status: string }>(
      "SELECT status FROM usuarios WHERE id = ? AND status = 'ativo'",
      [idUsuario]
    );

    if (usuario.length === 0) {
      return { sucesso: false, erro: 'Usuario nao encontrado ou ja esta inativo/excluido.' };
    }

    const agora = nowISO();
    await executeSql(
      "UPDATE usuarios SET status = 'inativo', data_atualizacao = ? WHERE id = ?",
      [agora, idUsuario]
    );

    await LogService.registrar(
      'administracao',
      'status_desativado',
      idChefeExecutor,
      idUsuario,
      JSON.stringify({ status: 'ativo' }),
      JSON.stringify({ status: 'inativo' }),
      null
    );

    return { sucesso: true };
  }

  static async excluirUsuario(
    idUsuario: string,
    idChefeExecutor: string,
    senhaChefe: string
  ): Promise<OperacaoResult> {
    const chefeValido = await this.validarSenhaChefe(idChefeExecutor, senhaChefe);
    if (!chefeValido) {
      return { sucesso: false, erro: 'Senha incorreta.' };
    }

    const validacaoProtecao = await ValidacaoAdminService.validarContaProtegida(idUsuario);
    if (!validacaoProtecao.valido) {
      return { sucesso: false, erro: validacaoProtecao.erro };
    }

    const usuario = await queryRows<{ status: string }>(
      "SELECT status FROM usuarios WHERE id = ? AND status <> 'excluido'",
      [idUsuario]
    );

    if (usuario.length === 0) {
      return { sucesso: false, erro: 'Usuario nao encontrado ou ja esta excluido.' };
    }

    const statusAnterior = usuario[0].status;
    const agora = nowISO();

    await executeSql(
      "UPDATE usuarios SET status = 'excluido', data_exclusao = ?, data_atualizacao = ? WHERE id = ?",
      [agora, agora, idUsuario]
    );

    await LogService.registrar(
      'administracao',
      'conta_excluida_chefia',
      idChefeExecutor,
      idUsuario,
      JSON.stringify({ status: statusAnterior }),
      JSON.stringify({ status: 'excluido' }),
      null
    );

    return { sucesso: true };
  }

  static async obterHistoricoUsuario(
    idUsuario: string,
    pagina: number
  ): Promise<{ logs: LogSistema[]; total: number }> {
    return LogService.buscarPorUsuario(
      idUsuario,
      ['autenticacao', 'administracao'],
      pagina,
      20
    );
  }

  static async validarSenhaChefe(idChefe: string, senha: string): Promise<boolean> {
    const rows = await queryRows<{ senha_hash: string }>(
      'SELECT senha_hash FROM usuarios WHERE id = ?',
      [idChefe]
    );

    if (rows.length === 0) return false;

    return SenhaService.verificarSenha(senha, rows[0].senha_hash);
  }
}
