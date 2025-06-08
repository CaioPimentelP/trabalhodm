import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Text, Platform, TouchableOpacity, Modal, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as Progresso from 'react-native-progress';
import { gerarPrompt } from "../functions/prompt";
import { buscarMaterias, inserirMateria } from '../database/database';

interface Materia {
  nome: string;
}

export default function Gerador({ navigation }) {
  const [valorInput, setValorInput] = useState('');
  const [nivel, setNivel] = useState('basico');
  const [conhecimento, setConhecimento] = useState('iniciante');
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaSelecionada, setMateriaSelecionada] = useState('');
  const [progresso, setProgresso] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [mostrarModalNovaMateria, setMostrarModalNovaMateria] = useState(false);
  const [novaMateria, setNovaMateria] = useState('');

  const lidarComMudancaInput = (assunto) => {
    setValorInput(assunto);
    atualizarProgresso(assunto, nivel, conhecimento, materiaSelecionada);
  };

  const lidarComMudancaPicker = (assunto, tipo) => {
    if (tipo === 'nivel') {
      setNivel(assunto);
      atualizarProgresso(valorInput, assunto, conhecimento, materiaSelecionada);
    } else if (tipo === 'conhecimento') {
      setConhecimento(assunto);
      atualizarProgresso(valorInput, nivel, assunto, materiaSelecionada);
    } else if (tipo === 'materia') {
      if (assunto === 'adicionar_nova') {
        setMostrarModalNovaMateria(true);
      } else {
        setMateriaSelecionada(assunto);
        atualizarProgresso(valorInput, nivel, conhecimento, assunto);
      }
    }
  };

  const atualizarProgresso = (input, nivel, conhecimento, materia) => {
  let camposPreenchidos = 0;
  if (input !== '') camposPreenchidos++;
  if (nivel !== '') camposPreenchidos++;
  if (conhecimento !== '') camposPreenchidos++;
  if (materia !== '') camposPreenchidos++;
  setProgresso(camposPreenchidos / 4);
};

  const lidarComPressionar = async () => {
    if (!materiaSelecionada) {
      Alert.alert('Aviso', 'Por favor, selecione uma matéria');
      return;
    }

    try {
      setCarregando(true);
      await gerarPrompt({
        materia: materiaSelecionada,
        assunto: valorInput,
        nivelUsuario: conhecimento,
        profundidadeDesejada: nivel
      });
    } catch (erro) {
      console.error("Erro ao gerar prompt:", erro);
    } finally {
      setCarregando(false);
    }
  };

  const lidarComAdicionarMateria = async () => {
    if (!novaMateria.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para a matéria');
      return;
    }

    try {
      await inserirMateria(novaMateria);
      const materiasAtualizadas = await buscarMaterias();
      setMaterias(materiasAtualizadas);
      setMateriaSelecionada(novaMateria);
      setMostrarModalNovaMateria(false);
      setNovaMateria('');
    } catch (erro) {
      console.error("Erro ao adicionar matéria:", erro);
      Alert.alert('Erro', 'Não foi possível adicionar a matéria');
    }
  };

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const materias = await buscarMaterias();
        setMaterias(materias);
      } catch (erro) {
        console.error("Erro ao buscar matérias:", erro);
      }
    };

    buscarDados();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Progresso.Bar
          progress={progresso}
          width={null}
          height={10}
          color="#1E40AF"
          unfilledColor="#E5E7EB"
        />
      </View>

      <Text style={styles.titulo}>
        Preencha os campos abaixo para gerar um mapa de estudos personalizado.
      </Text>

      <View style={styles.containerInputs}>
        <Text style={styles.rotulo}>O que você quer aprender:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: calculo II"
          placeholderTextColor="gray"
          value={valorInput}
          onChangeText={lidarComMudancaInput}
        />

        <Text style={styles.rotulo}>Nível de Profundidade:</Text>
        <Picker
          selectedValue={nivel}
          onValueChange={(assunto) => lidarComMudancaPicker(assunto, 'nivel')}
          style={styles.input}
          dropdownIconColor="#1E40AF"
        >
          <Picker.Item label="Básico" value="basico" style={styles.itemPicker} />
          <Picker.Item label="Intermediário" value="intermediario" style={styles.itemPicker} />
          <Picker.Item label="Avançado" value="avancado" style={styles.itemPicker} />
        </Picker>

        <Text style={styles.rotulo}>Seu nível de conhecimento atual:</Text>
        <Picker
          selectedValue={conhecimento}
          onValueChange={(assunto) => lidarComMudancaPicker(assunto, 'conhecimento')}
          style={styles.input}
          dropdownIconColor="#1E40AF"
        >
          <Picker.Item label="Iniciante" value="iniciante" style={styles.itemPicker} />
          <Picker.Item label="Intermediário" value="intermediario" style={styles.itemPicker} />
          <Picker.Item label="Avançado" value="avancado" style={styles.itemPicker} />
        </Picker>

        <Text style={styles.rotulo}>Matéria:</Text>
        <Picker
          selectedValue={materiaSelecionada}
          onValueChange={(assunto) => lidarComMudancaPicker(assunto, 'materia')}
          style={styles.input}
          dropdownIconColor="#1E40AF"
        >
          <Picker.Item 
            label="Selecione uma matéria" 
            value="" 
            style={[styles.itemPicker, styles.placeholder]} 
          />
          {materias.map((materia) => (
            <Picker.Item 
              key={materia.nome} 
              label={materia.nome} 
              value={materia.nome} 
              style={styles.itemPicker} 
            />
          ))}
          <Picker.Item 
            label="Adicione uma nova" 
            value="adicionar_nova" 
            style={[styles.itemPicker, styles.itemAdicionar]} 
          />
        </Picker>
      </View>

      <TouchableOpacity 
        style={styles.botao} 
        onPress={lidarComPressionar}
        disabled={carregando}
      >
        <Text style={styles.textoBotao}>{carregando ? "Carregando..." : "Prosseguir"}</Text>
      </TouchableOpacity>

      <Modal
        visible={mostrarModalNovaMateria}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMostrarModalNovaMateria(false)}
      >
        <View style={styles.containerModal}>
          <View style={styles.conteudoModal}>
            <Text style={styles.tituloModal}>Adicionar Nova Matéria</Text>
            <TextInput
              style={styles.inputModal}
              placeholder="Nome da matéria"
              value={novaMateria}
              onChangeText={setNovaMateria}
              autoFocus={true}
            />
            <View style={styles.botoesModal}>
              <TouchableOpacity 
                style={[styles.botaoModal, styles.botaoCancelar]}
                onPress={() => setMostrarModalNovaMateria(false)}
              >
                <Text style={styles.textoBotaoModal}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.botaoModal, styles.botaoAdicionar]}
                onPress={lidarComAdicionarMateria}
              >
                <Text style={styles.textoBotaoModal}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 50,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
  },
  topo: {
    gap: 10,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'left',
    color: 'black',
  },
  containerInputs: {
    marginBottom: 20,
  },
  rotulo: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: Platform.OS === 'android' ? 5 : 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  itemPicker: {
    color: '#1E40AF',
    fontSize: 16,
  },
  placeholder: {
    color: 'gray',
  },
  itemAdicionar: {
    color: '#666',
    fontStyle: 'italic',
  },
  botao: {
    marginTop: 10,
    backgroundColor: "#1E40AF",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 12,
  },
  textoBotao: {
    color: '#ffffff',
    fontSize: 16,
  },
  containerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  conteudoModal: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputModal: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  botoesModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botaoModal: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  botaoCancelar: {
    backgroundColor: '#ccc',
  },
  botaoAdicionar: {
    backgroundColor: '#1E40AF',
  },
  textoBotaoModal: {
    color: 'white',
    fontWeight: 'bold',
  },
});