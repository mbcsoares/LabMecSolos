import { queryRows } from './DatabaseService';

export class UsuarioService {
  static async obterNome(idUsuario: string): Promise<{ nome: string; sobrenome: string } | null> {
    const rows = await queryRows<{ nome: string; sobrenome: string }>(
      'SELECT nome, sobrenome FROM usuarios WHERE id = ?',
      [idUsuario]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}
