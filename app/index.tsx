import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
// Import vector icons instead of using emojis
import { Ionicons } from '@expo/vector-icons';
import {
  initDb,
  getProgramas,
  addPrograma,
  updatePrograma,
  deletePrograma,
} from '../src/db';

export default function ProgramasScreen() {
  const router = useRouter();

  // ==========================================
  // ESTADOS GLOBALES Y BÚSQUEDA
  // ==========================================
  const [dbReady, setDbReady] = useState(false);
  const [programas, setProgramas] = useState<any[]>([]);
  const [filteredProgramas, setFilteredProgramas] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ==========================================
  // ESTADOS DEL FORMULARIO (MODAL)
  // ==========================================
  const [modalVisible, setModalVisible] = useState(false);
  const [progCod, setProgCod] = useState('');
  const [progNombre, setProgNombre] = useState('');
  const [editingProg, setEditingProg] = useState(false);

  // ==========================================
  // EFECTOS Y CARGA INICIAL
  // ==========================================
  useEffect(() => {
    setupDb();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (dbReady) loadData();
    }, [dbReady])
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
      const progs = await getProgramas();
      setProgramas(progs);
      filterList(searchQuery, progs);
    } catch (e) {
      console.log(e);
    }
  };

  const filterList = (query: string, currentData = programas) => {
    if (!query) {
      setFilteredProgramas(currentData);
    } else {
      const lowerQ = query.toLowerCase();
      const filtered = currentData.filter(
        p => p.cod.toLowerCase().includes(lowerQ) || p.nombre.toLowerCase().includes(lowerQ)
      );
      setFilteredProgramas(filtered);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterList(text);
  };

  // ==========================================
  // CONTROLADORES CRUD (CREAR, EDITAR, BORRAR)
  // ==========================================
  const handleSavePrograma = async () => {
    try {
      if (!progCod || !progNombre) {
        Alert.alert('Error', 'Llene todos los campos de programa');
        return;
      }
      if (editingProg) {
        await updatePrograma(progCod, progNombre);
        Alert.alert('Éxito', 'Programa actualizado');
      } else {
        await addPrograma(progCod, progNombre);
        Alert.alert('Éxito', 'Programa guardado');
      }
      clearProgForm();
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const openCreateModal = () => {
    clearProgForm();
    setModalVisible(true);
  };

  const handleEditProg = (prog) => {
    setProgCod(prog.cod);
    setProgNombre(prog.nombre);
    setEditingProg(true);
    setModalVisible(true);
  };

  const handleDeleteProg = async (cod) => {
    try {
      await deletePrograma(cod);
      Alert.alert('Éxito', 'Programa eliminado');
      loadData();
    } catch (e: any) {
      if (e.message.includes('No se puede eliminar el programa porque tiene estudiantes asociados')) {
         Alert.alert('Error', 'No se puede eliminar un programa con estudiantes inscritos');
      } else {
         Alert.alert('Error', e.message);
      }
    }
  };

  const clearProgForm = () => {
    setProgCod('');
    setProgNombre('');
    setEditingProg(false);
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
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.listItem} 
      // Al tocar un programa, navega hacia la pantalla de sus estudiantes pasándole el código
      onPress={() => router.push(`/estudiantes/${item.cod}`)}
    >
      <View style={styles.listTextContainer}>
        {/* Título negro del programa */}
        <Text style={styles.listTitle}>{item.nombre}</Text>
        {/* Texto gris pequeño con el id */}
        <Text style={styles.listSub}>Cód: {item.cod}</Text>
      </View>
      <View style={styles.row}>
        {/* Botón azul de Editar */}
        <TouchableOpacity onPress={() => handleEditProg(item)} style={styles.actionBtn}>
          <Ionicons name="pencil" size={20} color="#0066cc" />
        </TouchableOpacity>
        {/* Botón rojo de Borrar */}
        <TouchableOpacity onPress={() => handleDeleteProg(item.cod)} style={styles.actionBtn}>
          <Ionicons name="trash" size={20} color="#cc0000" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra superior de navegación nativa color blanco */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Programas de Estudio</Text>
        {/* Botón flotante derecho circular '+' */}
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add-circle" size={36} color="#0066cc" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Input con bordes redondeados */}
        <TextInput
          style={styles.searchBar}
          placeholder="Buscar por código o nombre..."
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {/* Componente nativo de lista de alto rendimiento */}
        <FlatList
          data={filteredProgramas}
          keyExtractor={(item) => item.cod}
          renderItem={renderItem}
          // Mensaje de lista vacía centralizado
          ListEmptyComponent={<Text style={styles.emptyText}>No hay programas registrados</Text>}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Modal Formulario superpuesto con fondo oscuro */}
      <Modal
        animationType="slide" // Animación de entrada de abajo hacia arriba
        transparent={true} // Obliga a que podamos ver el fondo oscuro translúcido
        visible={modalVisible}
        onRequestClose={clearProgForm}
      >
        <View style={styles.modalOverlay}>
          {/* Caja Blanca Principal del Formulario */}
          <View style={styles.modalContent}>
            {/* Título negro centrado */}
            <Text style={styles.modalTitle}>{editingProg ? 'Modificar Programa' : 'Crear Programa'}</Text>
            
            {/* Input para el Código */}
            <TextInput
              style={[styles.input, editingProg && styles.disabledInput]}
              placeholder="Código (Max 4 chars)"
              value={progCod}
              onChangeText={setProgCod}
              editable={!editingProg} 
              maxLength={4}
            />
            {/* Input para el Nombre */}
            <TextInput
              style={styles.input}
              placeholder="Nombre (Max 30 chars)"
              value={progNombre}
              onChangeText={setProgNombre}
              maxLength={30}
            />
            
            <View style={styles.formRow}>
              {/* Botón de Guardar en Azul */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSavePrograma} disabled={!progCod || !progNombre}>
                <Text style={styles.saveBtnText}>{editingProg ? "Guardar" : "Crear"}</Text>
              </TouchableOpacity>
              {/* Botón de Cancelar en Rojo */}
              <TouchableOpacity style={styles.cancelBtn} onPress={clearProgForm}>
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
  // Centro horizontal y vertical
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Fondo base de toda la app
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  // Barra superior blanca con línea por debajo
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
  header: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  addButton: { padding: 4 },
  content: { padding: 16, flex: 1 },
  // Búsqueda con borde gris
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
  // Tarjetas blancas con sombra leve
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

  // ================== MODAL ==================
  // Fondo oscuro
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
  // Bloqueado (solo vista)
  disabledInput: { backgroundColor: '#e9ecef', color: '#6c757d' },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  // Botones inferiores azules
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
  // Botones inferiores rojos
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
