import { gerarPromptParaTopicoUnico, parseResposta } from "../functions/prompt";
import { callOpenAI } from "../functions/chatgptapi"
import * as SQLite from 'expo-sqlite';

let dbPromise = SQLite.openDatabaseAsync('estudo.db');

const createTable = async () => {
  try {
    const db = await dbPromise;
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS materia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS assunto (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        materia_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        progresso REAL DEFAULT 0,
        FOREIGN KEY (materia_id) REFERENCES materia(id) ON DELETE CASCADE
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS topico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assunto_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        concluido INTEGER DEFAULT 0 CHECK (concluido IN (0,1)),
        FOREIGN KEY (assunto_id) REFERENCES assunto(id) ON DELETE CASCADE
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS questoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topico_id INTEGER NOT NULL,
        enunciado TEXT NOT NULL,
        FOREIGN KEY (topico_id) REFERENCES topico(id) ON DELETE CASCADE
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS alternativas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        questao_id INTEGER NOT NULL,
        texto TEXT NOT NULL,
        correta INTEGER NOT NULL CHECK (correta IN (0,1)),
        FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE
      );
    `);
  } catch (erro) {
    console.error("Erro ao criar tabelas:", erro);
    throw erro;
  }
};

const salvarDados = async (assunto, topicos) => {
  try {
    const db = await dbPromise;

    const verificarTabelaQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name='materia'";
    const tabelaExiste = await db.getFirstAsync(verificarTabelaQuery);

    if (!tabelaExiste) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS materia (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL
        );
      `);
    }

    if (!assunto || !Array.isArray(topicos)) {
      throw new Error("Parâmetros inválidos para salvarDados");
    }

    let materiaId;
    const materiaNome = 'Matemática';

    const resultadoMateria = await db.getFirstAsync(
      'SELECT id FROM materia WHERE nome = ? LIMIT 1;',
      [materiaNome]
    );

    if (resultadoMateria) {
      materiaId = resultadoMateria.id;
    } else {
      const resultadoInsercao = await db.runAsync(
        'INSERT INTO materia (nome) VALUES (?)',
        [materiaNome]
      );

      if (!resultadoInsercao || !resultadoInsercao.lastInsertRowId) {
        throw new Error("Falha ao inserir nova matéria");
      }

      materiaId = resultadoInsercao.lastInsertRowId;
    }

    let assuntoId;
    const resultadoAssunto = await db.getFirstAsync(
      'SELECT id FROM assunto WHERE materia_id = ? AND nome = ? LIMIT 1;',
      [materiaId, assunto]
    );

    if (resultadoAssunto) {
      assuntoId = resultadoAssunto.id;
    } else {
      const insercaoAssunto = await db.runAsync(
        'INSERT INTO assunto (materia_id, nome) VALUES (?, ?)',
        [materiaId, assunto]
      );

      if (!insercaoAssunto || !insercaoAssunto.lastInsertRowId) {
        throw new Error("Falha ao inserir novo assunto");
      }

      assuntoId = insercaoAssunto.lastInsertRowId;
    }

    for (const nomeTopico of topicos) {
      if (!nomeTopico || typeof nomeTopico !== 'string') continue;

      const topicoExistente = await db.getFirstAsync(
        'SELECT id FROM topico WHERE assunto_id = ? AND nome = ? LIMIT 1;',
        [assuntoId, nomeTopico]
      );

      if (topicoExistente) continue;

      try {
        const prompt = gerarPromptParaTopicoUnico({ assunto, topico: nomeTopico });
        const resposta = await callOpenAI(prompt);
        const perguntasAnalisadas = parseResposta(resposta);

        if (!perguntasAnalisadas || !Array.isArray(perguntasAnalisadas)) {
          continue;
        }

        const topicoObj = {
          titulo: nomeTopico,
          perguntas: perguntasAnalisadas
        };

        await salvarDadosTopico(assuntoId, topicoObj);
      } catch (erro) {
        continue;
      }
    }
  } catch (erro) {
    throw erro;
  }
};

const salvarDadosTopico = async (assuntoId, topicoObj) => {
  try {
    const db = await dbPromise;

    const insercaoTopico = await db.runAsync(
      'INSERT INTO topico (assunto_id, nome) VALUES (?, ?);',
      [assuntoId, topicoObj.titulo]
    );
    const topicoId = insercaoTopico.lastInsertRowId;

    for (const pergunta of topicoObj.perguntas) {
      const insercaoQuestao = await db.runAsync(
        'INSERT INTO questoes (topico_id, enunciado) VALUES (?, ?);',
        [topicoId, pergunta.enunciado]
      );
      const questaoId = insercaoQuestao.lastInsertRowId;

      for (const [letra, texto] of Object.entries(pergunta.alternativas)) {
        const correta = letra === pergunta.respostaCorreta ? 1 : 0;
        await db.runAsync(
          'INSERT INTO alternativas (questao_id, texto, correta) VALUES (?, ?, ?);',
          [questaoId, texto, correta]
        );
      }
    }
  } catch (erro) {
    throw erro;
  }
};

