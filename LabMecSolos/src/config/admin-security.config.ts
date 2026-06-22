export const ADMIN_SECURITY_CONFIG = {
  CHEFIA_MINIMO: 1,
  CHEFIA_MAXIMO: 2,

  MAX_TENTATIVAS_SENHA: 3,
  ACAO_CRITICA_NEGADA_LOG_ACTION: 'acao_critica_negada',

  TEXTO_CONFIRMACAO_EXCLUSAO: 'EXCLUIR',

  ITENS_POR_PAGINA: 20,

  DEBOUNCE_BUSCA_MS: 300,

  MODULOS_HISTORICO_USUARIO: ['autenticacao', 'administracao'],

  ACOES_QUE_EXIGEM_SENHA: [
    'conceder_colaborador',
    'revogar_colaborador',
    'transferir_chefia',
    'desativar_usuario',
    'excluir_usuario',
  ],

  ACOES_SEM_SENHA: [
    'ativar_usuario',
  ],
} as const;
