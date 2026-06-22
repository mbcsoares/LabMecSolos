export const GEOTECNICO_CONFIG = {
  MAPA_CENTRO_PADRAO: { lat: -5.7950, lng: -35.2083 },
  MAPA_ZOOM_PADRAO: 7,
  MAPA_ZOOM_MAX: 18,
  MAPA_ZOOM_MIN: 3,
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  TILE_ATTRIBUTION: '© OpenStreetMap contributors',

  CLUSTER_MAX_ZOOM: 15,
  CLUSTER_RADIUS: 50,

  MARCADOR_CORES: {
    deformada_com_ensaio: '#3B82F6',
    deformada_sem_ensaio: '#F97316',
    indeformada_com_ensaio: '#22C55E',
    indeformada_sem_ensaio: '#EAB308',
    cluster: '#6B7280',
  } as const,

  ITENS_POR_PAGINA: 20,
  DEBOUNCE_BUSCA_MS: 300,

  TOTAL_CAMPOS_METADADOS: 11,

  EXPORT_GEOJSON_FILENAME: 'pontos_geotecnicos.geojson',
  EXPORT_CSV_FILENAME: 'pontos_geotecnicos.csv',
} as const;
