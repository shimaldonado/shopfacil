const express = require('express');
const cors = require('cors');
require('dotenv').config();


const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const carritoRoutes = require('./routes/carrito');
const pedidosRoutes = require('./routes/pedidos');
const adminRoutes = require('./routes/admin');
const ensureSprint3Schema = require('./utils/ensureSchema');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'ShopFácil API corriendo ✅' });
});

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await ensureSprint3Schema();
  } catch (error) {
    console.error('No se pudo verificar el esquema de la base de datos:', error);
  }

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

iniciarServidor();