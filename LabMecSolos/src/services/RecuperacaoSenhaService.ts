import { getDatabase } from './DatabaseService';
import { CodigoVerificacaoService } from './CodigoVerificacaoService';
import { SenhaService } from './SenhaService';
import { LogService } from './LogService';
import { nowISO } from '../utils/dateUtils';

export class RecuperacaoSenhaService {
  static async solicitarRecuperacao(
    email: string
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    const db = await getDatabase();
    const usuario = await db.query(
      "SELECT id FROM usuarios WHERE email = ? AND status = 'ativo'",
      [email]
    );

    if (!usuario.values || usuario.values.length === 0) {
      return { sucesso: false, mensagem: 'E-mail nao encontrado.' };
    }

    const codigo = CodigoVerificacaoService.gerarCodigo();
    await CodigoVerificacaoService.salvarCodigo(email, codigo, 'redefinicao_senha');

    return { sucesso: true, mensagem: 'Codigo de verificacao enviado para seu e-mail.' };
  }

  static async redefinirSenha(
    email: string,
    codigo: string,
    novaSenha: string
  ): Promise<{ sucesso: boolean; erro?: string }> {
    const validacaoSenha = SenhaService.validarForcaSenha(novaSenha);
    if (!validacaoSenha.valida) {
      return { sucesso: false, erro: validacaoSenha.erros.join(' ') };
    }

    const verificacao = await CodigoVerificacaoService.verificarCodigo(email, codigo, 'redefinicao_senha');
    if (!verificacao.valido) {
      return { sucesso: false, erro: verificacao.erro };
    }

    const novoHash = await SenhaService.gerarHash(novaSenha);
    const agora = nowISO();

    const db = await getDatabase();
    await db.run(
      "UPDATE usuarios SET senha_hash = ?, data_atualizacao = ? WHERE email = ? AND status = 'ativo'",
      [novoHash, agora, email]
    );

    await LogService.registrar('autenticacao', 'troca_senha', null, null, null, null, { email, motivo: 'recuperacao' });

    return { sucesso: true };
  }
}
