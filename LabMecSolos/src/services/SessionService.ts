import { Preferences } from '@capacitor/preferences';
import { generateUUID } from '../utils/idUtils';
import { nowISO, expiresInDays } from '../utils/dateUtils';
import { getDatabase, queryRows } from './DatabaseService';
import { SECURITY_CONFIG } from '../config/security.config';
import { SessionData } from '../models/types';

const TOKEN_KEY = 'session_token';

export class SessionService {
  private static readonly VALIDADE_DIAS = SECURITY_CONFIG.SESSION_DURATION_DAYS;

  static async criarSessao(idUsuario: string): Promise<string> {
    const db = await getDatabase();
    const id = generateUUID();
    const token = generateUUID();
    const dataCriacao = nowISO();
    const dataExpiracao = expiresInDays(this.VALIDADE_DIAS);

    await db.run(
      'INSERT INTO sessoes (id, id_usuario, token, data_criacao, data_expiracao) VALUES (?, ?, ?, ?, ?)',
      [id, idUsuario, token, dataCriacao, dataExpiracao]
    );

    await Preferences.set({ key: TOKEN_KEY, value: token });

    return token;
  }

  static async verificarSessao(token: string): Promise<boolean> {
    const db = await getDatabase();
    const resultado = await db.query(
      'SELECT * FROM sessoes WHERE token = ? AND data_expiracao > ?',
      [token, nowISO()]
    );
    return resultado.values !== undefined && resultado.values.length > 0;
  }

  static async buscarUsuarioPorSessao(token: string): Promise<SessionData | null> {
    const rows = await queryRows<SessionData>(
      `SELECT u.id as userId, u.nome, u.sobrenome, u.email, u.perfil, u.permissao
       FROM usuarios u
       INNER JOIN sessoes s ON u.id = s.id_usuario
       WHERE s.token = ? AND s.data_expiracao > ? AND u.status = 'ativo'`,
      [token, nowISO()]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  static async validateSession(): Promise<SessionData | null> {
    const { value: token } = await Preferences.get({ key: TOKEN_KEY });
    if (!token) return null;

    const isValid = await this.verificarSessao(token);
    if (!isValid) {
      await Preferences.remove({ key: TOKEN_KEY });
      return null;
    }

    const user = await this.buscarUsuarioPorSessao(token);
    if (!user) {
      await this.destroySession();
      return null;
    }

    return user;
  }

  static async destroySession(): Promise<void> {
    const { value: token } = await Preferences.get({ key: TOKEN_KEY });
    if (token) {
      const db = await getDatabase();
      await db.run('DELETE FROM sessoes WHERE token = ?', [token]);
    }
    await Preferences.remove({ key: TOKEN_KEY });
  }
}
