//const API = 'http://localhost:3000/api';
const API_CARRITO = 'http://localhost:3000/api';
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
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
                <b>${item.nombre}</b>
                <br>
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
                <br>
                <small>Stock: ${item.stock}</small>
              </td>

              <td>
                <b>$${parseFloat(item.subtotal).toFixed(2)}</b>
              </td>

              <td>
                <button class="btn-eliminar" onclick="eliminarItem(${item.id})">
                  Eliminar
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-box">
        <div>
          <div style="font-size:13px;color:#777;">Total a pagar</div>
          <div class="total-monto">$${data.total}</div>
        </div>

        <button class="btn-confirmar" onclick="confirmarPedido()">
          Confirmar pedido ✓
        </button>
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
      body: JSON.stringify({
        cantidad: parseInt(cantidad)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo actualizar la cantidad');
    }

    cargarCarrito();
  } catch (error) {
    alert('Error al actualizar cantidad');
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
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    cargarCarrito();
  } catch (error) {
    alert('Error al eliminar producto');
  }
}

// ================================
// HU-09: Confirmar pedido
// ================================
async function confirmarPedido() {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_CARRITO}/pedidos/confirmar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('contenido-carrito').innerHTML = `
        <div class="vacio">
          <p style="font-size:52px;">✅</p>
          <h3>¡Pedido confirmado!</h3>
          <p>Número de pedido:</p>
          <h2>${data.codigo}</h2>
          <p>Total: <b>$${data.total}</b></p>

          <a href="pedidos.html" class="btn" style="display:inline-block;width:auto;padding:10px 24px;text-decoration:none;margin-top:16px;">
            Ver mis pedidos
          </a>
        </div>
      `;
    } else {
      alert(data.error || 'Error al confirmar pedido');
    }
  } catch (error) {
    alert('No se pudo conectar con el servidor');
  }
}