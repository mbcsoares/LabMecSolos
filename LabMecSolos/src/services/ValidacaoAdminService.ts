import { queryRows } from './DatabaseService';

export class ValidacaoAdminService {
  static async validarAcessoChefia(idUsuario: string): Promise<boolean> {
    const rows = await queryRows<{ permissao: string }>(
      "SELECT permissao FROM usuarios WHERE id = ? AND status = 'ativo'",
      [idUsuario]
    );
    return rows.length > 0 && rows[0].permissao === 'chefia';
  }

  static async validarContaProtegida(idUsuario: string): Promise<{ valido: boolean; erro?: string }> {
    const rows = await queryRows<{ permissao: string }>(
      'SELECT permissao FROM usuarios WHERE id = ?',
      [idUsuario]
    );

    if (rows.length === 0) {
      return { valido: false, erro: 'Usuario nao encontrado.' };
    }

    if (rows[0].permissao === 'chefia') {
      return {
        valido: false,
        erro: 'Contas de chefia nao podem ser desativadas ou excluidas. Transfira a chefia primeiro.',
      };
    }

    return { valido: true };
  }

  static async validarDestinatarioChefia(idDestinatario: string): Promise<{ valido: boolean; erro?: string }> {
    const rows = await queryRows<{ perfil: string; status: string; permissao: string }>(
      'SELECT perfil, status, permissao FROM usuarios WHERE id = ?',
      [idDestinatario]
    );

    if (rows.length === 0) {
      return { valido: false, erro: 'Usuario destinatario nao encontrado.' };
    }

    const usuario = rows[0];

    if (usuario.perfil !== 'professor') {
      return { valido: false, erro: 'Apenas professores podem receber a permissao de chefia.' };
    }

    if (usuario.status !== 'ativo') {
      return { valido: false, erro: 'O destinatario deve estar com status ativo.' };
    }

    if (usuario.permissao === 'chefia') {
      return { valido: false, erro: 'Este professor ja possui permissao de chefia.' };
    }

    return { valido: true };
  }

  static async validarConcessaoColaborador(idUsuario: string): Promise<{ valido: boolean; erro?: string }> {
    const rows = await queryRows<{ status: string; permissao: string }>(
      'SELECT status, permissao FROM usuarios WHERE id = ?',
      [idUsuario]
    );

    if (rows.length === 0) {
      return { valido: false, erro: 'Usuario nao encontrado.' };
    }

    const usuario = rows[0];

    if (usuario.status !== 'ativo') {
      return { valido: false, erro: 'Apenas usuarios ativos podem receber permissao de colaborador.' };
    }

    if (usuario.permissao !== 'comum') {
      return { valido: false, erro: 'Este usuario ja possui uma permissao especial.' };
    }

    return { valido: true };
  }

  static async validarTransferenciaChefia(
    idChefeOrigem: string,
    idProfessorDestino: string,
    idChefeLogado: string
  ): Promise<{ valido: boolean; alerta?: string; erro?: string }> {
    const validacaoDestino = await this.validarDestinatarioChefia(idProfessorDestino);
    if (!validacaoDestino.valido) {
      return validacaoDestino;
    }

    const totalChefes = await this.contarChefesAtivos();

    if (totalChefes === 1 && idChefeOrigem === idChefeLogado) {
      return {
        valido: true,
        alerta: 'Voce e o unico chefe. Apos a transferencia, voce perdera o acesso a este modulo. Deseja continuar?',
      };
    }

    if (totalChefes >= 2) {
      const origemEhChefe = await queryRows<{ permissao: string }>(
        "SELECT permissao FROM usuarios WHERE id = ? AND permissao = 'chefia'",
        [idChefeOrigem]
      );

      if (origemEhChefe.length === 0) {
        return {
          valido: false,
          erro: 'A origem da transferencia deve ser um chefe atual.',
        };
      }
    }

    return { valido: true };
  }

  static async validarConcessaoChefia(idUsuario: string): Promise<{ valido: boolean; erro?: string }> {
    const validacaoDestino = await this.validarDestinatarioChefia(idUsuario);
    if (!validacaoDestino.valido) {
      return validacaoDestino;
    }

    const totalChefes = await this.contarChefesAtivos();

    if (totalChefes >= 2) {
      return {
        valido: false,
        erro: 'Ja existem 2 chefes. Use a transferencia de chefia para substituir um deles.',
      };
    }

    return { valido: true };
  }

  static async contarChefesAtivos(): Promise<number> {
    const rows = await queryRows<{ total: number }>(
      "SELECT COUNT(*) as total FROM usuarios WHERE permissao = 'chefia' AND status = 'ativo'"
    );
    return rows.length > 0 ? rows[0].total : 0;
  }
}
