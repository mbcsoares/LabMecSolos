export interface PreCadastro {
  id: string;
  nome: string;
  sobrenome: string;
  genero: 'masculino' | 'feminino' | 'nao_informado';
  matricula: string;
  email: string;
  senha_hash: string;
  perfil: 'professor' | 'tecnico' | 'aluno';
  codigo_verificacao: string;
  data_criacao: string;
  data_expiracao_codigo: string;
  reenvios: number;
}

export interface Usuario {
  id: string;
  nome: string;
  sobrenome: string;
  genero: 'masculino' | 'feminino' | 'nao_informado';
  matricula: string;
  email: string;
  senha_hash: string;
  perfil: 'professor' | 'tecnico' | 'aluno';
  permissao: 'comum' | 'colaborador' | 'chefia';
  status: 'ativo' | 'inativo' | 'excluido';
  data_criacao: string;
  data_atualizacao: string | null;
  data_exclusao: string | null;
}

export interface Sessao {
  id: string;
  id_usuario: string;
  token: string;
  data_criacao: string;
  data_expiracao: string;
}

export interface LogAutenticacao {
  id: string;
  id_usuario: string | null;
  acao: string;
  detalhes: string | null;
  ip_origem: string | null;
  data_criacao: string;
}

export interface CodigoVerificacao {
  id: string;
  email: string;
  codigo: string;
  tipo: 'confirmacao_conta' | 'redefinicao_senha';
  data_criacao: string;
  data_expiracao: string;
  usado: number;
}

export interface SessionData {
  userId: string;
  nome: string;
  sobrenome: string;
  email: string;
  perfil: string;
  permissao: string;
}

export type ModuloLog = 'autenticacao' | 'administracao' | 'estoque' | 'ensaios' | 'agendamento' | 'sistema' | 'geotecnico';

export type AdminLogAction =
  | 'permissao_concedida'
  | 'permissao_revogada'
  | 'status_ativado'
  | 'status_desativado'
  | 'conta_excluida_chefia'
  | 'chefia_concedida'
  | 'chefia_transferida'
  | 'acao_critica_negada';

export interface LogSistema {
  id: string;
  modulo: ModuloLog;
  acao: string;
  id_usuario_executor: string | null;
  id_usuario_afetado: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  detalhes: string | null;
  ip_origem: string | null;
  data_criacao: string;
}

export type StatusUsuario = 'ativo' | 'inativo' | 'excluido';
export type PerfilUsuario = 'professor' | 'tecnico' | 'aluno';
export type PermissaoUsuario = 'comum' | 'colaborador' | 'chefia';
export type GeneroUsuario = 'masculino' | 'feminino' | 'nao_informado';

export interface FiltrosUsuario {
  status: StatusUsuario | null;
  perfil: PerfilUsuario | null;
  permissao: PermissaoUsuario | null;
  genero: GeneroUsuario | null;
}

export interface UsuarioListItem {
  id: string;
  nome: string;
  sobrenome: string;
  matricula: string;
  perfil: PerfilUsuario;
  permissao: PermissaoUsuario;
  status: StatusUsuario;
}

export interface UsuarioDetalhado {
  id: string;
  nome: string;
  sobrenome: string;
  genero: GeneroUsuario;
  matricula: string;
  email: string;
  perfil: PerfilUsuario;
  permissao: PermissaoUsuario;
  status: StatusUsuario;
  data_criacao: string;
  data_atualizacao: string | null;
  data_exclusao: string | null;
}

export interface OperacaoResult {
  sucesso: boolean;
  erro?: string;
  alerta?: string;
}

export type TipoItem = 'material' | 'utensilio' | 'equipamento';
export type UnidadeMedidaMaterial = 'kg' | 'g' | 'tonelada' | 'L' | 'mL' | 'unidade' | 'm' | 'cm' | 'mm' | 'm²' | 'm³' | 'pacote' | 'rolo' | 'folha';
export type UnidadeMedidaUtensilio = 'unidade' | 'jogo' | 'par' | 'conjunto' | 'caixa';
export type EstadoEquipamento = 'disponivel' | 'em_manutencao' | 'inoperante' | 'calibracao_vencida';
export type TipoMovimentacao = 'entrada' | 'saida';
export type TipoOcorrencia = 'quebra' | 'estoque_insuficiente' | 'mal_funcionamento' | 'validade_expirada' | 'outro';
export type StatusOcorrencia = 'aberta' | 'em_analise' | 'resolvida' | 'fechada';
export type TipoRegistroEquipamento = 'verificacao' | 'reparo';
export type ResultadoRegistro = 'conforme' | 'nao_conforme' | 'concluido' | 'pendente';
export type StatusLote = 'ativo' | 'esgotado' | 'vencido';

