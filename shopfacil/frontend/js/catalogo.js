let todosLosProductos = [];

// ================================
// Corregir textos con errores tipo algodÃ³n
// ================================
function corregirTexto(texto) {
  if (!texto) return '';

  return String(texto)
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã±', 'ñ')
    .replaceAll('ÃÁ', 'Á')
    .replaceAll('Ã‰', 'É')
    .replaceAll('Ã“', 'Ó')
    .replaceAll('algodÃ³n', 'algodón')
    .replaceAll('PantalÃ³n', 'Pantalón')
    .replaceAll('descripciÃ³n', 'descripción');
}

// Evita que una descripción con símbolos rompa el HTML
function escaparHTML(texto) {
  return corregirTexto(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ================================
// Navbar según sesión
// ================================
function cargarNavbar() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const navLinks = document.querySelector('.nav-links');

  if (usuario) {
    const navUsuario = document.getElementById('nav-usuario');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnAgregar = document.getElementById('btn-agregar');

    if (navUsuario) navUsuario.textContent = `Hola, ${usuario.nombre}`;
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'inline';

    if (
      usuario.rol === 'comprador' &&
      navLinks &&
      !document.getElementById('btn-carrito')
    ) {
      navLinks.insertAdjacentHTML('beforeend', `
        <a href="carrito.html" id="btn-carrito" class="carrito-link">
          🛒 Mi carrito
          <span id="carrito-contador" class="carrito-badge">0</span>
        </a>
        <a href="pedidos.html" id="btn-pedidos">Mis pedidos</a>
      `);
    }

    // El vendedor gestiona productos y pedidos.
    // El administrador solo gestiona usuarios, roles y vendedores.
    if (usuario.rol === 'vendedor') {
      if (btnAgregar) btnAgregar.style.display = 'inline';

      if (navLinks && !document.getElementById('btn-panel-vendedor')) {
        navLinks.insertAdjacentHTML('beforeend', `
          <a href="panel-vendedor.html" id="btn-panel-vendedor">Panel vendedor</a>
        `);
      }
    }

    if (usuario.rol === 'admin') {
      if (btnAgregar) btnAgregar.style.display = 'none';

      if (navLinks && !document.getElementById('btn-panel-admin')) {
        navLinks.insertAdjacentHTML('beforeend', `
          <a href="admin.html" id="btn-panel-admin">Panel admin</a>
        `);
      }
    }

    actualizarContadorCarrito();
  }
}

// ================================
// Contador del carrito
// ================================
// ================================
// Contador del carrito
// ================================
async function actualizarContadorCarrito() {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const contador = document.getElementById('carrito-contador');

  if (!token || !contador || !usuario || usuario.rol !== 'comprador') {
    return;
  }

  try {
    const res = await fetch(`${API}/carrito`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      contador.style.display = 'none';
      return;
    }

    const items = Array.isArray(data) ? data : data.items;

    if (!Array.isArray(items)) {
      contador.style.display = 'none';
      return;
    }

    const totalItems = items.reduce((total, item) => {
      return total + Number(item.cantidad || 0);
    }, 0);

    if (totalItems > 0) {
      contador.textContent = totalItems > 99 ? '99+' : totalItems;
      contador.style.display = 'inline-flex';
    } else {
      contador.style.display = 'none';
    }

  } catch (error) {
    console.error('Error al actualizar contador:', error);
    contador.style.display = 'none';
  }
}

// ================================
// Cargar catálogo completo
// ================================
async function cargarProductos() {
  const catalogo = document.getElementById('catalogo');

  try {
    catalogo.innerHTML = '<p>Cargando productos...</p>';

    const res = await fetch(`${API}/productos`);

    if (!res.ok) {
      throw new Error('Error al obtener productos');
    }

    const productos = await res.json();

    todosLosProductos = productos;
    mostrarProductos(productos);

  } catch (error) {
    console.error('Error al cargar productos:', error);
    catalogo.innerHTML = '<p>Error al cargar productos.</p>';
  }
}


// ================================
// Mostrar productos
// ================================
function mostrarProductos(productos) {
  const catalogo = document.getElementById('catalogo');
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const puedeComprar = usuario && usuario.rol === 'comprador';

  if (!productos || productos.length === 0) {
    catalogo.innerHTML = '<p>No se encontraron productos.</p>';
    return;
  }

  catalogo.innerHTML = productos.map((p, index) => {
    const nombre = escaparHTML(p.nombre);
    const descripcion = escaparHTML(p.descripcion || 'Sin descripción');
    const imagen = p.imagen || 'https://via.placeholder.com/500x400?text=Sin+imagen';
    const precio = Number(p.precio || 0).toFixed(2);
    const stock = Number(p.stock || 0);

    return `
      <div class="producto-card">
        <div class="producto-imagen-box" onclick="verDetalle(${p.id})">
          <img
            src="${imagen}"
            alt="${nombre}"
            loading="${index < 4 ? 'eager' : 'lazy'}"
            decoding="async"
            onerror="this.src='https://via.placeholder.com/500x400?text=Sin+imagen'"
          >
        </div>

        <div class="producto-info">
          <h3 onclick="verDetalle(${p.id})" title="${nombre}">
            ${nombre}
          </h3>

          <p class="producto-descripcion" title="${descripcion}">
            ${descripcion}
          </p>

          <div class="precio">$${precio}</div>

          <div class="stock">Stock: ${stock} unidades</div>

          <div class="producto-acciones">
            ${
              puedeComprar
                ? `
                  <button class="btn" onclick="agregarAlCarrito(${p.id})">
                    Agregar
                  </button>
                `
                : ''
            }

            <button class="btn-secundario" onclick="verDetalle(${p.id})">
              Ver detalle
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ================================
// Ir al detalle
// ================================
function verDetalle(id) {
  window.location.href = `detalle-producto.html?id=${id}`;
}

// ================================
// Agregar al carrito
// ================================
async function agregarAlCarrito(productoId) {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const token = localStorage.getItem('token');

  if (!usuario || !token) {
    alert('Debes iniciar sesión para agregar productos al carrito');
    window.location.href = 'login.html';
    return;
  }
    if (usuario.rol !== 'comprador') {
    alert('Solo los compradores pueden agregar productos al carrito');
    return;
  }

  try {
    const res = await fetch(`${API}/carrito/agregar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        producto_id: productoId,
        cantidad: 1
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Producto agregado al carrito');
      actualizarContadorCarrito();
    } else {
      alert(data.error || 'Error al agregar al carrito');
    }

  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    alert('No se pudo conectar con el servidor');
  }
}

// ================================
// Buscar y filtrar productos
// ================================
async function filtrar() {
  const nombre = document.getElementById('buscador')?.value.trim() || '';
  const precioMin = document.getElementById('precio-min')?.value || '';
  const precioMax = document.getElementById('precio-max')?.value || '';
  const categoria = document.getElementById('categoria')?.value || 'todos';

  const params = new URLSearchParams();

  if (nombre) params.append('nombre', nombre);
  if (precioMin) params.append('precio_min', precioMin);
  if (precioMax) params.append('precio_max', precioMax);
  if (categoria && categoria !== 'todos') params.append('categoria', categoria);

  try {
    const catalogo = document.getElementById('catalogo');
    catalogo.innerHTML = '<p>Cargando productos...</p>';

    const url = params.toString()
      ? `${API}/productos?${params.toString()}`
      : `${API}/productos`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error('Error al filtrar productos');
    }

    const productos = await res.json();

    todosLosProductos = productos;
    mostrarProductos(productos);

  } catch (error) {
    console.error('Error al filtrar productos:', error);
    document.getElementById('catalogo').innerHTML =
      '<p>Error al filtrar productos.</p>';
  }
}

// ================================
// Limpiar filtros
// ================================
function limpiarFiltros() {
  const buscador = document.getElementById('buscador');
  const precioMin = document.getElementById('precio-min');
  const precioMax = document.getElementById('precio-max');
  const categoria = document.getElementById('categoria');

  if (buscador) buscador.value = '';
  if (precioMin) precioMin.value = '';
  if (precioMax) precioMax.value = '';
  if (categoria) categoria.value = 'todos';

  cargarProductos();
}

// ================================
// Inicializar
// ================================
cargarNavbar();
cargarProductos();