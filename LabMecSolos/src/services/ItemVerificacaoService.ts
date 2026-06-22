import { queryRows } from './DatabaseService';

export interface ItemStatus {
  id: string;
  nome: string;
  tipo: string;
  codigo: string;
  estado?: string;
  quantidade_atual?: number;
  ponto_pedido?: number;
  data_ultima_calibracao?: string;
  dias_restantes?: number;
  alerta: string | null;
}

export class ItemVerificacaoService {
  static async obterStatusItens(idsItens: string[]): Promise<ItemStatus[]> {
    const status: ItemStatus[] = [];

    for (const idItem of idsItens) {
      const itens = await queryRows<{ id: string; nome: string; tipo: string; codigo: string }>(
        "SELECT id, nome, tipo, codigo FROM itens WHERE id = ? AND status = 'ativo'",
        [idItem]
      );
      if (itens.length === 0) continue;

      const base = itens[0];
      const result: ItemStatus = {
        id: base.id,
        nome: base.nome,
        tipo: base.tipo,
        codigo: base.codigo,
        alerta: null,
      };

      switch (base.tipo) {
        case 'equipamento': {
          const eqs = await queryRows<{ estado: string; data_ultima_calibracao: string; frequencia_calibracao_dias: number }>(
            'SELECT e.estado, e.data_ultima_calibracao, e.frequencia_calibracao_dias FROM equipamentos e WHERE e.id = ?',
            [idItem]
          );
          if (eqs.length > 0) {
            const eq = eqs[0];
            result.estado = eq.estado;
            result.data_ultima_calibracao = eq.data_ultima_calibracao;
            if (eq.data_ultima_calibracao && eq.frequencia_calibracao_dias) {
              const proxCal = new Date(eq.data_ultima_calibracao);
              proxCal.setDate(proxCal.getDate() + eq.frequencia_calibracao_dias);
              const hoje = new Date();
              result.dias_restantes = Math.ceil((proxCal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
            }
            result.alerta = ItemVerificacaoService.avaliarAlertaEquipamento(eq.estado, result.dias_restantes);
          }
          break;
        }
        case 'material': {
          const mats = await queryRows<{ quantidade_atual: number; ponto_pedido: number }>(
            'SELECT quantidade_atual, ponto_pedido FROM materiais WHERE id = ?',
            [idItem]
          );
          if (mats.length > 0) {
            result.quantidade_atual = mats[0].quantidade_atual;
            result.ponto_pedido = mats[0].ponto_pedido;
            result.alerta = ItemVerificacaoService.avaliarAlertaEstoque(mats[0].quantidade_atual, mats[0].ponto_pedido);
          }
          break;
        }
        case 'utensilio': {
          const utes = await queryRows<{ quantidade_atual: number; ponto_pedido: number }>(
            'SELECT quantidade_atual, ponto_pedido FROM utensilios WHERE id = ?',
            [idItem]
          );
          if (utes.length > 0) {
            result.quantidade_atual = utes[0].quantidade_atual;
            result.ponto_pedido = utes[0].ponto_pedido;
            result.alerta = ItemVerificacaoService.avaliarAlertaEstoque(utes[0].quantidade_atual, utes[0].ponto_pedido);
          }
          break;
        }
      }

      status.push(result);
    }

    return status;
  }

  private static avaliarAlertaEquipamento(estado: string, diasRestantes?: number): string | null {
    if (estado === 'inoperante') return 'Equipamento inoperante';
    if (estado === 'calibracao_vencida') return 'Calibração vencida';
    if (diasRestantes !== undefined && diasRestantes <= 0) return 'Calibração vencida';
    if (diasRestantes !== undefined && diasRestantes > 0 && diasRestantes <= 30) return 'Calibração próxima do vencimento';
    return null;
  }

  private static avaliarAlertaEstoque(quantidade: number, pontoPedido?: number): string | null {
    if (quantidade <= 0) return 'Estoque zerado';
    if (pontoPedido && quantidade <= pontoPedido) return 'Estoque baixo';
    return null;
  }
}