export interface CategoriaItem {
  id: string;
  nome: string;
  descricao: string | null;
  status: 'ativa' | 'inativa';
  data_criacao: string;
  data_atualizacao: string | null;
}

export interface Item {
  id: string;
  tipo: TipoItem;
  nome: string;
  codigo: string;
  id_categoria: string | null;
  status: 'ativo' | 'inativo';
  data_criacao: string;
  data_atualizacao: string | null;
}

export interface Material {
  id: string;
  unidade_medida: UnidadeMedidaMaterial;
  ponto_pedido: number | null;
  quantidade_atual: number;
}

export interface Utensilio {
  id: string;
  unidade_medida: UnidadeMedidaUtensilio;
  ponto_pedido: number | null;
  local_armazenamento: string | null;
  quantidade_atual: number;
}

export interface Equipamento {
  id: string;
  numero_serie: string | null;
  marca: string | null;
  modelo: string | null;
  especificacao_tecnica: string | null;
  estado: EstadoEquipamento;
  data_ultima_calibracao: string | null;
  frequencia_calibracao_dias: number | null;
  data_criacao: string;
  data_atualizacao: string | null;
}

export interface LoteMaterial {
  id: string;
  id_material: string;
  numero_lote: string;
  data_recebimento: string;
  data_validade: string | null;
  quantidade_inicial: number;
  quantidade_atual: number;
  status: StatusLote;
  data_criacao: string;
}

export interface MovimentacaoEstoque {
  id: string;
  id_item: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  id_lote: string | null;
  motivo: string | null;
  id_usuario_solicitante: string | null;
  id_usuario_registrador: string;
  data_movimentacao: string;
  observacao: string | null;
}

export interface HistoricoEstadoEquipamento {
  id: string;
  id_equipamento: string;
  estado_anterior: string | null;
  estado_novo: string;
  observacao: string | null;
  id_usuario: string;
  data_alteracao: string;
}

export interface RegistroEquipamento {
  id: string;
  id_equipamento: string;
  tipo: TipoRegistroEquipamento;
  descricao: string;
  resultado: ResultadoRegistro;
  observacao: string | null;
  id_usuario: string;
  data_registro: string;
  data_proxima_verificacao: string | null;
}

export interface Ocorrencia {
  id: string;
  tipo: TipoOcorrencia;
  id_item: string | null;
  titulo: string;
  descricao: string;
  fotos: string | null;
  status: StatusOcorrencia;
  id_usuario_abertura: string;
  id_usuario_responsavel: string | null;
  resolucao: string | null;
  data_abertura: string;
  data_resolucao: string | null;
  data_atualizacao: string | null;
}

export type EstoqueLogAction =
  | 'categoria_criada'
  | 'categoria_editada'
  | 'categoria_desativada'
  | 'item_criado'
  | 'item_editado'
  | 'item_desativado'
  | 'movimentacao_entrada'
  | 'movimentacao_saida'
  | 'lote_criado'
  | 'lote_status_alterado'
  | 'estado_equipamento_alterado'
  | 'registro_equipamento_criado'
  | 'ocorrencia_aberta'
  | 'ocorrencia_status_alterado'
  | 'ocorrencia_resolvida'
  | 'ocorrencia_fechada'
  | 'qr_code_gerado'
  | 'qr_code_lido'
  | 'relatorio_emitido'
  | 'calibracao_verificada'
  | 'notificacao_estoque_minimo'
  | 'notificacao_calibracao';

export type StatusItem = 'ativo' | 'inativo';

export interface FiltrosItem {
  tipo?: TipoItem;
  idCategoria?: string;
  status?: StatusItem;
  estado?: EstadoEquipamento;
  busca?: string;
  estoqueBaixo?: boolean;
}

