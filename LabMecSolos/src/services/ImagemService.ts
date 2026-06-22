import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { queryRows, executeSql, getDatabase } from './DatabaseService';
import { LogService } from './LogService';
import { Imagem, EntidadeTipoImagem } from '../models/types';

export class ImagemService {
  static async upload(
    entidadeTipo: EntidadeTipoImagem,
    entidadeId: string,
    url: string,
    descricao: string | null,
    idAutor: string
  ): Promise<Imagem> {
    const id = generateUUID();
    const agora = nowISO();

    await executeSql(
      `INSERT INTO imagens (id, url, descricao, id_autor, entidade_tipo, entidade_id, status, data_criacao)
       VALUES (?, ?, ?, ?, ?, ?, 'ativo', ?)`,
      [id, url, descricao, idAutor, entidadeTipo, entidadeId, agora]
    );

    const moduloUpload = entidadeTipo === 'item' ? 'estoque' : 'ensaios';
    await LogService.registrar(
      moduloUpload,
      'imagem_upload',
      idAutor,
      null,
      null,
      JSON.stringify({ entidade: `${entidadeTipo}/${entidadeId}` }),
      null
    );

    return {
      id,
      url,
      descricao: descricao,
      id_autor: idAutor,
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      status: 'ativo',
      data_criacao: agora,
    };
  }

  static async listarPorEntidade(entidadeTipo: EntidadeTipoImagem, entidadeId: string): Promise<Imagem[]> {
    return queryRows<Imagem>(
      "SELECT * FROM imagens WHERE entidade_tipo = ? AND entidade_id = ? AND status = 'ativo' ORDER BY data_criacao DESC",
      [entidadeTipo, entidadeId]
    );
  }

  private static async obterIdResponsavelPesquisa(entidadeTipo: string, entidadeId: string): Promise<string | null> {
    const db = await getDatabase();

    switch (entidadeTipo) {
      case 'pesquisa': {
        const r = await db.query('SELECT id_responsavel FROM pesquisas WHERE id = ?', [entidadeId]);
        return r.values?.[0]?.id_responsavel as string || null;
      }
      case 'programa_amostragem': {
        const r = await db.query(
          'SELECT pesq.id_responsavel FROM programas_amostragem prog INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id WHERE prog.id = ?',
          [entidadeId]
        );
        return r.values?.[0]?.id_responsavel as string || null;
      }
      case 'ponto_coleta': {
        const r = await db.query(
          'SELECT pesq.id_responsavel FROM pontos_coleta pt INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id WHERE pt.id = ?',
          [entidadeId]
        );
        return r.values?.[0]?.id_responsavel as string || null;
      }
      case 'amostra_bruta': {
        const r = await db.query(
          'SELECT pesq.id_responsavel FROM amostras_brutas ab INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id WHERE ab.id = ?',
          [entidadeId]
        );
        return r.values?.[0]?.id_responsavel as string || null;
      }
      case 'amostra_preparada': {
        const r = await db.query(
          'SELECT pesq.id_responsavel FROM amostras_preparadas ap INNER JOIN amostras_brutas ab ON ap.id_amostra_bruta = ab.id INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id WHERE ap.id = ?',
          [entidadeId]
        );
        return r.values?.[0]?.id_responsavel as string || null;
      }
      case 'amostra_ensaiada': {
        const r = await db.query(
          'SELECT pesq.id_responsavel FROM amostras_ensaiadas ae INNER JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id INNER JOIN amostras_brutas ab ON ap.id_amostra_bruta = ab.id INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id WHERE ae.id = ?',
          [entidadeId]
        );
        return r.values?.[0]?.id_responsavel as string || null;
      }
      case 'amostra_indeformada': {
        const r = await db.query(
          'SELECT pesq.id_responsavel FROM amostras_indeformadas ai INNER JOIN amostras_brutas ab ON ai.id_amostra_bruta = ab.id INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id WHERE ai.id = ?',
          [entidadeId]
        );
        return r.values?.[0]?.id_responsavel as string || null;
      }
      case 'ensaio': {
        const r = await db.query(
          `SELECT pesq.id_responsavel FROM ensaios e
           LEFT JOIN amostras_ensaiadas ae ON e.id_amostra_ensaiada = ae.id
           LEFT JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id
           LEFT JOIN amostras_brutas ab1 ON ap.id_amostra_bruta = ab1.id
           LEFT JOIN amostras_indeformadas ai ON e.id_amostra_indeformada = ai.id
           LEFT JOIN amostras_brutas ab2 ON ai.id_amostra_bruta = ab2.id
           LEFT JOIN pontos_coleta pt ON (ab1.id_ponto_coleta = pt.id OR ab2.id_ponto_coleta = pt.id)
           LEFT JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id
           LEFT JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE e.id = ?`,
          [entidadeId]
        );
        return r.values?.[0]?.id_responsavel as string || null;
      }
      case 'determinacao_teor_umidade': {
        const r = await db.query(
          `SELECT pesq.id_responsavel FROM determinacoes_teor_umidade d
           INNER JOIN ensaios_teor_umidade etu ON d.id_ensaio_teor_umidade = etu.id
           INNER JOIN ensaios e ON etu.id = e.id
           LEFT JOIN amostras_ensaiadas ae ON e.id_amostra_ensaiada = ae.id
           LEFT JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id
           LEFT JOIN amostras_brutas ab1 ON ap.id_amostra_bruta = ab1.id
           LEFT JOIN amostras_indeformadas ai ON e.id_amostra_indeformada = ai.id
           LEFT JOIN amostras_brutas ab2 ON ai.id_amostra_bruta = ab2.id
           LEFT JOIN pontos_coleta pt ON (ab1.id_ponto_coleta = pt.id OR ab2.id_ponto_coleta = pt.id)
           LEFT JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id
           LEFT JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE d.id = ?`,
          [entidadeId]
        );
        return r.values?.[0]?.id_responsavel as string || null;
      }
      default:
        return null;
    }
  }

  static async excluir(idImagem: string, idUsuario: string): Promise<void> {
    const imagens = await queryRows<{ id_autor: string; entidade_tipo: string; entidade_id: string }>(
      'SELECT id_autor, entidade_tipo, entidade_id FROM imagens WHERE id = ?',
      [idImagem]
    );

    if (imagens.length === 0) {
      throw new Error('Imagem nao encontrada.');
    }

    const { id_autor, entidade_tipo, entidade_id } = imagens[0];

    if (idUsuario !== id_autor) {
      const idResponsavel = await ImagemService.obterIdResponsavelPesquisa(entidade_tipo, entidade_id);
      if (!idResponsavel || idResponsavel !== idUsuario) {
        throw new Error('Apenas o autor da imagem ou o Responsavel Principal da pesquisa pode exclui-la.');
      }
    }

    await executeSql(
      "UPDATE imagens SET status = 'excluido' WHERE id = ?",
      [idImagem]
    );

    const moduloExcluir = entidade_tipo === 'item' ? 'estoque' : 'ensaios';

    await LogService.registrar(
      moduloExcluir,
      'imagem_excluida',
      idUsuario,
      null,
      JSON.stringify({ status: 'ativo' }),
      JSON.stringify({ status: 'excluido' }),
      null
    );
  }
}
