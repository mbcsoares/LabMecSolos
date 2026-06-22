import { SenhaService } from './SenhaService';
import { LoginService } from './LoginService';
import { SessionService } from './SessionService';
import { LogService } from './LogService';
import { queryRows, executeSql } from './DatabaseService';
import { nowISO } from '../utils/dateUtils';
import { Usuario, SessionData } from '../models/types';

export interface LoginResult {
  success: boolean;
  message: string;
  user?: SessionData;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  if (!email || !password) {
    return { success: false, message: 'Preencha todos os campos.' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const bloqueio = LoginService.verificarBloqueio(normalizedEmail);
  if (bloqueio.bloqueado) {
    return {
      success: false,
      message: `Conta bloqueada por excesso de tentativas. Tente novamente em ${bloqueio.minutosRestantes} minuto(s).`,
    };
  }

  try {
    const rows = await queryRows<Usuario>(
      'SELECT * FROM usuarios WHERE email = ?',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      LoginService.registrarTentativa(normalizedEmail, false);
      await LogService.registrar('autenticacao', 'login_falha', null, null, null, null, { email: normalizedEmail, motivo: 'email_nao_encontrado' });
      return { success: false, message: 'E-mail ou senha invalidos.' };
    }

    const user = rows[0];

    if (user.status === 'excluido') {
      return { success: false, message: 'Esta conta foi excluida e nao pode ser acessada.' };
    }

    if (user.status === 'inativo') {
      return { success: false, message: 'Esta conta esta desativada. Contate a chefia do laboratorio.' };
    }

    const passwordValid = await SenhaService.verificarSenha(password, user.senha_hash);

    if (!passwordValid) {
      LoginService.registrarTentativa(normalizedEmail, false);
      await LogService.registrar('autenticacao', 'login_falha', user.id, null, null, null, { motivo: 'senha_incorreta' });
      return { success: false, message: 'E-mail ou senha invalidos.' };
    }

    await SessionService.criarSessao(user.id);
    LoginService.registrarTentativa(normalizedEmail, true);
    await LogService.registrar('autenticacao', 'login_sucesso', user.id, null, null, null, {});

    const sessionData: SessionData = {
      userId: user.id,
      nome: user.nome,
      sobrenome: user.sobrenome,
      email: user.email,
      perfil: user.perfil,
      permissao: user.permissao,
    };

    return { success: true, message: 'Login realizado com sucesso.', user: sessionData };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, message: 'Erro ao acessar o banco de dados. Tente novamente.' };
  }
}

export async function logout(): Promise<void> {
  const session = await SessionService.validateSession();
  if (session) {
    await LogService.registrar('autenticacao', 'logout', session.userId, null, null, null, {});
  }
  await SessionService.destroySession();
}

export async function checkSession(): Promise<SessionData | null> {
  return SessionService.validateSession();
}

export async function updateProfile(
  userId: string,
  nome: string,
  sobrenome: string,
  genero: string
): Promise<{ success: boolean; message: string }> {
  if (!nome || !sobrenome) {
    return { success: false, message: 'Nome e sobrenome sao obrigatorios.' };
  }

  const generosValidos = ['masculino', 'feminino', 'nao_informado'];
  if (!generosValidos.includes(genero)) {
    return { success: false, message: 'Genero invalido.' };
  }

  try {
    await executeSql(
      'UPDATE usuarios SET nome = ?, sobrenome = ?, genero = ?, data_atualizacao = ? WHERE id = ?',
      [nome.trim(), sobrenome.trim(), genero, nowISO(), userId]
    );

    await LogService.registrar('autenticacao', 'edicao_perfil', userId, null, null, null, { nome, sobrenome, genero });

    return { success: true, message: 'Perfil atualizado com sucesso.' };
  } catch (err) {
    console.error('Update profile error:', err);
    return { success: false, message: 'Erro ao acessar o banco de dados. Tente novamente.' };
  }
}
