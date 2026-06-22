import { queryRows } from './DatabaseService';
import { LogService } from './LogService';
import type { VistaPontoGeotecnico, FiltrosMapa } from '../models/types';

export class GeotecnicoService {
  static async obterPontos(filtros?: FiltrosMapa): Promise<VistaPontoGeotecnico[]> {
    const condicoes: string[] = [];
    const params: any[] = [];

    if (filtros?.tipoEnsaio) {
      condicoes.push('ensaios_realizados LIKE ?');
      params.push(`%${filtros.tipoEnsaio}%`);
    }
    if (filtros?.dataInicio) {
      condicoes.push('data_coleta >= ?');
      params.push(filtros.dataInicio);
    }
    if (filtros?.dataFim) {
      condicoes.push('data_coleta <= ?');
      params.push(filtros.dataFim);
    }
    if (filtros?.classificacaoSucs) {
      condicoes.push('classificacao_sucs = ?');
      params.push(filtros.classificacaoSucs);
    }
    if (filtros?.contexto) {
      condicoes.push('contexto_pesquisa = ?');
      params.push(filtros.contexto);
    }

    const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

    return queryRows<VistaPontoGeotecnico>(
      `SELECT * FROM vista_pontos_geotecnicos ${whereClause} ORDER BY data_coleta DESC`,
      params
    );
  }

  static async contarPontos(filtros?: FiltrosMapa): Promise<number> {
    const pontos = await GeotecnicoService.obterPontos(filtros);
    return pontos.length;
  }

  static async obterDetalhesPonto(idAmostra: string): Promise<any> {
    const pontos = await queryRows<VistaPontoGeotecnico>(
      'SELECT * FROM vista_pontos_geotecnicos WHERE id_amostra = ?',
      [idAmostra]
    );

    if (pontos.length === 0) return null;

    const ponto = pontos[0];
    const ensaios = await GeotecnicoService.obterEnsaiosAmostra(idAmostra);

    let camposPreenchidos = 0;
    if (ponto.id_metadados) {
      const contagem = await queryRows<{ total: number }>(
        `SELECT
          (CASE WHEN classificacao_sucs IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN classificacao_aashto IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN cor IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN textura IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN consistencia IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN origem_geologica IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN municipio IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN uf IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN profundidade_inicial IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN profundidade_final IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN nivel_agua IS NOT NULL THEN 1 ELSE 0 END
          ) AS total
         FROM metadados_amostra WHERE id_amostra_bruta = ?`,
        [idAmostra]
      );
      camposPreenchidos = contagem[0]?.total || 0;
    }

    return {
      ...ponto,
      ensaiosDetalhes: ensaios,
      metadadosCamposPreenchidos: camposPreenchidos,
      metadadosTotalCampos: 11,
    };
  }

  static async obterEnsaiosAmostra(idAmostra: string): Promise<any[]> {
    const rows = await queryRows<any>(
      `SELECT e.id, e.tipo_ensaio, e.status, e.data_fim, etu.h_medio
       FROM amostras_preparadas ap
       INNER JOIN amostras_ensaiadas ae ON ae.id_amostra_preparada = ap.id
       INNER JOIN ensaios e ON e.id_amostra_ensaiada = ae.id
       LEFT JOIN ensaios_teor_umidade etu ON etu.id = e.id
       WHERE ap.id_amostra_bruta = ? AND e.status = 'concluido'
       UNION ALL
       SELECT e.id, e.tipo_ensaio, e.status, e.data_fim, etu.h_medio
       FROM amostras_indeformadas ai
       INNER JOIN ensaios e ON e.id_amostra_indeformada = ai.id
       LEFT JOIN ensaios_teor_umidade etu ON etu.id = e.id
       WHERE ai.id_amostra_bruta = ? AND e.status = 'concluido'`,
      [idAmostra, idAmostra]
    );

    return rows.map((row: any) => ({
      id: row.id,
      tipoEnsaio: row.tipo_ensaio,
      status: row.status,
      dataFim: row.data_fim,
      resultado: row.h_medio !== null ? { h_medio: row.h_medio } : null,
    }));
  }