export interface FiltrosOcorrencia {
  status?: StatusOcorrencia;
  tipo?: TipoOcorrencia;
}

export interface CriarCategoriaDTO {
  nome: string;
  descricao?: string;
}

export interface CriarItemDTO {
  tipo: TipoItem;
  nome: string;
  codigo: string;
  idCategoria?: string;
  unidadeMedida?: string;
  pontoPedido?: number;
  localArmazenamento?: string;
  numeroSerie?: string;
  marca?: string;
  modelo?: string;
  especificacaoTecnica?: string;
  frequenciaCalibracaoDias?: number;
}

export interface RegistrarEntradaDTO {
  idItem: string;
  quantidade: number;
  idLote?: string;
  observacao?: string;
}

export interface RegistrarSaidaDTO {
  idItem: string;
  quantidade: number;
  motivo: string;
  idLote?: string;
  idUsuarioSolicitante?: string;
  observacao?: string;
}

export interface CriarLoteDTO {
  idMaterial: string;
  numeroLote: string;
  dataRecebimento: string;
  dataValidade?: string;
  quantidadeInicial: number;
}

export interface CriarOcorrenciaDTO {
  tipo: TipoOcorrencia;
  idItem?: string;
  titulo: string;
  descricao: string;
  fotos?: string[];
}

export interface RegistrarVerificacaoReparoDTO {
  idEquipamento: string;
  tipo: TipoRegistroEquipamento;
  descricao: string;
  resultado: string;
  observacao?: string;
  dataProximaVerificacao?: string;
}

export interface ResultadoVerificacaoCalibracao {
  totalEquipamentos: number;
  vencidos: number;
  proximosVencimento: { id: string; nome: string; diasRestantes: number }[];
  todosItens: { id: string; nome: string; diasRestantes: number }[];
}

export interface AlertaEstoque {
  idItem: string;
  nome: string;
  codigo: string;
  unidadeMedida: string;
  quantidadeAtual: number;
  pontoPedido: number;
}

export interface AlertaValidade {
  nomeMaterial: string;
  numeroLote: string;
  dataValidade: string;
  diasRestantes: number;
  quantidadeAtual: number;
}

export interface ItemResumo {
  id: string;
  tipo: TipoItem;
  nome: string;
  codigo: string;
  id_categoria: string | null;
  categoria_nome?: string;
  status: StatusItem;
  data_criacao: string;
  data_atualizacao: string | null;
}

export interface ItemDetalhado extends ItemResumo {
  unidade_medida?: string;
  ponto_pedido?: number | null;
  local_armazenamento?: string | null;
  quantidade_atual?: number;
  numero_serie?: string | null;
  marca?: string | null;
  modelo?: string | null;
  especificacao_tecnica?: string | null;
  estado?: string;
  data_ultima_calibracao?: string | null;
  frequencia_calibracao_dias?: number | null;
  data_criacao_especializado?: string;
  data_atualizacao_especializado?: string | null;
}

export interface OcorrenciaResumo {
  id: string;
  tipo: TipoOcorrencia;
  id_item: string | null;
  nome_item?: string;
  titulo: string;
  status: StatusOcorrencia;
  id_usuario_abertura: string;
  nome_abertura?: string;
  id_usuario_responsavel: string | null;
  data_abertura: string;
  data_resolucao: string | null;
}

