import * as SQLite from 'expo-sqlite';

let db = null;

export const initDb = async () => {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('estudiantes.db');

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Create tables
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Programas (
      cod TEXT PRIMARY KEY CHECK(length(cod) <= 4),
      nombre TEXT CHECK(length(nombre) <= 30)
    );
    CREATE TABLE IF NOT EXISTS Estudiantes (
      cod TEXT PRIMARY KEY CHECK(length(cod) <= 4),
      nombre TEXT CHECK(length(nombre) <= 30),
      email TEXT CHECK(length(email) <= 100),
      Programa_cod TEXT,
      FOREIGN KEY (Programa_cod) REFERENCES Programas(cod) ON DELETE RESTRICT
    );
  `);

    return db;
};

// --- Programas CRUD ---
export const getProgramas = async () => {
    if (!db) await initDb();
    return await db.getAllAsync('SELECT * FROM Programas');
};

export const addPrograma = async (cod, nombre) => {
    if (!db) await initDb();
    if (cod.length > 4) throw new Error("cod must be up to 4 chars");
    await db.runAsync('INSERT INTO Programas (cod, nombre) VALUES (?, ?)', [cod, nombre]);
};

export const updatePrograma = async (cod, nombre) => {
    if (!db) await initDb();
    // RULE: La actualización SOLO permite modificar el nombre.
    await db.runAsync('UPDATE Programas SET nombre = ? WHERE cod = ?', [nombre, cod]);
};

export const deletePrograma = async (cod) => {
    if (!db) await initDb();
    // RULE: La eliminación debe fallar si el programa tiene estudiantes asociados.
    // This is handled automatically by PRAGMA foreign_keys = ON & ON DELETE RESTRICT.
    try {
        await db.runAsync('DELETE FROM Programas WHERE cod = ?', [cod]);
    } catch (error) {
        throw new Error('No se puede eliminar el programa porque tiene estudiantes asociados.');
    }
};

// --- Estudiantes CRUD ---
export const getEstudiantes = async () => {
    if (!db) await initDb();
    return await db.getAllAsync('SELECT * FROM Estudiantes');
};

export const addEstudiante = async (cod, nombre, email, Programa_cod) => {
    if (!db) await initDb();
    if (cod.length > 4) throw new Error("cod must be up to 4 chars");
    await db.runAsync('INSERT INTO Estudiantes (cod, nombre, email, Programa_cod) VALUES (?, ?, ?, ?)', [cod, nombre, email, Programa_cod]);
};

export const updateEstudiante = async (cod, nombre, email) => {
    if (!db) await initDb();
    // RULE: La actualización SOLO permite modificar el nombre y el email. (No permite cambiar cod ni Programa_cod)
    await db.runAsync('UPDATE Estudiantes SET nombre = ?, email = ? WHERE cod = ?', [nombre, email, cod]);
};

export const deleteEstudiante = async (cod) => {
    if (!db) await initDb();
    await db.runAsync('DELETE FROM Estudiantes WHERE cod = ?', [cod]);
};
