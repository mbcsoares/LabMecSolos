import { SECURITY_CONFIG } from '../config/security.config';
import { SenhaService } from './SenhaService';

export class ValidacaoService {
  private static readonly DOMINIOS_PERMITIDOS = SECURITY_CONFIG.ALLOWED_EMAIL_DOMAINS;

  static validarEmailInstitucional(email: string): { valido: boolean; erro?: string } {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      return { valido: false, erro: 'Formato de e-mail invalido.' };
    }

    const dominioValido = this.DOMINIOS_PERMITIDOS.some((dominio) =>
      email.toLowerCase().endsWith(dominio.toLowerCase())
    );

    if (!dominioValido) {
      return {
        valido: false,
        erro: `O e-mail deve pertencer a um dos dominios: ${this.DOMINIOS_PERMITIDOS.join(', ')}.`,
      };
    }

    return { valido: true };
  }

  static validarFormularioCadastro(dados: {
    nome: string;
    sobrenome: string;
    matricula: string;
    email: string;
    perfil: string;
    senha: string;
    confirmarSenha: string;
  }): { valido: boolean; erros: Record<string, string> } {
    const erros: Record<string, string> = {};

    if (!dados.nome || dados.nome.trim().length < 2) {
      erros['nome'] = 'Nome deve ter pelo menos 2 caracteres.';
    }
    if (!dados.sobrenome || dados.sobrenome.trim().length < 2) {
      erros['sobrenome'] = 'Sobrenome deve ter pelo menos 2 caracteres.';
    }
    if (!dados.matricula || dados.matricula.trim().length === 0) {
      erros['matricula'] = 'Matricula e obrigatoria.';
    }

    const validacaoEmail = this.validarEmailInstitucional(dados.email);
    if (!validacaoEmail.valido) {
      erros['email'] = validacaoEmail.erro!;
    }

    if (!['professor', 'tecnico', 'aluno'].includes(dados.perfil)) {
      erros['perfil'] = 'Perfil invalido.';
    }

    const validacaoSenha = SenhaService.validarForcaSenha(dados.senha);
    if (!validacaoSenha.valida) {
      erros['senha'] = validacaoSenha.erros.join(' ');
    }

    if (dados.senha !== dados.confirmarSenha) {
      erros['confirmarSenha'] = 'As senhas nao conferem.';
    }

    return { valido: Object.keys(erros).length === 0, erros };
  }
}
