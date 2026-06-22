import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { queryRows, executeSql } from './DatabaseService';
import { LogService } from './LogService';
import type {
  CalendarioMensal,
  CalendarioDia,
  CalendarioMensalDetalhado,
  DisponibilidadeDia,
  CriarCalendarioDTO,
  EditarDiaDTO,
} from '../models/types';

export class CalendarioService {
  static async criarCalendario(dados: CriarCalendarioDTO, idUsuario: string): Promise<CalendarioMensal> {
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO calendario_mensal (id, mes_ano, hora_abertura_padrao, hora_fechamento_padrao, capacidade_padrao, observacoes, status, id_responsavel, data_criacao)
       VALUES (?, ?, ?, ?, ?, ?, 'em_configuracao', ?, ?)`,
      [id, dados.mesAno, dados.horaAberturaPadrao, dados.horaFechamentoPadrao, dados.capacidadePadrao, dados.observacoes || null, idUsuario, agora]
    );

    const [anoStr, mesStr] = dados.mesAno.split('-');
    const ano = parseInt(anoStr);
    const mes = parseInt(mesStr);
    const ultimoDia = new Date(ano, mes, 0).getDate();

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const diaId = generateUUID();
      const data = new Date(ano, mes - 1, dia);
      const diaDaSemana = data.getDay();
      const isFimDeSemana = diaDaSemana === 0 || diaDaSemana === 6;
      await executeSql(
        `INSERT INTO calendario_dias (id, id_calendario_mensal, dia, disponivel)
         VALUES (?, ?, ?, ?)`,
        [diaId, id, dia, isFimDeSemana ? 0 : 1]
      );
    }

    await LogService.registrar(
      'agendamento',
      'calendario_mensal_criado',
      idUsuario,
      null,
      null,
      JSON.stringify({ mes_ano: dados.mesAno }),
      null
    );

    return {
      id,
      mes_ano: dados.mesAno,
      hora_abertura_padrao: dados.horaAberturaPadrao,
      hora_fechamento_padrao: dados.horaFechamentoPadrao,
      capacidade_padrao: dados.capacidadePadrao,
      observacoes: dados.observacoes || null,
      status: 'em_configuracao',
      id_responsavel: idUsuario,
      data_criacao: agora,
      data_atualizacao: null,
    };
  }

  static async editarCalendario(idCalendario: string, dados: CriarCalendarioDTO, idUsuario: string): Promise<void> {
    const agora = nowISO();

    await executeSql(
      `UPDATE calendario_mensal SET hora_abertura_padrao = ?, hora_fechamento_padrao = ?, capacidade_padrao = ?, observacoes = ?, data_atualizacao = ?
       WHERE id = ?`,
      [dados.horaAberturaPadrao, dados.horaFechamentoPadrao, dados.capacidadePadrao, dados.observacoes || null, agora, idCalendario]
    );

    await LogService.registrar(
      'agendamento',
      'calendario_mensal_editado',
      idUsuario,
      null,
      null,
      null,
      { mes_ano: dados.mesAno }
    );
  }

  static async publicarCalendario(idCalendario: string, idUsuario: string): Promise<void> {
    const agora = nowISO();

    await executeSql(
      "UPDATE calendario_mensal SET status = 'publicado', data_atualizacao = ? WHERE id = ?",
      [agora, idCalendario]
    );

    await LogService.registrar(
      'agendamento',
      'calendario_mensal_publicado',
      idUsuario,
      null,
      JSON.stringify({ status: 'em_configuracao' }),
      JSON.stringify({ status: 'publicado' }),
      null
    );
  }

  static async editarDia(
    idCalendario: string,
    dia: number,
    dados: EditarDiaDTO,
    idUsuario: string
  ): Promise<void> {
    if (!dados.disponivel && (!dados.motivo || dados.motivo.trim().length === 0)) {
      throw new Error('Motivo é obrigatório para dias indisponíveis.');
    }

    const calendario = await queryRows<{ mes_ano: string }>(
      'SELECT mes_ano FROM calendario_mensal WHERE id = ?',
      [idCalendario]
    );
    const mesAno = calendario.length > 0 ? calendario[0].mes_ano : '';

    await executeSql(
      `UPDATE calendario_dias
       SET disponivel = ?, hora_abertura = ?, hora_fechamento = ?, capacidade = ?, motivo = ?
       WHERE id_calendario_mensal = ? AND dia = ?`,
      [
        dados.disponivel ? 1 : 0,
        dados.horaAbertura || null,
        dados.horaFechamento || null,
        dados.capacidade || null,
        dados.disponivel ? null : dados.motivo,
        idCalendario,
        dia,
      ]
    );

    await LogService.registrar(
      'agendamento',
      'calendario_dia_editado',
      idUsuario,
      null,
      null,
      JSON.stringify({ mes_ano: mesAno, dia, disponivel: dados.disponivel }),
      null
    );
  }

  static async obterCalendarioPorMes(mesAno: string): Promise<CalendarioMensalDetalhado | null> {
    const calendarios = await queryRows<CalendarioMensal>(
      'SELECT * FROM calendario_mensal WHERE mes_ano = ?',
      [mesAno]
    );

    if (calendarios.length === 0) {
      return null;
    }

    const calendario = calendarios[0];
    const dias = await queryRows<CalendarioDia>(
      'SELECT * FROM calendario_dias WHERE id_calendario_mensal = ? ORDER BY dia ASC',
      [calendario.id]
    );

    return {
      ...calendario,
      dias,
    };
  }

  static async verificarDisponibilidade(mesAno: string, dia: number): Promise<DisponibilidadeDia> {
    const query = `
      SELECT
        cm.hora_abertura_padrao, cm.hora_fechamento_padrao, cm.capacidade_padrao, cm.status,
        cd.disponivel, cd.hora_abertura, cd.hora_fechamento, cd.capacidade, cd.motivo
      FROM calendario_mensal cm
      LEFT JOIN calendario_dias cd ON cm.id = cd.id_calendario_mensal AND cd.dia = ?
      WHERE cm.mes_ano = ? AND cm.status = 'publicado'
    `;

    const rows = await queryRows<any>(query, [dia, mesAno]);

    if (rows.length === 0) {
      return { disponivel: false, motivo: 'Calendário não encontrado ou não publicado.' };
    }

    const row = rows[0];

    if (row.disponivel === 0) {
      return { disponivel: false, motivo: row.motivo || 'Dia indisponível.' };
    }

    return {
      disponivel: true,
      horaAbertura: row.hora_abertura || row.hora_abertura_padrao,
      horaFechamento: row.hora_fechamento || row.hora_fechamento_padrao,
      capacidade: row.capacidade || row.capacidade_padrao,
    };
  }

  static async verificarCalendariosPendentes(): Promise<string[]> {
    const hoje = new Date();
    const mesSeguinte = hoje.getMonth() + 2;
    const anoSeguinte = mesSeguinte > 12 ? hoje.getFullYear() + 1 : hoje.getFullYear();
    const mesAjustado = mesSeguinte > 12 ? mesSeguinte - 12 : mesSeguinte;
    const mesAnoSeguinte = `${anoSeguinte}-${String(mesAjustado).padStart(2, '0')}`;

    const rows = await queryRows<{ mes_ano: string }>(
      "SELECT mes_ano FROM calendario_mensal WHERE status = 'em_configuracao' AND mes_ano = ?",
      [mesAnoSeguinte]
    );

    return rows.map((r) => r.mes_ano);
  }
}
