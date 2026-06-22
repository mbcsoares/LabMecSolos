import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { getDatabase } from './DatabaseService';
import { SECURITY_CONFIG } from '../config/security.config';

export class CodigoVerificacaoService {
  private static readonly VALIDADE_MINUTOS = SECURITY_CONFIG.VERIFICATION_CODE_EXPIRY_MINUTES;
  private static readonly MAX_REENVIOS = SECURITY_CONFIG.MAX_CODE_RESENDS;

  static gerarCodigo(): string {
    const length = SECURITY_CONFIG.VERIFICATION_CODE_LENGTH;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  static calcularExpiracao(): string {
    const expiracao = new Date();
    expiracao.setMinutes(expiracao.getMinutes() + this.VALIDADE_MINUTOS);
    return expiracao.toISOString();
  }

  static async salvarCodigo(email: string, codigo: string, tipo: 'confirmacao_conta' | 'redefinicao_senha'): Promise<void> {
    const db = await getDatabase();
    const id = generateUUID();
    const dataCriacao = nowISO();
    const dataExpiracao = this.calcularExpiracao();

    await db.run(
      'INSERT INTO codigos_verificacao (id, email, codigo, tipo, data_criacao, data_expiracao) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email, codigo, tipo, dataCriacao, dataExpiracao]
    );
  }

  static async verificarCodigo(
    email: string,
    codigo: string,
    tipo: 'confirmacao_conta' | 'redefinicao_senha'
  ): Promise<{ valido: boolean; erro?: string }> {
    const db = await getDatabase();
    const resultado = await db.query(
      `SELECT * FROM codigos_verificacao
       WHERE email = ? AND codigo = ? AND tipo = ? AND usado = 0
       ORDER BY data_criacao DESC
       LIMIT 1`,
      [email, codigo, tipo]
    );

    if (!resultado.values || resultado.values.length === 0) {
      return { valido: false, erro: 'Codigo invalido.' };
    }

    const registro = resultado.values[0];

    if (new Date(registro.data_expiracao) < new Date()) {
      return { valido: false, erro: 'Codigo expirado. Solicite um novo.' };
    }

    await db.run('UPDATE codigos_verificacao SET usado = 1 WHERE id = ?', [registro.id]);

    return { valido: true };
  }

  static podeReenviar(reenvios: number): boolean {
    return reenvios < this.MAX_REENVIOS;
  }
}