export type ContextoPesquisa = 'comercial' | 'pesquisa_cientifica' | 'academico' | 'outro';
export type StatusPesquisa = 'em_andamento' | 'concluida' | 'cancelada';
export type PapelPesquisa = 'colaborador' | 'responsavel_secundario';
export type ObjetivoPrograma = 'investigacao_exploratoria' | 'investigacao_confirmatoria' | 'investigacao_detalhada' | 'remediacao' | 'outro';
export type StatusPrograma = 'ativo' | 'concluido' | 'cancelado';
export type TipoAmostra = 'deformada' | 'indeformada';
export type ClassificacaoAmostra = 'superficial' | 'profunda';
export type StatusAmostraBruta = 'coletada' | 'preparada' | 'ensaiada' | 'descartada';
export type MetodoPreparo = 'com_secagem_previa' | 'sem_secagem_previa';
export type MetodoSecagem = 'ao_ar' | 'estufa_60c' | 'outro';
export type TipoEnsaioDestino = 'teor_umidade' | 'granulometria' | 'compactacao' | 'limite_liquidez' | 'limite_plasticidade' | 'cisalhamento_direto' | 'adensamento' | 'triaxial' | 'outro';
export type TipoIndeformada = 'shelby' | 'bloco' | 'anel' | 'outro';
export type FormatoIndeformada = 'cilindrico' | 'cubico' | 'prismatico' | 'irregular';
export type StatusEnsaio = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'cancelado';
export type EntidadeTipoImagem = 'pesquisa' | 'programa_amostragem' | 'ponto_coleta' | 'amostra_bruta' | 'amostra_preparada' | 'amostra_ensaiada' | 'amostra_indeformada' | 'ensaio' | 'determinacao_teor_umidade' | 'ocorrencia' | 'item';

export type EnsaiosLogAction =
  | 'pesquisa_criada'
  | 'pesquisa_editada'
  | 'pesquisa_concluida'
  | 'pesquisa_cancelada'
  | 'pesquisa_excluida'
  | 'colaborador_adicionado'
  | 'colaborador_removido'
  | 'colaborador_promovido'
  | 'colaborador_rebaixado'
  | 'programa_criado'
  | 'programa_editado'
  | 'ponto_coleta_criado'
  | 'ponto_coleta_editado'
  | 'amostra_bruta_registrada'
  | 'amostra_preparada'
  | 'amostra_ensaiada_criada'
  | 'amostra_indeformada_criada'
  | 'ensaio_criado'
  | 'ensaio_iniciado'
  | 'determinacao_registrada'
  | 'ensaio_concluido'
  | 'ensaio_cancelado'
  | 'imagem_upload'
  | 'imagem_excluida'
  | 'relatorio_ensaio_emitido'
  | 'relatorio_pesquisa_emitido';

export interface Pesquisa {
  id: string;
  titulo: string;
  descricao: string | null;
  contexto: ContextoPesquisa;
  descricao_contexto: string | null;
  id_responsavel: string;
  status: StatusPesquisa;
  data_inicio: string | null;
  data_fim: string | null;
  data_criacao: string;
  data_atualizacao: string | null;
  finalizado: number;
}

export interface PesquisaColaborador {
  id: string;
  id_pesquisa: string;
  id_usuario: string;
  papel: PapelPesquisa;
  data_adicao: string;
}

export interface PesquisaResumo extends Pesquisa {
  meu_papel: string | null;
  nome_responsavel?: string;
}

export interface ProgramaAmostragem {
  id: string;
  id_pesquisa: string;
  endereco_coleta: string | null;
  coordenadas: string | null;
  objetivo: ObjetivoPrograma;
  descricao: string | null;
  status: StatusPrograma;
  data_criacao: string;
  data_atualizacao: string | null;
  id_criado_por: string;
  finalizado: number;
}

export interface PontoColeta {
  id: string;
  id_programa_amostragem: string;
  identificacao_plano: string;
  coordenadas: string | null;
  descricao_local: string | null;
  data_criacao: string;
  id_criado_por: string;
  finalizado: number;
}

export interface AmostraBruta {
  id: string;
  id_ponto_coleta: string;
  numero_identificacao_campo: string;
  tipo_amostra: TipoAmostra;
  classificacao: ClassificacaoAmostra | null;
  metodo_coleta: string | null;
  data_coleta: string;
  operador_coleta: string | null;
  profundidade_coleta: number | null;
  descricao: string | null;
  peso_bruto_campo: number | null;
  coordenadas_gps: string | null;
  status: StatusAmostraBruta;
  data_criacao: string;
  id_criado_por: string;
  finalizado: number;
}

export interface AmostraPreparada {
  id: string;
  id_amostra_bruta: string;
  numero_amostra: string;
  descricao_inicial: string | null;
  normatizacao: string | null;
  metodo_preparo: MetodoPreparo;
  metodo_secagem: MetodoSecagem;
  data_preparo: string;
  id_responsavel_preparo: string;
  quantidade_pre_quarteamento: number;
  quantidade_pos_quarteamento: number;
  observacoes: string | null;
  data_criacao: string;
  id_criado_por: string;
  finalizado: number;
}

