import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, Alert, TouchableOpacity, Modal } from 'react-native';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';

// Constantes para o seletor de data
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const ANOS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

export default function App() {
  const [tarefas, setTarefas] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [titulo, setTitulo] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [calendarioVisivel, setCalendarioVisivel] = useState(false);
  const [seletorDataVisivel, setSeletorDataVisivel] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  // READ: Lê as tarefas e marca as datas no calendário
  useEffect(() => {
    const tarefasCollection = collection(db, 'tarefas');
    const unsubscribe = onSnapshot(tarefasCollection, (querySnapshot) => {
      const listaTarefas = [];
      const marked = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        listaTarefas.push({ id: doc.id, ...data });

        // Marca a data no calendário se houver uma tarefa
        if (data.data) {
          marked[data.data] = { marked: true, dotColor: 'blue' };
        }
      });
      setTarefas(listaTarefas);
      setMarkedDates(marked);
    });
    return () => unsubscribe();
  }, []);

  // Limpa o formulário e o estado de edição
  const limparFormulario = () => {
    setTitulo('');
    setDataSelecionada(null);
    setEditingId(null);
  };

  // CRUD Functions
  const adicionarTarefa = async () => {
    if (titulo.trim() === '' || !dataSelecionada) {
      Alert.alert('Erro', 'Por favor, preencha o título e selecione uma data.');
      return;
    }
    
    try {
        if (editingId) {
            // Lógica para ATUALIZAR
            const tarefaDoc = doc(db, 'tarefas', editingId);
            await updateDoc(tarefaDoc, { titulo, data: dataSelecionada });
        } else {
            // Lógica para ADICIONAR NOVO
            await addDoc(collection(db, 'tarefas'), {
                titulo: titulo,
                data: dataSelecionada,
                completa: false,
                criadoEm: new Date().toISOString(),
            });
        }
    } catch (e) {
        console.error("Erro ao salvar tarefa: ", e);
        Alert.alert('Erro', 'Não foi possível salvar a tarefa.');
    } finally {
        limparFormulario(); // Garante a limpeza em qualquer situação
    }
  };

  const deletarTarefa = async (id) => {
    try {
      const tarefaDoc = doc(db, 'tarefas', id);
      await deleteDoc(tarefaDoc);
    } catch (e) {
      console.error("Erro ao deletar tarefa: ", e);
      Alert.alert('Erro', 'Não foi possível deletar a tarefa.');
    } finally {
      limparFormulario(); // Garante a limpeza em qualquer situação
    }
  };

  const iniciarEdicao = (tarefa) => {
    setTitulo(tarefa.titulo);
    setDataSelecionada(tarefa.data);
    setEditingId(tarefa.id);
  };

  const formatarData = (data) => {
    if (!data) return 'Selecionar Data';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const onDayPress = (day) => {
    setDataSelecionada(day.dateString);
    setCalendarioVisivel(false);
  };

  const renderCustomHeader = (date) => {
    const mesAtual = date.getMonth();
    const anoAtual = date.getFullYear();
    const tituloHeader = `${MESES[mesAtual]} ${anoAtual}`;

    return (
      <TouchableOpacity onPress={() => setSeletorDataVisivel(true)} style={styles.customHeader}>
        <Text style={styles.headerTitulo}>{tituloHeader}</Text>
      </TouchableOpacity>
    );
  };

  const confirmarSelecao = () => {
    const dataString = `${anoSelecionado}-${(mesSelecionado + 1).toString().padStart(2, '0')}-01`;
    setSeletorDataVisivel(false);
    setCalendarioVisivel(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.tarefaItem}>
      <View>
        <Text style={styles.tituloTarefa}>{item.titulo}</Text>
        <Text style={styles.dataTarefa}>Data: {formatarData(item.data)}</Text>
      </View>
      <View style={styles.botoes}>
        <Button title="Editar" onPress={() => iniciarEdicao(item)} color="#FFC107" />
        <Button title="Deletar" onPress={() => deletarTarefa(item.id)} color="#F44336" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Agenda Escolar</Text>

      {/* Formulário de Adição/Edição */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { flex: 0.5, marginRight: 5 }]}
          placeholder="Adicionar tarefa..."
          value={titulo}
          onChangeText={setTitulo}
        />
        <TouchableOpacity style={[styles.input, styles.dataInput]} onPress={() => setCalendarioVisivel(true)}>
          <Text>{formatarData(dataSelecionada)}</Text>
        </TouchableOpacity>
      </View>
      <Button
        title={editingId ? "Atualizar Tarefa" : "Adicionar Tarefa"}
        onPress={adicionarTarefa}
      />

      {/* Calendário Pop-up */}
      <Modal visible={calendarioVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={onDayPress}
              current={dataSelecionada || `${anoSelecionado}-${(mesSelecionado + 1).toString().padStart(2, '0')}-01`}
              markedDates={{
                ...markedDates,
                ...(dataSelecionada ? { [dataSelecionada]: { selected: true, selectedColor: '#00adf5' } } : {})
              }}
              renderHeader={renderCustomHeader}
            />
            <Button title="Fechar Calendário" onPress={() => setCalendarioVisivel(false)} />
          </View>
        </View>
      </Modal>

      {/* Seletor de Mês e Ano */}
      <Modal visible={seletorDataVisivel} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.seletorContainer}>
            <Text style={styles.seletorTitulo}>Selecione o Mês e o Ano</Text>
            <Picker
              selectedValue={mesSelecionado}
              style={{ height: 50, width: '100%' }}
              onValueChange={(itemValue) => setMesSelecionado(itemValue)}
            >
              {MESES.map((mes, index) => (
                <Picker.Item key={index} label={mes} value={index} />
              ))}
            </Picker>
            <Picker
              selectedValue={anoSelecionado}
              style={{ height: 50, width: '100%' }}
              onValueChange={(itemValue) => setAnoSelecionado(itemValue)}
            >
              {ANOS.map((ano) => (
                <Picker.Item key={ano} label={ano.toString()} value={ano} />
              ))}
            </Picker>
            <View style={styles.botoesSeletor}>
              <Button title="Confirmar" onPress={confirmarSelecao} />
              <Button title="Cancelar" onPress={() => setSeletorDataVisivel(false)} color="gray" />
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={tarefas}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.lista}
      />
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  dataInput: {
    flex: 0.5,
    marginLeft: 5,
    justifyContent: 'center',
  },
  lista: {
    width: '100%',
    marginTop: 20,
  },
  tarefaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 5,
    marginBottom: 10,
  },
  tituloTarefa: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataTarefa: {
    fontSize: 14,
    color: '#666',
  },
  botoes: {
    flexDirection: 'row',
    gap: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  seletorContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  seletorTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  botoesSeletor: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  customHeader: {
    alignItems: 'center',
    padding: 10,
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});