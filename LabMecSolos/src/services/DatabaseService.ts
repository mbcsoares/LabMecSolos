import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements } from 'jeep-sqlite/loader';
import { generateUUID } from '../utils/idUtils';

const DB_NAME = 'labmecsolos';

let db: SQLiteDBConnection | null = null;
let sqliteConnection: SQLiteConnection | null = null;

function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web';
}

async function saveDatabase(): Promise<void> {
  if (isWeb() && sqliteConnection) {
    try {
      await sqliteConnection.saveToStore(DB_NAME);
    } catch (err) {
      console.error('Failed to save database to store:', err);
    }
  }
}

export async function initDatabase(): Promise<void> {
  try {
    if (Capacitor.getPlatform() === 'web') {
      await defineCustomElements(window);
      await customElements.whenDefined('jeep-sqlite');
    }

    const sqlite = CapacitorSQLite;
    sqliteConnection = new SQLiteConnection(sqlite);

    if (isWeb()) {
      await sqliteConnection.initWebStore();
    }

    const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result;
    if (isConn) {
      db = await sqliteConnection.retrieveConnection(DB_NAME, false);
    } else {
      db = await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    }

    await db.open();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS pre_cadastro (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        sobrenome TEXT NOT NULL,
        genero TEXT CHECK(genero IN ('masculino', 'feminino', 'nao_informado')),
        matricula TEXT NOT NULL,
        email TEXT NOT NULL,
        senha_hash TEXT NOT NULL,
        perfil TEXT CHECK(perfil IN ('professor', 'tecnico', 'aluno')) NOT NULL,
        codigo_verificacao TEXT NOT NULL,
        data_criacao TEXT NOT NULL,
        data_expiracao_codigo TEXT NOT NULL,
        reenvios INTEGER DEFAULT 0,
        UNIQUE(matricula),
        UNIQUE(email)
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        sobrenome TEXT NOT NULL,
        genero TEXT CHECK(genero IN ('masculino', 'feminino', 'nao_informado')),
        matricula TEXT NOT NULL,
        email TEXT NOT NULL,
        senha_hash TEXT NOT NULL,
        perfil TEXT CHECK(perfil IN ('professor', 'tecnico', 'aluno')) NOT NULL,
        permissao TEXT CHECK(permissao IN ('comum', 'colaborador', 'chefia')) DEFAULT 'comum',
        status TEXT CHECK(status IN ('ativo', 'inativo', 'excluido')) DEFAULT 'ativo',
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT,
        data_exclusao TEXT,
        UNIQUE(matricula),
        UNIQUE(email)
      );

      CREATE TABLE IF NOT EXISTS sessoes (
        id TEXT PRIMARY KEY,
        id_usuario TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        data_criacao TEXT NOT NULL,
        data_expiracao TEXT NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS logs_sistema (
        id TEXT PRIMARY KEY,
        modulo TEXT CHECK(modulo IN ('autenticacao', 'administracao', 'estoque', 'ensaios', 'agendamento')) NOT NULL,
        acao TEXT NOT NULL,
        id_usuario_executor TEXT,
        id_usuario_afetado TEXT,
        valor_anterior TEXT,
        valor_novo TEXT,
        detalhes TEXT,
        ip_origem TEXT,
        data_criacao TEXT NOT NULL,
        FOREIGN KEY (id_usuario_executor) REFERENCES usuarios(id),
        FOREIGN KEY (id_usuario_afetado) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS codigos_verificacao (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        codigo TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('confirmacao_conta', 'redefinicao_senha')) NOT NULL,
        data_criacao TEXT NOT NULL,
        data_expiracao TEXT NOT NULL,
        usado INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS categorias_item (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL UNIQUE,
        descricao TEXT,
        status TEXT CHECK(status IN ('ativa', 'inativa')) DEFAULT 'ativa',
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT
      );

      CREATE TABLE IF NOT EXISTS itens (
        id TEXT PRIMARY KEY,
        tipo TEXT CHECK(tipo IN ('material', 'utensilio', 'equipamento')) NOT NULL,
        nome TEXT NOT NULL,
        codigo TEXT UNIQUE NOT NULL,
        id_categoria TEXT,
        status TEXT CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo',
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT,
        FOREIGN KEY (id_categoria) REFERENCES categorias_item(id)
      );

      CREATE TABLE IF NOT EXISTS materiais (
        id TEXT PRIMARY KEY,
        unidade_medida TEXT CHECK(unidade_medida IN ('kg', 'g', 'tonelada', 'L', 'mL', 'unidade', 'm', 'cm', 'mm', 'm²', 'm³', 'pacote', 'rolo', 'folha')) NOT NULL,
        ponto_pedido REAL,
        quantidade_atual REAL DEFAULT 0,
        FOREIGN KEY (id) REFERENCES itens(id)
      );

      CREATE TABLE IF NOT EXISTS utensilios (
        id TEXT PRIMARY KEY,
        unidade_medida TEXT CHECK(unidade_medida IN ('unidade', 'jogo', 'par', 'conjunto', 'caixa')) DEFAULT 'unidade',
        ponto_pedido REAL,
        local_armazenamento TEXT,
        quantidade_atual REAL DEFAULT 0,
        FOREIGN KEY (id) REFERENCES itens(id)
      );

      CREATE TABLE IF NOT EXISTS equipamentos (
        id TEXT PRIMARY KEY,
        numero_serie TEXT,
        marca TEXT,
        modelo TEXT,
        especificacao_tecnica TEXT,
        estado TEXT CHECK(estado IN ('disponivel', 'em_manutencao', 'inoperante', 'calibracao_vencida')) DEFAULT 'disponivel',
        data_ultima_calibracao TEXT,
        frequencia_calibracao_dias INTEGER,
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT,
        FOREIGN KEY (id) REFERENCES itens(id)
      );

      CREATE TABLE IF NOT EXISTS lotes_material (
        id TEXT PRIMARY KEY,
        id_material TEXT NOT NULL,
        numero_lote TEXT NOT NULL,
        data_recebimento TEXT NOT NULL,
        data_validade TEXT,
        quantidade_inicial REAL NOT NULL,
        quantidade_atual REAL NOT NULL,
        status TEXT CHECK(status IN ('ativo', 'esgotado', 'vencido')) DEFAULT 'ativo',
        data_criacao TEXT NOT NULL,
        FOREIGN KEY (id_material) REFERENCES materiais(id)
      );

      CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
        id TEXT PRIMARY KEY,
        id_item TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('entrada', 'saida')) NOT NULL,
        quantidade REAL NOT NULL,
        id_lote TEXT,
        motivo TEXT,
        id_usuario_solicitante TEXT,
        id_usuario_registrador TEXT NOT NULL,
        data_movimentacao TEXT NOT NULL,
        observacao TEXT,
        FOREIGN KEY (id_item) REFERENCES itens(id),
        FOREIGN KEY (id_lote) REFERENCES lotes_material(id),
        FOREIGN KEY (id_usuario_solicitante) REFERENCES usuarios(id),
        FOREIGN KEY (id_usuario_registrador) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS historico_estado_equipamento (
        id TEXT PRIMARY KEY,
        id_equipamento TEXT NOT NULL,
        estado_anterior TEXT,
        estado_novo TEXT NOT NULL,
        observacao TEXT,
        id_usuario TEXT NOT NULL,
        data_alteracao TEXT NOT NULL,
        FOREIGN KEY (id_equipamento) REFERENCES equipamentos(id),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS registros_equipamento (
        id TEXT PRIMARY KEY,
        id_equipamento TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('verificacao', 'reparo')) NOT NULL,
        descricao TEXT NOT NULL,
        resultado TEXT CHECK(resultado IN ('conforme', 'nao_conforme', 'concluido', 'pendente')),
        observacao TEXT,
        id_usuario TEXT NOT NULL,
        data_registro TEXT NOT NULL,
        data_proxima_verificacao TEXT,
        FOREIGN KEY (id_equipamento) REFERENCES equipamentos(id),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS ocorrencias (
        id TEXT PRIMARY KEY,
        tipo TEXT CHECK(tipo IN ('quebra', 'estoque_insuficiente', 'mal_funcionamento', 'validade_expirada', 'outro')) NOT NULL,
        id_item TEXT,
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        fotos TEXT,
        status TEXT CHECK(status IN ('aberta', 'em_analise', 'resolvida', 'fechada')) DEFAULT 'aberta',
        id_usuario_abertura TEXT NOT NULL,
        id_usuario_responsavel TEXT,
        resolucao TEXT,
        data_abertura TEXT NOT NULL,
        data_resolucao TEXT,
        data_atualizacao TEXT,
        FOREIGN KEY (id_item) REFERENCES itens(id),
        FOREIGN KEY (id_usuario_abertura) REFERENCES usuarios(id),
        FOREIGN KEY (id_usuario_responsavel) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS pesquisas (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        contexto TEXT CHECK(contexto IN ('comercial', 'pesquisa_cientifica', 'academico', 'outro')) DEFAULT 'outro',
        descricao_contexto TEXT,
        id_responsavel TEXT NOT NULL,
        status TEXT CHECK(status IN ('em_andamento', 'concluida', 'cancelada')) DEFAULT 'em_andamento',
        data_inicio TEXT,
        data_fim TEXT,
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT,
        finalizado INTEGER DEFAULT 0,
        FOREIGN KEY (id_responsavel) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS pesquisa_colaboradores (
        id TEXT PRIMARY KEY,
        id_pesquisa TEXT NOT NULL,
        id_usuario TEXT NOT NULL,
        papel TEXT CHECK(papel IN ('colaborador', 'responsavel_secundario')) DEFAULT 'colaborador',
        data_adicao TEXT NOT NULL,
        FOREIGN KEY (id_pesquisa) REFERENCES pesquisas(id),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
        UNIQUE(id_pesquisa, id_usuario)
      );

      CREATE TABLE IF NOT EXISTS programas_amostragem (
        id TEXT PRIMARY KEY,
        id_pesquisa TEXT NOT NULL,
        endereco_coleta TEXT,
        coordenadas TEXT,
        objetivo TEXT CHECK(objetivo IN ('investigacao_exploratoria', 'investigacao_confirmatoria', 'investigacao_detalhada', 'remediacao', 'outro')),
        descricao TEXT,
        status TEXT CHECK(status IN ('ativo', 'concluido', 'cancelado')) DEFAULT 'ativo',
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT,
        finalizado INTEGER DEFAULT 0,
        id_criado_por TEXT NOT NULL,
        FOREIGN KEY (id_pesquisa) REFERENCES pesquisas(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS pontos_coleta (
        id TEXT PRIMARY KEY,
        id_programa_amostragem TEXT NOT NULL,
        identificacao_plano TEXT NOT NULL,
        coordenadas TEXT,
        descricao_local TEXT,
        data_criacao TEXT NOT NULL,
        finalizado INTEGER DEFAULT 0,
        id_criado_por TEXT NOT NULL,
        FOREIGN KEY (id_programa_amostragem) REFERENCES programas_amostragem(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id),
        UNIQUE(id_programa_amostragem, identificacao_plano)
      );

      CREATE TABLE IF NOT EXISTS amostras_brutas (
        id TEXT PRIMARY KEY,
        id_ponto_coleta TEXT NOT NULL,
        numero_identificacao_campo TEXT NOT NULL,
        tipo_amostra TEXT CHECK(tipo_amostra IN ('deformada', 'indeformada')) NOT NULL,
        classificacao TEXT CHECK(classificacao IN ('superficial', 'profunda')),
        metodo_coleta TEXT,
        data_coleta TEXT NOT NULL,
        operador_coleta TEXT,
        profundidade_coleta REAL,
        descricao TEXT,
        peso_bruto_campo REAL,
        coordenadas_gps TEXT,
        status TEXT CHECK(status IN ('coletada', 'preparada', 'ensaiada', 'descartada')) DEFAULT 'coletada',
        data_criacao TEXT NOT NULL,
        finalizado INTEGER DEFAULT 0,
        id_criado_por TEXT NOT NULL,
        FOREIGN KEY (id_ponto_coleta) REFERENCES pontos_coleta(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id),
        UNIQUE(id_ponto_coleta, numero_identificacao_campo)
      );

      CREATE TABLE IF NOT EXISTS amostras_preparadas (
        id TEXT PRIMARY KEY,
        id_amostra_bruta TEXT NOT NULL,
        numero_amostra TEXT NOT NULL,
        descricao_inicial TEXT,
        normatizacao TEXT,
        metodo_preparo TEXT CHECK(metodo_preparo IN ('com_secagem_previa', 'sem_secagem_previa')),
        metodo_secagem TEXT CHECK(metodo_secagem IN ('ao_ar', 'estufa_60c', 'outro')),
        data_preparo TEXT NOT NULL,
        id_responsavel_preparo TEXT NOT NULL,
        quantidade_pre_quarteamento REAL,
        quantidade_pos_quarteamento REAL,
        observacoes TEXT,
        data_criacao TEXT NOT NULL,
        finalizado INTEGER DEFAULT 0,
        id_criado_por TEXT NOT NULL,
        FOREIGN KEY (id_amostra_bruta) REFERENCES amostras_brutas(id),
        FOREIGN KEY (id_responsavel_preparo) REFERENCES usuarios(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id),
        CHECK (quantidade_pos_quarteamento <= quantidade_pre_quarteamento)
      );

      CREATE TABLE IF NOT EXISTS amostras_ensaiadas (
        id TEXT PRIMARY KEY,
        id_amostra_preparada TEXT NOT NULL,
        numero_amostra TEXT NOT NULL,
        tipo_ensaio_destino TEXT CHECK(tipo_ensaio_destino IN ('teor_umidade', 'granulometria', 'compactacao', 'limite_liquidez', 'limite_plasticidade', 'cisalhamento_direto', 'adensamento', 'triaxial', 'outro')) NOT NULL,
        quantidade_inicial REAL,
        quantidade_final REAL,
        descricao TEXT,
        observacoes TEXT,
        data_criacao TEXT NOT NULL,
        finalizado INTEGER DEFAULT 0,
        id_criado_por TEXT NOT NULL,
        FOREIGN KEY (id_amostra_preparada) REFERENCES amostras_preparadas(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS amostras_indeformadas (
        id TEXT PRIMARY KEY,
        id_amostra_bruta TEXT NOT NULL,
        numero_amostra TEXT NOT NULL,
        tipo_indeformada TEXT CHECK(tipo_indeformada IN ('shelby', 'bloco', 'anel', 'outro')),
        formato TEXT CHECK(formato IN ('cilindrico', 'cubico', 'prismatico', 'irregular')),
        altura REAL,
        largura REAL,
        comprimento REAL,
        condicao TEXT,
        observacoes TEXT,
        data_criacao TEXT NOT NULL,
        finalizado INTEGER DEFAULT 0,
        id_criado_por TEXT NOT NULL,
        FOREIGN KEY (id_amostra_bruta) REFERENCES amostras_brutas(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS ensaios (
        id TEXT PRIMARY KEY,
        tipo_ensaio TEXT CHECK(tipo_ensaio IN ('teor_umidade', 'granulometria', 'compactacao', 'limite_liquidez', 'limite_plasticidade', 'cisalhamento_direto', 'adensamento', 'triaxial', 'outro')) NOT NULL,
        norma_referencia TEXT,
        id_amostra_ensaiada TEXT,
        id_amostra_indeformada TEXT,
        id_executante TEXT NOT NULL,
        status TEXT CHECK(status IN ('nao_iniciado', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'nao_iniciado',
        data_inicio TEXT,
        data_fim TEXT,
        temperatura_ambiente REAL,
        umidade_ambiente REAL,
        observacoes TEXT,
        data_criacao TEXT NOT NULL,
        finalizado INTEGER DEFAULT 0,
        id_criado_por TEXT NOT NULL,
        FOREIGN KEY (id_amostra_ensaiada) REFERENCES amostras_ensaiadas(id),
        FOREIGN KEY (id_amostra_indeformada) REFERENCES amostras_indeformadas(id),
        FOREIGN KEY (id_executante) REFERENCES usuarios(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id),
        CHECK (
          (id_amostra_ensaiada IS NOT NULL AND id_amostra_indeformada IS NULL) OR
          (id_amostra_ensaiada IS NULL AND id_amostra_indeformada IS NOT NULL)
        )
      );

      CREATE TABLE IF NOT EXISTS ensaios_teor_umidade (
        id TEXT PRIMARY KEY,
        temperatura_estufa REAL,
        id_estufa TEXT,
        id_balanca TEXT,
        h_medio REAL,
        desvio_padrao REAL,
        fc_medio REAL,
        numero_determinacoes INTEGER DEFAULT 0,
        FOREIGN KEY (id) REFERENCES ensaios(id),
        FOREIGN KEY (id_estufa) REFERENCES equipamentos(id),
        FOREIGN KEY (id_balanca) REFERENCES equipamentos(id),
        CHECK (temperatura_estufa >= 105 AND temperatura_estufa <= 110)
      );

      CREATE TABLE IF NOT EXISTS determinacoes_teor_umidade (
        id TEXT PRIMARY KEY,
        id_ensaio_teor_umidade TEXT NOT NULL,
        numero_determinacao INTEGER NOT NULL,
        tara REAL NOT NULL,
        m1 REAL NOT NULL,
        m2 REAL NOT NULL,
        tempo_estufa REAL,
        h_calculado REAL,
        fc_individual REAL,
        observacao TEXT,
        data_criacao TEXT NOT NULL,
        id_criado_por TEXT NOT NULL,
        FOREIGN KEY (id_ensaio_teor_umidade) REFERENCES ensaios_teor_umidade(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id),
        UNIQUE(id_ensaio_teor_umidade, numero_determinacao)
      );

      CREATE TABLE IF NOT EXISTS imagens (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        descricao TEXT,
        id_autor TEXT NOT NULL,
        entidade_tipo TEXT CHECK(entidade_tipo IN ('pesquisa', 'programa_amostragem', 'ponto_coleta', 'amostra_bruta', 'amostra_preparada', 'amostra_ensaiada', 'amostra_indeformada', 'ensaio', 'determinacao_teor_umidade', 'ocorrencia', 'item')) NOT NULL,
        entidade_id TEXT NOT NULL,
        status TEXT CHECK(status IN ('ativo', 'excluido')) DEFAULT 'ativo',
        data_criacao TEXT NOT NULL,
        FOREIGN KEY (id_autor) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS configuracoes_laboratorio (
        id TEXT PRIMARY KEY,
        antecedencia_minima_dias INTEGER NOT NULL DEFAULT 2,
        antecedencia_maxima_dias INTEGER NOT NULL DEFAULT 60,
        prazo_cancelamento_horas INTEGER NOT NULL DEFAULT 24,
        data_atualizacao TEXT NOT NULL,
        id_atualizado_por TEXT NOT NULL,
        FOREIGN KEY (id_atualizado_por) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS calendario_mensal (
        id TEXT PRIMARY KEY,
        mes_ano TEXT NOT NULL UNIQUE,
        hora_abertura_padrao TEXT NOT NULL,
        hora_fechamento_padrao TEXT NOT NULL,
        capacidade_padrao INTEGER NOT NULL DEFAULT 3,
        observacoes TEXT,
        status TEXT CHECK(status IN ('em_configuracao', 'publicado')) DEFAULT 'em_configuracao',
        id_responsavel TEXT NOT NULL,
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT,
        FOREIGN KEY (id_responsavel) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS calendario_dias (
        id TEXT PRIMARY KEY,
        id_calendario_mensal TEXT NOT NULL,
        dia INTEGER NOT NULL CHECK(dia BETWEEN 1 AND 31),
        disponivel INTEGER NOT NULL DEFAULT 1,
        hora_abertura TEXT,
        hora_fechamento TEXT,
        capacidade INTEGER,
        motivo TEXT,
        FOREIGN KEY (id_calendario_mensal) REFERENCES calendario_mensal(id),
        UNIQUE(id_calendario_mensal, dia)
      );

      CREATE TABLE IF NOT EXISTS agendamentos (
        id TEXT PRIMARY KEY,
        id_pesquisa TEXT NOT NULL,
        id_usuario_solicitante TEXT NOT NULL,
        id_tecnico_responsavel TEXT,
        objetivo TEXT NOT NULL,
        contexto TEXT CHECK(contexto IN ('academico', 'pesquisa_cientifica', 'comercial', 'outro')),
        status TEXT CHECK(status IN ('solicitado', 'aprovado', 'negado', 'cancelado', 'finalizado')) DEFAULT 'solicitado',
        id_aprovador TEXT,
        justificativa_aprovacao TEXT,
        motivo_cancelamento TEXT,
        data_solicitacao TEXT NOT NULL,
        data_aprovacao TEXT,
        data_cancelamento TEXT,
        data_finalizacao TEXT,
        FOREIGN KEY (id_pesquisa) REFERENCES pesquisas(id),
        FOREIGN KEY (id_usuario_solicitante) REFERENCES usuarios(id),
        FOREIGN KEY (id_tecnico_responsavel) REFERENCES usuarios(id),
        FOREIGN KEY (id_aprovador) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS agendamento_datas (
        id TEXT PRIMARY KEY,
        id_agendamento TEXT NOT NULL,
        data_agendada TEXT NOT NULL,
        hora_inicio TEXT NOT NULL,
        hora_fim TEXT NOT NULL,
        comparecimento TEXT CHECK(comparecimento IN ('compareceu', 'nao_compareceu')),
        observacao_finalizacao TEXT,
        FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id),
        UNIQUE(id_agendamento, data_agendada, hora_inicio)
      );

      CREATE TABLE IF NOT EXISTS agendamento_ensaios (
        id TEXT PRIMARY KEY,
        id_agendamento TEXT NOT NULL,
        tipo_ensaio TEXT NOT NULL,
        descricao TEXT,
        FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id)
      );

      CREATE TABLE IF NOT EXISTS agendamento_itens (
        id TEXT PRIMARY KEY,
        id_agendamento TEXT NOT NULL,
        id_item TEXT NOT NULL,
        FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id),
        FOREIGN KEY (id_item) REFERENCES itens(id),
        UNIQUE(id_agendamento, id_item)
      );

      CREATE TABLE IF NOT EXISTS configuracoes_sistema (
        id TEXT PRIMARY KEY,
        chave TEXT NOT NULL UNIQUE,
        valor TEXT NOT NULL,
        descricao TEXT,
        data_atualizacao TEXT NOT NULL,
        id_atualizado_por TEXT NOT NULL,
        FOREIGN KEY (id_atualizado_por) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS metadados_amostra (
        id TEXT PRIMARY KEY,
        id_amostra_bruta TEXT NOT NULL UNIQUE,
        classificacao_sucs TEXT,
        classificacao_aashto TEXT,
        cor TEXT,
        textura TEXT,
        consistencia TEXT,
        origem_geologica TEXT,
        municipio TEXT,
        uf TEXT,
        profundidade_inicial REAL,
        profundidade_final REAL,
        nivel_agua REAL,
        status_preenchimento TEXT CHECK(status_preenchimento IN ('parcial', 'completo')) DEFAULT 'parcial',
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT,
        id_criado_por TEXT NOT NULL,
        id_atualizado_por TEXT,
        FOREIGN KEY (id_amostra_bruta) REFERENCES amostras_brutas(id),
        FOREIGN KEY (id_criado_por) REFERENCES usuarios(id),
        FOREIGN KEY (id_atualizado_por) REFERENCES usuarios(id)
      );
    `);

    const oldLogsTable = await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='logs_autenticacao'");
    if (oldLogsTable.values && oldLogsTable.values.length > 0) {
      await db.execute(`
        INSERT INTO logs_sistema (
          id, modulo, acao, id_usuario_executor, id_usuario_afetado,
          valor_anterior, valor_novo, detalhes, ip_origem, data_criacao
        )
        SELECT
          id,
          'autenticacao',
          acao,
          id_usuario,
          NULL,
          NULL,
          NULL,
          detalhes,
          ip_origem,
          data_criacao
        FROM logs_autenticacao
        WHERE NOT EXISTS (SELECT 1 FROM logs_sistema WHERE logs_sistema.id = logs_autenticacao.id)
      `);
      await db.execute('DROP TABLE logs_autenticacao');
    }

    const oldConfigLab = await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='configuracoes_laboratorio'");
    if (oldConfigLab.values && oldConfigLab.values.length > 0) {
      const chefiaRow = await db.query("SELECT id FROM usuarios WHERE permissao = 'chefia' LIMIT 1");
      const adminId = chefiaRow.values?.[0]?.id || '';

      await db.execute(`
        INSERT OR IGNORE INTO configuracoes_sistema (id, chave, valor, descricao, data_atualizacao, id_atualizado_por)
        SELECT '${generateUUID()}', 'antecedencia_minima_dias',
          CAST(antecedencia_minima_dias AS TEXT),
          'Antecedência mínima em dias para solicitação de agendamento',
          data_atualizacao, id_atualizado_por
        FROM configuracoes_laboratorio ORDER BY data_atualizacao DESC LIMIT 1
      `);
      await db.execute(`
        INSERT OR IGNORE INTO configuracoes_sistema (id, chave, valor, descricao, data_atualizacao, id_atualizado_por)
        SELECT '${generateUUID()}', 'antecedencia_maxima_dias',
          CAST(antecedencia_maxima_dias AS TEXT),
          'Antecedência máxima em dias para solicitação de agendamento',
          data_atualizacao, id_atualizado_por
        FROM configuracoes_laboratorio ORDER BY data_atualizacao DESC LIMIT 1
      `);
      await db.execute(`
        INSERT OR IGNORE INTO configuracoes_sistema (id, chave, valor, descricao, data_atualizacao, id_atualizado_por)
        SELECT '${generateUUID()}', 'prazo_cancelamento_horas',
          CAST(prazo_cancelamento_horas AS TEXT),
          'Prazo em horas antes da primeira data para cancelamento pelo usuário',
          data_atualizacao, id_atualizado_por
        FROM configuracoes_laboratorio ORDER BY data_atualizacao DESC LIMIT 1
      `);
      await db.execute('DROP TABLE configuracoes_laboratorio');
    }

    const now = new Date().toISOString();
    const chefiaForSeed = await db.query("SELECT id FROM usuarios WHERE permissao = 'chefia' LIMIT 1");
    const seedAdminId = chefiaForSeed.values?.[0]?.id || '';
    if (seedAdminId) {
      await db.execute(`
        INSERT OR IGNORE INTO configuracoes_sistema (id, chave, valor, descricao, data_atualizacao, id_atualizado_por)
        VALUES
          ('${generateUUID()}', 'tempo_retencao_logs_dias', '365', 'Dias de retenção de logs antes da exclusão automática', '${now}', '${seedAdminId}'),
          ('${generateUUID()}', 'antecedencia_minima_dias', '2', 'Antecedência mínima em dias para solicitação de agendamento', '${now}', '${seedAdminId}'),
          ('${generateUUID()}', 'antecedencia_maxima_dias', '60', 'Antecedência máxima em dias para solicitação de agendamento', '${now}', '${seedAdminId}'),
          ('${generateUUID()}', 'prazo_cancelamento_horas', '24', 'Prazo em horas antes da primeira data para cancelamento pelo usuário', '${now}', '${seedAdminId}'),
          ('${generateUUID()}', 'ultima_limpeza_logs', '', 'Timestamp da última limpeza automática de logs', '${now}', '${seedAdminId}'),
          ('${generateUUID()}', 'ultima_verificacao_notificacoes_gerenciais', '', 'Timestamp da última verificação de notificações gerenciais', '${now}', '${seedAdminId}')
      `);
    }

    await db.run('DROP TABLE IF EXISTS logs_sistema_new');
    await db.run(`CREATE TABLE logs_sistema_new (
      id TEXT PRIMARY KEY,
      modulo TEXT CHECK(modulo IN ('autenticacao', 'administracao', 'estoque', 'ensaios', 'agendamento', 'sistema', 'geotecnico')) NOT NULL,
      acao TEXT NOT NULL,
      id_usuario_executor TEXT,
      id_usuario_afetado TEXT,
      valor_anterior TEXT,
      valor_novo TEXT,
      detalhes TEXT,
      ip_origem TEXT,
      data_criacao TEXT NOT NULL,
      FOREIGN KEY (id_usuario_executor) REFERENCES usuarios(id),
      FOREIGN KEY (id_usuario_afetado) REFERENCES usuarios(id)
    )`);
    await db.run('INSERT INTO logs_sistema_new SELECT * FROM logs_sistema');
    await db.run('DROP TABLE logs_sistema');
    await db.run('ALTER TABLE logs_sistema_new RENAME TO logs_sistema');
    await db.run('CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs_sistema(modulo)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_logs_usuario_afetado ON logs_sistema(id_usuario_afetado)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_logs_usuario_executor ON logs_sistema(id_usuario_executor)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_sistema(data_criacao)');

    const oldImagensCheck = await db.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='imagens'");
    const oldSql = oldImagensCheck.values?.[0]?.sql as string || '';
    if (oldSql && !oldSql.includes("'item'")) {
      await db.run('DROP TABLE IF EXISTS imagens_new');
      await db.run(`CREATE TABLE imagens_new (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        descricao TEXT,
        id_autor TEXT NOT NULL,
        entidade_tipo TEXT CHECK(entidade_tipo IN ('pesquisa', 'programa_amostragem', 'ponto_coleta', 'amostra_bruta', 'amostra_preparada', 'amostra_ensaiada', 'amostra_indeformada', 'ensaio', 'determinacao_teor_umidade', 'ocorrencia', 'item')) NOT NULL,
        entidade_id TEXT NOT NULL,
        status TEXT CHECK(status IN ('ativo', 'excluido')) DEFAULT 'ativo',
        data_criacao TEXT NOT NULL,
        FOREIGN KEY (id_autor) REFERENCES usuarios(id)
      )`);
      await db.run('INSERT INTO imagens_new SELECT * FROM imagens');
      await db.run('DROP TABLE imagens');
      await db.run('ALTER TABLE imagens_new RENAME TO imagens');
      await db.run('CREATE INDEX IF NOT EXISTS idx_imagens_entidade ON imagens(entidade_tipo, entidade_id)');
    }

    const colunasAmostras = await db.query("PRAGMA table_info('amostras_brutas')");
    const temProfundidadeColeta = (colunasAmostras.values || []).some(
      (r: unknown) => (r as Record<string, unknown>).name === 'profundidade_coleta'
    );
    if (!temProfundidadeColeta) {
      await db.run('ALTER TABLE amostras_brutas ADD COLUMN profundidade_coleta REAL');
    }

    const tabelasFinalizado = ['pesquisas', 'programas_amostragem', 'pontos_coleta',
      'amostras_brutas', 'amostras_preparadas', 'amostras_ensaiadas',
      'amostras_indeformadas', 'ensaios'];
    for (const tabela of tabelasFinalizado) {
      const cols = await db.query(`PRAGMA table_info('${tabela}')`);
      const tem = (cols.values || []).some((r: unknown) => (r as Record<string, unknown>).name === 'finalizado');
      if (!tem) {
        await db.run(`ALTER TABLE ${tabela} ADD COLUMN finalizado INTEGER DEFAULT 0`);
      }
    }

    const idxList = await db.query("PRAGMA index_list('amostras_brutas')");
    const temUniqComposta = (idxList.values || []).some(
      (r: unknown) => String((r as Record<string, unknown>).origin || '') === 'u'
    );
    if (!temUniqComposta) {
      const idxRows = (idxList.values || []) as Record<string, unknown>[];
      const hasOldUnique = idxRows.some((r) => r.unique === 1 && String(r.name || '').includes('numero_identificacao_campo') && !String(r.name || '').includes('id_ponto_coleta'));
      if (hasOldUnique) {
        await db.run('DROP TABLE IF EXISTS amostras_brutas_new');
        await db.run(`CREATE TABLE amostras_brutas_new (
          id TEXT PRIMARY KEY,
          id_ponto_coleta TEXT NOT NULL,
          numero_identificacao_campo TEXT NOT NULL,
          tipo_amostra TEXT CHECK(tipo_amostra IN ('deformada', 'indeformada')) NOT NULL,
          classificacao TEXT CHECK(classificacao IN ('superficial', 'profunda')),
          metodo_coleta TEXT,
          data_coleta TEXT NOT NULL,
          operador_coleta TEXT,
          profundidade_coleta REAL,
          descricao TEXT,
          peso_bruto_campo REAL,
          coordenadas_gps TEXT,
          status TEXT CHECK(status IN ('coletada', 'preparada', 'ensaiada', 'descartada')) DEFAULT 'coletada',
          data_criacao TEXT NOT NULL,
          finalizado INTEGER DEFAULT 0,
          id_criado_por TEXT NOT NULL,
          FOREIGN KEY (id_ponto_coleta) REFERENCES pontos_coleta(id),
          FOREIGN KEY (id_criado_por) REFERENCES usuarios(id),
          UNIQUE(id_ponto_coleta, numero_identificacao_campo)
        )`);
        await db.run('INSERT INTO amostras_brutas_new SELECT * FROM amostras_brutas');
        await db.run('DROP TABLE amostras_brutas');
        await db.run('ALTER TABLE amostras_brutas_new RENAME TO amostras_brutas');
      }
    }

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON usuarios(matricula);
      CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
      CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token);
      CREATE INDEX IF NOT EXISTS idx_sessoes_id_usuario ON sessoes(id_usuario);
      CREATE INDEX IF NOT EXISTS idx_pre_cadastro_email ON pre_cadastro(email);
      CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs_sistema(modulo);
      CREATE INDEX IF NOT EXISTS idx_logs_usuario_afetado ON logs_sistema(id_usuario_afetado);
      CREATE INDEX IF NOT EXISTS idx_logs_usuario_executor ON logs_sistema(id_usuario_executor);
      CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_sistema(data_criacao);
      CREATE INDEX IF NOT EXISTS idx_codigos_verificacao_email_tipo ON codigos_verificacao(email, tipo);
      CREATE INDEX IF NOT EXISTS idx_itens_tipo ON itens(tipo);
      CREATE INDEX IF NOT EXISTS idx_itens_categoria ON itens(id_categoria);
      CREATE INDEX IF NOT EXISTS idx_itens_status ON itens(status);
      CREATE INDEX IF NOT EXISTS idx_itens_codigo ON itens(codigo);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_item ON movimentacoes_estoque(id_item);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes_estoque(data_movimentacao);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_estoque(tipo);
      CREATE INDEX IF NOT EXISTS idx_equipamentos_estado ON equipamentos(estado);
      CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON ocorrencias(status);
      CREATE INDEX IF NOT EXISTS idx_ocorrencias_tipo ON ocorrencias(tipo);
      CREATE INDEX IF NOT EXISTS idx_ocorrencias_usuario_abertura ON ocorrencias(id_usuario_abertura);
      CREATE INDEX IF NOT EXISTS idx_ocorrencias_usuario_responsavel ON ocorrencias(id_usuario_responsavel);
      CREATE INDEX IF NOT EXISTS idx_lotes_material_status ON lotes_material(status);
      CREATE INDEX IF NOT EXISTS idx_lotes_material_id_material ON lotes_material(id_material);
      CREATE INDEX IF NOT EXISTS idx_lotes_material_validade ON lotes_material(data_validade);
      CREATE INDEX IF NOT EXISTS idx_historico_estado_equipamento ON historico_estado_equipamento(id_equipamento);
      CREATE INDEX IF NOT EXISTS idx_registros_equipamento_id ON registros_equipamento(id_equipamento);
      CREATE INDEX IF NOT EXISTS idx_pesquisas_responsavel ON pesquisas(id_responsavel);
      CREATE INDEX IF NOT EXISTS idx_pesquisas_status ON pesquisas(status);
      CREATE INDEX IF NOT EXISTS idx_pesquisa_colaboradores_pesquisa ON pesquisa_colaboradores(id_pesquisa);
      CREATE INDEX IF NOT EXISTS idx_pesquisa_colaboradores_usuario ON pesquisa_colaboradores(id_usuario);
      CREATE INDEX IF NOT EXISTS idx_programas_pesquisa ON programas_amostragem(id_pesquisa);
      CREATE INDEX IF NOT EXISTS idx_pontos_coleta_programa ON pontos_coleta(id_programa_amostragem);
      CREATE INDEX IF NOT EXISTS idx_amostras_brutas_ponto ON amostras_brutas(id_ponto_coleta);
      CREATE INDEX IF NOT EXISTS idx_amostras_brutas_tipo ON amostras_brutas(tipo_amostra);
      CREATE INDEX IF NOT EXISTS idx_amostras_brutas_status ON amostras_brutas(status);
      CREATE INDEX IF NOT EXISTS idx_amostras_brutas_numero_campo ON amostras_brutas(numero_identificacao_campo);
      CREATE INDEX IF NOT EXISTS idx_amostras_preparadas_bruta ON amostras_preparadas(id_amostra_bruta);
      CREATE INDEX IF NOT EXISTS idx_amostras_ensaiadas_preparada ON amostras_ensaiadas(id_amostra_preparada);
      CREATE INDEX IF NOT EXISTS idx_amostras_ensaiadas_tipo ON amostras_ensaiadas(tipo_ensaio_destino);
      CREATE INDEX IF NOT EXISTS idx_amostras_indeformadas_bruta ON amostras_indeformadas(id_amostra_bruta);
      CREATE INDEX IF NOT EXISTS idx_ensaios_status ON ensaios(status);
      CREATE INDEX IF NOT EXISTS idx_ensaios_tipo ON ensaios(tipo_ensaio);
      CREATE INDEX IF NOT EXISTS idx_ensaios_amostra_ensaiada ON ensaios(id_amostra_ensaiada);
      CREATE INDEX IF NOT EXISTS idx_ensaios_amostra_indeformada ON ensaios(id_amostra_indeformada);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ensaios_amostra_ensaiada_uq ON ensaios(id_amostra_ensaiada) WHERE id_amostra_ensaiada IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ensaios_amostra_indeformada_uq ON ensaios(id_amostra_indeformada) WHERE id_amostra_indeformada IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_ensaios_executante ON ensaios(id_executante);
      CREATE INDEX IF NOT EXISTS idx_determinacoes_ensaio ON determinacoes_teor_umidade(id_ensaio_teor_umidade);
      CREATE INDEX IF NOT EXISTS idx_imagens_entidade ON imagens(entidade_tipo, entidade_id);
      CREATE INDEX IF NOT EXISTS idx_imagens_autor ON imagens(id_autor);
      CREATE INDEX IF NOT EXISTS idx_imagens_status ON imagens(status);
      CREATE INDEX IF NOT EXISTS idx_calendario_mensal_mes ON calendario_mensal(mes_ano);
      CREATE INDEX IF NOT EXISTS idx_calendario_mensal_status ON calendario_mensal(status);
      CREATE INDEX IF NOT EXISTS idx_calendario_dias_calendario ON calendario_dias(id_calendario_mensal);
      CREATE INDEX IF NOT EXISTS idx_calendario_dias_dia ON calendario_dias(id_calendario_mensal, dia);
      CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
      CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario ON agendamentos(id_usuario_solicitante);
      CREATE INDEX IF NOT EXISTS idx_agendamentos_pesquisa ON agendamentos(id_pesquisa);
      CREATE INDEX IF NOT EXISTS idx_agendamentos_tecnico ON agendamentos(id_tecnico_responsavel);
      CREATE INDEX IF NOT EXISTS idx_agendamento_datas_data ON agendamento_datas(data_agendada);
      CREATE INDEX IF NOT EXISTS idx_agendamento_datas_agendamento ON agendamento_datas(id_agendamento);
      CREATE INDEX IF NOT EXISTS idx_agendamento_ensaios_agendamento ON agendamento_ensaios(id_agendamento);
      CREATE INDEX IF NOT EXISTS idx_agendamento_itens_agendamento ON agendamento_itens(id_agendamento);
      CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes_sistema(chave);
      CREATE INDEX IF NOT EXISTS idx_metadados_amostra ON metadados_amostra(id_amostra_bruta);
      CREATE INDEX IF NOT EXISTS idx_metadados_status ON metadados_amostra(status_preenchimento);
      CREATE INDEX IF NOT EXISTS idx_metadados_sucs ON metadados_amostra(classificacao_sucs);
      CREATE INDEX IF NOT EXISTS idx_metadados_municipio ON metadados_amostra(municipio);
      CREATE INDEX IF NOT EXISTS idx_metadados_uf ON metadados_amostra(uf);
    `);

    await db.execute('DROP VIEW IF EXISTS vista_pontos_geotecnicos');

    await db.execute(`
      CREATE VIEW IF NOT EXISTS vista_pontos_geotecnicos AS
      SELECT
        ab.id AS id_amostra,
        ab.numero_identificacao_campo,
        ab.tipo_amostra,
        ab.data_coleta,
        ab.coordenadas_gps,
        ab.status AS status_amostra,
        pc.id AS id_ponto_coleta,
        pc.identificacao_plano,
        ab.profundidade_coleta,
        pa.id AS id_programa,
        pa.objetivo AS objetivo_programa,
        p.id AS id_pesquisa,
        p.titulo AS titulo_pesquisa,
        p.contexto AS contexto_pesquisa,
        u.id AS id_responsavel,
        u.nome || ' ' || u.sobrenome AS nome_responsavel,
        ma.id AS id_metadados,
        ma.classificacao_sucs,
        ma.classificacao_aashto,
        ma.cor,
        ma.textura,
        ma.consistencia,
        ma.origem_geologica,
        ma.municipio,
        ma.uf,
        ma.profundidade_inicial,
        ma.profundidade_final,
        ma.nivel_agua,
        ma.status_preenchimento,
        (SELECT etu.h_medio
         FROM amostras_preparadas ap
         INNER JOIN amostras_ensaiadas ae ON ae.id_amostra_preparada = ap.id
         INNER JOIN ensaios e ON e.id_amostra_ensaiada = ae.id
         INNER JOIN ensaios_teor_umidade etu ON etu.id = e.id
         WHERE ap.id_amostra_bruta = ab.id
           AND e.status = 'concluido'
         LIMIT 1) AS teor_umidade,
        (SELECT etu.h_medio
         FROM amostras_indeformadas ai
         INNER JOIN ensaios e ON e.id_amostra_indeformada = ai.id
         INNER JOIN ensaios_teor_umidade etu ON etu.id = e.id
         WHERE ai.id_amostra_bruta = ab.id
           AND e.status = 'concluido'
         LIMIT 1) AS teor_umidade_indeformada,
        COALESCE(
          (SELECT COUNT(DISTINCT e.id)
           FROM amostras_preparadas ap
           INNER JOIN amostras_ensaiadas ae ON ae.id_amostra_preparada = ap.id
           INNER JOIN ensaios e ON e.id_amostra_ensaiada = ae.id
           WHERE ap.id_amostra_bruta = ab.id AND e.status = 'concluido'),
          0
        ) + COALESCE(
          (SELECT COUNT(DISTINCT e.id)
           FROM amostras_indeformadas ai
           INNER JOIN ensaios e ON e.id_amostra_indeformada = ai.id
           WHERE ai.id_amostra_bruta = ab.id AND e.status = 'concluido'),
          0
        ) AS total_ensaios_concluidos,
        (SELECT GROUP_CONCAT(DISTINCT e.tipo_ensaio)
         FROM amostras_preparadas ap
         INNER JOIN amostras_ensaiadas ae ON ae.id_amostra_preparada = ap.id
         INNER JOIN ensaios e ON e.id_amostra_ensaiada = ae.id
         WHERE ap.id_amostra_bruta = ab.id AND e.status = 'concluido') AS ensaios_realizados
      FROM amostras_brutas ab
      INNER JOIN pontos_coleta pc ON ab.id_ponto_coleta = pc.id
      INNER JOIN programas_amostragem pa ON pc.id_programa_amostragem = pa.id
      INNER JOIN pesquisas p ON pa.id_pesquisa = p.id
      INNER JOIN usuarios u ON p.id_responsavel = u.id
      LEFT JOIN metadados_amostra ma ON ma.id_amostra_bruta = ab.id
      WHERE ab.coordenadas_gps IS NOT NULL
        AND ab.coordenadas_gps != ''
        AND ab.status != 'descartada'
    `);

    const { MaintenanceJob } = await import('./MaintenanceJob');
    await MaintenanceJob.executarTodos();

    const { SeedService } = await import('./SeedService');
    await SeedService.seed();

    const { InventarioSeedService } = await import('./InventarioSeedService');
    await InventarioSeedService.seed();

    await saveDatabase();

    const { TestDataService } = await import('./TestDataService');
    await TestDataService.seed();

    await saveDatabase();

    const { InventarioJobs } = await import('./InventarioJobs');
    InventarioJobs.executarTodos(null).catch((err) => console.error('[DB Init] Inventario jobs error:', err));
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

export async function getDatabase(): Promise<SQLiteDBConnection> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

export async function queryRows<T>(sql: string, params: any[] = []): Promise<T[]> {
  const connection = await getDatabase();
  const result = await connection.query(sql, params);

  if (!result.values || result.values.length === 0) {
    return [];
  }

  if (Array.isArray(result.values[0]) && !Array.isArray(params[0])) {
    const columns = result.values[0] as string[];
    const rows: T[] = [];
    for (let i = 1; i < result.values.length; i++) {
      const row: any = {};
      const dataRow = result.values[i] as any[];
      columns.forEach((col: string, idx: number) => {
        row[col] = dataRow[idx];
      });
      rows.push(row as T);
    }
    return rows;
  }

  return result.values as T[];
}

export async function executeSql(sql: string, params: any[] = []): Promise<void> {
  const connection = await getDatabase();
  await connection.run(sql, params);
  await saveDatabase();
}