export interface AmostraEnsaiada {


  id: string;
  id_amostra_preparada: string;
  numero_amostra: string;
  tipo_ensaio_destino: TipoEnsaioDestino;
  quantidade_inicial: number | null;
  quantidade_final: number | null;
  descricao: string | null;
  observacoes: string | null;
  data_criacao: string;
  id_criado_por: string;
  finalizado: number;
}

export interface AmostraIndeformada {
  id: string;
  id_amostra_bruta: string;
  numero_amostra: string;
  tipo_indeformada: TipoIndeformada;
  formato: FormatoIndeformada;
  altura: number | null;
  largura: number | null;
  comprimento: number | null;
  condicao: string | null;
  observacoes: string | null;
  data_criacao: string;
  id_criado_por: string;
  finalizado: number;
}

export interface Ensaio {
  id: string;
  tipo_ensaio: TipoEnsaioDestino;
  norma_referencia: string | null;
  id_amostra_ensaiada: string | null;
  id_amostra_indeformada: string | null;
  id_executante: string;
  status: StatusEnsaio;
  data_inicio: string | null;
  data_fim: string | null;
  temperatura_ambiente: number | null;
  umidade_ambiente: number | null;
  observacoes: string | null;
  data_criacao: string;
  id_criado_por: string;
  finalizado: number;
}

export interface EnsaioTeorUmidade {
  id: string;
  temperatura_estufa: number | null;
  id_estufa: string | null;
  id_balanca: string | null;
  h_medio: number | null;
  desvio_padrao: number | null;
  fc_medio: number | null;
  numero_determinacoes: number;
}

export interface DeterminacaoTeorUmidade {
  id: string;
  id_ensaio_teor_umidade: string;
  numero_determinacao: number;
  tara: number;
  m1: number;
  m2: number;
  tempo_estufa: number | null;
  h_calculado: number | null;
  fc_individual: number | null;
  observacao: string | null;
  data_criacao: string;
  id_criado_por: string;
}

export interface Imagem {
  id: string;
  url: string;
  descricao: string | null;
  id_autor: string;
  entidade_tipo: EntidadeTipoImagem;
  entidade_id: string;
  status: 'ativo' | 'excluido';
  data_criacao: string;
}

export interface CriarPesquisaDTO {
  titulo: string;
  descricao?: string;
  contexto: ContextoPesquisa;
  descricaoContexto?: string;
}

export interface EditarPesquisaDTO {
  titulo: string;
  descricao?: string;
  contexto: ContextoPesquisa;
  descricaoContexto?: string;
}

export interface CriarProgramaDTO {
  idPesquisa: string;
  enderecoColeta?: string;
  coordenadas?: string;
  objetivo: ObjetivoPrograma;
  descricao?: string;
}

export interface CriarPontoDTO {
  idProgramaAmostragem: string;
  identificacaoPlano: string;
  coordenadas?: string;
  descricaoLocal?: string;
}

export interface EditarProgramaDTO {
  enderecoColeta?: string;
  coordenadas?: string;
  objetivo: ObjetivoPrograma;
  descricao?: string;
}

export interface EditarPontoDTO {
  identificacaoPlano: string;
  coordenadas?: string;
  descricaoLocal?: string;
}

export interface RegistrarAmostraBrutaDTO {
  idPontoColeta: string;
  numeroIdentificacaoCampo: string;
  tipoAmostra: TipoAmostra;
  classificacao: ClassificacaoAmostra;
  metodoColeta?: string;
  dataColeta: string;
  operadorColeta?: string;
  profundidadeColeta?: number;
  descricao?: string;
  pesoBrutoCampo?: number;
  coordenadasGps?: string;
}

export interface PrepararAmostraDTO {
  idAmostraBruta: string;
  numeroAmostra: string;
  descricaoInicial?: string;
  normatizacao?: string;
  metodoPreparo: MetodoPreparo;
  metodoSecagem: MetodoSecagem;
  dataPreparo: string;
  idResponsavelPreparo: string;
  quantidadePreQuarteamento: number;
  quantidadePosQuarteamento: number;
  observacoes?: string;
}

