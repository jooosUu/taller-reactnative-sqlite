import * as SQLite from 'expo-sqlite';

/**
 * Instancia global de la base de datos de SQLite.
 * Se reutiliza para evitar múltiples conexiones abiertas simultáneamente.
 */
let db = null;

/**
 * Inicializa la conexión a la base de datos `estudiantes.db`.
 * Ejecuta la configuración de Foreign Keys y la creación de las tablas si no existen.
 * 
 * Tabla `Programas`: Relación 1:N con Estudiantes.
 * Tabla `Estudiantes`: Integra un FOREIGN KEY `Programa_cod` apuntando a `Programas`.
 * 
 * @returns {Promise<SQLite.SQLiteDatabase>} Instancia conectada a la base de datos
 */
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

// ==========================================
//           CRUD DE PROGRAMAS
// ==========================================

/**
 * Obtiene todos los programas registrados en la base de datos.
 * @returns {Promise<Array>} Lista de programas
 */
export const getProgramas = async () => {
    if (!db) await initDb();
    return await db.getAllAsync('SELECT * FROM Programas');
};

/**
 * Agrega un nuevo programa a la base de datos.
 * Verifica estrictamente que el código (Primary Key) no supere los 4 caracteres.
 * Intercepta errores de UNIQUE constraint cuando el código ya existe.
 * 
 * @param {string} cod Código único del programa (Máx 4 caracteres)
 * @param {string} nombre Nombre completo del programa
 */
export const addPrograma = async (cod, nombre) => {
    if (!db) await initDb();
    if (cod.length > 4) throw new Error("El código debe tener un máximo de 4 caracteres.");
    try {
        await db.runAsync('INSERT INTO Programas (cod, nombre) VALUES (?, ?)', [cod, nombre]);
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            throw new Error('Ya existe un programa registrado con este código.');
        }
        throw new Error('Error en la base de datos: ' + error.message);
    }
};

/**
 * Actualiza un Programa existente.
 * REGLA ESTRICTA: La actualización SOLO permite modificar el nombre. 
 * El código (cod) funciona como la llave de búsqueda.
 * 
 * @param {string} cod El identificador (Primary Key) del programa a actualizar
 * @param {string} nombre El nuevo nombre para asignarle
 */
export const updatePrograma = async (cod, nombre) => {
    if (!db) await initDb();
    await db.runAsync('UPDATE Programas SET nombre = ? WHERE cod = ?', [nombre, cod]);
};

/**
 * Elimina un Programa mediante su código.
 * REGLA ESTRICTA: La eliminación DEBE FALLAR si el programa tiene estudiantes asociados.
 * Esto es manejado de manera automática e implícita por la base de datos gracias a 
 * PRAGMA foreign_keys = ON y ON DELETE RESTRICT (Ver initDb).
 * 
 * @param {string} cod Código del programa a borrar
 */
export const deletePrograma = async (cod) => {
    if (!db) await initDb();
    try {
        await db.runAsync('DELETE FROM Programas WHERE cod = ?', [cod]);
    } catch (error) {
        throw new Error('No se puede eliminar el programa porque tiene estudiantes asociados.');
    }
};

// ==========================================
//           CRUD DE ESTUDIANTES
// ==========================================

/**
 * Obtiene todos los estudiantes registrados en la base de datos.
 * @returns {Promise<Array>} Lista de estudiantes
 */
export const getEstudiantes = async () => {
    if (!db) await initDb();
    return await db.getAllAsync('SELECT * FROM Estudiantes');
};

/**
 * Registra un nuevo estudiante validando que el código no supere los 4 caracteres.
 * Captura y formatea mensajes amistosos en caso de duplicidad de Primary Keys.
 * 
 * @param {string} cod Código único del estudiante (Máx 4 chars)
 * @param {string} nombre Nombre completo
 * @param {string} email Correo electrónico principal
 * @param {string} Programa_cod Llave Foránea obligatoria que apunta a Programas
 */
export const addEstudiante = async (cod, nombre, email, Programa_cod) => {
    if (!db) await initDb();
    if (cod.length > 4) throw new Error("El código debe tener un máximo de 4 caracteres.");
    try {
        await db.runAsync('INSERT INTO Estudiantes (cod, nombre, email, Programa_cod) VALUES (?, ?, ?, ?)', [cod, nombre, email, Programa_cod]);
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            throw new Error('Ya existe un estudiante registrado con este código.');
        }
        throw new Error('Error en la base de datos: ' + error.message);
    }
};

/**
 * Actualiza un Estudiante existente.
 * REGLA ESTRICTA: La actualización SOLO permite modificar el nombre y el correo.
 * El Código y el Programa están intrínsecamente bloqueados en esta consulta.
 * 
 * @param {string} cod Identificador inmutable del estudiante
 * @param {string} nombre Nuevo nombre a asignar
 * @param {string} email Nuevo correo a asignar
 */
export const updateEstudiante = async (cod, nombre, email) => {
    if (!db) await initDb();
    await db.runAsync('UPDATE Estudiantes SET nombre = ?, email = ? WHERE cod = ?', [nombre, email, cod]);
};

/**
 * Elimina un Estudiante definitivamente buscando por su Primary Key (cod).
 * @param {string} cod Código del Estudiante a ser purgado
 */
export const deleteEstudiante = async (cod) => {
    if (!db) await initDb();
    await db.runAsync('DELETE FROM Estudiantes WHERE cod = ?', [cod]);
};
