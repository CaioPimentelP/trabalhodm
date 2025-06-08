import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { buscarAssuntoETopicosComQuestoes } from '../database/database';

type Alternativa = {
  id: number;
  texto: string;
  correta: boolean;
};

type Questao = {
  id: number;
  enunciado: string;
  alternativas: Alternativa[];
};

type Topico = {
  id: number;
  nome: string;
  concluido: boolean;
  questoes: Questao[];
};

type Assunto = {
  id: number;
  nome: string;
  progresso: number;
};

type DadosAssunto = {
  assunto: Assunto;
  topicos: Topico[];
};

export default function Topicos({ navigation, route }) {
  const { assuntoId } = route.params;
  const [dados, setDados] = useState<DadosAssunto>({
    assunto: {
      id: 0,
      nome: '',
      progresso: 0
    },
    topicos: []
  });

  useEffect(() => {
    const carregarDados = async () => {
      setDados(await buscarAssuntoETopicosComQuestoes(assuntoId));
    };

    carregarDados();
  }, []);

  const pressionarTopico = (topico: Topico) => {
    navigation.navigate('Teste', {
      topico,
      assuntoId: dados.assunto.id
    });
  };

  const renderizarTopico = ({ item }: { item: Topico }) => (
    <TouchableOpacity
      style={[
        styles.itemTopico,
        item.questoes.length === 0 && styles.topicoIncompleto,
        item.concluido && styles.topicoConcluido
      ]}
      onPress={() => pressionarTopico(item)}
    >
      <View style={styles.ladoEsquerdoTopico}>
        <Ionicons
          name={item.concluido ? "checkmark-circle" : "book"}
          size={24}
          color={item.concluido ? "#10B981" : item.questoes.length > 0 ? "#4F46E5" : "#9CA3AF"}
        />
        <View style={styles.containerTextoTopico}>
          <Text style={styles.nomeTopico}>{item.nome}</Text>
          <Text style={styles.textoQuestoes}>
            {item.questoes.length} {item.questoes.length === 1 ? 'questão' : 'questões'}
            {item.concluido && ' • Concluído'}
          </Text>
        </View>
      </View>
      {item.questoes.length > 0 && (
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>

        <View style={styles.containerProgresso}>
          <Text style={styles.textoProgresso}>
            Progresso geral: {Math.round(dados.assunto.progresso)}%
          </Text>
          <Progress.Bar
            progress={dados.assunto.progresso / 100}
            width={null}
            height={8}
            color="#4F46E5"
            unfilledColor="#E5E7EB"
            borderRadius={4}
          />
        </View>
      </View>

      <Text style={styles.titulo}>{dados.assunto.nome}</Text>

      <FlatList
        data={dados.topicos}
        renderItem={renderizarTopico}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.containerLista}
        ListEmptyComponent={
          <Text style={styles.textoVazio}>Nenhum tópico disponível</Text>
        }
      />
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
    marginBottom: 20,
    gap: 12,
  },
  botaoVoltar: {
    padding: 4,
    alignSelf: 'flex-start'
  },
  containerProgresso: {
    gap: 6,
  },
  textoProgresso: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  titulo: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  containerLista: {
    paddingBottom: 20,
  },
  itemTopico: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topicoIncompleto: {
    opacity: 0.6,
  },
  topicoConcluido: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  ladoEsquerdoTopico: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  containerTextoTopico: {
    flex: 1,
  },
  nomeTopico: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  textoQuestoes: {
    fontSize: 14,
    color: '#6B7280',
  },
  textoVazio: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
    fontSize: 16,
  },
});