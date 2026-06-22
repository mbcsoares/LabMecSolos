export class SanitizationService {
  static sanitizarTexto(texto: string): string {
    return texto
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 255);
  }

  static sanitizarEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static sanitizarMatricula(matricula: string): string {
    return matricula.trim().replace(/[^a-zA-Z0-9]/g, '');
  }
}
