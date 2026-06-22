import { generateUUID } from '../utils/idUtils';
import { nowISO } from '../utils/dateUtils';
import { getDatabase } from './DatabaseService';
import { SenhaService } from './SenhaService';

export class SeedService {
  static async seed(): Promise<void> {
    try {
      const db = await getDatabase();

      const existing = await db.query('SELECT COUNT(*) as count FROM usuarios', []);
      const count = existing.values?.[0]?.count ?? 0;
      if (count > 0) return;

      const contas = [
        { nome: 'Aluno', sobrenome: 'Teste', genero: 'masculino', matricula: '20241001', email: 'aluno@ufrn.br', perfil: 'aluno', permissao: 'comum', senha: 'Teste123' },
        { nome: 'Professor', sobrenome: 'Teste', genero: 'masculino', matricula: '20241002', email: 'professor@ufrn.br', perfil: 'professor', permissao: 'comum', senha: 'Teste123' },
        { nome: 'Tecnico', sobrenome: 'Teste', genero: 'masculino', matricula: '20241003', email: 'tecnico@ufrn.edu.br', perfil: 'tecnico', permissao: 'comum', senha: 'Teste123' },
        { nome: 'Colaborador', sobrenome: 'Teste', genero: 'feminino', matricula: '20241004', email: 'colaborador@ufrn.br', perfil: 'tecnico', permissao: 'colaborador', senha: 'Teste123' },
        { nome: 'Chefe', sobrenome: 'Teste', genero: 'masculino', matricula: '20241005', email: 'chefia@ufrn.br', perfil: 'professor', permissao: 'chefia', senha: 'Teste123' },
      ];

      for (const c of contas) {
        const hash = await SenhaService.gerarHash(c.senha);
        await db.run(
          `INSERT INTO usuarios (id, nome, sobrenome, genero, matricula, email, senha_hash, perfil, permissao, status, data_criacao)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?)`,
          [generateUUID(), c.nome, c.sobrenome, c.genero, c.matricula, c.email, hash, c.perfil, c.permissao, nowISO()]
        );
      }

      console.log('Seed: 5 contas de teste criadas.');
    } catch (err) {
      console.error('Seed error:', err);
    }
  }
}