export interface FracionarDTO {
  idAmostraPreparada: string;
  numeroAmostra: string;
  tipoEnsaioDestino: TipoEnsaioDestino;
  quantidadeInicial: number;
  descricao?: string;
  observacoes?: string;
}

export interface RegistrarIndeformadaDTO {
  idAmostraBruta: string;
  numeroAmostra: string;
  tipoIndeformada: TipoIndeformada;
  formato: FormatoIndeformada;
  altura?: number;
  largura?: number;
  comprimento?: number;
  condicao?: string;
  observacoes?: string;
}

export interface CriarEnsaioDTO {
  tipoEnsaio: TipoEnsaioDestino;
  normaReferencia?: string;
  idAmostraEnsaiada?: string;
  idAmostraIndeformada?: string;
  idExecutante: string;
  temperaturaAmbiente?: number;
  umidadeAmbiente?: number;
  observacoes?: string;
}

export interface RegistrarDeterminacaoDTO {
  idEnsaioTeorUmidade: string;
  tara: number;
  m1: number;
  m2?: number;
  tempoEstufa?: number;
  observacao?: string;
}

export interface ResultadosTeorUmidade {
  hMedio: number;
  desvioPadrao: number;
  fcMedio: number;
  numeroDeterminacoes: number;
}

export interface Rastreabilidade {
  pesquisa_id: string;
  pesquisa_titulo: string;
  programa_id: string;
  programa_objetivo: string;
  ponto_id: string;
  identificacao_plano: string;
  numero_identificacao_campo: string;
  tipo_amostra: TipoAmostra;
  data_coleta: string;
  coordenadas_gps: string | null;
  status: string;
  preparada_id: string | null;
  preparada_numero: string | null;
  metodo_preparo: string | null;
  ensaiada_id: string | null;
  ensaiada_numero: string | null;
  tipo_ensaio_destino: string | null;
  indeformada_id: string | null;
  indeformada_numero: string | null;
  ensaio_id: string | null;
  tipo_ensaio: string | null;
  ensaio_status: string | null;
  data_inicio: string | null;
  data_fim: string | null;
}

export interface EnsaioDetalhado {
  id: string;
  tipo_ensaio: TipoEnsaioDestino;
  norma_referencia: string | null;
  id_amostra_ensaiada: string | null;
  id_amostra_indeformada: string | null;
  id_executante: string;
  nome_executante?: string;
  status: StatusEnsaio;
  data_inicio: string | null;
  data_fim: string | null;
  temperatura_ambiente: number | null;
  umidade_ambiente: number | null;
  observacoes: string | null;
  data_criacao: string;
  id_criado_por: string;
  h_medio?: number;
  desvio_padrao?: number;
  fc_medio?: number;
  numero_determinacoes?: number;
  temperatura_estufa?: number | null;
  id_estufa?: string | null;
  id_balanca?: string | null;
  finalizado?: number;
}

export interface EquipamentoEnsaio {
  id: string;
  nome: string;
  estado: string;
  calibracaoVencida: boolean;
  diasRestantes: number;
}

export interface CalibracaoStatus {
  vencida: boolean;
  diasRestantes: number | null;
}

// =============================================
// MÓDULO 5: AGENDAMENTO E RESERVAS
// =============================================

export type StatusCalendario = 'em_configuracao' | 'publicado';
export type StatusAgendamento = 'solicitado' | 'aprovado' | 'negado' | 'cancelado' | 'finalizado';
export type ContextoAgendamento = 'academico' | 'pesquisa_cientifica' | 'comercial' | 'outro';
export type ComparecimentoStatus = 'compareceu' | 'nao_compareceu';

export interface ConfiguracaoLaboratorio {
  id: string;
  antecedencia_minima_dias: number;
  antecedencia_maxima_dias: number;
  prazo_cancelamento_horas: number;
  data_atualizacao: string;
  id_atualizado_por: string;
}

export interface CalendarioMensal {
  id: string;
  mes_ano: string;
  hora_abertura_padrao: string;
  hora_fechamento_padrao: string;
  capacidade_padrao: number;
  observacoes: string | null;
  status: StatusCalendario;
  id_responsavel: string;
  data_criacao: string;
  data_atualizacao: string | null;
}

