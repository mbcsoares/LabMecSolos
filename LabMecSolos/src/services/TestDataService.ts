import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { getDatabase } from './DatabaseService';
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function iso(d: Date): string {
  return d.toISOString();
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function mesAno(d: Date): string {
  const m = d.getMonth() + 1;
  return `${d.getFullYear()}-${m.toString().padStart(2, '0')}`;
}

interface IdMap {
  aluno: string;
  professor: string;
  tecnico: string;
  colaborador: string;
  chefia: string;
  estufa: string;
  prensa: string;
  paquimetro: string;
  areia: string;
  cimento: string;
  agua: string;
  bandeja: string;
  espatula: string;
}

export class TestDataService {
  static async seed(): Promise<void> {
    try {
      const db = await getDatabase();

      const existing = await db.query('SELECT COUNT(*) as count FROM pesquisas');
      const count = existing.values?.[0]?.count ?? 0;
      if (count > 0) {
        console.log('[TestData] Dados de teste ja existem, pulando.');
        return;
      }

      const agora = nowISO();
      const hoje = new Date();

      const ids = await TestDataService.loadSeedIds(db);
      if (!ids) {
        console.log('[TestData] Seeds base nao encontrados, pulando.');
        return;
      }

      const {
        idP1, idP2, idP3,
        idPa1, idPa2, idPa3, idPa4, idPa5, idPa6,
        idPc1, idPc2, idPc3, idPc4, idPc5, idPc6, idPc7, idPc8, idPc9, idPc10, idPc11, idPc12,
        idAb1, idAb2, idAb3, idAb4, idAb5, idAb6, idAb7, idAb8, idAb9, idAb10, idAb11, idAb12, idAb13, idAb14,
        idAp1, idAp2, idAp3, idAp4, idAp5, idAp6,
        idAe1, idAe2, idAe3, idAe4, idAe5,
        idAi1, idAi2, idAi3,
        idE1, idE2, idE3, idE4, idE5, idE6,
      } = TestDataService.generateIds();

      // ============================================================
      // PESQUISAS
      // ============================================================
      const d60 = iso(addDays(hoje, -60));
      const d45 = iso(addDays(hoje, -45));
      const d120 = iso(addDays(hoje, -120));
      const d15 = iso(addDays(hoje, -15));

      await db.run(
        `INSERT INTO pesquisas (id, titulo, descricao, contexto, descricao_contexto, id_responsavel, status, data_inicio, data_fim, data_criacao, data_atualizacao, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idP1, 'Estudo de Erodibilidade dos Solos da Bacia do Rio Potengi',
          'Investigacao dos mecanismos de erosao hidrica nas margens do Rio Potengi, analisando a suscetibilidade dos solos locais.',
          'pesquisa_cientifica', 'Projeto financiado pelo CNPq - Edital Universal 2025',
          ids.professor, 'em_andamento', d60, null, d60, d60, 0]
      );
      await db.run(
        `INSERT INTO pesquisas (id, titulo, descricao, contexto, descricao_contexto, id_responsavel, status, data_inicio, data_fim, data_criacao, data_atualizacao, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idP2, 'Caracterizacao Geotecnica de Solos Expansivos do Semiarido Potiguar',
          'Avaliacao do comportamento de solos expansivos da regiao semiarida, com foco em variacao volumetrica sazonal.',
          'pesquisa_cientifica', 'Dissertacao de Mestrado - PPGEC/UFRN',
          ids.professor, 'em_andamento', d45, null, d45, d45, 0]
      );
      await db.run(
        `INSERT INTO pesquisas (id, titulo, descricao, contexto, descricao_contexto, id_responsavel, status, data_inicio, data_fim, data_criacao, data_atualizacao, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idP3, 'Analise de Estabilidade de Taludes - Campus Central da UFRN',
          'Estudo geotecnico dos taludes do campus central, incluindo retroanalise de rupturas e recomendacoes de contencao.',
          'academico', 'Trabalho de Conclusao de Curso - Engenharia Civil',
          ids.chefia, 'concluida', d120, d15, d120, d15, 0]
      );

      // ============================================================
      // PESQUISA_COLABORADORES
      // ============================================================
      await db.run(
        `INSERT INTO pesquisa_colaboradores (id, id_pesquisa, id_usuario, papel, data_adicao) VALUES (?,?,?,?,?)`,
        [generateUUID(), idP1, ids.tecnico, 'colaborador', d60]);
      await db.run(
        `INSERT INTO pesquisa_colaboradores (id, id_pesquisa, id_usuario, papel, data_adicao) VALUES (?,?,?,?,?)`,
        [generateUUID(), idP1, ids.aluno, 'colaborador', addDays(hoje, -30).toISOString()]);
      await db.run(
        `INSERT INTO pesquisa_colaboradores (id, id_pesquisa, id_usuario, papel, data_adicao) VALUES (?,?,?,?,?)`,
        [generateUUID(), idP2, ids.colaborador, 'colaborador', d45]);
      await db.run(
        `INSERT INTO pesquisa_colaboradores (id, id_pesquisa, id_usuario, papel, data_adicao) VALUES (?,?,?,?,?)`,
        [generateUUID(), idP2, ids.aluno, 'colaborador', d45]);
      await db.run(
        `INSERT INTO pesquisa_colaboradores (id, id_pesquisa, id_usuario, papel, data_adicao) VALUES (?,?,?,?,?)`,
        [generateUUID(), idP3, ids.tecnico, 'colaborador', d120]);
      await db.run(
        `INSERT INTO pesquisa_colaboradores (id, id_pesquisa, id_usuario, papel, data_adicao) VALUES (?,?,?,?,?)`,
        [generateUUID(), idP3, ids.professor, 'responsavel_secundario', d120]);

      // ============================================================
      // PROGRAMAS DE AMOSTRAGEM
      // ============================================================
      await db.run(
        `INSERT INTO programas_amostragem (id, id_pesquisa, endereco_coleta, coordenadas, objetivo, descricao, status, data_criacao, data_atualizacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [idPa1, idP1, 'Margem Direita do Rio Potengi, Av. Florianopolis s/n', '-5.7950,-35.2080',
          'investigacao_exploratoria', 'Sondagens a trado e coleta superficial ao longo da margem direita.',
          'ativo', d60, null, ids.professor, 0]);
      await db.run(
        `INSERT INTO programas_amostragem (id, id_pesquisa, endereco_coleta, coordenadas, objetivo, descricao, status, data_criacao, data_atualizacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [idPa2, idP1, 'Margem Esquerda do Rio Potengi, Proximo a Ponte de Igapo', '-5.7890,-35.2150',
          'investigacao_detalhada', 'Coleta de amostras indeformadas em taludes com sinais de erosao avancada.',
          'ativo', iso(addDays(hoje, -50)), null, ids.professor, 0]);
      await db.run(
        `INSERT INTO programas_amostragem (id, id_pesquisa, endereco_coleta, coordenadas, objetivo, descricao, status, data_criacao, data_atualizacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [idPa3, idP2, 'Zona Rural de Sao Goncalo do Amarante, RN-160 Km 12', '-5.8200,-35.2500',
          'investigacao_confirmatoria', 'Coleta sistematica em grade de 500m x 500m para mapeamento de solos expansivos.',
          'ativo', d45, null, ids.professor, 0]);
      await db.run(
        `INSERT INTO programas_amostragem (id, id_pesquisa, endereco_coleta, coordenadas, objetivo, descricao, status, data_criacao, data_atualizacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [idPa4, idP2, 'Regiao de Macaiba, Comunidade de Ferreiro Torto', '-5.8600,-35.3500',
          'investigacao_detalhada', 'Sondagens mistas com coleta de amostras deformadas e indeformadas para ensaios especiais.',
          'ativo', iso(addDays(hoje, -40)), null, ids.professor, 0]);
      await db.run(
        `INSERT INTO programas_amostragem (id, id_pesquisa, endereco_coleta, coordenadas, objetivo, descricao, status, data_criacao, data_atualizacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [idPa5, idP3, 'Setor Norte do Campus Universitario, Proximo ao CT', '-5.8380,-35.2000',
          'investigacao_exploratoria', 'Mapeamento geotecnico preliminar dos taludes do setor norte do campus.',
          'concluido', d120, d15, ids.chefia, 0]);
      await db.run(
        `INSERT INTO programas_amostragem (id, id_pesquisa, endereco_coleta, coordenadas, objetivo, descricao, status, data_criacao, data_atualizacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [idPa6, idP3, 'Talude da Biblioteca Central Zila Mamede', '-5.8390,-35.2010',
          'remediacao', 'Analise de ruptura ocorrida em janeiro/2025. Investigacao das causas e propostas de contencao.',
          'concluido', iso(addDays(hoje, -100)), d15, ids.chefia, 0]);

      // ============================================================
      // PONTOS DE COLETA
      // ============================================================
      const pontos: [string, string, string, string, string, string][] = [
        [idPc1, idPa1, 'PC-RP-01', '-5.7948,-35.2078', 'Ponto a montante, solo areno-argiloso avermelhado.', ids.professor],
        [idPc2, idPa1, 'PC-RP-02', '-5.7955,-35.2085', 'Ponto central, presenca de erosao laminar.', ids.professor],
        [idPc3, idPa2, 'PC-RP-03', '-5.7888,-35.2148', 'Base do talude, solo siltoso com cascalho.', ids.professor],
        [idPc4, idPa2, 'PC-RP-04', '-5.7895,-35.2155', 'Topo do talude, material coluvionar.', ids.professor],
        [idPc5, idPa3, 'PC-SG-01', '-5.8195,-35.2495', 'Area de pastagem, solo argiloso escuro.', ids.professor],
        [idPc6, idPa3, 'PC-SG-02', '-5.8210,-35.2510', 'Proximo a acude, solo com rachaduras de contracao.', ids.professor],
        [idPc7, idPa4, 'PC-MC-01', '-5.8595,-35.3495', 'Terreno inclinado, perfil com horizonte B textural.', ids.professor],
        [idPc8, idPa4, 'PC-MC-02', '-5.8610,-35.3510', 'Base de encosta, solo residual maduro.', ids.professor],
        [idPc9, idPa5, 'PC-CT-01', '-5.8375,-35.1995', 'Talude leste do CT, vegetacao rasteira.', ids.chefia],
        [idPc10, idPa5, 'PC-CT-02', '-5.8385,-35.2005', 'Corte de estrada, exposicao de perfil com 3m.', ids.chefia],
        [idPc11, idPa6, 'PC-BC-01', '-5.8388,-35.2008', 'Crista do talude rompido, solo residual de arenito.', ids.chefia],
        [idPc12, idPa6, 'PC-BC-02', '-5.8395,-35.2015', 'Base da ruptura, material transportado.', ids.chefia],
      ];
      for (const [id, idProg, idPlan, coords, desc, criadoPor] of pontos) {
        await db.run(
          `INSERT INTO pontos_coleta (id, id_programa_amostragem, identificacao_plano, coordenadas, descricao_local, data_criacao, id_criado_por, finalizado)
           VALUES (?,?,?,?,?,?,?,?)`,
          [id, idProg, idPlan, coords, desc, agora, criadoPor, 0]);
      }

      // ============================================================
      // AMOSTRAS BRUTAS
      // ============================================================
      const d30 = iso(addDays(hoje, -30));
      const d20 = iso(addDays(hoje, -20));
      const d10 = iso(addDays(hoje, -10));
      const d5 = iso(addDays(hoje, -5));

      const abDefs: [string, string, string, string, string, string, string][] = [
        // id, idPonto, numCampo, tipo, status, dataColeta, coords
        [idAb1, idPc1, 'AB-RP-001', 'deformada', 'ensaiada', d30, '-5.7948,-35.2078'],
        [idAb2, idPc2, 'AB-RP-002', 'deformada', 'ensaiada', iso(addDays(hoje, -25)), '-5.7955,-35.2085'],
        [idAb3, idPc3, 'AB-RP-003', 'deformada', 'ensaiada', d20, '-5.7888,-35.2148'],
        [idAb4, idPc5, 'AB-SG-001', 'deformada', 'ensaiada', d45, '-5.8195,-35.2495'],
        [idAb5, idPc6, 'AB-SG-002', 'deformada', 'preparada', d10, '-5.8210,-35.2510'],
        [idAb6, idPc7, 'AB-MC-001', 'deformada', 'preparada', d5, '-5.8595,-35.3495'],
        [idAb7, idPc9, 'AB-CT-001', 'deformada', 'coletada', iso(addDays(hoje, -3)), '-5.8375,-35.1995'],
        [idAb8, idPc12, 'AB-BC-002', 'deformada', 'descartada', iso(addDays(hoje, -90)), '-5.8395,-35.2015'],
        [idAb9, idPc10, 'AB-CT-002', 'deformada', 'coletada', iso(addDays(hoje, -2)), '-5.8385,-35.2005'],
        [idAb10, idPc11, 'AB-BC-001', 'deformada', 'ensaiada', d120, '-5.8388,-35.2008'],
      ];
      for (const [id, idPonto, numCampo, tipo, status, dataCol, coords] of abDefs) {
        await db.run(
          `INSERT INTO amostras_brutas (id, id_ponto_coleta, numero_identificacao_campo, tipo_amostra, classificacao, metodo_coleta, data_coleta, operador_coleta, profundidade_coleta, descricao, peso_bruto_campo, coordenadas_gps, status, data_criacao, id_criado_por, finalizado)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, idPonto, numCampo, tipo, 'superficial', 'trado_manual', dataCol,
            'Equipe de Campo UFRN', 0.5, 'Solo areno-argiloso com presenca de raizes.', 2.5, coords,
            status, agora, ids.professor, 0]);
      }

      const abIndefs: [string, string, string, string, string][] = [
        [idAb11, idPc4, 'AB-RP-004-I', 'indeformada', d20],
        [idAb12, idPc8, 'AB-MC-003-I', 'indeformada', iso(addDays(hoje, -35))],
        [idAb13, idPc10, 'AB-CT-003-I', 'indeformada', iso(addDays(hoje, -100))],
        [idAb14, idPc3, 'AB-RP-005-I', 'indeformada', iso(addDays(hoje, -80))],
      ];
      for (const [id, idPonto, numCampo, tipo, dataCol] of abIndefs) {
        await db.run(
          `INSERT INTO amostras_brutas (id, id_ponto_coleta, numero_identificacao_campo, tipo_amostra, classificacao, metodo_coleta, data_coleta, operador_coleta, profundidade_coleta, descricao, peso_bruto_campo, coordenadas_gps, status, data_criacao, id_criado_por, finalizado)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, idPonto, numCampo, tipo, 'profunda', 'shelby', dataCol,
            'Equipe de Campo UFRN', 2.0, 'Solo argiloso indeformado, amostra em tubo Shelby.', 5.0,
            '-5.7895,-35.2155', 'coletada', agora, ids.professor, 0]);
      }

      // ============================================================
      // ATUALIZAR STATUS DE ALGUMAS AMOSTRAS BRUTAS
      // ============================================================
      await db.run('UPDATE amostras_brutas SET status = ? WHERE id = ?', ['descartada', idAb8]);
      await db.run('UPDATE amostras_brutas SET status = ? WHERE id = ?', ['ensaiada', idAb11]);
      await db.run('UPDATE amostras_brutas SET status = ? WHERE id = ?', ['ensaiada', idAb12]);
      await db.run('UPDATE amostras_brutas SET status = ? WHERE id = ?', ['descartada', idAb14]);

      // ============================================================
      // AMOSTRAS PREPARADAS (para deformadas)
      // ============================================================
      const apData: [string, string, string, string, number, number, string][] = [
        [idAp1, idAb1, 'AP-001', 'com_secagem_previa', 2.0, 1.2, ids.tecnico],
        [idAp2, idAb2, 'AP-002', 'sem_secagem_previa', 3.0, 2.5, ids.tecnico],
        [idAp3, idAb3, 'AP-003', 'com_secagem_previa', 1.8, 1.0, ids.colaborador],
        [idAp4, idAb4, 'AP-004', 'com_secagem_previa', 2.2, 1.5, ids.tecnico],
        [idAp5, idAb5, 'AP-005', 'sem_secagem_previa', 2.5, 2.0, ids.colaborador],
        [idAp6, idAb6, 'AP-006', 'com_secagem_previa', 1.5, 0.8, ids.tecnico],
      ];
      for (const [id, idAb, num, metodo, pre, pos, resp] of apData) {
        await db.run(
          `INSERT INTO amostras_preparadas (id, id_amostra_bruta, numero_amostra, descricao_inicial, normatizacao, metodo_preparo, metodo_secagem, data_preparo, id_responsavel_preparo, quantidade_pre_quarteamento, quantidade_pos_quarteamento, observacoes, data_criacao, id_criado_por, finalizado)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, idAb, num, 'Amostra homogenea, cor marrom avermelhada.', 'ABNT NBR 6457:1986',
            metodo, 'ao_ar', iso(addDays(hoje, -1)), resp, pre, pos,
            'Preparo realizado conforme procedimento padrao.', agora, ids.tecnico, 0]);
      }

      // ============================================================
      // AMOSTRAS ENSAIADAS
      // ============================================================
      const aeData: [string, string, string, string, number][] = [
        [idAe1, idAp1, 'AE-001-UM', 'teor_umidade', 0.5],
        [idAe2, idAp2, 'AE-002-UM', 'teor_umidade', 0.4],
        [idAe3, idAp3, 'AE-003-GR', 'granulometria', 0.8],
        [idAe4, idAp4, 'AE-004-CP', 'compactacao', 1.5],
        [idAe5, idAp5, 'AE-005-LL', 'limite_liquidez', 0.3],
      ];
      for (const [id, idAp, num, tipo, qtd] of aeData) {
        await db.run(
          `INSERT INTO amostras_ensaiadas (id, id_amostra_preparada, numero_amostra, tipo_ensaio_destino, quantidade_inicial, quantidade_final, descricao, observacoes, data_criacao, id_criado_por, finalizado)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [id, idAp, num, tipo, qtd, qtd * 0.9, 'Fracao destinada ao ensaio.', null, agora, ids.tecnico, 0]);
      }

      // ============================================================
      // AMOSTRAS INDEFORMADAS
      // ============================================================
      await db.run(
        `INSERT INTO amostras_indeformadas (id, id_amostra_bruta, numero_amostra, tipo_indeformada, formato, altura, largura, comprimento, condicao, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idAi1, idAb11, 'AI-001-SH', 'shelby', 'cilindrico', 15.0, 7.0, null, 'Integra, sem fissuras visiveis.',
          'Amostra extraida com Shelby de 3", profundidade 2.0m.', agora, ids.tecnico, 0]);
      await db.run(
        `INSERT INTO amostras_indeformadas (id, id_amostra_bruta, numero_amostra, tipo_indeformada, formato, altura, largura, comprimento, condicao, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idAi2, idAb12, 'AI-002-BL', 'bloco', 'cubico', 20.0, 20.0, 20.0, 'Boa, bloco talhado in situ.',
          'Bloco indeformado de solo residual, embalado em filme PVC.', agora, ids.colaborador, 0]);
      await db.run(
        `INSERT INTO amostras_indeformadas (id, id_amostra_bruta, numero_amostra, tipo_indeformada, formato, altura, largura, comprimento, condicao, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idAi3, idAb13, 'AI-003-AN', 'anel', 'cilindrico', 2.0, 5.0, null, 'Regular, pequenas trincas nas bordas.',
          'Amostra em anel de aco inox para ensaio de adensamento.', agora, ids.tecnico, 0]);

      // ============================================================
      // ENSAIOS
      // ============================================================
      // E1..E4: teor_umidade; E5: granulometria; E6: cisalhamento_direto
      await db.run(
        `INSERT INTO ensaios (id, tipo_ensaio, norma_referencia, id_amostra_ensaiada, id_amostra_indeformada, id_executante, status, data_inicio, data_fim, temperatura_ambiente, umidade_ambiente, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idE1, 'teor_umidade', 'ABNT NBR 6457:1986', idAe1, null, ids.tecnico,
          'concluido', iso(addDays(hoje, -5)), iso(addDays(hoje, -4)), 25.0, 60.0,
          'Ensaio concluido sem intercorrencias.', agora, ids.tecnico, 0]);
      await db.run(
        `INSERT INTO ensaios (id, tipo_ensaio, norma_referencia, id_amostra_ensaiada, id_amostra_indeformada, id_executante, status, data_inicio, data_fim, temperatura_ambiente, umidade_ambiente, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idE2, 'teor_umidade', 'ABNT NBR 6457:1986', idAe2, null, ids.colaborador,
          'em_andamento', iso(addDays(hoje, -2)), null, 26.0, 58.0,
          'Aguardando segunda determinacao na estufa.', agora, ids.colaborador, 0]);
      await db.run(
        `INSERT INTO ensaios (id, tipo_ensaio, norma_referencia, id_amostra_ensaiada, id_amostra_indeformada, id_executante, status, data_inicio, data_fim, temperatura_ambiente, umidade_ambiente, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idE3, 'granulometria', 'ABNT NBR 7181:2016', idAe3, null, ids.tecnico,
          'concluido', iso(addDays(hoje, -10)), iso(addDays(hoje, -8)), 24.5, 55.0,
          'Ensaio completo: peneiramento fino e grosso + sedimentacao.', agora, ids.tecnico, 0]);
      await db.run(
        `INSERT INTO ensaios (id, tipo_ensaio, norma_referencia, id_amostra_ensaiada, id_amostra_indeformada, id_executante, status, data_inicio, data_fim, temperatura_ambiente, umidade_ambiente, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idE4, 'compactacao', 'ABNT NBR 7182:2016', idAe4, null, ids.colaborador,
          'nao_iniciado', null, null, null, null,
          'Ensaio programado, aguardando liberacao da prensa.', agora, ids.colaborador, 0]);
      await db.run(
        `INSERT INTO ensaios (id, tipo_ensaio, norma_referencia, id_amostra_ensaiada, id_amostra_indeformada, id_executante, status, data_inicio, data_fim, temperatura_ambiente, umidade_ambiente, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idE5, 'limite_liquidez', 'ABNT NBR 6459:2016', idAe5, null, ids.tecnico,
          'cancelado', iso(addDays(hoje, -7)), iso(addDays(hoje, -6)), 25.0, 62.0,
          'Cancelado por contaminacao da amostra durante o manuseio.', agora, ids.tecnico, 0]);
      await db.run(
        `INSERT INTO ensaios (id, tipo_ensaio, norma_referencia, id_amostra_ensaiada, id_amostra_indeformada, id_executante, status, data_inicio, data_fim, temperatura_ambiente, umidade_ambiente, observacoes, data_criacao, id_criado_por, finalizado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idE6, 'teor_umidade', 'ABNT NBR 6457:1986', null, idAi1, ids.colaborador,
          'concluido', iso(addDays(hoje, -18)), iso(addDays(hoje, -17)), 24.0, 55.0,
          'Umidade de amostra indeformada para correcao de parametros de resistencia.', agora, ids.colaborador, 0]);

      // ============================================================
      // ENSAIOS TEOR UMIDADE + DETERMINACOES
      // ============================================================
      // ETU1 (ensaio E1, concluido, 3 determinacoes)
      await db.run(
        `INSERT INTO ensaios_teor_umidade (id, temperatura_estufa, id_estufa, id_balanca, h_medio, desvio_padrao, fc_medio, numero_determinacoes)
         VALUES (?,?,?,?,?,?,?,?)`,
        [idE1, 105.0, ids.estufa, ids.paquimetro, 18.52, 0.35, 0.815, 3]);
      const detsE1: [string, number, number, number][] = [
        [generateUUID(), 45.23, 200.15, 167.80],
        [generateUUID(), 44.87, 198.50, 165.92],
        [generateUUID(), 46.01, 201.30, 168.75],
      ];
      for (let i = 0; i < detsE1.length; i++) {
        const [idDet, tara, m1, m2] = detsE1[i];
        await db.run(
          `INSERT INTO determinacoes_teor_umidade (id, id_ensaio_teor_umidade, numero_determinacao, tara, m1, m2, tempo_estufa, h_calculado, fc_individual, observacao, data_criacao, id_criado_por)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [idDet, idE1, i + 1, tara, m1, m2, 24.0,
            +(((m1 - m2) / (m2 - tara)) * 100).toFixed(2),
            +((m2 - tara) / (m1 - tara)).toFixed(4),
            null, agora, ids.tecnico]);
      }

      // ETU2 (ensaio E2, em_andamento, 2 determinacoes)
      await db.run(
        `INSERT INTO ensaios_teor_umidade (id, temperatura_estufa, id_estufa, id_balanca, h_medio, desvio_padrao, fc_medio, numero_determinacoes)
         VALUES (?,?,?,?,?,?,?,?)`,
        [idE2, 108.0, ids.estufa, ids.paquimetro, null, null, null, 1]);
      const detsE2: [string, number, number, number][] = [
        [generateUUID(), 43.50, 185.40, 158.20],
      ];
      for (let i = 0; i < detsE2.length; i++) {
        const [idDet, tara, m1, m2] = detsE2[i];
        await db.run(
          `INSERT INTO determinacoes_teor_umidade (id, id_ensaio_teor_umidade, numero_determinacao, tara, m1, m2, tempo_estufa, h_calculado, fc_individual, observacao, data_criacao, id_criado_por)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [idDet, idE2, i + 1, tara, m1, m2, 24.0,
            +(((m1 - m2) / (m2 - tara)) * 100).toFixed(2),
            +((m2 - tara) / (m1 - tara)).toFixed(4),
            null, agora, ids.colaborador]);
      }

      // ETU3 (ensaio E6, concluido, amostra indeformada, 3 determinacoes)
      await db.run(
        `INSERT INTO ensaios_teor_umidade (id, temperatura_estufa, id_estufa, id_balanca, h_medio, desvio_padrao, fc_medio, numero_determinacoes)
         VALUES (?,?,?,?,?,?,?,?)`,
        [idE6, 105.0, ids.estufa, ids.paquimetro, 27.83, 0.62, 0.782, 3]);
      const detsE3: [string, number, number, number][] = [
        [generateUUID(), 48.00, 210.50, 168.30],
        [generateUUID(), 47.50, 208.00, 166.80],
        [generateUUID(), 48.30, 212.10, 169.50],
      ];
      for (let i = 0; i < detsE3.length; i++) {
        const [idDet, tara, m1, m2] = detsE3[i];
        await db.run(
          `INSERT INTO determinacoes_teor_umidade (id, id_ensaio_teor_umidade, numero_determinacao, tara, m1, m2, tempo_estufa, h_calculado, fc_individual, observacao, data_criacao, id_criado_por)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [idDet, idE6, i + 1, tara, m1, m2, 24.0,
            +(((m1 - m2) / (m2 - tara)) * 100).toFixed(2),
            +((m2 - tara) / (m1 - tara)).toFixed(4),
            null, agora, ids.colaborador]);
      }

      // ETU4 (ensaio teor_umidade without corresponding ensaio, for extra odm)
      // Actually, the CHECK constraint requires id REFERENCES ensaios(id),
      // and E4 is compactacao, not teor_umidade. Let's skip an extra ETU.
      // We'll just keep ETU1, ETU2, ETU3.

      // ============================================================
      // METADADOS AMOSTRA
      // ============================================================
      const mtdAb1 = generateUUID();
      const mtdAb2 = generateUUID();
      const mtdAb11 = generateUUID();
      const mtdAb12 = generateUUID();
      const mtdAb10 = generateUUID();

      await db.run(
        `INSERT INTO metadados_amostra (id, id_amostra_bruta, classificacao_sucs, classificacao_aashto, cor, textura, consistencia, origem_geologica, municipio, uf, profundidade_inicial, profundidade_final, nivel_agua, status_preenchimento, data_criacao, data_atualizacao, id_criado_por, id_atualizado_por)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [mtdAb1, idAb1, 'SC', 'A-2-6', 'Marrom avermelhado', 'Arenosa com finos plasticos',
          'Media', 'Formacao Barreiras - sedimentos areno-argilosos', 'Natal', 'RN',
          0.3, 0.8, null, 'completo', agora, null, ids.professor, null]);
      await db.run(
        `INSERT INTO metadados_amostra (id, id_amostra_bruta, classificacao_sucs, classificacao_aashto, cor, textura, consistencia, origem_geologica, municipio, uf, profundidade_inicial, profundidade_final, nivel_agua, status_preenchimento, data_criacao, data_atualizacao, id_criado_por, id_atualizado_por)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [mtdAb2, idAb2, 'CL', 'A-6', 'Cinza esverdeado', 'Argilosa com silte',
          'Dura', 'Aluviao fluvial - depositos de varzea', 'Natal', 'RN',
          1.0, 2.0, 1.5, 'completo', agora, null, ids.professor, null]);
      await db.run(
        `INSERT INTO metadados_amostra (id, id_amostra_bruta, classificacao_sucs, classificacao_aashto, cor, textura, consistencia, origem_geologica, municipio, uf, profundidade_inicial, profundidade_final, nivel_agua, status_preenchimento, data_criacao, data_atualizacao, id_criado_por, id_atualizado_por)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [mtdAb11, idAb11, 'CH', 'A-7-6', 'Cinza escuro', 'Argila gorda, muito plastica',
          'Mole a media', 'Deposito de mangue - sedimentos organicos', 'Natal', 'RN',
          1.5, 2.5, 1.0, 'completo', agora, null, ids.professor, null]);
      await db.run(
        `INSERT INTO metadados_amostra (id, id_amostra_bruta, classificacao_sucs, classificacao_aashto, cor, textura, consistencia, origem_geologica, municipio, uf, profundidade_inicial, profundidade_final, nivel_agua, status_preenchimento, data_criacao, data_atualizacao, id_criado_por, id_atualizado_por)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [mtdAb12, idAb12, 'SM', 'A-2-4', 'Amarelo ocre', 'Siltosa com areia fina',
          'Media', 'Solo residual de granito - horizonte C', 'Macaiba', 'RN',
          0.5, 1.5, null, 'parcial', agora, null, ids.professor, null]);
      await db.run(
        `INSERT INTO metadados_amostra (id, id_amostra_bruta, classificacao_sucs, classificacao_aashto, cor, textura, consistencia, origem_geologica, municipio, uf, profundidade_inicial, profundidade_final, nivel_agua, status_preenchimento, data_criacao, data_atualizacao, id_criado_por, id_atualizado_por)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [mtdAb10, idAb10, 'ML', 'A-4', 'Vermelho tijolo', 'Siltosa, pouco plastica',
          'Rija', 'Solo residual de arenito - Formacao Barreiras', 'Natal', 'RN',
          1.0, 3.0, 2.5, 'completo', agora, null, ids.professor, null]);

      // ============================================================
      // INVENTARIO: LOTES DE MATERIAL
      // ============================================================
      const idLote1 = generateUUID();
      const idLote2 = generateUUID();
      const idLote3 = generateUUID();

      await db.run(
        `INSERT INTO lotes_material (id, id_material, numero_lote, data_recebimento, data_validade, quantidade_inicial, quantidade_atual, status, data_criacao)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [idLote1, ids.areia, 'LOTE-2026-001', iso(addDays(hoje, -40)), iso(addDays(hoje, 180)), 50, 42, 'ativo', agora]);
      await db.run(
        `INSERT INTO lotes_material (id, id_material, numero_lote, data_recebimento, data_validade, quantidade_inicial, quantidade_atual, status, data_criacao)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [idLote2, ids.cimento, 'LOTE-2025-003', iso(addDays(hoje, -200)), iso(addDays(hoje, -10)), 30, 0, 'vencido', agora]);
      await db.run(
        `INSERT INTO lotes_material (id, id_material, numero_lote, data_recebimento, data_validade, quantidade_inicial, quantidade_atual, status, data_criacao)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [idLote3, ids.areia, 'LOTE-2025-001', iso(addDays(hoje, -365)), iso(addDays(hoje, -60)), 25, 0, 'esgotado', agora]);

      // ============================================================
      // INVENTARIO: MAIS MOVIMENTACOES
      // ============================================================
      await db.run(
        `INSERT INTO movimentacoes_estoque (id, id_item, tipo, quantidade, id_lote, motivo, id_usuario_solicitante, id_usuario_registrador, data_movimentacao, observacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), ids.areia, 'saida', 8, idLote1, 'Consumo em ensaios de granulometria', ids.tecnico, ids.colaborador, iso(addDays(hoje, -10)), 'Retirada para peneiramento de 4 amostras.']);
      await db.run(
        `INSERT INTO movimentacoes_estoque (id, id_item, tipo, quantidade, id_lote, motivo, id_usuario_solicitante, id_usuario_registrador, data_movimentacao, observacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), ids.agua, 'saida', 3, null, 'Preparo de amostras para ensaio de compactacao', ids.tecnico, ids.tecnico, iso(addDays(hoje, -5)), null]);
      await db.run(
        `INSERT INTO movimentacoes_estoque (id, id_item, tipo, quantidade, id_lote, motivo, id_usuario_solicitante, id_usuario_registrador, data_movimentacao, observacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), ids.cimento, 'entrada', 20, idLote2, null, null, ids.chefia, iso(addDays(hoje, -180)), 'Compra via pregao eletronico UFRN.']);
      await db.run(
        `INSERT INTO movimentacoes_estoque (id, id_item, tipo, quantidade, id_lote, motivo, id_usuario_solicitante, id_usuario_registrador, data_movimentacao, observacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), ids.bandeja, 'saida', 1, null, 'Emprestimo para aula pratica de Mecanica dos Solos I', ids.professor, ids.colaborador, iso(addDays(hoje, -3)), 'Devolucao prevista para proxima semana.']);

      // ============================================================
      // INVENTARIO: HISTORICO ESTADO EQUIPAMENTO
      // ============================================================
      await db.run(
        `INSERT INTO historico_estado_equipamento (id, id_equipamento, estado_anterior, estado_novo, observacao, id_usuario, data_alteracao)
         VALUES (?,?,?,?,?,?,?)`,
        [generateUUID(), ids.prensa, 'disponivel', 'em_manutencao', 'Ruido metalico anormal detectado. Encaminhada para manutencao preventiva.', ids.colaborador, iso(addDays(hoje, -7))]);

      await db.run('UPDATE equipamentos SET estado = ?, data_atualizacao = ? WHERE id = ?', ['em_manutencao', iso(addDays(hoje, -7)), ids.prensa]);

      // ============================================================
      // INVENTARIO: REGISTROS DE EQUIPAMENTO
      // ============================================================
      await db.run(
        `INSERT INTO registros_equipamento (id, id_equipamento, tipo, descricao, resultado, observacao, id_usuario, data_registro, data_proxima_verificacao)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), ids.estufa, 'verificacao', 'Verificacao periodica de temperatura com termopar padrao.',
          'conforme', 'Temperatura estavel em 105°C ± 2°C em todos os pontos medidos.',
          ids.tecnico, iso(addDays(hoje, -15)), iso(addDays(hoje, 75))]);
      await db.run(
        `INSERT INTO registros_equipamento (id, id_equipamento, tipo, descricao, resultado, observacao, id_usuario, data_registro, data_proxima_verificacao)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), ids.paquimetro, 'verificacao', 'Calibracao com bloco padrao de 50mm.',
          'conforme', 'Erro maximo de 0.01mm, dentro da tolerancia do fabricante.',
          ids.colaborador, iso(addDays(hoje, -30)), iso(addDays(hoje, 150))]);

      // ============================================================
      // INVENTARIO: OCORRENCIAS ADICIONAIS
      // ============================================================
      await db.run(
        `INSERT INTO ocorrencias (id, tipo, id_item, titulo, descricao, fotos, status, id_usuario_abertura, id_usuario_responsavel, resolucao, data_abertura, data_resolucao, data_atualizacao)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), 'quebra', ids.bandeja, 'Bandeja metalica amassada durante transporte',
          'Uma das bandejas sofreu deformacao durante transporte de amostras para o campo. Compromete o uso em ensaios de pesagem.',
          null, 'resolvida', ids.aluno, ids.colaborador,
          'Bandeja encaminhada para funilaria. Recuperada e apta para uso.',
          iso(addDays(hoje, -25)), iso(addDays(hoje, -20)), iso(addDays(hoje, -20))]);
      await db.run(
        `INSERT INTO ocorrencias (id, tipo, id_item, titulo, descricao, fotos, status, id_usuario_abertura, id_usuario_responsavel, resolucao, data_abertura, data_resolucao, data_atualizacao)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), 'validade_expirada', ids.cimento, 'Cimento Portland lote LOTE-2025-003 vencido',
          'Lote de cimento com validade expirada em ' + dateStr(addDays(hoje, -10)) + '. Necessario descarte e reposicao.',
          null, 'em_analise', ids.colaborador, ids.chefia, null,
          iso(addDays(hoje, -3)), null, iso(addDays(hoje, -2))]);

      // ============================================================
      // CALENDARIO MENSAL E DIAS
      // ============================================================
      const idCal1 = generateUUID();

      await db.run(
        `INSERT INTO calendario_mensal (id, mes_ano, hora_abertura_padrao, hora_fechamento_padrao, capacidade_padrao, observacoes, status, id_responsavel, data_criacao, data_atualizacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [idCal1, mesAno(hoje), '07:00', '19:00', 3, 'Calendario de junho/2026 - periodo letivo regular.', 'publicado', ids.chefia, agora, null]);

      // Generate weekday entries for the current month
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth();
      const ultimoDia = new Date(ano, mes + 1, 0).getDate();

      for (let dia = 1; dia <= ultimoDia; dia++) {
        const data = new Date(ano, mes, dia);
        const diaSemana = data.getDay(); // 0=dom, 6=sab
        if (diaSemana === 0 || diaSemana === 6) {
          // Weekend: unavailable
          await db.run(
            `INSERT INTO calendario_dias (id, id_calendario_mensal, dia, disponivel, hora_abertura, hora_fechamento, capacidade, motivo)
             VALUES (?,?,?,?,?,?,?,?)`,
            [generateUUID(), idCal1, dia, 0, null, null, null, 'Final de semana - laboratorio fechado.']);
        } else {
          // Weekday: available
          await db.run(
            `INSERT INTO calendario_dias (id, id_calendario_mensal, dia, disponivel, hora_abertura, hora_fechamento, capacidade, motivo)
             VALUES (?,?,?,?,?,?,?,?)`,
            [generateUUID(), idCal1, dia, 1, '07:00', '19:00', 3, null]);
        }
      }

      // ============================================================
      // AGENDAMENTOS
      // ============================================================
      const idAg1 = generateUUID();
      const idAg2 = generateUUID();
      const idAg3 = generateUUID();
      const idAg4 = generateUUID();

      // AG1: solicitado (aguardando aprovacao)
      await db.run(
        `INSERT INTO agendamentos (id, id_pesquisa, id_usuario_solicitante, id_tecnico_responsavel, objetivo, contexto, status, id_aprovador, justificativa_aprovacao, motivo_cancelamento, data_solicitacao, data_aprovacao, data_cancelamento, data_finalizacao)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idAg1, idP1, ids.aluno, null, 'Ensaio de granulometria em amostras da margem direita do Potengi.',
          'academico', 'solicitado', null, null, null, d10, null, null, null]);
      await db.run(
        `INSERT INTO agendamento_datas (id, id_agendamento, data_agendada, hora_inicio, hora_fim, comparecimento, observacao_finalizacao)
         VALUES (?,?,?,?,?,?,?)`,
        [generateUUID(), idAg1, dateStr(addDays(hoje, 14)), '08:00', '12:00', null, null]);
      await db.run(
        `INSERT INTO agendamento_datas (id, id_agendamento, data_agendada, hora_inicio, hora_fim, comparecimento, observacao_finalizacao)
         VALUES (?,?,?,?,?,?,?)`,
        [generateUUID(), idAg1, dateStr(addDays(hoje, 15)), '08:00', '12:00', null, null]);
      await db.run(
        `INSERT INTO agendamento_ensaios (id, id_agendamento, tipo_ensaio, descricao) VALUES (?,?,?,?)`,
        [generateUUID(), idAg1, 'granulometria', 'Peneiramento fino e grosso, sem sedimentacao.']);
      await db.run(
        `INSERT INTO agendamento_itens (id, id_agendamento, id_item) VALUES (?,?,?)`,
        [generateUUID(), idAg1, ids.areia]);

      // AG2: aprovado (datas futuras)
      await db.run(
        `INSERT INTO agendamentos (id, id_pesquisa, id_usuario_solicitante, id_tecnico_responsavel, objetivo, contexto, status, id_aprovador, justificativa_aprovacao, motivo_cancelamento, data_solicitacao, data_aprovacao, data_cancelamento, data_finalizacao)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idAg2, idP2, ids.professor, ids.colaborador, 'Ensaios de compactacao Proctor Normal para amostras de Sao Goncalo.',
          'pesquisa_cientifica', 'aprovado', ids.chefia,
          'Agendamento aprovado conforme disponibilidade do tecnico.', null,
          iso(addDays(hoje, -3)), iso(addDays(hoje, -2)), null, null]);
      await db.run(
        `INSERT INTO agendamento_datas (id, id_agendamento, data_agendada, hora_inicio, hora_fim, comparecimento, observacao_finalizacao)
         VALUES (?,?,?,?,?,?,?)`,
        [generateUUID(), idAg2, dateStr(addDays(hoje, 7)), '13:00', '18:00', null, null]);
      await db.run(
        `INSERT INTO agendamento_ensaios (id, id_agendamento, tipo_ensaio, descricao) VALUES (?,?,?,?)`,
        [generateUUID(), idAg2, 'compactacao', 'Proctor Normal com reuso de material - 5 pontos.']);
      await db.run(
        `INSERT INTO agendamento_itens (id, id_agendamento, id_item) VALUES (?,?,?)`,
        [generateUUID(), idAg2, ids.areia]);
      await db.run(
        `INSERT INTO agendamento_itens (id, id_agendamento, id_item) VALUES (?,?,?)`,
        [generateUUID(), idAg2, ids.estufa]);

      // AG3: negado
      await db.run(
        `INSERT INTO agendamentos (id, id_pesquisa, id_usuario_solicitante, id_tecnico_responsavel, objetivo, contexto, status, id_aprovador, justificativa_aprovacao, motivo_cancelamento, data_solicitacao, data_aprovacao, data_cancelamento, data_finalizacao)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idAg3, idP1, ids.aluno, null, 'Ensaio de cisalhamento direto em amostras indeformadas.',
          'academico', 'negado', ids.chefia,
          null,
          'Equipamento de cisalhamento direto em manutencao. Reagendar para julho.',
          iso(addDays(hoje, -15)), iso(addDays(hoje, -13)), null, null]);
      await db.run(
        `INSERT INTO agendamento_datas (id, id_agendamento, data_agendada, hora_inicio, hora_fim, comparecimento, observacao_finalizacao)
         VALUES (?,?,?,?,?,?,?)`,
        [generateUUID(), idAg3, dateStr(addDays(hoje, -5)), '07:00', '12:00', null, null]);
      await db.run(
        `INSERT INTO agendamento_ensaios (id, id_agendamento, tipo_ensaio, descricao) VALUES (?,?,?,?)`,
        [generateUUID(), idAg3, 'cisalhamento_direto', 'Cisalhamento direto em amostras indeformadas da margem esquerda.']);

      // AG4: finalizado (passado, com comparecimento)
      await db.run(
        `INSERT INTO agendamentos (id, id_pesquisa, id_usuario_solicitante, id_tecnico_responsavel, objetivo, contexto, status, id_aprovador, justificativa_aprovacao, motivo_cancelamento, data_solicitacao, data_aprovacao, data_cancelamento, data_finalizacao)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [idAg4, idP3, ids.tecnico, ids.colaborador, 'Ensaios de teor de umidade para amostras da Biblioteca Central.',
          'academico', 'finalizado', ids.chefia,
          'Aprovado. Utilizar estufa EQP-001.', null,
          iso(addDays(hoje, -25)), iso(addDays(hoje, -24)), null, iso(addDays(hoje, -19))]);
      await db.run(
        `INSERT INTO agendamento_datas (id, id_agendamento, data_agendada, hora_inicio, hora_fim, comparecimento, observacao_finalizacao)
         VALUES (?,?,?,?,?,?,?)`,
        [generateUUID(), idAg4, dateStr(addDays(hoje, -21)), '08:00', '12:00', 'compareceu', 'Ensaio concluido sem intercorrencias.']);
      await db.run(
        `INSERT INTO agendamento_datas (id, id_agendamento, data_agendada, hora_inicio, hora_fim, comparecimento, observacao_finalizacao)
         VALUES (?,?,?,?,?,?,?)`,
        [generateUUID(), idAg4, dateStr(addDays(hoje, -22)), '13:00', '17:00', 'compareceu', 'Segunda bateria de determinacoes concluida.']);

      // ============================================================
      // IMAGENS
      // ============================================================
      await db.run(
        `INSERT INTO imagens (id, url, descricao, id_autor, entidade_tipo, entidade_id, status, data_criacao)
         VALUES (?,?,?,?,?,?,?,?)`,
        [generateUUID(), '/assets/fotos/amostra_AB-RP-001.jpg', 'Amostra AB-RP-001 apos coleta em campo.',
          ids.professor, 'amostra_bruta', idAb1, 'ativo', agora]);
      await db.run(
        `INSERT INTO imagens (id, url, descricao, id_autor, entidade_tipo, entidade_id, status, data_criacao)
         VALUES (?,?,?,?,?,?,?,?)`,
        [generateUUID(), '/assets/fotos/talude_biblioteca.jpg', 'Vista geral do talude da Biblioteca Central apos ruptura.',
          ids.chefia, 'ponto_coleta', idPc11, 'ativo', agora]);
      await db.run(
        `INSERT INTO imagens (id, url, descricao, id_autor, entidade_tipo, entidade_id, status, data_criacao)
         VALUES (?,?,?,?,?,?,?,?)`,
        [generateUUID(), '/assets/fotos/lab_vista_geral.jpg', 'Vista geral do Laboratorio de Mecanica dos Solos.',
          ids.aluno, 'pesquisa', idP3, 'ativo', agora]);

      // ============================================================
      // LOGS DE SISTEMA (alguns registros para o painel gerencial)
      // ============================================================
      await db.run(
        `INSERT INTO logs_sistema (id, modulo, acao, id_usuario_executor, id_usuario_afetado, valor_anterior, valor_novo, detalhes, ip_origem, data_criacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), 'ensaios', 'pesquisa_criada', ids.professor, null, null, null,
          'Pesquisa "Estudo de Erodibilidade" criada.', '127.0.0.1', d60]);
      await db.run(
        `INSERT INTO logs_sistema (id, modulo, acao, id_usuario_executor, id_usuario_afetado, valor_anterior, valor_novo, detalhes, ip_origem, data_criacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), 'estoque', 'movimentacao_saida', ids.colaborador, null, null, null,
          'Saida de 8 kg de Areia Lavada (MAT-001) para ensaios.', '127.0.0.1', iso(addDays(hoje, -10))]);
      await db.run(
        `INSERT INTO logs_sistema (id, modulo, acao, id_usuario_executor, id_usuario_afetado, valor_anterior, valor_novo, detalhes, ip_origem, data_criacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), 'agendamento', 'agendamento_aprovado', ids.chefia, ids.professor, 'solicitado', 'aprovado',
          'Agendamento de compactacao aprovado.', '127.0.0.1', iso(addDays(hoje, -2))]);
      await db.run(
        `INSERT INTO logs_sistema (id, modulo, acao, id_usuario_executor, id_usuario_afetado, valor_anterior, valor_novo, detalhes, ip_origem, data_criacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), 'estoque', 'estado_equipamento_alterado', ids.colaborador, null, 'disponivel', 'em_manutencao',
          'Prensa de adensamento (EQP-002) em manutencao por ruido anormal.', '127.0.0.1', iso(addDays(hoje, -7))]);
      await db.run(
        `INSERT INTO logs_sistema (id, modulo, acao, id_usuario_executor, id_usuario_afetado, valor_anterior, valor_novo, detalhes, ip_origem, data_criacao)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [generateUUID(), 'ensaios', 'ensaio_concluido', ids.tecnico, null, null, null,
          'Ensaio de teor de umidade (AB-RP-001) concluido com h=18.52%.', '127.0.0.1', iso(addDays(hoje, -4))]);

      console.log('[TestData] Dados de teste criados: 3 pesquisas, 6 programas, 12 pontos, 14 amostras brutas, 6 preparadas, 5 ensaiadas, 3 indeformadas, 6 ensaios, 7 determinacoes, 5 metadados, 3 lotes, 6 movimentacoes, 3 ocorrencias totais, 1 calendario mensal, 4 agendamentos, 3 imagens, 5 logs.');
    } catch (err) {
      console.error('[TestData] Erro ao criar dados de teste:', err);
    }
  }

  private static async loadSeedIds(db: SQLiteDBConnection): Promise<IdMap | null> {
    const userRows = await db.query(
      "SELECT id, email FROM usuarios WHERE email IN ('aluno@ufrn.br','professor@ufrn.br','tecnico@ufrn.edu.br','colaborador@ufrn.br','chefia@ufrn.br')"
    );
    const userMap: Record<string, string> = {};
    for (const row of (userRows.values || []) as Record<string, string>[]) {
      userMap[row.email] = row.id;
    }
    if (Object.keys(userMap).length < 5) {
      console.warn('[TestData] Usuarios seed insuficientes:', Object.keys(userMap).length);
      return null;
    }

    const eqpRows = await db.query(
      "SELECT id, codigo FROM itens WHERE codigo IN ('EQP-001','EQP-002','EQP-003') AND tipo='equipamento'"
    );
    const eqpMap: Record<string, string> = {};
    for (const row of (eqpRows.values || []) as Record<string, string>[]) {
      eqpMap[row.codigo] = row.id;
    }
    if (Object.keys(eqpMap).length < 3) {
      console.warn('[TestData] Equipamentos seed insuficientes:', Object.keys(eqpMap).length);
      return null;
    }

    const matRows = await db.query(
      "SELECT id, codigo FROM itens WHERE codigo IN ('MAT-001','MAT-002','MAT-003') AND tipo='material'"
    );
    const matMap: Record<string, string> = {};
    for (const row of (matRows.values || []) as Record<string, string>[]) {
      matMap[row.codigo] = row.id;
    }

    const uteRows = await db.query(
      "SELECT id, codigo FROM itens WHERE codigo IN ('UTE-001','UTE-002') AND tipo='utensilio'"
    );
    const uteMap: Record<string, string> = {};
    for (const row of (uteRows.values || []) as Record<string, string>[]) {
      uteMap[row.codigo] = row.id;
    }

    return {
      aluno: userMap['aluno@ufrn.br'],
      professor: userMap['professor@ufrn.br'],
      tecnico: userMap['tecnico@ufrn.edu.br'],
      colaborador: userMap['colaborador@ufrn.br'],
      chefia: userMap['chefia@ufrn.br'],
      estufa: eqpMap['EQP-001'],
      prensa: eqpMap['EQP-002'],
      paquimetro: eqpMap['EQP-003'],
      areia: matMap['MAT-001'],
      cimento: matMap['MAT-002'],
      agua: matMap['MAT-003'],
      bandeja: uteMap['UTE-001'],
      espatula: uteMap['UTE-002'],
    };
  }

  private static generateIds() {
    return {
      idP1: generateUUID(), idP2: generateUUID(), idP3: generateUUID(),
      idPa1: generateUUID(), idPa2: generateUUID(), idPa3: generateUUID(),
      idPa4: generateUUID(), idPa5: generateUUID(), idPa6: generateUUID(),
      idPc1: generateUUID(), idPc2: generateUUID(), idPc3: generateUUID(),
      idPc4: generateUUID(), idPc5: generateUUID(), idPc6: generateUUID(),
      idPc7: generateUUID(), idPc8: generateUUID(), idPc9: generateUUID(),
      idPc10: generateUUID(), idPc11: generateUUID(), idPc12: generateUUID(),
      idAb1: generateUUID(), idAb2: generateUUID(), idAb3: generateUUID(),
      idAb4: generateUUID(), idAb5: generateUUID(), idAb6: generateUUID(),
      idAb7: generateUUID(), idAb8: generateUUID(), idAb9: generateUUID(),
      idAb10: generateUUID(), idAb11: generateUUID(), idAb12: generateUUID(),
      idAb13: generateUUID(), idAb14: generateUUID(),
      idAp1: generateUUID(), idAp2: generateUUID(), idAp3: generateUUID(),
      idAp4: generateUUID(), idAp5: generateUUID(), idAp6: generateUUID(),
      idAe1: generateUUID(), idAe2: generateUUID(), idAe3: generateUUID(),
      idAe4: generateUUID(), idAe5: generateUUID(),
      idAi1: generateUUID(), idAi2: generateUUID(), idAi3: generateUUID(),
      idE1: generateUUID(), idE2: generateUUID(), idE3: generateUUID(),
      idE4: generateUUID(), idE5: generateUUID(), idE6: generateUUID(),
    };
  }
}
