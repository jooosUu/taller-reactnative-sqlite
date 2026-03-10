import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  initDb,
  getEstudiantes,
  addEstudiante,
  updateEstudiante,
  deleteEstudiante,
  getProgramas,
} from '../../src/db';

import { Picker } from '@react-native-picker/picker';

export default function EstudiantesScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Estudiantes Form
  const [estCod, setEstCod] = useState('');
  const [estNombre, setEstNombre] = useState('');
  const [estEmail, setEstEmail] = useState('');
  const [estProgCod, setEstProgCod] = useState('');
  const [editingEst, setEditingEst] = useState(false);

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
      const ests = await getEstudiantes();
      setEstudiantes(ests);
      filterList(searchQuery, ests);
      
      // Select first program by default if available and not set
      if (progs.length > 0 && !estProgCod) {
        setEstProgCod(progs[0].cod);
      }
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

  const handleSaveEstudiante = async () => {
    try {
      if (!estCod || !estNombre || !estEmail || (!editingEst && !estProgCod)) {
        Alert.alert('Error', 'Llene todos los campos de estudiante');
        return;
      }
      if (editingEst) {
        // Update ONLY allows modifying name and email
        await updateEstudiante(estCod, estNombre, estEmail);
        Alert.alert('Éxito', 'Estudiante actualizado');
      } else {
        await addEstudiante(estCod, estNombre, estEmail, estProgCod);
        Alert.alert('Éxito', 'Estudiante guardado');
      }
      clearEstForm();
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEditEst = (est) => {
    setEstCod(est.cod);
    setEstNombre(est.nombre);
    setEstEmail(est.email);
    setEstProgCod(est.Programa_cod);
    setEditingEst(true);
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
    setEstProgCod('');
    setEditingEst(false);
  };

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listTextContainer}>
        <Text style={styles.listTitle}>{item.nombre}</Text>
        <Text style={styles.listSub}>Cód: {item.cod} | Prog: {item.Programa_cod}</Text>
        <Text style={styles.listSub}>{item.email}</Text>
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleEditEst(item)} style={styles.actionBtn}>
          <Text style={styles.editBtnText}>✏️ Modificar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteEst(item.cod)} style={styles.actionBtn}>
          <Text style={styles.deleteBtnText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Gestión de Estudiantes</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{editingEst ? 'Modificar Estudiante' : 'Crear Estudiante'}</Text>
          <TextInput
            style={[styles.input, editingEst && styles.disabledInput]}
            placeholder="Código (Max 4 chars)"
            value={estCod}
            onChangeText={setEstCod}
            editable={!editingEst} // Update ONLY allows modifying name and email
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
          {!editingEst && (
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Programa:</Text>
              <Picker
                selectedValue={estProgCod}
                onValueChange={(itemValue) => setEstProgCod(itemValue)}
                style={styles.picker}
              >
                {programas.map(p => (
                   <Picker.Item key={p.cod} label={`${p.nombre} (${p.cod})`} value={p.cod} />
                ))}
              </Picker>
            </View>
          )}
          <View style={styles.formRow}>
            <Button title={editingEst ? "Guardar Cambios" : "Crear"} onPress={handleSaveEstudiante} disabled={!estCod || !estNombre || !estEmail} />
            {editingEst && <Button title="Cancelar" color="red" onPress={clearEstForm} />}
          </View>
        </View>

        <TextInput
          style={styles.searchBar}
          placeholder="🔍 Buscar por código o nombre..."
          value={searchQuery}
          onChangeText={handleSearch}
        />

        <FlatList
          data={filteredEstudiantes}
          keyExtractor={(item) => item.cod}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay estudiantes registrados</Text>}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, flex: 1, marginTop: 40 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  disabledInput: { backgroundColor: '#f0f0f0', color: '#999' },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  formRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  listContainer: { paddingBottom: 20 },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'column',
    elevation: 1,
  },
  listTextContainer: { marginBottom: 12 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  listSub: { fontSize: 14, color: '#666', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  actionBtn: { padding: 8, borderRadius: 6, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee' },
  editBtnText: { color: '#0066cc', fontWeight: '500' },
  deleteBtnText: { color: '#cc0000', fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 16 },
});
