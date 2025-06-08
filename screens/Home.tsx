import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { buscarMaterias, buscarTodasMateriasEAssuntos, inserirMateria } from '../database/database';

interface Assunto {
    id: number;
    nome: string;
    progresso: number;
}

interface Materia {
    id: number;
    nome: string;
    assuntos: Assunto[];
}

export default function Home({ navigation }) {
    const [dados, setDados] = useState<Materia[]>([]);
    const [materiaSelecionada, setMateriaSelecionada] = useState<Materia | null>(null);
    const [mostrarModalNovaMateria, setMostrarModalNovaMateria] = useState(false);
      const [novaMateria, setNovaMateria] = useState('');

    const selecionarMateria = (materia: Materia) => {
        setMateriaSelecionada(materia);
    };
    const lidarComAdicionarMateria = async () => {
    if (!novaMateria.trim()) {
      Alert.alert('insira um nome para a matéria');
      return;
    }

    try {
      await inserirMateria(novaMateria);
      const materiasAtualizadas = await buscarTodasMateriasEAssuntos();
      setDados(materiasAtualizadas);
      setMostrarModalNovaMateria(false);
      setNovaMateria('');
    } catch (erro) {
      console.error("Erro ao adicionar matéria:", erro);
      Alert.alert('Erro', 'Não foi possível adicionar a matéria');
    }
  };

    useEffect(() => {
        const carregarDados = async () => {
            setDados(await buscarTodasMateriasEAssuntos());
        };
        carregarDados();
    }, []);

    const renderizarItemMateria = ({ item }: { item: Materia }) => (
        <View style={styles.celulaGrade}>
            <TouchableOpacity
                style={styles.botaoGrade}
                onPress={() => selecionarMateria(item)}
            >
                <Text style={styles.textoBotaoGrade}>{item.nome}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderizarItemAssunto = ({ item }: { item: Assunto }) => {
        const estaCompleto = item.progresso === 100;

        return (
            <View style={styles.celulaUnica}>
                <TouchableOpacity
                    style={[
                        styles.botaoGrade,
                        estaCompleto && styles.botaoGradeCompleto
                    ]}
                    onPress={() => navigation.navigate('Topicos', { assuntoId: item.id })}
                >
                    <Text style={[
                        styles.textoBotaoGrade,
                        estaCompleto && styles.textoBotaoGradeCompleto
                    ]}>
                        {item.nome}
                    </Text>
                    <Text style={[
                        styles.textoProgresso,
                        estaCompleto && styles.textoProgressoCompleto
                    ]}>
                        {Math.round(item.progresso)}% completo
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.titulo}>Matérias:</Text>
                <TouchableOpacity
                    style={styles.botaoAdicionar}
                    onPress={() => setMostrarModalNovaMateria(true)}
                >
                    <Text style={styles.textoBotaoAdicionar}>+ nova pasta</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.containerBorda}>
                <FlatList
                    data={dados}
                    renderItem={renderizarItemMateria}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.linhaGrade}
                    contentContainerStyle={styles.gradeContainer}
                />
            </View>

            <View style={styles.containerBorda}>
                {materiaSelecionada ? (
                    <FlatList
                        data={materiaSelecionada.assuntos}
                        renderItem={renderizarItemAssunto}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.gradeColunaUnica}
                    />
                ) : (
                    <Text style={styles.textoPlaceholder}>Selecione uma matéria para ver seus roadmaps</Text>
                )}
            </View>

            <TouchableOpacity style={styles.botaoWrapper} onPress={() => navigation.navigate('Gerador')}>
                <Text style={styles.textoBotao}>Gerar Novo Roadmap</Text>
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
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 50,
        paddingHorizontal: 30,
        gap: 20,
        backgroundColor: '#F9FAFB',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titulo: {
        fontSize: 22,
        fontWeight: '500',
        textAlign: 'left',
        color: 'black',
    },
    botaoAdicionar: {
        backgroundColor: '#4F46E5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    textoBotaoAdicionar: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    containerBorda: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 15,
        backgroundColor: 'white',
        minHeight: 300,
    },
    gradeContainer: {
        flexGrow: 1,
    },
    gradeColunaUnica: {
        flexGrow: 1,
    },
    botaoWrapper: {
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
    linhaGrade: {
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 10,
    },
    celulaGrade: {
        flex: 1,
        height: 80,
        maxWidth: '48%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 6,
    },
    celulaUnica: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 6,
        marginBottom: 10,
    },
    botaoGrade: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#4F46E5',
        borderRadius: 6,
        padding: 10,
    },
    botaoGradeCompleto: {
        borderColor: '#10B981',
    },
    textoBotaoGrade: {
        color: '#4F46E5',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    textoBotaoGradeCompleto: {
        color: '#10B981',
    },
    textoProgresso: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 4,
    },
    textoProgressoCompleto: {
        color: '#10B981',
        fontWeight: '500',
    },
    textoPlaceholder: {
        color: '#6B7280',
        textAlign: 'center',
        paddingVertical: 20,
    },containerModal: {
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
  textoBotaoModal: {
    color: 'white',
    fontWeight: 'bold',
  },
});