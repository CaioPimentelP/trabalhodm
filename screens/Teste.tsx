import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { concluirTopico } from '../database/database';

type Questao = {
  id: number;
  enunciado: string;
  alternativas: {
    id: number;
    texto: string;
    correta: boolean;
  }[];
};

type Topico = {
  id: number;
  nome: string;
  questoes: Questao[];
};

export default function Teste({ navigation, route }) {
  const { topico }: { topico: Topico } = route.params;
  const { assuntoId } = route.params;
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  
  const responderQuestao = (alternativaId: number) => {
    if (mostrarResultado) return;

    const novasRespostas = [...respostas];
    novasRespostas[questaoAtual] = alternativaId;
    setRespostas(novasRespostas);
    setMostrarResultado(true);
  };

  const avancarQuestao = () => {
    setMostrarResultado(false);
    if (questaoAtual < topico.questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1);
    }
  };

  const finalizarTeste = async () => {
    const acertos = topico.questoes.reduce((total, questao, index) => {
      const respostaId = respostas[index];
      const alternativaCorreta = questao.alternativas.find(a => a.correta)?.id;
      return total + (respostaId === alternativaCorreta ? 1 : 0);
    }, 0);

    const percentual = (acertos / topico.questoes.length) * 100;
    const todasCorretas = acertos === topico.questoes.length;

    if (todasCorretas) {
      await concluirTopico(topico.id);
    }

    Alert.alert(
      'Teste Finalizado',
      `Você acertou ${acertos} de ${topico.questoes.length} questões (${percentual.toFixed(0)}%)`,
      [
        {
          text: 'Voltar',
          onPress: () => navigation.navigate('Topicos', {assuntoId: assuntoId})
        }
      ]
    );
  };

  const questao = topico.questoes[questaoAtual];

  if (!questao) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.textoProgresso}>
          Questão {questaoAtual + 1} de {topico.questoes.length}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.nomeTopico}>{topico.nome}</Text>
      <ScrollView style={styles.containerEnunciado}>
        <Text style={styles.enunciado}>{questao.enunciado}</Text>
      </ScrollView>
      <View style={styles.containerAlternativas}>
        {questao.alternativas.map(alternativa => {
          const selecionada = respostas[questaoAtual] === alternativa.id;
          const correta = alternativa.correta;
          let estilo = styles.alternativa;
          
          if (mostrarResultado) {
            if (correta) {
              estilo = styles.alternativaCorreta;
            } else if (selecionada && !correta) {
              estilo = styles.alternativaIncorreta;
            }
          } else if (selecionada) {
            estilo = styles.alternativaSelecionada;
          }

          return (
            <TouchableOpacity
              key={alternativa.id}
              style={[estilo, styles.botaoAlternativa]}
              onPress={() => responderQuestao(alternativa.id)}
              disabled={mostrarResultado}
            >
              <Text style={styles.textoAlternativa}>{alternativa.texto}</Text>
              {mostrarResultado && correta && (
                <Ionicons name="checkmark-circle" size={20} color="white" style={styles.iconeResposta} />
              )}
              {mostrarResultado && selecionada && !correta && (
                <Ionicons name="close-circle" size={20} color="white" style={styles.iconeResposta} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {mostrarResultado && (
        <TouchableOpacity
          style={styles.botaoProximo}
          onPress={() => {
            if (questaoAtual < topico.questoes.length - 1) {
              avancarQuestao();
            } else {
              finalizarTeste();
            }
          }}
        >
          <Text style={styles.textoBotaoProximo}>
            {questaoAtual < topico.questoes.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 50,
    paddingHorizontal: 30,
    backgroundColor: '#F9FAFB',
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  textoProgresso: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  nomeTopico: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  containerEnunciado: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 1,
  },
  enunciado: {
    fontSize: 18,
    color: '#111827',
    lineHeight: 26,
  },
  containerAlternativas: {
    marginBottom: 20,
  },
  botaoAlternativa: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alternativa: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  alternativaSelecionada: {
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  alternativaCorreta: {
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  alternativaIncorreta: {
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  textoAlternativa: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  iconeResposta: {
    marginLeft: 10,
  },
  botaoProximo: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoBotaoProximo: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});