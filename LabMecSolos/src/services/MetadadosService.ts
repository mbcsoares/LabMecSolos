import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { queryRows, executeSql } from './DatabaseService';
import { LogService } from './LogService';
import type { MetadadosAmostra, MetadadosAmostraDTO, StatusPreenchimento } from '../models/types';

const TOTAL_CAMPOS = 11;

export class MetadadosService {
  static async criar(dados: MetadadosAmostraDTO, idUsuario: string, idAmostraBruta: string): Promise<MetadadosAmostra> {
    const existente = await queryRows<{ id: string }>(
      'SELECT id FROM metadados_amostra WHERE id_amostra_bruta = ?',
      [idAmostraBruta]
    );
    if (existente.length > 0) {
      throw new Error('Esta amostra já possui metadados. Utilize a edição.');
    }

    const amostra = await queryRows<{ numero_identificacao_campo: string }>(
      'SELECT numero_identificacao_campo FROM amostras_brutas WHERE id = ?',
      [idAmostraBruta]
    );
    if (amostra.length === 0) {
      throw new Error('Amostra não encontrada.');
    }

    const membro = await queryRows<{ c: number }>(
      `SELECT 1 as c FROM amostras_brutas ab
       INNER JOIN pontos_coleta pc ON ab.id_ponto_coleta = pc.id
       INNER JOIN programas_amostragem pa ON pc.id_programa_amostragem = pa.id
       INNER JOIN pesquisas p ON pa.id_pesquisa = p.id
       LEFT JOIN pesquisa_colaboradores pcol ON p.id = pcol.id_pesquisa AND pcol.id_usuario = ?
       WHERE ab.id = ? AND (p.id_responsavel = ? OR pcol.id_usuario = ?)`,
      [idUsuario, idAmostraBruta, idUsuario, idUsuario]
    );
    if (membro.length === 0) {
      throw new Error('Você não é membro da pesquisa desta amostra.');
    }

    const id = generateUUID();
    const agora = nowISO();
    const numeroCampo = amostra[0].numero_identificacao_campo;

    await executeSql(
      `INSERT INTO metadados_amostra (
        id, id_amostra_bruta, classificacao_sucs, classificacao_aashto,
        cor, textura, consistencia, origem_geologica, municipio, uf,
        profundidade_inicial, profundidade_final, nivel_agua,
        status_preenchimento, data_criacao, id_criado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'parcial', ?, ?)`,
      [
        id, idAmostraBruta,
        dados.classificacao_sucs || null, dados.classificacao_aashto || null,
        dados.cor || null, dados.textura || null, dados.consistencia || null,
        dados.origem_geologica || null, dados.municipio || null, dados.uf || null,
        dados.profundidade_inicial || null, dados.profundidade_final || null,
        dados.nivel_agua || null,
        agora, idUsuario,
      ]
    );

    await LogService.registrar(
      'geotecnico', 'metadados_criados', idUsuario, null, null,
      JSON.stringify({ id_amostra: numeroCampo, status: 'parcial' }), null
    );

    return {
      id,
      id_amostra_bruta: idAmostraBruta,
      classificacao_sucs: dados.classificacao_sucs || null,
      classificacao_aashto: dados.classificacao_aashto || null,
      cor: dados.cor || null,
      textura: dados.textura || null,
      consistencia: dados.consistencia || null,
      origem_geologica: dados.origem_geologica || null,
      municipio: dados.municipio || null,
      uf: dados.uf || null,
      profundidade_inicial: dados.profundidade_inicial || null,
      profundidade_final: dados.profundidade_final || null,
      nivel_agua: dados.nivel_agua || null,
      status_preenchimento: 'parcial',
      data_criacao: agora,
      data_atualizacao: null,
      id_criado_por: idUsuario,
      id_atualizado_por: null,
    };
  }

