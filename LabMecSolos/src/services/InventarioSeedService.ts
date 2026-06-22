import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { getDatabase } from './DatabaseService';

export class InventarioSeedService {
  static async seed(): Promise<void> {
    try {
      const db = await getDatabase();

      const existing = await db.query('SELECT COUNT(*) as count FROM itens', []);
      const count = existing.values?.[0]?.count ?? 0;
      if (count > 0) return;

      const chefiaUser = await db.query("SELECT id FROM usuarios WHERE permissao = 'chefia' LIMIT 1");
      const adminId = chefiaUser.values?.[0]?.id as string | undefined;
      if (!adminId) return;

      const agora = nowISO();
      const cal30Dias = new Date(); cal30Dias.setDate(cal30Dias.getDate() + 30);
      const calVencida = new Date(); calVencida.setDate(calVencida.getDate() - 15);

      const ids = {
        cat1: generateUUID(), cat2: generateUUID(), cat3: generateUUID(),
        m1: generateUUID(), m2: generateUUID(), m3: generateUUID(),
        u1: generateUUID(), u2: generateUUID(),
        e1: generateUUID(), e2: generateUUID(), e3: generateUUID(),
      };

      // Categorias
      await db.run('INSERT INTO categorias_item (id, nome, descricao, status, data_criacao) VALUES (?, ?, ?, ?, ?)',
        [ids.cat1, 'Solos Granulares', 'Materiais para ensaios com areias e pedregulhos', 'ativa', agora]);
      await db.run('INSERT INTO categorias_item (id, nome, descricao, status, data_criacao) VALUES (?, ?, ?, ?, ?)',
        [ids.cat2, 'Solos Finos', 'Materiais para ensaios com siltes e argilas', 'ativa', agora]);
      await db.run('INSERT INTO categorias_item (id, nome, descricao, status, data_criacao) VALUES (?, ?, ?, ?, ?)',
        [ids.cat3, 'Equipamentos de Campo', 'Equipamentos usados em coletas externas', 'ativa', agora]);

      // Materiais
      await db.run("INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, 'material', ?, ?, ?, 'ativo', ?)",
        [ids.m1, 'Areia Lavada', 'MAT-001', ids.cat1, agora]);
      await db.run('INSERT INTO materiais (id, unidade_medida, ponto_pedido, quantidade_atual) VALUES (?, ?, ?, ?)',
        [ids.m1, 'kg', 25, 50]);

      await db.run("INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, 'material', ?, ?, ?, 'ativo', ?)",
        [ids.m2, 'Cimento Portland', 'MAT-002', ids.cat2, agora]);
      await db.run('INSERT INTO materiais (id, unidade_medida, ponto_pedido, quantidade_atual) VALUES (?, ?, ?, ?)',
        [ids.m2, 'kg', 10, 8]); // abaixo do ponto de pedido

      await db.run("INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, 'material', ?, ?, ?, 'ativo', ?)",
        [ids.m3, 'Agua Destilada', 'MAT-003', null, agora]);
      await db.run('INSERT INTO materiais (id, unidade_medida, ponto_pedido, quantidade_atual) VALUES (?, ?, ?, ?)',
        [ids.m3, 'L', 5, 12]);

      // Utensílios
      await db.run("INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, 'utensilio', ?, ?, ?, 'ativo', ?)",
        [ids.u1, 'Bandeja Metalica', 'UTE-001', null, agora]);
      await db.run("INSERT INTO utensilios (id, unidade_medida, ponto_pedido, local_armazenamento, quantidade_atual) VALUES (?, 'unidade', ?, ?, ?)",
        [ids.u1, 5, 'Armario A-3, Prateleira 2', 12]);

      await db.run("INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, 'utensilio', ?, ?, ?, 'ativo', ?)",
        [ids.u2, 'Espatula de Laboratorio', 'UTE-002', ids.cat2, agora]);
      await db.run("INSERT INTO utensilios (id, unidade_medida, ponto_pedido, local_armazenamento, quantidade_atual) VALUES (?, 'unidade', ?, ?, ?)",
        [ids.u2, 3, 'Armario B-1, Gaveta 3', 2]); // abaixo do ponto de pedido

      // Equipamentos
      await db.run("INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, 'equipamento', ?, ?, ?, 'ativo', ?)",
        [ids.e1, 'Estufa de Secagem', 'EQP-001', ids.cat2, agora]);
      await db.run("INSERT INTO equipamentos (id, numero_serie, marca, modelo, especificacao_tecnica, estado, data_ultima_calibracao, frequencia_calibracao_dias, data_criacao) VALUES (?, ?, ?, ?, ?, 'disponivel', ?, ?, ?)",
        [ids.e1, 'SN-2024-001', 'Solab', 'SL-102', '105°C ± 5°C, 220V', agora, 180, agora]);
      await db.run('INSERT INTO historico_estado_equipamento (id, id_equipamento, estado_anterior, estado_novo, id_usuario, data_alteracao) VALUES (?, ?, NULL, ?, ?, ?)',
        [generateUUID(), ids.e1, 'disponivel', adminId, agora]);

      await db.run("INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, 'equipamento', ?, ?, ?, 'ativo', ?)",
        [ids.e2, 'Prensa de Adensamento', 'EQP-002', ids.cat2, agora]);
      await db.run("INSERT INTO equipamentos (id, numero_serie, marca, modelo, especificacao_tecnica, estado, data_ultima_calibracao, frequencia_calibracao_dias, data_criacao) VALUES (?, ?, ?, ?, ?, 'disponivel', ?, ?, ?)",
        [ids.e2, 'SN-2023-088', 'Contenco', 'CP-2000', 'Carga max 20kN', calVencida.toISOString(), 365, agora]); // calibracao vencida

      await db.run("INSERT INTO itens (id, tipo, nome, codigo, id_categoria, status, data_criacao) VALUES (?, 'equipamento', ?, ?, ?, 'ativo', ?)",
        [ids.e3, 'Paquimetro Digital', 'EQP-003', ids.cat3, agora]);
      await db.run("INSERT INTO equipamentos (id, numero_serie, marca, modelo, especificacao_tecnica, estado, data_ultima_calibracao, frequencia_calibracao_dias, data_criacao) VALUES (?, ?, ?, ?, ?, 'disponivel', ?, ?, ?)",
        [ids.e3, 'PD-2025-015', 'Mitutoyo', 'CD-6', '0-150mm, 0.01mm', cal30Dias.toISOString(), 180, agora]);

      // Movimentações
      await db.run("INSERT INTO movimentacoes_estoque (id, id_item, tipo, quantidade, id_usuario_registrador, data_movimentacao, observacao) VALUES (?, ?, 'entrada', ?, ?, ?, ?)",
        [generateUUID(), ids.m1, 50, adminId, agora, 'Entrada inicial']);
      await db.run("INSERT INTO movimentacoes_estoque (id, id_item, tipo, quantidade, motivo, id_usuario_registrador, data_movimentacao) VALUES (?, ?, 'saida', ?, ?, ?, ?)",
        [generateUUID(), ids.m2, 2, 'Uso em ensaio de compactacao', adminId, agora]);

      // Ocorrências
      await db.run("INSERT INTO ocorrencias (id, tipo, id_item, titulo, descricao, status, id_usuario_abertura, data_abertura) VALUES (?, 'mal_funcionamento', ?, ?, ?, 'aberta', ?, ?)",
        [generateUUID(), ids.e2, 'Prensa com ruido anormal', 'A prensa de adensamento esta emitindo um ruido metalico durante a operacao. Pode indicar desgaste no parafuso de carga.', adminId, agora]);
      await db.run("INSERT INTO ocorrencias (id, tipo, id_item, titulo, descricao, status, id_usuario_abertura, data_abertura) VALUES (?, 'estoque_insuficiente', ?, ?, ?, 'aberta', ?, ?)",
        [generateUUID(), ids.m2, 'Cimento Portland com estoque baixo', 'Estoque atual de 8 kg esta abaixo do ponto de pedido de 10 kg. Necessario reposicao urgente.', adminId, agora]);

      console.log('InventarioSeed: Dados de teste criados (3 materiais, 2 utensilios, 3 equipamentos, 2 ocorrencias).');
    } catch (err) {
      console.error('InventarioSeed error:', err);
    }
  }
}
