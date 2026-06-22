import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { getDatabase, queryRows } from './DatabaseService';
import { ValidacaoService } from './ValidacaoService';
import { SenhaService } from './SenhaService';
import { CodigoVerificacaoService } from './CodigoVerificacaoService';
import { LogService } from './LogService';
import { PreCadastro, Usuario } from '../models/types';

export class CadastroService {
  static async criarPreCadastro(dados: {
    nome: string;
    sobrenome: string;
    genero: string;
    matricula: string;
    email: string;
    senha: string;
    perfil: string;
  }): Promise<{ sucesso: boolean; erro?: string; codigo?: string }> {
    const validacao = ValidacaoService.validarFormularioCadastro({
      ...dados,
      confirmarSenha: dados.senha,
    });

    if (!validacao.valido) {
      return { sucesso: false, erro: Object.values(validacao.erros).join(' ') };
    }

    const db = await getDatabase();

    const existe = await db.query(
      `SELECT id FROM usuarios WHERE (matricula = ? OR email = ?) AND status IN ('ativo', 'inativo')`,
      [dados.matricula, dados.email]
    );

    if (existe.values && existe.values.length > 0) {
      return { sucesso: false, erro: 'Matricula ou e-mail ja cadastrados no sistema.' };
    }

    await db.run('DELETE FROM pre_cadastro WHERE email = ? OR matricula = ?', [
      dados.email,
      dados.matricula,
    ]);

    const senhaHash = await SenhaService.gerarHash(dados.senha);
    const codigo = CodigoVerificacaoService.gerarCodigo();
    const agora = nowISO();
    const expiracao = CodigoVerificacaoService.calcularExpiracao();

    const preId = generateUUID();
    await db.run(
      `INSERT INTO pre_cadastro (id, nome, sobrenome, genero, matricula, email, senha_hash, perfil, codigo_verificacao, data_criacao, data_expiracao_codigo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [preId, dados.nome, dados.sobrenome, dados.genero, dados.matricula, dados.email, senhaHash, dados.perfil, codigo, agora, expiracao]
    );

    await CodigoVerificacaoService.salvarCodigo(dados.email, codigo, 'confirmacao_conta');

    return { sucesso: true, codigo };
  }

  static async confirmarConta(
    email: string,
    codigo: string
  ): Promise<{ sucesso: boolean; erro?: string }> {
    const verificacao = await CodigoVerificacaoService.verificarCodigo(email, codigo, 'confirmacao_conta');
    if (!verificacao.valido) {
      return { sucesso: false, erro: verificacao.erro };
    }

    const db = await getDatabase();
    const preCadastro = await db.query('SELECT * FROM pre_cadastro WHERE email = ?', [email]);
    if (!preCadastro.values || preCadastro.values.length === 0) {
      return { sucesso: false, erro: 'Pre-cadastro nao encontrado. Refaca o cadastro.' };
    }

    const dados = preCadastro.values[0];

    const validacaoRecriacao = await validarRecriacao(dados.matricula, dados.email);
    if (!validacaoRecriacao.valido) {
      return { sucesso: false, erro: validacaoRecriacao.erro };
    }

    const agora = nowISO();
    await db.run(
      `INSERT INTO usuarios (id, nome, sobrenome, genero, matricula, email, senha_hash, perfil, permissao, status, data_criacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'comum', 'ativo', ?)`,
      [generateUUID(), dados.nome, dados.sobrenome, dados.genero, dados.matricula, dados.email, dados.senha_hash, dados.perfil, agora]
    );

    await db.run('DELETE FROM pre_cadastro WHERE email = ?', [email]);

    await LogService.registrar('autenticacao', 'confirmacao_conta', null, null, null, null, { email });

    return { sucesso: true };
  }

  static async reenviarCodigo(email: string): Promise<{ sucesso: boolean; erro?: string }> {
    const db = await getDatabase();
    const pre = await queryRows<PreCadastro>('SELECT * FROM pre_cadastro WHERE email = ?', [email]);

    if (pre.length === 0) {
      return { sucesso: false, erro: 'Pre-cadastro nao encontrado.' };
    }

    const registro = pre[0];

    if (!CodigoVerificacaoService.podeReenviar(registro.reenvios)) {
      return { sucesso: false, erro: 'Numero maximo de reenvios atingido. Inicie um novo cadastro.' };
    }

    const novoCodigo = CodigoVerificacaoService.gerarCodigo();
    const novaExpiracao = CodigoVerificacaoService.calcularExpiracao();

    await db.run(
      'UPDATE pre_cadastro SET codigo_verificacao = ?, data_expiracao_codigo = ?, reenvios = reenvios + 1 WHERE id = ?',
      [novoCodigo, novaExpiracao, registro.id]
    );

    await CodigoVerificacaoService.salvarCodigo(email, novoCodigo, 'confirmacao_conta');

    return { sucesso: true, erro: undefined };
  }
}

async function validarRecriacao(
  matricula: string,
  email: string
): Promise<{ valido: boolean; erro?: string }> {
  const rows = await queryRows<Usuario>(
    `SELECT id, status, matricula, email
     FROM usuarios
     WHERE (matricula = ? OR email = ?)
     AND status IN ('ativo', 'inativo')`,
    [matricula, email]
  );

  if (rows.length > 0) {
    const usuario = rows[0];
    if (usuario.matricula === matricula) {
      return { valido: false, erro: 'Matricula ja cadastrada no sistema.' };
    }
    return { valido: false, erro: 'E-mail ja cadastrado no sistema.' };
  }

  return { valido: true };
}
