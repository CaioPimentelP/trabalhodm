import { salvarDados } from "../database/database";
import { callOpenAI } from "./chatgptapi"

interface PlanoEstudoProps {
  materia: string;
  assunto: string;
  nivelUsuario: string;
  profundidadeDesejada: string;
}


const gerarPromptPlanoEstudo = (input: PlanoEstudoProps): string =>
  `Crie um plano de estudos para aprender ${input.assunto} dividido em tres tópicos claros e objetivos, que garantam que a pessoa vai dominar completamente a matéria.

Considere que a pessoa tem o seguinte nível de conhecimento atual: ${input.nivelUsuario}.
Ela quer alcançar uma profundidade: ${input.profundidadeDesejada}.

A estrutura do plano deve conter uma lista de tópicos a serem estudados ou praticados, organizados de forma lógica e progressiva.

Não repita o nome do assunto em todos os tópicos. Seja claro, direto, sem rodeios.

faça exatamente o seguinte retorno, apenas com os tópicos sem enumeração, e com aspas em cada um, esse é um array de strings. tenha cuidado para não colocar aspas ou couchetes adicionais, pois esse array vai entrar em outra função.

[topico 1, topico 2..]
`;

export const gerarPromptParaTopicoUnico  = ({ assunto, topico }: { assunto: string, topico: string }) => {
  return `
Crie **duas perguntas de múltipla escolha** sobre o tópico **${topico}**, dentro do assunto **${assunto}**.

As perguntas devem testar o conhecimento da pessoa sobre o tópico individualmente.
Cada pergunta deve ter:
- Enunciado claro
- 4 alternativas (A, B, C, D)
- Apenas uma alternativa correta
- A resposta correta marcada no final (por exemplo: "Resposta correta: B")

Formato esperado:
1. Pergunta...
   A) ...
   B) ...
   C) ...
   D) ...
   Resposta correta: X

2. Pergunta...
   ...
`;
};
export const gerarPrompt = async (entrada: PlanoEstudoProps) => {
  try {
    const promptPlanoEstudo = gerarPromptPlanoEstudo(entrada);

    let topicos;
    try {
      const topicosString = await callOpenAI(promptPlanoEstudo);
      topicos = JSON.parse(topicosString);
    } catch (erro) {
      throw erro;
    }

    await salvarDados(entrada.assunto, topicos,  entrada.materia);
  } catch (erro) {
    throw erro;
  }
};

export const parseResposta = (resposta) => {
  const perguntas = [];
  const blocos = resposta.trim().split(/\n(?=\d+\.)/);

  for (const bloco of blocos) {
    const linhas = bloco.trim().split("\n");

    const matchEnunciado = linhas[0].match(/^\d+\.\s*(.*)/);
    const enunciado = matchEnunciado ? matchEnunciado[1].trim() : "";

    const alternativas = {};
    let respostaCorreta = "";

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();

      if (linha.startsWith("A)")) alternativas["A"] = linha.slice(2).trim();
      else if (linha.startsWith("B)")) alternativas["B"] = linha.slice(2).trim();
      else if (linha.startsWith("C)")) alternativas["C"] = linha.slice(2).trim();
      else if (linha.startsWith("D)")) alternativas["D"] = linha.slice(2).trim();
      else if (linha.toLowerCase().startsWith("resposta correta:")) {
        respostaCorreta = linha.split(":")[1].trim().toUpperCase();
      }
    }

    if (enunciado && respostaCorreta) {
      perguntas.push({
        enunciado,
        alternativas,
        respostaCorreta,
      });
    }
  }

  return perguntas;
};
