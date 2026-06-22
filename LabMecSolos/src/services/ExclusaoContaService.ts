import { getDatabase } from './DatabaseService';
import { SenhaService } from './SenhaService';
import { LogService } from './LogService';
import { nowISO } from '../utils/dateUtils';

export class ExclusaoContaService {
  static async excluirConta(
    idUsuario: string,
    senha: string
  ): Promise<{ sucesso: boolean; erro?: string }> {
    const db = await getDatabase();
    const usuario = await db.query('SELECT * FROM usuarios WHERE id = ?', [idUsuario]);

    if (!usuario.values || usuario.values.length === 0) {
      return { sucesso: false, erro: 'Usuario nao encontrado.' };
    }

    const dados = usuario.values[0];

    if (dados.status === 'excluido') {
      return { sucesso: false, erro: 'Conta ja excluida.' };
    }

    const senhaCorreta = await SenhaService.verificarSenha(senha, dados.senha_hash);
    if (!senhaCorreta) {
      return { sucesso: false, erro: 'Senha incorreta.' };
    }

    const agora = nowISO();
    await db.run(
      'UPDATE usuarios SET status = ?, data_exclusao = ?, data_atualizacao = ? WHERE id = ?',
      ['excluido', agora, agora, idUsuario]
    );

    await db.run('DELETE FROM sessoes WHERE id_usuario = ?', [idUsuario]);

    await LogService.registrar('autenticacao', 'exclusao_conta', idUsuario, null, null, null, {});

    return { sucesso: true };
  }
}
