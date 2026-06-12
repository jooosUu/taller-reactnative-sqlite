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
  // useLocalSearchParams permite capturar el parámetro "[programa]" que viene en la URL.
  // Es decir, si navegamos a `/estudiantes/SIST`, `programa` valdrá "SIST".
  const { programa } = useLocalSearchParams(); 

  // ==========================================
  // ESTADOS GLOBALES Y BÚSQUEDA
  // ==========================================
  const [dbReady, setDbReady] = useState(false);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<any[]>([]);
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
  // Este useEffect se ejecuta una sola vez cuando el componente se monta (o si cambia el programa).
  // Se encarga de preparar la base de datos de SQLite en este entorno y empezar a leerla.
  useEffect(() => {
    setupDb();
  }, [programa]);

  // useFocusEffect es de React Navigation. Hace que cada vez que el usuario entre a esta pantalla, 
  // los datos se vuelvan a cargar. (Útil si los datos cambiaron por detrás mientras no estábamos aquí).
  useFocusEffect(
    React.useCallback(() => {
      if (dbReady) loadData();
    }, [dbReady, programa])
  );

  // Inicializamos la base de datos de forma asincrónica.
  const setupDb = async () => {
    try {
      await initDb();
      setDbReady(true);
      await loadData(); // Inmediatamente después, cargamos la lista de estudiantes
    } catch (e) {
      Alert.alert('Error', 'No se pudo inicializar la base de datos');
    }
  };

  // Trae los estudiantes desde la base de datos SQLite
  const loadData = async () => {
    try {
      const allEsts = await getEstudiantes();
      // Filtrar los resultados para mostrar ÚNICAMENTE a los estudiantes que pertenecen al programa actual.
      // Así mantenemos el drill-down aislado y no mezclamos todos los estudiantes de la universidad.
      const progsEsts = allEsts.filter(e => e.Programa_cod === programa);
      setEstudiantes(progsEsts);
      filterList(searchQuery, progsEsts);
    } catch (e) {
      console.log(e);
    }
  };

  // Función genérica local para filtrar el arreglo de estudiantes mostrados (`filteredEstudiantes`)
  // en base al texto insertado por el usuario (ignorando mayúsculas y minúsculas).
  const filterList = (query: string, currentData = estudiantes) => {
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

  // Se ejecuta cada vez que el usuario teclea en la barra de búsqueda.
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterList(text);
  };

  // ==========================================
  // CONTROLADORES CRUD (CREAR, EDITAR, BORRAR)
  // ==========================================
  
  // Lógica principal para guardar el formulario del modal. Funciona tanto para CREAR como para ACTUALIZAR.
  const handleSaveEstudiante = async () => {
    try {
      if (!estCod || !estNombre || !estEmail) {
        Alert.alert('Error', 'Llene todos los campos de estudiante');
        return;
      }
      if (editingEst) {
        // En modo actualización, el código primario del estudiante jamás se cambia.
        await updateEstudiante(estCod, estNombre, estEmail);
        Alert.alert('Éxito', 'Estudiante actualizado');
      } else {
        // En modo creación, usamos mágicamente la variable "programa" que está en los parámetros 
        // para enlazar silenciosa y automáticamente a este nuevo estudiante a su programa actual.
        // Así el usuario no tiene que seleccionarlo manualmente desde un menú despegable o picker.
        await addEstudiante(estCod, estNombre, estEmail, programa as string);
        Alert.alert('Éxito', 'Estudiante guardado');
      }
      // Se limpia el formulario y vuelve a recargar la pantalla
      clearEstForm();
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // Limpia el formulario y lo prepara para insertar información fresca  
  const openCreateModal = () => {
    clearEstForm();
    setModalVisible(true);
  };

  // Rellena el formulario con los datos vivos del Estudiante seleccionado.
  const handleEditEst = (est: any) => {
    setEstCod(est.cod);
    setEstNombre(est.nombre);
    setEstEmail(est.email);
    setEditingEst(true);
    setModalVisible(true);
  };

  // Ordena a SQLite aplicar un DELETE usando el código y refresca la lista de la pantalla.
  const handleDeleteEst = async (cod: string) => {
    try {
      await deleteEstudiante(cod);
      Alert.alert('Éxito', 'Estudiante eliminado');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // Función utilitaria general que resetea todos los estados a su variable original y cierra la ventana Modal.
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
  
  // Elemento individual (carta) que se renderiza por cada registro que halla devuelto SQLite.
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={styles.listTextContainer}>
        {/* Título en negrita principal (Nombre) */}
        <Text style={styles.listTitle}>{item.nombre}</Text>
        {/* Subtítulos secundarios en gris (Código e Email) */}
        <Text style={styles.listSub}>Cód: {item.cod}</Text>
        <Text style={styles.listSub}>{item.email}</Text>
      </View>
      <View style={styles.row}>
        {/* Botón azul con ícono de lápiz para Editar */}
        <TouchableOpacity onPress={() => handleEditEst(item)} style={styles.actionBtn}>
           <Ionicons name="pencil" size={20} color="#0066cc" />
        </TouchableOpacity>
        {/* Botón rojo con ícono de tacho para Borrar */}
        <TouchableOpacity onPress={() => handleDeleteEst(item.cod)} style={styles.actionBtn}>
           <Ionicons name="trash" size={20} color="#cc0000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera superior blanca */}
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Botón de retroceso de React Navigation para volver a la pantalla de Programas */}
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          {/* Título dinámico que muestra en qué programa estamos */}
          <Text style={styles.header}>Estudiantes - {programa}</Text>
        </View>
        {/* Botón "+" de la esquina para abrir el modal de crear estudiante */}
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="person-add" size={28} color="#0066cc" />
        </TouchableOpacity>
      </View>

      {/* Contenedor principal de la lista */}
      <View style={styles.content}>
        {/* Barra de búsqueda de texto superior */}
        <TextInput
          style={styles.searchBar}
          placeholder="Buscar por código o nombre..."
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {/* Componente nativo de lista de alto rendimiento */}
        <FlatList
          data={filteredEstudiantes}
          keyExtractor={(item) => item.cod}
          renderItem={renderItem}
          // Mensaje centrado por si la lista está vacía
          ListEmptyComponent={<Text style={styles.emptyText}>No hay estudiantes en este programa</Text>}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Modal Formulario superpuesto con fondo oscuro */}
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
              // El operador [] permite inyectar estilos de forma condicional, 
              // en este caso el color de fondo gris claro para hacer entender que NO es editable.
              style={[styles.input, editingEst && styles.disabledInput]}
              placeholder="Código (Max 4 chars)"
              value={estCod}
              onChangeText={setEstCod}
              // Estrictamente prohíbe tocar el código en modo edición
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
            
            {/* Programm_cod ya está sobreentendido, oculto en la vista y manejado bajo 
                el capó en base al parámetro de la ruta automáticamente :) */}
            
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
  // Utilidad general para centrar (ej. la rueda de carga)
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Fondo de toda la pantalla en gris muy clarito mate
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  
  // Header principal blanco con una pequeña línea gris por debajo
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
  // Tamaño y color de la fuente del título de arriba
  header: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addButton: { padding: 4 },
  content: { padding: 16, flex: 1 },
  
  // Diseño de Input redondeado para la barra superior
  searchBar: {
    borderWidth: 1,
    borderColor: '#ddd', // Borde gris claro
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff', // Fondo enteramente blanco
    fontSize: 16,
  },
  listContainer: { paddingBottom: 20 },
  
  // Diseño de "carta blanca" (Card) individual para cada estudiante en la lista
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2, // Le da la sombra en teléfonos Android
    shadowColor: '#000', // Sombra en iPhone
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  listTextContainer: { flex: 1 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  listSub: { fontSize: 14, color: '#666', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 }, // Separa el botón de lápiz y basura
  // Color de fondo 'celeste agua' para los círculos de acción
  actionBtn: { padding: 8, borderRadius: 6, backgroundColor: '#f0f8ff' }, 
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 16 },

  // ==================== MODAL ====================
  // Fondo oscuro transparente gigante que tapa la app atrás
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Caja de alerta central blanca del formulario
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
  // Inputs de adentro del popup
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  // Variables condicionales para cuando el input NO se pueda editar
  disabledInput: { backgroundColor: '#e9ecef', color: '#6c757d' },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  
  // Diseño genérico Botón Guardar azul marino
  saveBtn: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }, // Texto siempre blanco
  
  // Diseño genérico Botón Cancelar o rojo peligro
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
