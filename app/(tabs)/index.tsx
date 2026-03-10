import React, { useEffect, useState } from 'react';
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  addEstudiante,
  addPrograma,
  deleteEstudiante,
  deletePrograma,
  getEstudiantes,
  getProgramas,
  initDb,
  updateEstudiante,
  updatePrograma,
} from '../../src/db';

export default function HomeScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [programas, setProgramas] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  // Programas Form
  const [progCod, setProgCod] = useState('');
  const [progNombre, setProgNombre] = useState('');
  const [editingProg, setEditingProg] = useState(false);

  // Estudiantes Form
  const [estCod, setEstCod] = useState('');
  const [estNombre, setEstNombre] = useState('');
  const [estEmail, setEstEmail] = useState('');
  const [estProgCod, setEstProgCod] = useState('');
  const [editingEst, setEditingEst] = useState(false);

  useEffect(() => {
    setupDb();
  }, []);

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
      const ests = await getEstudiantes();
      setProgramas(progs);
      setEstudiantes(ests);
    } catch (e) {
      console.log(e);
    }
  };

  // --- Programas Handlers ---
  const handleSavePrograma = async () => {
    try {
      if (!progCod || !progNombre) {
        Alert.alert('Error', 'Llene todos los campos de programa');
        return;
      }
      if (editingProg) {
        // Update ONLY allows modifying name. Cod is used to identify.
        await updatePrograma(progCod, progNombre);
        Alert.alert('Éxito', 'Programa actualizado');
      } else {
        await addPrograma(progCod, progNombre);
        Alert.alert('Éxito', 'Programa guardado');
      }
      clearProgForm();
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEditProg = (prog) => {
    setProgCod(prog.cod);
    setProgNombre(prog.nombre);
    setEditingProg(true);
  };

  const handleDeleteProg = async (cod) => {
    try {
      await deletePrograma(cod);
      Alert.alert('Éxito', 'Programa eliminado');
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const clearProgForm = () => {
    setProgCod('');
    setProgNombre('');
    setEditingProg(false);
  };

  // --- Estudiantes Handlers ---
  const handleSaveEstudiante = async () => {
    try {
      if (!estCod || !estNombre || !estEmail || (!editingEst && !estProgCod)) {
        Alert.alert('Error', 'Llene todos los campos de estudiante');
        return;
      }
      if (editingEst) {
        // Update ONLY allows modifying name and email.
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
        <Text>Cargando Base de Datos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Gestión Universitaria</Text>

        {/* --- PROGRAMAS --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Programas</Text>
          <TextInput
            style={styles.input}
            placeholder="Código (4 chars)"
            value={progCod}
            onChangeText={setProgCod}
            editable={!editingProg} // Update ONLY allows modifying name
            maxLength={4}
          />
          <TextInput
            style={styles.input}
            placeholder="Nombre (Max 30 chars)"
            value={progNombre}
            onChangeText={setProgNombre}
            maxLength={30}
          />
          <View style={styles.row}>
            <Button title={editingProg ? "Actualizar" : "Agregar"} onPress={handleSavePrograma} />
            {editingProg && <Button title="Cancelar" color="gray" onPress={clearProgForm} />}
          </View>

          {programas.map((p) => (
            <View key={p.cod} style={styles.listItem}>
              <View style={styles.listTextContainer}>
                <Text style={styles.listTitle}>{p.nombre} ({p.cod})</Text>
              </View>
              <View style={styles.row}>
                <TouchableOpacity onPress={() => handleEditProg(p)} style={styles.iconBtn}>
                  <Text style={{ color: 'blue' }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteProg(p.cod)} style={styles.iconBtn}>
                  <Text style={{ color: 'red' }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* --- ESTUDIANTES --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estudiantes</Text>
          <TextInput
            style={styles.input}
            placeholder="Código (4 chars)"
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
            <TextInput
              style={styles.input}
              placeholder="Código de Programa (FK)"
              value={estProgCod}
              onChangeText={setEstProgCod}
              maxLength={4}
            />
          )}
          <View style={styles.row}>
            <Button title={editingEst ? "Actualizar" : "Agregar"} onPress={handleSaveEstudiante} />
            {editingEst && <Button title="Cancelar" color="gray" onPress={clearEstForm} />}
          </View>

          {estudiantes.map((e) => (
            <View key={e.cod} style={styles.listItem}>
              <View style={styles.listTextContainer}>
                <Text style={styles.listTitle}>{e.nombre} ({e.cod})</Text>
                <Text style={styles.listSub}>{e.email} - Prog: {e.Programa_cod}</Text>
              </View>
              <View style={styles.row}>
                <TouchableOpacity onPress={() => handleEditEst(e)} style={styles.iconBtn}>
                  <Text style={{ color: 'blue' }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteEst(e.cod)} style={styles.iconBtn}>
                  <Text style={{ color: 'red' }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  listTextContainer: { flex: 1 },
  listTitle: { fontSize: 16, fontWeight: '600' },
  listSub: { fontSize: 14, color: '#666' },
  iconBtn: { padding: 5, marginLeft: 10 },
});
