-- =============================================
-- ShopFácil - Base de datos inicial
-- =============================================

CREATE DATABASE IF NOT EXISTS shopfacil;
USE shopfacil;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  correo       VARCHAR(100) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  rol          ENUM('comprador', 'vendedor', 'admin') DEFAULT 'comprador',
  activo       BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(150) NOT NULL,
  descripcion    TEXT,
  precio        DECIMAL(10,2) NOT NULL,
  stock         INT NOT NULL,
  imagen        VARCHAR(255),
  categoria     VARCHAR(50) DEFAULT 'otros',
  vendedor_id    INT,
  activo        BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

-- Sprint 3: varias imágenes por producto
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  principal BOOLEAN DEFAULT FALSE,
  orden INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Sprint 3: variantes de producto: talla, color, stock y estado
CREATE TABLE IF NOT EXISTS producto_variantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  talla VARCHAR(30),
  color VARCHAR(60),
  stock INT NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);


-- ================================
-- SPRINT 2: Carrito
-- ================================
CREATE TABLE IF NOT EXISTS carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto_id INT NOT NULL,
  variante_id INT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (variante_id) REFERENCES producto_variantes(id) ON DELETE SET NULL
);

-- ================================
-- SPRINT 2: Pedidos
-- ================================
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE,
  comprador_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('pendiente','en_proceso','enviado','entregado') DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comprador_id) REFERENCES usuarios(id)
);

-- ================================
-- SPRINT 2: Detalle de pedidos
-- ================================
CREATE TABLE IF NOT EXISTS pedido_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  variante_id INT NULL,
  cantidad INT NOT NULL,
  precio_unit DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (variante_id) REFERENCES producto_variantes(id) ON DELETE SET NULL
);

-- Sprint 3: comentarios y estrellas
CREATE TABLE IF NOT EXISTS producto_comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
-- =============================================
-- Datos iniciales de prueba
-- =============================================

INSERT INTO usuarios (nombre, correo, password, rol) VALUES
('Admin ShopFácil', 'admin@shopfacil.com', '$2a$10$7CEec9PS4Q/qqq6DYiCgm.gBNU.jHKhdxinv3gMYNs5HxdM6o/k.q', 'admin'),
('Vendedor Demo', 'vendedor@shopfacil.com', '$2a$10$RiUSW/goNY59Fj3RCIInl.My3KQ3uSUN68AWU5p4LL18MQoTRnjAK', 'vendedor'),
('Comprador Demo', 'comprador@shopfacil.com', '$2a$10$uUKYTZfBR0BVWzAKz4CE.eQl5h0xQUzHaYGDl4nOv1dRN5kzerxtu', 'comprador')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), rol = VALUES(rol);
-- admin123, vend123, comp123
INSERT INTO productos (nombre, descripcion, precio, stock, imagen, categoria, vendedor_id, activo) VALUES
('Camisa Azul', 'Camisa de algodón talla M', 25.00, 10,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 'ropa', 2, true),
('Pantalon Negro', 'Pantalón slim fit talla 32', 45.00, 8,'https://images.unsplash.com/photo-1473966968600-fa801b869a1a', 'ropa',2, true),
('Zapatos Blancos', 'Zapatillas deportivas talla 40', 60.00, 5,'https://images.unsplash.com/photo-1542291026-7eec264c27ff', 'calzado', 2, true),
('Gorra Negra', 'Gorra deportiva ajustable', 15.00, 20, 'https://images.unsplash.com/photo-1521369909029-2afed882baee', 'accesorios', 2, true),
('Bolso Cafe', 'Bolso de cuero genuino', 80.00, 6, 'https://http2.mlstatic.com/D_Q_NP_838109-MLU74571701321_022024-O.webp', 'accesorios', 2, true);


INSERT INTO producto_imagenes (producto_id, url, principal) VALUES
(1,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', true),
(1,'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800', false),
(2,'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', true),
(3,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', true),
(4,'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800', true),
(5,'https://http2.mlstatic.com/D_Q_NP_838109-MLU74571701321_022024-O.webp', true);

INSERT INTO producto_variantes (producto_id, talla, color, stock, activo) VALUES
(1,'S','Azul',3,true),(1,'M','Azul',4,true),(1,'L','Azul',3,true),
(2,'30','Negro',2,true),(2,'32','Negro',4,true),(2,'34','Negro',2,true),
(3,'39','Blanco',2,true),(3,'40','Blanco',2,true),(3,'41','Blanco',1,true),
(4,'Única','Negro',20,true),(5,'Única','Café',6,true);

