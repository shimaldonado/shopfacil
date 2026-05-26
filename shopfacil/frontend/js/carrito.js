// //const API = 'http://localhost:3000/api';
// const API_CARRITO = 'http://localhost:3000/api';
// const IVA_ECUADOR = 0.15;
// window.onload = function () {
//   const usuario = JSON.parse(localStorage.getItem('usuario'));
//   const token = localStorage.getItem('token');

//   if (!usuario || !token) {
//     alert('Debes iniciar sesión para ver el carrito');
//     window.location.href = 'login.html';
//     return;
//   }

//   cargarCarrito();
// };

// // ================================
// // HU-07 / HU-08: Cargar carrito
// // ================================
// async function cargarCarrito() {
//   const token = localStorage.getItem('token');

//   try {
//     const res = await fetch(`${API_CARRITO}/carrito`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });

//     const data = await res.json();
//     const div = document.getElementById('contenido-carrito');

//     if (!res.ok) {
//       div.innerHTML = `<p>${data.error || 'Error al cargar carrito'}</p>`;
//       return;
//     }

//     if (data.items.length === 0) {
//       div.innerHTML = `
//         <div class="vacio">
//           <p style="font-size:48px;">🛒</p>
//           <h3>Tu carrito está vacío</h3>
//           <p>Agrega productos desde el catálogo.</p>
//           <a href="index.html" class="btn" style="display:inline-block;width:auto;padding:10px 24px;text-decoration:none;">
//             Ver catálogo
//           </a>
//         </div>
//       `;
//       return;
//     }

//     div.innerHTML = `
//       <table class="carrito-tabla">
//         <thead>
//           <tr>
//             <th>Producto</th>
//             <th>Precio unit.</th>
//             <th>Cantidad</th>
//             <th>Subtotal</th>
//             <th>Acción</th>
//           </tr>
//         </thead>

//         <tbody>
//           ${data.items.map(item => `
//             <tr>
//               <td>
//                 <b>${item.nombre}</b>
//                 <br>
//                 <small>${item.descripcion || ''}</small>
//                 ${item.talla || item.color ? `<br><small>Variante: ${item.color || ''} ${item.talla || ''}</small>` : ''}
//               </td>

//               <td>$${parseFloat(item.precio).toFixed(2)}</td>

//               <td>
//                 <input 
//                   type="number"
//                   class="cantidad-input"
//                   min="1"
//                   max="${item.stock}"
//                   value="${item.cantidad}"
//                   onchange="actualizarCantidad(${item.id}, this.value)"
//                 >
//                 <br>
//                 <small>Stock: ${item.stock}</small>
//               </td>

//               <td>
//                 <b>$${parseFloat(item.subtotal).toFixed(2)}</b>
//               </td>

//               <td>
//                 <button class="btn-eliminar" onclick="eliminarItem(${item.id})">
//                   Eliminar
//                 </button>
//               </td>
//             </tr>
//           `).join('')}
//         </tbody>
//       </table>

//       <div class="total-box">
//         <div>
//           <div style="font-size:13px;color:#777;">Total a pagar</div>
//           <div class="total-monto">$${data.total}</div>
//         </div>

//         <button class="btn-confirmar" onclick="confirmarPedido()">
//           Confirmar pedido ✓
//         </button>
//       </div>
//     `;
//   } catch (error) {
//     document.getElementById('contenido-carrito').innerHTML =
//       '<p>Error al conectar con el servidor.</p>';
//   }
// }

// // ================================
// // HU-08: Actualizar cantidad
// // ================================
// async function actualizarCantidad(itemId, cantidad) {
//   const token = localStorage.getItem('token');

//   try {
//     const res = await fetch(`${API_CARRITO}/carrito/${itemId}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       body: JSON.stringify({
//         cantidad: parseInt(cantidad)
//       })
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       alert(data.error || 'No se pudo actualizar la cantidad');
//     }

//     cargarCarrito();
//   } catch (error) {
//     alert('Error al actualizar cantidad');
//   }
// }

// // ================================
// // HU-07: Eliminar item
// // ================================
// async function eliminarItem(itemId) {
//   const token = localStorage.getItem('token');

//   try {
//     await fetch(`${API_CARRITO}/carrito/${itemId}`, {
//       method: 'DELETE',
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });

//     cargarCarrito();
//   } catch (error) {
//     alert('Error al eliminar producto');
//   }
// }

