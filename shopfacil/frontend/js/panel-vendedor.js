//const API = 'http://localhost:3000/api';
const API_PANEL = 'http://localhost:3000/api';

window.onload = function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const token = localStorage.getItem('token');

  if (!usuario || !token) {
    alert('Debes iniciar sesión');
    window.location.href = 'login.html';
    return;
  }

  if (usuario.rol !== 'vendedor') {
    alert('No tienes permisos para acceder al panel vendedor');
    window.location.href = 'index.html';
    return;
  }

  cargarMisProductosVendedor();
  cargarPedidosVendedor();
};

function escaparHTML(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function imagenSeguraProducto(url) {
  return url || 'https://via.placeholder.com/120x90?text=Producto';
}

// ================================
// HU-06/HU-18/HU-21: Mis productos como vendedor
// ================================
async function cargarMisProductosVendedor() {
  const token = localStorage.getItem('token');
  const contenedor = document.getElementById('lista-productos-vendedor');
  if (!contenedor) return;

  contenedor.innerHTML = '<p class="estado-vacio">Cargando productos...</p>';

  try {
    const res = await fetch(`${API_PANEL}/productos/vendedor/mis-productos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const productos = await res.json();

    if (!res.ok) {
      contenedor.innerHTML = `<p class="estado-vacio">${productos.error || 'No se pudieron cargar los productos'}</p>`;
      return;
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      contenedor.innerHTML = `
        <div class="estado-vacio estado-vacio-card">
          <strong>Aún no tienes productos publicados.</strong><br>
          Registra tu primer producto para que aparezca en el catálogo.
        </div>
      `;
      return;
    }

    contenedor.innerHTML = `
      <div class="tabla-responsiva">
        <table class="tabla-panel tabla-productos-vendedor">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Variantes</th>
              <th>Galería</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${productos.map(producto => `
              <tr>
                <td>
                  <div class="producto-tabla-info">
                    <img src="${escaparHTML(imagenSeguraProducto(producto.imagen))}" alt="${escaparHTML(producto.nombre)}" onerror="this.src='https://via.placeholder.com/120x90?text=Producto'">
                    <div>
                      <strong>${escaparHTML(producto.nombre)}</strong>
                      <span>${escaparHTML(producto.descripcion || 'Sin descripción')}</span>
                    </div>
                  </div>
                </td>
                <td><span class="badge-suave">${escaparHTML(producto.categoria || 'otros')}</span></td>
                <td><strong>$${Number(producto.precio).toFixed(2)}</strong></td>
                <td>${producto.stock} unidades</td>
                <td>${producto.total_variantes || 0}</td>
                <td>${Number(producto.total_imagenes || 0) + (producto.imagen ? 1 : 0)}</td>
                <td>
                  <span class="badge-estado ${Number(producto.activo) === 1 ? 'badge-activo' : 'badge-inactivo'}">
                    ${Number(producto.activo) === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <a class="btn-accion-tabla btn-editar-producto" href="agregar-producto.html?editar=${producto.id}">
                    Editar
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = '<p class="estado-vacio">Error al conectar con el servidor.</p>';
  }
}

// ================================
// HU-10: Ver pedidos vendedor
// ================================
function nombreEstado(estado) {
  const nombres = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    enviado: 'Enviado',
    entregado: 'Entregado'
  };
  return nombres[estado] || estado || 'Pendiente';
}

function siguienteEstado(estadoActual) {
  const flujo = {
    pendiente: 'en_proceso',
    en_proceso: 'enviado',
    enviado: 'entregado'
  };
  return flujo[estadoActual] || null;
}

function claseBotonEstado(estado) {
  const clases = {
    en_proceso: 'btn-proceso',
    enviado: 'btn-enviado',
    entregado: 'btn-entregado'
  };
  return clases[estado] || 'btn-proceso';
}

function formatearFecha(fecha) {
  if (!fecha) return 'No disponible';

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) {
    return 'No disponible';
  }

  return fechaObj.toLocaleString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderAccionEstado(pedido) {
  const proximoEstado = siguienteEstado(pedido.estado);

  if (!proximoEstado) {
    return `
      <div class="acciones">
        <span class="estado entregado">Pedido finalizado</span>
      </div>
    `;
  }

  return `
    <div class="acciones">
      <button class="btn-estado ${claseBotonEstado(proximoEstado)}" onclick="actualizarEstado(${pedido.id}, '${proximoEstado}')">
        Pasar a ${nombreEstado(proximoEstado)}
      </button>
    </div>
  `;
}

async function cargarPedidosVendedor() {
  const token = localStorage.getItem('token');
  const div = document.getElementById('lista-pedidos');

  if (!div) return;
  div.innerHTML = '<p class="estado-vacio">Cargando pedidos...</p>';

  try {
    const res = await fetch(`${API_PANEL}/pedidos/todos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const pedidos = await res.json();

    if (!res.ok) {
      div.innerHTML = `<p class="estado-vacio">${pedidos.error || 'Error al cargar pedidos'}</p>`;
      return;
    }

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      div.innerHTML = '<p class="estado-vacio">Todavía no existen pedidos para tus productos.</p>';
      return;
    }

    div.innerHTML = pedidos.map(pedido => `
      <div class="pedido-card">
        <div class="pedido-top">
          <div>
            <h3>Pedido #${pedido.id}</h3>
            <p><strong>Código:</strong> ${escaparHTML(pedido.codigo || 'Sin código')}</p>
          </div>
          <span class="estado ${escaparHTML(pedido.estado)}">${nombreEstado(pedido.estado)}</span>
        </div>

        <div class="pedido-info">
          <p><strong>Cliente:</strong> ${escaparHTML(pedido.comprador || pedido.cliente_nombre || 'Comprador')}</p>
          <p><strong>Correo:</strong> ${escaparHTML(pedido.comprador_correo || pedido.cliente_correo || 'No disponible')}</p>
          <p><strong>Productos:</strong> ${escaparHTML(pedido.productos || 'Sin detalle')}</p>
          <p><strong>Total:</strong> $${Number(pedido.total || 0).toFixed(2)}</p>
          <p><strong>Fecha:</strong> ${formatearFecha(pedido.created_at || pedido.fecha)}</p>
        </div>

        ${renderAccionEstado(pedido)}
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
    div.innerHTML = '<p class="estado-vacio">Error al conectar con el servidor</p>';
  }
}

// ================================
// HU-11: Actualizar estado de pedido sin saltar pasos
// ================================
async function actualizarEstado(id, nuevoEstado) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_PANEL}/pedidos/estado/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Pedido actualizado a: ${nombreEstado(data.estado || nuevoEstado)}`);
      cargarPedidosVendedor();
    } else {
      alert(data.error || 'Error al actualizar estado');
      cargarPedidosVendedor();
    }
  } catch (err) {
    console.error(err);
    alert('Error al conectar con el servidor');
  }
}