  static async obterValoresUnicos(campo: string): Promise<string[]> {
    let query = '';
    switch (campo) {
      case 'classificacao_sucs':
        query = 'SELECT DISTINCT classificacao_sucs FROM vista_pontos_geotecnicos WHERE classificacao_sucs IS NOT NULL ORDER BY classificacao_sucs ASC';
        break;
      case 'contexto_pesquisa':
        query = 'SELECT DISTINCT contexto_pesquisa FROM vista_pontos_geotecnicos WHERE contexto_pesquisa IS NOT NULL ORDER BY contexto_pesquisa ASC';
        break;
      case 'tipo_ensaio':
        query = "SELECT DISTINCT tipo_ensaio FROM ensaios WHERE status = 'concluido' ORDER BY tipo_ensaio ASC";
        break;
      default:
        return [];
    }

    const rows = await queryRows<any>(query);
    return rows.map((r: any) => Object.values(r)[0] as string);
  }

  static async exportarGeoJSON(filtros: FiltrosMapa | undefined, idUsuario: string): Promise<string> {
    const pontos = await GeotecnicoService.obterPontos(filtros);

    const features = pontos
      .filter((p) => p.coordenadas_gps && p.coordenadas_gps.includes(','))
      .map((p) => {
        const [lat, lng] = p.coordenadas_gps.split(',').map(Number);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            id_amostra: p.id_amostra,
            numero_identificacao_campo: p.numero_identificacao_campo,
            tipo_amostra: p.tipo_amostra,
            data_coleta: p.data_coleta,
            classificacao_sucs: p.classificacao_sucs,
            classificacao_aashto: p.classificacao_aashto,
            cor: p.cor,
            textura: p.textura,
            consistencia: p.consistencia,
            origem_geologica: p.origem_geologica,
            municipio: p.municipio,
            uf: p.uf,
            teor_umidade: p.teor_umidade || p.teor_umidade_indeformada,
            total_ensaios: p.total_ensaios_concluidos,
            pesquisa: p.titulo_pesquisa,
            responsavel: p.nome_responsavel,
          },
        };
      });

    const geojson = { type: 'FeatureCollection', features };

    await LogService.registrar(
      'geotecnico', 'dados_exportados_geojson', idUsuario, null, null,
      JSON.stringify({ total_pontos: features.length }), null
    );

    return JSON.stringify(geojson, null, 2);
  }

  static async exportarCSV(filtros: FiltrosMapa | undefined, idUsuario: string): Promise<string> {
    const pontos = await GeotecnicoService.obterPontos(filtros);

    const cabecalhos = [
      'ID Amostra', 'Nº Campo', 'Tipo', 'Data Coleta', 'Coordenadas',
      'SUCS', 'AASHTO', 'Cor', 'Textura', 'Consistência',
      'Origem Geológica', 'Município', 'UF',
      'Prof. Inicial (m)', 'Prof. Final (m)', 'Nível Água (m)',
      'Teor Umidade (%)', 'Ensaios Concluídos', 'Pesquisa', 'Responsável',
    ];

    const linhas = pontos.map((p) => [
      p.id_amostra, p.numero_identificacao_campo, p.tipo_amostra, p.data_coleta, p.coordenadas_gps,
      p.classificacao_sucs || '', p.classificacao_aashto || '', p.cor || '', p.textura || '', p.consistencia || '',
      p.origem_geologica || '', p.municipio || '', p.uf || '',
      p.profundidade_inicial?.toString() || '', p.profundidade_final?.toString() || '', p.nivel_agua?.toString() || '',
      (p.teor_umidade || p.teor_umidade_indeformada)?.toString() || '', p.total_ensaios_concluidos.toString(),
      p.titulo_pesquisa, p.nome_responsavel,
    ]);

    const csv = [cabecalhos.join(','), ...linhas.map((l) => l.map((v) => `"${v}"`).join(','))].join('\n');

    await LogService.registrar(
      'geotecnico', 'dados_exportados_csv', idUsuario, null, null,
      JSON.stringify({ total_pontos: pontos.length }), null
    );

    return csv;
  }
}