const buscarTodasMateriasEAssuntos = async () => {
  try {
    const db = await dbPromise;

    const materias = await db.getAllAsync('SELECT id, nome FROM materia;');

    const materiasComAssuntos = await Promise.all(
      materias.map(async (materia) => {
        const assuntos = await db.getAllAsync(
          'SELECT id, nome, progresso FROM assunto WHERE materia_id = ?;',
          [materia.id]
        );

        return {
          ...materia,
          assuntos
        };
      })
    );

    return materiasComAssuntos;
  } catch (erro) {
    return [];
  }
};

const buscarMaterias = async () => {
  try {
    const db = await dbPromise;
    const materias = await db.getAllAsync('SELECT nome FROM materia;');
    return materias;
  } catch (erro) {
    return [];
  }
};

const buscarAssuntoETopicosComQuestoes = async (assuntoId) => {
  try {
    const db = await dbPromise;

    const resultadoAssunto = await db.getFirstAsync(
      'SELECT id, nome, progresso FROM assunto WHERE id = ? LIMIT 1;',
      [assuntoId]
    );

    if (!resultadoAssunto) return null;

    const query = `
      SELECT 
        t.id as topico_id, t.nome as topico_nome, t.concluido,
        q.id as questao_id, q.enunciado,
        a.id as alternativa_id, a.texto, a.correta
      FROM topico t
      LEFT JOIN questoes q ON q.topico_id = t.id
      LEFT JOIN alternativas a ON a.questao_id = q.id
      WHERE t.assunto_id = ?
      ORDER BY t.id, q.id, a.id;
    `;

    const resultado = await db.getAllAsync(query, [assuntoId]);

    const mapaTopicos = {};

    resultado.forEach(linha => {
      if (!mapaTopicos[linha.topico_id]) {
        mapaTopicos[linha.topico_id] = {
          id: linha.topico_id,
          nome: linha.topico_nome,
          concluido: linha.concluido === 1,
          questoes: []
        };
      }

      if (linha.questao_id) {
        let questao = mapaTopicos[linha.topico_id].questoes.find(q => q.id === linha.questao_id);

        if (!questao) {
          questao = {
            id: linha.questao_id,
            enunciado: linha.enunciado,
            alternativas: []
          };
          mapaTopicos[linha.topico_id].questoes.push(questao);
        }

        if (linha.alternativa_id) {
          questao.alternativas.push({
            id: linha.alternativa_id,
            texto: linha.texto,
            correta: linha.correta === 1
          });
        }
      }
    });

    return {
      assunto: {
        id: resultadoAssunto.id,
        nome: resultadoAssunto.nome,
        progresso: resultadoAssunto.progresso || 0
      },
      topicos: Object.values(mapaTopicos)
    };
  } catch (erro) {
    return null;
  }
};

const atualizarProgressoAssunto = async (assuntoId) => {
  try {
    const db = await dbPromise;

    const resultado = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN concluido = 1 THEN 1 ELSE 0 END) as concluidos
      FROM topico 
      WHERE assunto_id = ?;
    `, [assuntoId]);

    if (resultado && resultado.total > 0) {
      const progresso = (resultado.concluidos / resultado.total) * 100;

      await db.runAsync(`
        UPDATE assunto 
        SET progresso = ?
        WHERE id = ?;
      `, [progresso, assuntoId]);

      return {
        totalTopicos: resultado.total,
        concluidos: resultado.concluidos,
        progresso: progresso
      };
    }

    return {
      totalTopicos: 0,
      concluidos: 0,
      progresso: 0
    };
  } catch (erro) {
    throw erro;
  }
};

const concluirTopico = async (topicoId) => {
  try {
    const db = await dbPromise;

    const topico = await db.getFirstAsync(
      'SELECT assunto_id FROM topico WHERE id = ?;',
      [topicoId]
    );

    if (!topico) {
      throw new Error("Tópico não encontrado");
    }

    await db.runAsync(
      'UPDATE topico SET concluido = 1 WHERE id = ?;',
      [topicoId]
    );

    const progresso = await atualizarProgressoAssunto(topico.assunto_id);

    return {
      sucesso: true,
      progresso: progresso
    };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro.message
    };
  }
};

const inserirMateria = async (nomeMateria) => {
  try {
    const db = await dbPromise;

    const materiaExistente = await db.getFirstAsync(
      'SELECT id FROM materia WHERE nome = ? LIMIT 1;',
      [nomeMateria]
    );

    if (materiaExistente) {
      throw new Error('Matéria já existe');
    }

    const resultado = await db.runAsync(
      'INSERT INTO materia (nome) VALUES (?);',
      [nomeMateria]
    );

    if (!resultado || !resultado.lastInsertRowId) {
      throw new Error('Falha ao inserir matéria');
    }

    return { sucesso: true, id: resultado.lastInsertRowId };
  } catch (erro) {
    throw erro;
  }
};

createTable();

export {
  salvarDados,
  buscarAssuntoETopicosComQuestoes,
  concluirTopico,
  buscarTodasMateriasEAssuntos,
  buscarMaterias,
  inserirMateria
};