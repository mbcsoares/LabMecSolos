import bcrypt from 'bcryptjs';
import { getDatabase, executeSql } from './DatabaseService';
import { nowISO } from '../utils/dateUtils';
import { SECURITY_CONFIG } from '../config/security.config';

export class SenhaService {
  static validarForcaSenha(senha: string): { valida: boolean; erros: string[] } {
    const erros: string[] = [];

    if (senha.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      erros.push(`A senha deve ter no minimo ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} caracteres.`);
    }
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(senha)) {
      erros.push('A senha deve conter pelo menos 1 letra maiuscula.');
    }
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(senha)) {
      erros.push('A senha deve conter pelo menos 1 letra minuscula.');
    }
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(senha)) {
      erros.push('A senha deve conter pelo menos 1 numero.');
    }

    return { valida: erros.length === 0, erros };
  }

  static async gerarHash(senha: string): Promise<string> {
    return bcrypt.hash(senha, SECURITY_CONFIG.BCRYPT_SALT_ROUNDS);
  }

  static async verificarSenha(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  static async alterarSenha(
    idUsuario: string,
    senhaAtual: string,
    novaSenha: string
  ): Promise<{ sucesso: boolean; erro?: string }> {
    const db = await getDatabase();
    const resultado = await db.query('SELECT senha_hash FROM usuarios WHERE id = ?', [idUsuario]);

    if (!resultado.values || resultado.values.length === 0) {
      return { sucesso: false, erro: 'Usuario nao encontrado.' };
    }

    const senhaCorreta = await this.verificarSenha(senhaAtual, resultado.values[0].senha_hash);
    if (!senhaCorreta) {
      return { sucesso: false, erro: 'Senha atual incorreta.' };
    }

    const validacao = this.validarForcaSenha(novaSenha);
    if (!validacao.valida) {
      return { sucesso: false, erro: validacao.erros.join(' ') };
    }

    const novoHash = await this.gerarHash(novaSenha);
    await executeSql(
      'UPDATE usuarios SET senha_hash = ?, data_atualizacao = ? WHERE id = ?',
      [novoHash, nowISO(), idUsuario]
    );

    return { sucesso: true };
  }
}
