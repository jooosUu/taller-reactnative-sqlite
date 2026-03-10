import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Alert, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  initDb,
  getEstudiantes,
  addEstudiante,
  updateEstudiante,
  deleteEstudiante,
} from '../../src/db';

export default function EstudiantesScreen() {
  const router = useRouter();
  
  // ==========================================
  // RECEPCIÓN DE PARÁMETROS DINÁMICOS
  // ==========================================
  const { programa } = useLocalSearchParams(); // Dynamic parameter from route

  // ==========================================
  // ESTADOS GLOBALES Y BÚSQUEDA
  // ==========================================
  const [dbReady, setDbReady] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ==========================================
  // ESTADOS DEL FORMULARIO (MODAL)
  // ==========================================
  const [modalVisible, setModalVisible] = useState(false);
  const [estCod, setEstCod] = useState('');
  const [estNombre, setEstNombre] = useState('');
  const [estEmail, setEstEmail] = useState('');
  const [editingEst, setEditingEst] = useState(false);

  // ==========================================
  // EFECTOS Y CARGA INICIAL
  // ==========================================
  useEffect(() => {
    setupDb();
  }, [programa]);

  useFocusEffect(
    React.useCallback(() => {
      if (dbReady) loadData();
    }, [dbReady, programa])
  );

  const setupDb = async () => {
    try {
      await initDb();
      setDbReady(true);
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'No se pudo inicializar la base de datos');
    }
  };

  const loadData = async () => {
    try {
      const allEsts = await getEstudiantes();
      // Only keep students for the current program
      const progsEsts = allEsts.filter(e => e.Programa_cod === programa);
      setEstudiantes(progsEsts);
      filterList(searchQuery, progsEsts);
    } catch (e) {
      console.log(e);
    }
  };

  const filterList = (query, currentData = estudiantes) => {
    if (!query) {
      setFilteredEstudiantes(currentData);
    } else {
      const lowerQ = query.toLowerCase();
      const filtered = currentData.filter(
        e => e.cod.toLowerCase().includes(lowerQ) || e.nombre.toLowerCase().includes(lowerQ)
      );
      setFilteredEstudiantes(filtered);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterList(text);
  };

  // ==========================================
  // CONTROLADORES CRUD (CREAR, EDITAR, BORRAR)
  // ==========================================
  const handleSaveEstudiante = async () => {
    try {
      if (!estCod || !estNombre || !estEmail) {
        Alert.alert('Error', 'Llene todos los campos de estudiante');
        return;
      }
      if (editingEst) {
        // Update ONLY allows modifying name and email
        await updateEstudiante(estCod, estNombre, estEmail);
        Alert.alert('Éxito', 'Estudiante actualizado');
      } else {
        // Automatically assign the current generic program code passed via parameter hook
        await addEstudiante(estCod, estNombre, estEmail, programa);
        Alert.alert('Éxito', 'Estudiante guardado');
      }
      clearEstForm();
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const openCreateModal = () => {
    clearEstForm();
    setModalVisible(true);
  };

  const handleEditEst = (est) => {
    setEstCod(est.cod);
    setEstNombre(est.nombre);
    setEstEmail(est.email);
    setEditingEst(true);
    setModalVisible(true);
  };

  const handleDeleteEst = async (cod) => {
    try {
      await deleteEstudiante(cod);
      Alert.alert('Éxito', 'Estudiante eliminado');
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const clearEstForm = () => {
    setEstCod('');
    setEstNombre('');
    setEstEmail('');
    setEditingEst(false);
    setModalVisible(false);
  };

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // ==========================================
  // COMPONENTES DE RENDERIZADO
  // ==========================================
  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listTextContainer}>
        <Text style={styles.listTitle}>{item.nombre}</Text>
        <Text style={styles.listSub}>Cód: {item.cod}</Text>
        <Text style={styles.listSub}>{item.email}</Text>
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleEditEst(item)} style={styles.actionBtn}>
           <Ionicons name="pencil" size={20} color="#0066cc" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteEst(item.cod)} style={styles.actionBtn}>
           <Ionicons name="trash" size={20} color="#cc0000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.header}>Estudiantes - {programa}</Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="person-add" size={28} color="#0066cc" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.searchBar}
          placeholder="Buscar por código o nombre..."
          value={searchQuery}
          onChangeText={handleSearch}
        />

        <FlatList
          data={filteredEstudiantes}
          keyExtractor={(item) => item.cod}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay estudiantes en este programa</Text>}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Modal Formulario */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={clearEstForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingEst ? 'Modificar Estudiante' : 'Crear Estudiante'}</Text>
            
            <TextInput
              style={[styles.input, editingEst && styles.disabledInput]}
              placeholder="Código (Max 4 chars)"
              value={estCod}
              onChangeText={setEstCod}
              editable={!editingEst}
              maxLength={4}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre (Max 30 chars)"
              value={estNombre}
              onChangeText={setEstNombre}
              maxLength={30}
            />
            <TextInput
              style={styles.input}
              placeholder="Email (Max 100 chars)"
              value={estEmail}
              onChangeText={setEstEmail}
              keyboardType="email-address"
              maxLength={100}
            />
            {/* Programm_cod is implied and automatically handled under the hood here */}
            
            <View style={styles.formRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEstudiante} disabled={!estCod || !estNombre || !estEmail}>
                <Text style={styles.saveBtnText}>{editingEst ? "Guardar" : "Crear"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={clearEstForm}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addButton: { padding: 4 },
  content: { padding: 16, flex: 1 },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  listContainer: { paddingBottom: 20 },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  listTextContainer: { flex: 1 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  listSub: { fontSize: 14, color: '#666', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8, borderRadius: 6, backgroundColor: '#f0f8ff' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 16 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  disabledInput: { backgroundColor: '#e9ecef', color: '#6c757d' },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  saveBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: {
    backgroundColor: '#cc0000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