export interface CalendarioDia {
  id: string;
  id_calendario_mensal: string;
  dia: number;
  disponivel: number;
  hora_abertura: string | null;
  hora_fechamento: string | null;
  capacidade: number | null;
  motivo: string | null;
}

export interface Agendamento {
  id: string;
  id_pesquisa: string;
  id_usuario_solicitante: string;
  id_tecnico_responsavel: string | null;
  objetivo: string;
  contexto: ContextoAgendamento;
  status: StatusAgendamento;
  id_aprovador: string | null;
  justificativa_aprovacao: string | null;
  motivo_cancelamento: string | null;
  data_solicitacao: string;
  data_aprovacao: string | null;
  data_cancelamento: string | null;
  data_finalizacao: string | null;
}

export interface AgendamentoData {
  id: string;
  id_agendamento: string;
  data_agendada: string;
  hora_inicio: string;
  hora_fim: string;
  comparecimento: ComparecimentoStatus | null;
  observacao_finalizacao: string | null;
}

export interface AgendamentoEnsaio {
  id: string;
  id_agendamento: string;
  tipo_ensaio: string;
  descricao: string | null;
}

export interface AgendamentoItem {
  id: string;
  id_agendamento: string;
  id_item: string;
}

export type AgendamentoLogAction =
  | 'configuracao_laboratorio_atualizada'
  | 'calendario_mensal_criado'
  | 'calendario_mensal_editado'
  | 'calendario_mensal_publicado'
  | 'calendario_dia_editado'
  | 'agendamento_solicitado'
  | 'agendamento_aprovado'
  | 'agendamento_negado'
  | 'agendamento_cancelado_usuario'
  | 'agendamento_cancelado_laboratorio'
  | 'agendamento_data_comparecimento'
  | 'agendamento_finalizado'
  | 'consulta_disponibilidade'
  | 'notificacao_calendario_pendente';

export interface AtualizarConfiguracaoDTO {
  antecedenciaMinimaDias: number;
  antecedenciaMaximaDias: number;
  prazoCancelamentoHoras: number;
}

export interface CriarCalendarioDTO {
  mesAno: string;
  horaAberturaPadrao: string;
  horaFechamentoPadrao: string;
  capacidadePadrao: number;
  observacoes?: string;
}

export interface EditarDiaDTO {
  disponivel: boolean;
  horaAbertura?: string;
  horaFechamento?: string;
  capacidade?: number;
  motivo?: string;
}

export interface SolicitarAgendamentoDTO {
  idPesquisa: string;
  objetivo: string;
  contexto: ContextoAgendamento;
  datas: { dataAgendada: string; horaInicio: string; horaFim: string }[];
  ensaios: { tipoEnsaio: string; descricao?: string }[];
  itens?: string[];
}

export interface AprovarAgendamentoDTO {
  idTecnicoResponsavel: string;
  justificativa: string;
}

export interface NegarAgendamentoDTO {
  justificativa: string;
}

export interface CalendarioMensalDetalhado extends CalendarioMensal {
  dias: CalendarioDia[];
}

export interface DisponibilidadeDia {
  disponivel: boolean;
  motivo?: string;
  horaAbertura?: string;
  horaFechamento?: string;
  capacidade?: number;
}

// =============================================
// MÓDULO 6: PAINEL GERENCIAL E CONFIGURAÇÕES
// =============================================

export interface ConfiguracaoSistema {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  data_atualizacao: string;
  id_atualizado_por: string;
}

export interface EditarConfiguracaoDTO {
  chave: string;
  valor: string;
}

export type SistemaLogAction =
  | 'configuracao_alterada'
  | 'logs_exportados'
  | 'limpeza_logs_automatica'
  | 'limpeza_logs_manual'
  | 'relatorio_gerencial_emitido'
  | 'notificacao_gerencial_gerada'
  | 'painel_consultado';

export type PeriodoPreset = '7d' | '30d' | '90d' | 'este_mes' | 'este_semestre' | 'este_ano' | 'personalizado';

export interface PeriodoFiltro {
  dataInicio: string;
  dataFim: string;
  preset: PeriodoPreset;
}

