//const API = 'http://localhost:3000/api';
const API_PEDIDOS = 'http://localhost:3000/api';
window.onload = function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const token = localStorage.getItem('token');

  if (!usuario || !token) {
    alert('Debes iniciar sesión para ver tus pedidos');
    window.location.href = 'login.html';
    return;
  }

  cargarPedidos();
};

// ================================
// HU-09: Historial de pedidos comprador
// ================================
async function cargarPedidos() {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_PEDIDOS}/pedidos/mis-pedidos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const pedidos = await res.json();
    const div = document.getElementById('lista-pedidos');

    if (!res.ok) {
      div.innerHTML = `<p>${pedidos.error || 'Error al cargar pedidos'}</p>`;
      return;
    }

    if (pedidos.length === 0) {
      div.innerHTML = `
        <div class="vacio">
          <p style="font-size:48px;">📋</p>
          <h3>No tienes pedidos registrados</h3>
          <p>Cuando confirmes una compra, aparecerá aquí.</p>
          <a href="index.html" class="btn" style="display:inline-block;width:auto;padding:10px 24px;text-decoration:none;">
            Ir al catálogo
          </a>
        </div>
      `;
      return;
    }

    div.innerHTML = pedidos.map(pedido => `
      <div class="pedido-card">
        <div class="pedido-info">
          <h3>${pedido.codigo || `Pedido #${pedido.id}`}</h3>
          <p>📦 Productos: ${pedido.productos}</p>
          <p>📅 Fecha: ${new Date(pedido.created_at).toLocaleDateString('es-EC')}</p>
          <p>💰 Total: <b>$${parseFloat(pedido.total).toFixed(2)}</b></p>
        </div>

        <span class="estado ${pedido.estado}">
          ${estadoTexto(pedido.estado)}
        </span>
      </div>
    `).join('');
  } catch (error) {
    document.getElementById('lista-pedidos').innerHTML =
      '<p>Error al conectar con el servidor.</p>';
  }
}

function estadoTexto(estado) {
  const textos = {
    pendiente: '⏳ Pendiente',
    en_proceso: '🔄 En proceso',
    enviado: '🚚 Enviado',
    entregado: '✅ Entregado'
  };

  return textos[estado] || estado;
}