// // ================================
// // HU-09: Confirmar pedido
// // ================================
// async function confirmarPedido() {
//   const token = localStorage.getItem('token');

//   try {
//     const res = await fetch(`${API_CARRITO}/pedidos/confirmar`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });

//     const data = await res.json();

//     if (res.ok) {
//       document.getElementById('contenido-carrito').innerHTML = `
//         <div class="vacio">
//           <p style="font-size:52px;">✅</p>
//           <h3>¡Pedido confirmado!</h3>
//           <p>Número de pedido:</p>
//           <h2>${data.codigo}</h2>
//           <p>Total: <b>$${data.total}</b></p>

//           <a href="pedidos.html" class="btn" style="display:inline-block;width:auto;padding:10px 24px;text-decoration:none;margin-top:16px;">
//             Ver mis pedidos
//           </a>
//         </div>
//       `;
//     } else {
//       alert(data.error || 'Error al confirmar pedido');
//     }
//   } catch (error) {
//     alert('No se pudo conectar con el servidor');
//   }
// }



const API_CARRITO = 'http://localhost:3000/api';
const IVA_ECUADOR = 0.15;

window.onload = function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const token = localStorage.getItem('token');

  if (!usuario || !token) {
    alert('Debes iniciar sesión para ver el carrito');
    window.location.href = 'login.html';
    return;
  }

  cargarCarrito();
};