  static async editar(idMetadados: string, dados: MetadadosAmostraDTO, idUsuario: string): Promise<MetadadosAmostra> {
    const existente = await queryRows<MetadadosAmostra>(
      'SELECT * FROM metadados_amostra WHERE id = ?',
      [idMetadados]
    );
    if (existente.length === 0) {
      throw new Error('Metadados não encontrados.');
    }

    const idAmostraBruta = existente[0].id_amostra_bruta;
    const membro = await queryRows<{ c: number }>(
      `SELECT 1 as c FROM amostras_brutas ab
       INNER JOIN pontos_coleta pc ON ab.id_ponto_coleta = pc.id
       INNER JOIN programas_amostragem pa ON pc.id_programa_amostragem = pa.id
       INNER JOIN pesquisas p ON pa.id_pesquisa = p.id
       LEFT JOIN pesquisa_colaboradores pcol ON p.id = pcol.id_pesquisa AND pcol.id_usuario = ?
       WHERE ab.id = ? AND (p.id_responsavel = ? OR pcol.id_usuario = ?)`,
      [idUsuario, idAmostraBruta, idUsuario, idUsuario]
    );
    if (membro.length === 0) {
      throw new Error('Você não é membro da pesquisa desta amostra.');
    }

    const agora = nowISO();
    const registro = existente[0];
    const camposAlterados: string[] = [];

    const mapeamento: [string, keyof MetadadosAmostraDTO][] = [
      ['classificacao_sucs', 'classificacao_sucs'],
      ['classificacao_aashto', 'classificacao_aashto'],
      ['cor', 'cor'],
      ['textura', 'textura'],
      ['consistencia', 'consistencia'],
      ['origem_geologica', 'origem_geologica'],
      ['municipio', 'municipio'],
      ['uf', 'uf'],
      ['profundidade_inicial', 'profundidade_inicial'],
      ['profundidade_final', 'profundidade_final'],
      ['nivel_agua', 'nivel_agua'],
    ];

    const camposSet: string[] = [];
    const valores: any[] = [];

    for (const [coluna, chave] of mapeamento) {
      if (dados[chave] !== undefined) {
        const novoValor = dados[chave] || null;
        camposSet.push(`${coluna} = ?`);
        valores.push(novoValor);
        if ((registro as any)[coluna] !== novoValor) {
          camposAlterados.push(coluna);
        }
      }
    }

    if (camposSet.length === 0) {
      throw new Error('Nenhum campo para atualizar.');
    }

    camposSet.push('data_atualizacao = ?');
    valores.push(agora);
    camposSet.push('id_atualizado_por = ?');
    valores.push(idUsuario);
    valores.push(idMetadados);

    await executeSql(
      `UPDATE metadados_amostra SET ${camposSet.join(', ')} WHERE id = ?`,
      valores
    );

    const amostra = await queryRows<{ numero_identificacao_campo: string }>(
      `SELECT ab.numero_identificacao_campo FROM amostras_brutas ab
       INNER JOIN metadados_amostra ma ON ab.id = ma.id_amostra_bruta WHERE ma.id = ?`,
      [idMetadados]
    );
    const numeroCampo = amostra[0]?.numero_identificacao_campo || '';

    await LogService.registrar(
      'geotecnico', 'metadados_editados', idUsuario, null, null, null,
      { id_amostra: numeroCampo, campos: camposAlterados.join(', ') }
    );

    return MetadadosService.obterPorId(idMetadados);
  }

  static async obterPorAmostra(idAmostraBruta: string): Promise<MetadadosAmostra | null> {
    const rows = await queryRows<MetadadosAmostra>(
      'SELECT * FROM metadados_amostra WHERE id_amostra_bruta = ?',
      [idAmostraBruta]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  private static async obterPorId(id: string): Promise<MetadadosAmostra> {
    const rows = await queryRows<MetadadosAmostra>(
      'SELECT * FROM metadados_amostra WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async marcarComoCompleto(idMetadados: string, idUsuario: string): Promise<void> {
    const agora = nowISO();

    await executeSql(
      "UPDATE metadados_amostra SET status_preenchimento = 'completo', data_atualizacao = ?, id_atualizado_por = ? WHERE id = ?",
      [agora, idUsuario, idMetadados]
    );

    const amostra = await queryRows<{ numero_identificacao_campo: string }>(
      `SELECT ab.numero_identificacao_campo FROM amostras_brutas ab
       INNER JOIN metadados_amostra ma ON ab.id = ma.id_amostra_bruta WHERE ma.id = ?`,
      [idMetadados]
    );
    const numeroCampo = amostra[0]?.numero_identificacao_campo || '';

    await LogService.registrar(
      'geotecnico', 'metadados_completados', idUsuario, null,
      JSON.stringify({ status: 'parcial' }), JSON.stringify({ status: 'completo' }),
      { id_amostra: numeroCampo }
    );
  }

  static async listarPorStatus(status: string): Promise<any[]> {
    return queryRows(
      `SELECT ma.*, ab.numero_identificacao_campo
       FROM metadados_amostra ma
       INNER JOIN amostras_brutas ab ON ma.id_amostra_bruta = ab.id
       WHERE ma.status_preenchimento = ?
       ORDER BY ma.data_atualizacao DESC`,
      [status]
    );
  }

  static contarCamposPreenchidos(dados: MetadadosAmostraDTO): number {
    let count = 0;
    if (dados.classificacao_sucs) count++;
    if (dados.classificacao_aashto) count++;
    if (dados.cor) count++;
    if (dados.textura) count++;
    if (dados.consistencia) count++;
    if (dados.origem_geologica) count++;
    if (dados.municipio) count++;
    if (dados.uf) count++;
    if (dados.profundidade_inicial !== undefined) count++;
    if (dados.profundidade_final !== undefined) count++;
    if (dados.nivel_agua !== undefined) count++;
    return count;
  }
}
