const express = require('express');
const router = express.Router();
const db = require('../db');
const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// ================================
// HU-09: Confirmar pedido
// ================================
router.post('/confirmar', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;

  try {
    const [items] = await db.query(
      `SELECT 
        c.cantidad,
        c.variante_id,
        p.id AS producto_id,
        p.nombre,
        p.precio,
        p.stock AS stock_producto,
        v.stock AS stock_variante,
        v.activo AS variante_activa,
        v.talla,
        v.color,
        IFNULL(v.stock, p.stock) AS stock
      FROM carrito c
      INNER JOIN productos p ON c.producto_id = p.id
      LEFT JOIN producto_variantes v ON c.variante_id = v.id
      WHERE c.usuario_id = ?`,
      [usuarioId]
    );

    if (items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    for (const item of items) {
      if (item.variante_id && !item.variante_activa) {
        return res.status(400).json({
          error: `La variante seleccionada de ${item.nombre} ya no está disponible`
        });
      }

      if (item.cantidad > item.stock) {
        return res.status(400).json({
          error: `Stock insuficiente para ${item.nombre}`
        });
      }
    }

    const total = items.reduce((sum, item) => {
      return sum + parseFloat(item.precio) * item.cantidad;
    }, 0);

    const [pedidoResult] = await db.query(
      `INSERT INTO pedidos (comprador_id, total) 
       VALUES (?, ?)`,
      [usuarioId, total.toFixed(2)]
    );

    const pedidoId = pedidoResult.insertId;
    const codigo = `ORD-2026-${String(pedidoId).padStart(4, '0')}`;

    await db.query(
      `UPDATE pedidos SET codigo = ? WHERE id = ?`,
      [codigo, pedidoId]
    );

    for (const item of items) {
      await db.query(
        `INSERT INTO pedido_detalle 
         (pedido_id, producto_id, variante_id, cantidad, precio_unit) 
         VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, item.producto_id, item.variante_id || null, item.cantidad, item.precio]
      );

      await db.query(
        `UPDATE productos 
         SET stock = stock - ? 
         WHERE id = ?`,
        [item.cantidad, item.producto_id]
      );

      if (item.variante_id) {
        await db.query(
          `UPDATE producto_variantes
           SET stock = stock - ?
           WHERE id = ?`,
          [item.cantidad, item.variante_id]
        );
      }
    }

    await db.query(
      `DELETE FROM carrito 
       WHERE usuario_id = ?`,
      [usuarioId]
    );

    res.status(201).json({
      message: 'Pedido confirmado exitosamente',
      pedido_id: pedidoId,
      codigo,
      total: total.toFixed(2),
      productos: items.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        talla: item.talla,
        color: item.color
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar pedido' });
  }
});

// ================================
// HU-04 / apoyo Sprint 2: Mis pedidos comprador
// ================================
router.get('/mis-pedidos', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;

  try {
    const [pedidos] = await db.query(
      `SELECT 
        p.id,
        p.codigo,
        p.total,
        p.estado,
        p.created_at,
        GROUP_CONCAT(
          CONCAT(
            pr.nombre,
            CASE
              WHEN v.id IS NOT NULL THEN CONCAT(
                ' - ',
                COALESCE(v.color, 'Sin color'),
                ' / ',
                COALESCE(v.talla, 'Sin talla')
              )
              ELSE ''
            END,
            ' x', pd.cantidad
          )
          SEPARATOR ', '
        ) AS productos
      FROM pedidos p
      INNER JOIN pedido_detalle pd ON p.id = pd.pedido_id
      INNER JOIN productos pr ON pd.producto_id = pr.id
      LEFT JOIN producto_variantes v ON pd.variante_id = v.id
      WHERE p.comprador_id = ?
      GROUP BY p.id, p.codigo, p.total, p.estado, p.created_at
      ORDER BY p.created_at DESC`,
      [usuarioId]
    );

    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// ================================
// HU-10: Ver pedidos para vendedor
// IMPORTANTE: cada vendedor ve únicamente los pedidos que contienen
// productos registrados por él. Si un vendedor nuevo aún no tiene
// productos vendidos, su panel aparecerá vacío.
// ================================
router.get(
  '/todos',
  verificarToken,
  permitirRoles('vendedor'),
  async (req, res) => {
    const vendedorId = req.usuario.id;

    try {
      const [pedidos] = await db.query(
        `SELECT 
          p.id,
          p.codigo,
          SUM(pd.cantidad * pd.precio_unit) AS total,
          p.estado,
          p.created_at,
          u.nombre AS comprador,
          u.correo AS comprador_correo,
          GROUP_CONCAT(
            CONCAT(
              pr.nombre,
              CASE
                WHEN v.id IS NOT NULL THEN CONCAT(
                  ' - ',
                  COALESCE(v.color, 'Sin color'),
                  ' / ',
                  COALESCE(v.talla, 'Sin talla')
                )
                ELSE ''
              END,
              ' x', pd.cantidad
            )
            SEPARATOR ', '
          ) AS productos
        FROM pedidos p
        INNER JOIN usuarios u ON p.comprador_id = u.id
        INNER JOIN pedido_detalle pd ON p.id = pd.pedido_id
        INNER JOIN productos pr ON pd.producto_id = pr.id
        LEFT JOIN producto_variantes v ON pd.variante_id = v.id
        WHERE pr.vendedor_id = ?
        GROUP BY p.id, p.codigo, p.estado, p.created_at, u.nombre, u.correo
        ORDER BY p.created_at DESC`,
        [vendedorId]
      );

      res.json(pedidos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener pedidos del vendedor' });
    }
  }
);

// ================================
// HU-11: Actualizar estado con flujo lógico
// IMPORTANTE: el vendedor solo puede actualizar pedidos que contienen
// productos registrados por él.
// ================================
router.put(
  '/estado/:id',
  verificarToken,
  permitirRoles('vendedor'),
  async (req, res) => {
    const vendedorId = req.usuario.id;
    const pedidoId = req.params.id;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'en_proceso', 'enviado', 'entregado'];
    const flujo = {
      pendiente: 'en_proceso',
      en_proceso: 'enviado',
      enviado: 'entregado'
    };

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    try {
      const [actual] = await db.query(
        `SELECT DISTINCT p.id, p.estado
         FROM pedidos p
         INNER JOIN pedido_detalle pd ON p.id = pd.pedido_id
         INNER JOIN productos pr ON pd.producto_id = pr.id
         WHERE p.id = ? AND pr.vendedor_id = ?
         LIMIT 1`,
        [pedidoId, vendedorId]
      );

      if (actual.length === 0) {
        return res.status(404).json({
          error: 'Pedido no encontrado para este vendedor'
        });
      }

      const estadoActual = actual[0].estado;
      const siguienteEstado = flujo[estadoActual];

      if (siguienteEstado !== estado) {
        return res.status(400).json({
          error: `El siguiente estado válido es: ${siguienteEstado || 'ninguno, el pedido ya fue entregado'}`
        });
      }

      await db.query(
        `UPDATE pedidos 
         SET estado = ? 
         WHERE id = ?`,
        [estado, pedidoId]
      );

      res.json({
        message: 'Estado actualizado correctamente',
        estado
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
);

module.exports = router;