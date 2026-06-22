import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { queryRows } from './DatabaseService';
import type { NotificacaoGerencial } from '../models/types';

export class NotificacaoGerencialService {
  static async verificarNotificacoes(): Promise<NotificacaoGerencial[]> {
    const notificacoes: NotificacaoGerencial[] = [];

    const n1 = await NotificacaoGerencialService.verificarCalendarioPendente();
    if (n1) notificacoes.push(n1);

    const n2 = await NotificacaoGerencialService.verificarSemAgendamentos();
    if (n2) notificacoes.push(n2);

    const n3 = await NotificacaoGerencialService.verificarEquipamentosCriticos();
    if (n3) notificacoes.push(n3);

    const n4 = await NotificacaoGerencialService.verificarOcorrenciasAcumuladas();
    if (n4) notificacoes.push(n4);

    const n5 = await NotificacaoGerencialService.verificarTaxaNaoComparecimento();
    if (n5) notificacoes.push(n5);

    const n6 = await NotificacaoGerencialService.verificarEstoqueZerado();
    if (n6) notificacoes.push(n6);

    return notificacoes;
  }

  static async verificarCalendarioPendente(): Promise<NotificacaoGerencial | null> {
    const hoje = new Date();
    if (hoje.getDate() < 26) return null;

    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const rows = await queryRows<{ id: string }>(
      "SELECT id FROM calendario_mensal WHERE mes_ano = ? AND status = 'publicado'",
      [mesAtual]
    );

    if (rows.length === 0) {
      return {
        id: generateUUID(),
        tipo: 'calendario_pendente',
        mensagem: `Calendário de ${mesAtual} ainda não foi publicado. Publique para permitir agendamentos.`,
        gravidade: 'warning',
        dataGeracao: nowISO(),
      };
    }

    return null;
  }

  static async verificarSemAgendamentos(): Promise<NotificacaoGerencial | null> {
    const hoje = new Date().toISOString().split('T')[0];
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() + 7);
    const dataLimite = seteDias.toISOString().split('T')[0];

    const rows = await queryRows<{ total: number }>(
      `SELECT COUNT(DISTINCT a.id) as total FROM agendamentos a
       INNER JOIN agendamento_datas ad ON a.id = ad.id_agendamento
       WHERE a.status = 'aprovado' AND ad.data_agendada BETWEEN ? AND ?`,
      [hoje, dataLimite]
    );

    if ((rows[0]?.total || 0) === 0) {
      return {
        id: generateUUID(),
        tipo: 'sem_agendamentos',
        mensagem: 'Sem agendamentos previstos para a próxima semana.',
        gravidade: 'info',
        dataGeracao: nowISO(),
      };
    }

    return null;
  }

  static async verificarEquipamentosCriticos(): Promise<NotificacaoGerencial | null> {
    const rows = await queryRows<{ total: number }>(
      `SELECT COUNT(*) as total FROM equipamentos e
       INNER JOIN itens i ON e.id = i.id
       WHERE i.status = 'ativo' AND e.estado IN ('inoperante', 'calibracao_vencida')`
    );

    const total = rows[0]?.total || 0;
    if (total >= 3) {
      return {
        id: generateUUID(),
        tipo: 'equipamentos_criticos',
        mensagem: `${total} equipamentos requerem atenção (inoperantes ou com calibração vencida).`,
        gravidade: 'critical',
        dataGeracao: nowISO(),
      };
    }

    return null;
  }

  static async verificarOcorrenciasAcumuladas(): Promise<NotificacaoGerencial | null> {
    const rows = await queryRows<{ total: number }>(
      "SELECT COUNT(*) as total FROM ocorrencias WHERE status = 'aberta'"
    );

    const total = rows[0]?.total || 0;
    if (total >= 5) {
      return {
        id: generateUUID(),
        tipo: 'ocorrencias_acumuladas',
        mensagem: `${total} ocorrências aguardando resolução. Verifique a lista de ocorrências.`,
        gravidade: 'warning',
        dataGeracao: nowISO(),
      };
    }

    return null;
  }

  static async verificarTaxaNaoComparecimento(): Promise<NotificacaoGerencial | null> {
    const hoje = new Date().toISOString().split('T')[0];
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const dataInicio = trintaDiasAtras.toISOString().split('T')[0];

    const rows = await queryRows<{ nao_compareceram: number; total_avaliados: number }>(
      `SELECT
         COUNT(CASE WHEN ad.comparecimento = 'nao_compareceu' THEN 1 END) as nao_compareceram,
         COUNT(CASE WHEN ad.comparecimento IS NOT NULL THEN 1 END) as total_avaliados
       FROM agendamento_datas ad
       INNER JOIN agendamentos a ON ad.id_agendamento = a.id
       WHERE ad.data_agendada BETWEEN ? AND ?
         AND a.status IN ('aprovado', 'finalizado')`,
      [dataInicio, hoje]
    );

    const dados = rows[0] || {};
    const totalAvaliados = dados.total_avaliados || 0;
    const naoCompareceram = dados.nao_compareceram || 0;

    if (totalAvaliados > 0) {
      const taxa = Math.round((naoCompareceram / totalAvaliados) * 100);
      if (taxa > 30) {
        return {
          id: generateUUID(),
          tipo: 'nao_comparecimento_alto',
          mensagem: `Taxa de não comparecimento no último mês: ${taxa}%. Considere investigar as causas.`,
          gravidade: 'warning',
          dataGeracao: nowISO(),
        };
      }
    }

    return null;
  }

  static async verificarEstoqueZerado(): Promise<NotificacaoGerencial | null> {
    const rows = await queryRows<{ nome: string }>(
      `SELECT i.nome FROM materiais m
       INNER JOIN itens i ON m.id = i.id
       WHERE i.status = 'ativo' AND m.quantidade_atual <= 0 LIMIT 1`
    );

    if (rows.length > 0) {
      return {
        id: generateUUID(),
        tipo: 'estoque_zerado',
        mensagem: `Material "${rows[0].nome}" está com estoque zerado. Providencie a reposição.`,
        gravidade: 'critical',
        dataGeracao: nowISO(),
      };
    }

    return null;
  }
}