// ================================
// HU-07 / HU-08: Cargar carrito
// ================================
async function cargarCarrito() {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_CARRITO}/carrito`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    const div = document.getElementById('contenido-carrito');

    if (!res.ok) {
      div.innerHTML = `<p>${data.error || 'Error al cargar carrito'}</p>`;
      return;
    }

    if (data.items.length === 0) {
      div.innerHTML = `
        <div class="vacio">
          <p style="font-size:48px;">🛒</p>
          <h3>Tu carrito está vacío</h3>
          <p>Agrega productos desde el catálogo.</p>
          <a href="index.html" class="btn" style="display:inline-block;width:auto;padding:10px 24px;text-decoration:none;">
            Ver catálogo
          </a>
        </div>
      `;
      return;
    }

    const totalBruto = parseFloat(data.total);
    const baseImponible = totalBruto / (1 + IVA_ECUADOR);
    const valorIva = totalBruto - baseImponible;

    div.innerHTML = `
      <table class="carrito-tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio unit.</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>
                <b>${item.nombre}</b><br>
                <small>${item.descripcion || ''}</small>
                ${item.talla || item.color ? `<br><small>Variante: ${item.color || ''} ${item.talla || ''}</small>` : ''}
              </td>
              <td>$${parseFloat(item.precio).toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  class="cantidad-input"
                  min="1"
                  max="${item.stock}"
                  value="${item.cantidad}"
                  onchange="actualizarCantidad(${item.id}, this.value)"
                >
                <br><small>Stock: ${item.stock}</small>
              </td>
              <td><b>$${parseFloat(item.subtotal).toFixed(2)}</b></td>
              <td>
                <button class="btn-eliminar" onclick="eliminarItem(${item.id})">
                  Eliminar
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-box" style="flex-direction:column;align-items:stretch;gap:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="font-size:13px;color:#777;margin-bottom:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Resumen de pago</div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <div style="display:flex;justify-content:space-between;gap:60px;font-size:14px;color:#555;">
                <span>Subtotal (sin IVA)</span>
                <span>$${baseImponible.toFixed(2)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:60px;font-size:14px;color:#555;">
                <span>IVA Ecuador (15%)</span>
                <span>$${valorIva.toFixed(2)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:60px;font-size:18px;font-weight:700;color:#1F4E79;border-top:1.5px solid #e0e7f0;margin-top:8px;padding-top:8px;">
                <span>Total a pagar</span>
                <span class="total-monto">$${totalBruto.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button class="btn-confirmar" onclick="confirmarPedido()">
            Confirmar pedido ✓
          </button>
        </div>
      </div>
    `;
  } catch (error) {
    document.getElementById('contenido-carrito').innerHTML =
      '<p>Error al conectar con el servidor.</p>';
  }
}

// ================================
// HU-08: Actualizar cantidad
// ================================
async function actualizarCantidad(itemId, cantidad) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_CARRITO}/carrito/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cantidad: parseInt(cantidad) })
    });

    const data = await res.json();

    if (!res.ok) {
      if (typeof sfToastError === 'function') {
        sfToastError(data.error || 'No se pudo actualizar la cantidad');
      } else {
        alert(data.error || 'No se pudo actualizar la cantidad');
      }
    }

    cargarCarrito();
  } catch (error) {
    if (typeof sfToastError === 'function') {
      sfToastError('Error al actualizar cantidad');
    } else {
      alert('Error al actualizar cantidad');
    }
  }
}

// ================================
// HU-07: Eliminar item
// ================================
async function eliminarItem(itemId) {
  const token = localStorage.getItem('token');

  try {
    await fetch(`${API_CARRITO}/carrito/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    cargarCarrito();
  } catch (error) {
    if (typeof sfToastError === 'function') {
      sfToastError('Error al eliminar producto');
    } else {
      alert('Error al eliminar producto');
    }
  }
}

// ================================
// HU-09: Confirmar pedido + guardar factura
// ================================
async function confirmarPedido() {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  try {
    const res = await fetch(`${API_CARRITO}/pedidos/confirmar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      guardarFactura(data, usuario);

      document.getElementById('contenido-carrito').innerHTML = `
        <div class="vacio" style="padding:50px 20px;">
          <div style="font-size:60px;margin-bottom:12px;">✅</div>
          <h3 style="color:#1F4E79;font-size:24px;margin-bottom:8px;">¡Pedido confirmado!</h3>
          <p style="font-size:16px;color:#555;margin-bottom:4px;">Número de pedido:</p>
          <h2 style="color:#1F4E79;font-size:28px;margin-bottom:12px;">${data.codigo}</h2>

          <div style="background:#f7fafc;border:1px solid #e0e7f0;border-radius:12px;padding:18px 24px;display:inline-block;text-align:left;margin-bottom:22px;">
            <div style="font-size:13px;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em;font-weight:600;">Resumen de pago</div>
            <div style="display:flex;justify-content:space-between;gap:50px;font-size:14px;color:#555;margin-bottom:4px;">
              <span>Subtotal (sin IVA)</span>
              <span>$${(parseFloat(data.total) / (1 + IVA_ECUADOR)).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:50px;font-size:14px;color:#555;margin-bottom:8px;">
              <span>IVA Ecuador (15%)</span>
              <span>$${(parseFloat(data.total) - parseFloat(data.total) / (1 + IVA_ECUADOR)).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:50px;font-size:18px;font-weight:700;color:#1F4E79;border-top:1.5px solid #e0e7f0;padding-top:8px;">
              <span>Total pagado</span>
              <span>$${parseFloat(data.total).toFixed(2)}</span>
            </div>
          </div>

          <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
            <a href="facturas.html" class="btn" style="display:inline-block;width:auto;padding:11px 26px;text-decoration:none;margin-top:0;">
              Ver mi factura
            </a>
            <a href="pedidos.html" class="btn-secundario" style="display:inline-block;width:auto;padding:11px 26px;text-decoration:none;margin-top:0;">
              Ver mis pedidos
            </a>
          </div>
        </div>
      `;
    } else {
      if (typeof sfToastError === 'function') {
        sfToastError(data.error || 'Error al confirmar pedido');
      } else {
        alert(data.error || 'Error al confirmar pedido');
      }
    }
  } catch (error) {
    if (typeof sfToastError === 'function') {
      sfToastError('No se pudo conectar con el servidor');
    } else {
      alert('No se pudo conectar con el servidor');
    }
  }
}

// ================================
// Guardar factura en localStorage
// ================================
function guardarFactura(pedidoData, usuario) {
  try {
    const facturas = JSON.parse(localStorage.getItem('sf_facturas') || '[]');
    const total = parseFloat(pedidoData.total);
    const baseImponible = total / (1 + IVA_ECUADOR);
    const valorIva = total - baseImponible;

    const factura = {
      id: pedidoData.pedido_id,
      codigo: pedidoData.codigo,
      fecha: new Date().toISOString(),
      usuario: usuario ? { nombre: usuario.nombre, correo: usuario.correo } : {},
      productos: pedidoData.productos || [],
      total: total,
      baseImponible: parseFloat(baseImponible.toFixed(2)),
      iva: parseFloat(valorIva.toFixed(2)),
      estado: 'pagada'
    };

    facturas.unshift(factura);
    localStorage.setItem('sf_facturas', JSON.stringify(facturas));
  } catch (e) {
    console.warn('No se pudo guardar la factura en localStorage', e);
  }
}