import { SECURITY_CONFIG } from '../config/security.config';

export class LoginService {
  private static readonly MAX_TENTATIVAS = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
  private static readonly BLOQUEIO_MINUTOS = SECURITY_CONFIG.LOGIN_BLOCK_DURATION_MINUTES;
  private static readonly tentativasCache: Map<string, { tentativas: number; bloqueadoAte: Date | null }> = new Map();

  static verificarBloqueio(email: string): { bloqueado: boolean; minutosRestantes?: number } {
    const registro = this.tentativasCache.get(email);

    if (registro?.bloqueadoAte) {
      if (new Date() < registro.bloqueadoAte) {
        const minutosRestantes = Math.ceil(
          (registro.bloqueadoAte.getTime() - Date.now()) / 60000
        );
        return { bloqueado: true, minutosRestantes };
      } else {
        this.tentativasCache.set(email, { tentativas: 0, bloqueadoAte: null });
      }
    }

    return { bloqueado: false };
  }

  static registrarTentativa(email: string, sucesso: boolean): void {
    if (sucesso) {
      this.tentativasCache.delete(email);
      return;
    }

    const registro = this.tentativasCache.get(email) || { tentativas: 0, bloqueadoAte: null };
    registro.tentativas++;

    if (registro.tentativas >= this.MAX_TENTATIVAS) {
      registro.bloqueadoAte = new Date(Date.now() + this.BLOQUEIO_MINUTOS * 60000);
    }

    this.tentativasCache.set(email, registro);
  }
}