export interface IndicadoresVisaoGeral {
  pesquisasAtivas: number;
  ensaiosPeriodo: number;
  ocupacaoMedia: number;
  taxaComparecimento: number;
  equipamentosCriticos: number;
  ocorrenciasAbertas: number;
  ensaiosPorMes: { mes: string; total: number }[];
  comparecimento: { comparecimento: string; total: number }[];
  pesquisasPorContexto: { contexto: string; total: number }[];
}

export interface DadosPesquisasEnsaios {
  ensaiosPorTipo: { tipo_ensaio: string; total: number }[];
  pesquisasRecentes: any[];
  resultadosEnsaios: any[];
}

export interface DadosUsoLaboratorio {
  ocupacaoPorDiaSemana: { dia_semana: string; total: number; ordem?: number }[];
  usuariosFrequentes: { nome: string; total: number }[];
  tecnicosSupervisoes: { nome: string; total: number }[];
  estatisticas: EstatisticasAgendamento;
}

export interface EstatisticasAgendamento {
  totalAgendamentos: number;
  totalDatas: number;
  compareceram: number;
  naoCompareceram: number;
  cancelados: number;
  taxaComparecimento: number;
  ocupacaoMedia: number;
}

export interface DadosInventarioResumo {
  equipamentosPorEstado: { estado: string; total: number }[];
  equipamentosCalibracaoVencida: any[];
  materiaisEstoqueBaixo: any[];
  ocorrenciasAbertasResumo: any[];
}

export interface NotificacaoGerencial {
  id: string;
  tipo: string;
  mensagem: string;
  gravidade: 'info' | 'warning' | 'critical';
  dataGeracao: string;
}

// =============================================
// MÓDULO 7: ESTUDO UNIFICADO DE SOLOS
// =============================================

export type StatusPreenchimento = 'parcial' | 'completo';

export interface MetadadosAmostra {
  id: string;
  id_amostra_bruta: string;
  classificacao_sucs: string | null;
  classificacao_aashto: string | null;
  cor: string | null;
  textura: string | null;
  consistencia: string | null;
  origem_geologica: string | null;
  municipio: string | null;
  uf: string | null;
  profundidade_inicial: number | null;
  profundidade_final: number | null;
  nivel_agua: number | null;
  status_preenchimento: StatusPreenchimento;
  data_criacao: string;
  data_atualizacao: string | null;
  id_criado_por: string;
  id_atualizado_por: string | null;
}

export interface MetadadosAmostraDTO {
  classificacao_sucs?: string;
  classificacao_aashto?: string;
  cor?: string;
  textura?: string;
  consistencia?: string;
  origem_geologica?: string;
  municipio?: string;
  uf?: string;
  profundidade_inicial?: number;
  profundidade_final?: number;
  nivel_agua?: number;
}

export interface FiltrosMapa {
  tipoEnsaio?: string;
  dataInicio?: string;
  dataFim?: string;
  classificacaoSucs?: string;
  contexto?: string;
}

export interface VistaPontoGeotecnico {
  id_amostra: string;
  numero_identificacao_campo: string;
  tipo_amostra: string;
  data_coleta: string;
  coordenadas_gps: string;
  status_amostra: string;
  id_ponto_coleta: string;
  identificacao_plano: string;
  profundidade_extracao: number | null;
  id_programa: string;
  objetivo_programa: string;
  id_pesquisa: string;
  titulo_pesquisa: string;
  contexto_pesquisa: string;
  id_responsavel: string;
  nome_responsavel: string;
  id_metadados: string | null;
  classificacao_sucs: string | null;
  classificacao_aashto: string | null;
  cor: string | null;
  textura: string | null;
  consistencia: string | null;
  origem_geologica: string | null;
  municipio: string | null;
  uf: string | null;
  profundidade_inicial: number | null;
  profundidade_final: number | null;
  nivel_agua: number | null;
  status_preenchimento: string | null;
  teor_umidade: number | null;
  teor_umidade_indeformada: number | null;
  total_ensaios_concluidos: number;
  ensaios_realizados: string | null;
}

export type GeotecnicoLogAction =
  | 'mapa_consultado'
  | 'metadados_criados'
  | 'metadados_editados'
  | 'metadados_completados'
  | 'filtro_aplicado'
  | 'dados_exportados_geojson'
  | 'dados_exportados_csv'
  | 'popup_consultado';
