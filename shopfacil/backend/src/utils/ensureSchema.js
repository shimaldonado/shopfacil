const db = require('../db');

async function tableExists(tableName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );

  return Number(rows[0].total) > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return Number(rows[0].total) > 0;
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const exists = await columnExists(tableName, columnName);

  if (!exists) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    console.log(`Migración aplicada: ${tableName}.${columnName}`);
  }
}

async function ensureSprint3Schema() {
  // HU-21: galería de imágenes por producto.
  await db.query(`
    CREATE TABLE IF NOT EXISTS producto_imagenes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      producto_id INT NOT NULL,
      url VARCHAR(500) NOT NULL,
      principal BOOLEAN DEFAULT FALSE,
      orden INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
    )
  `);

  // HU-18 / HU-19: variantes por talla, color, stock y estado.
  await db.query(`
    CREATE TABLE IF NOT EXISTS producto_variantes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      producto_id INT NOT NULL,
      talla VARCHAR(30),
      color VARCHAR(60),
      stock INT NOT NULL DEFAULT 0,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
    )
  `);

  // HU-20: comentarios y calificación por estrellas.
  await db.query(`
    CREATE TABLE IF NOT EXISTS producto_comentarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      producto_id INT NOT NULL,
      usuario_id INT NOT NULL,
      calificacion INT NOT NULL,
      comentario TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Si la BD ya existía de Sprint 2, estas columnas pueden faltar.
  // Sin esto, al agregar una variante al carrito aparece: "Error al agregar producto al carrito".
  if (await tableExists('carrito')) {
    await addColumnIfMissing('carrito', 'variante_id', 'INT NULL AFTER producto_id');
  }

  if (await tableExists('pedido_detalle')) {
    await addColumnIfMissing('pedido_detalle', 'variante_id', 'INT NULL AFTER producto_id');
  }

  if (await tableExists('usuarios')) {
    await addColumnIfMissing('usuarios', 'activo', 'BOOLEAN DEFAULT TRUE AFTER rol');
  }

  if (await tableExists('productos')) {
    await addColumnIfMissing('productos', 'categoria', "VARCHAR(50) DEFAULT 'otros' AFTER imagen");
    await addColumnIfMissing('productos', 'activo', 'BOOLEAN DEFAULT TRUE AFTER categoria');
    await addColumnIfMissing('productos', 'vendedor_id', 'INT NULL AFTER activo');
  }

  console.log('Esquema Sprint 3 verificado correctamente');
}

module.exports = ensureSprint3Schema;
