import { queryRows } from './DatabaseService';
import type { PesquisaResumo } from '../models/types';

export class PesquisaVinculacaoService {
  static async buscarPesquisasUsuario(idUsuario: string): Promise<PesquisaResumo[]> {
    return queryRows<PesquisaResumo>(
      `SELECT DISTINCT p.*, CASE WHEN p.id_responsavel = ? THEN 'responsavel_principal' ELSE 'colaborador' END AS meu_papel
       FROM pesquisas p
       LEFT JOIN pesquisa_colaboradores pc ON p.id = pc.id_pesquisa
       WHERE p.status = 'em_andamento'
         AND (p.id_responsavel = ? OR pc.id_usuario = ?)
       ORDER BY p.titulo ASC`,
      [idUsuario, idUsuario, idUsuario]
    );
  }
}
