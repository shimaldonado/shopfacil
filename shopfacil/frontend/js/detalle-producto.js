const API_DETALLE = 'http://localhost:3000/api';

let productoActual = null;

function construirNavbarDetalle() {
  const nav = document.getElementById('nav-links-detalle');
  if (!nav) return;

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  let enlaces = '<a href="index.html">Catálogo</a>';

  if (!usuario) {
    enlaces += '<a href="login.html">Iniciar sesión</a>';
  } else if (usuario.rol === 'comprador') {
    enlaces += '<a href="carrito.html">Mi carrito</a>';
    enlaces += '<a href="pedidos.html">Mis pedidos</a>';
    enlaces += '<a href="#" onclick="cerrarSesion()">Cerrar sesión</a>';
  } else if (usuario.rol === 'vendedor') {
    enlaces += '<a href="agregar-producto.html">+ Agregar producto</a>';
    enlaces += '<a href="panel-vendedor.html">Panel vendedor</a>';
    enlaces += '<a href="#" onclick="cerrarSesion()">Cerrar sesión</a>';
  } else if (usuario.rol === 'admin') {
    enlaces += '<a href="admin.html">Panel admin</a>';
    enlaces += '<a href="#" onclick="cerrarSesion()">Cerrar sesión</a>';
  }

  nav.innerHTML = enlaces;
}

let colorSeleccionado = null;
let tallaSeleccionada = null;

window.onload = function () {
  construirNavbarDetalle();
  cargarDetalleProducto();
};

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

async function leerJSONSeguro(res) {
  const contentType = res.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  return await res.json();
}

function limpiarTextoParaJS(texto) {
  return String(texto || '')
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('"', '&quot;');
}

function escaparHTML(texto) {
  return corregirTexto(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function obtenerImagenes(producto) {
  if (producto.imagenes && Array.isArray(producto.imagenes)) {
    const urls = producto.imagenes
      .map(img => typeof img === 'string' ? img : img.url)
      .filter(Boolean);

    if (urls.length > 0) return urls;
  }

  if (producto.imagenes && typeof producto.imagenes === 'string') {
    const urls = producto.imagenes
      .split(',')
      .map(img => img.trim())
      .filter(img => img.length > 0);

    if (urls.length > 0) return urls;
  }

  if (producto.imagen) {
    return [producto.imagen];
  }

  return ['https://via.placeholder.com/650x650?text=Sin+imagen'];
}

function esVarianteActiva(variante) {
  return variante.activo === true ||
    variante.activo === 1 ||
    variante.activo === '1' ||
    variante.activo === 'true';
}

// HU-18/HU-19: solo se consideran variantes activas y con stock.
function variantesDisponibles() {
  if (!productoActual || !Array.isArray(productoActual.variantes)) return [];

  return productoActual.variantes.filter(v =>
    esVarianteActiva(v) && Number(v.stock) > 0
  );
}

function valoresUnicos(lista) {
  return [...new Set(lista.filter(Boolean))];
}

function obtenerColoresGlobales() {
  return valoresUnicos(variantesDisponibles().map(v => v.color));
}

function obtenerTallasGlobales() {
  return valoresUnicos(variantesDisponibles().map(v => v.talla));
}

function obtenerTallasPorColor(color) {
  return valoresUnicos(
    variantesDisponibles()
      .filter(v => !color || v.color === color)
      .map(v => v.talla)
  );
}

function obtenerColoresPorTalla(talla) {
  return valoresUnicos(
    variantesDisponibles()
      .filter(v => !talla || v.talla === talla)
      .map(v => v.color)
  );
}

function existeCombinacionDisponible(color, talla) {
  return variantesDisponibles().some(v => {
    const coincideColor = !color || v.color === color;
    const coincideTalla = !talla || v.talla === talla;
    return coincideColor && coincideTalla;
  });
}

function obtenerVarianteSeleccionada() {
  const variantes = variantesDisponibles();

  if (variantes.length === 0) return null;

  return variantes.find(v => {
    const coincideTalla = !tallaSeleccionada || v.talla === tallaSeleccionada;
    const coincideColor = !colorSeleccionado || v.color === colorSeleccionado;
    return coincideTalla && coincideColor;
  }) || null;
}

function calcularStockDisponible() {
  const variantes = variantesDisponibles();

  if (variantes.length === 0) {
    return Number(productoActual?.stock || 0);
  }

  const varianteExacta = obtenerVarianteSeleccionada();

  if (varianteExacta && colorSeleccionado && tallaSeleccionada) {
    return Number(varianteExacta.stock || 0);
  }

  const variantesFiltradas = variantes.filter(v => {
    const coincideColor = !colorSeleccionado || v.color === colorSeleccionado;
    const coincideTalla = !tallaSeleccionada || v.talla === tallaSeleccionada;
    return coincideColor && coincideTalla;
  });

  return variantesFiltradas.reduce((total, v) => total + Number(v.stock || 0), 0);
}

function generarBotonesColores() {
  const colores = obtenerColoresGlobales();

  return colores.map(color => {
    const habilitado = existeCombinacionDisponible(color, tallaSeleccionada);
    const seleccionado = colorSeleccionado === color;
    const colorSeguro = limpiarTextoParaJS(color);

    return `
      <button
        class="opcion-btn ${seleccionado ? 'seleccionada' : ''} ${!habilitado ? 'deshabilitada' : ''}"
        ${habilitado ? `onclick="seleccionarColor('${colorSeguro}')"` : 'disabled'}
      >
        ${color}
      </button>
    `;
  }).join('');
}

function generarBotonesTallas() {
  const tallas = obtenerTallasGlobales();

  return tallas.map(talla => {
    const habilitado = existeCombinacionDisponible(colorSeleccionado, talla);
    const seleccionado = tallaSeleccionada === talla;
    const tallaSegura = limpiarTextoParaJS(talla);

    return `
      <button
        class="opcion-btn ${seleccionado ? 'seleccionada' : ''} ${!habilitado ? 'deshabilitada' : ''}"
        ${habilitado ? `onclick="seleccionarTalla('${tallaSegura}')"` : 'disabled'}
      >
        ${talla}
      </button>
    `;
  }).join('');
}

function renderizarOpcionesVariantes() {
  const coloresContenedor = document.getElementById('lista-colores');
  const tallasContenedor = document.getElementById('lista-tallas');

  if (coloresContenedor) {
    coloresContenedor.innerHTML = generarBotonesColores();
  }

  if (tallasContenedor) {
    tallasContenedor.innerHTML = generarBotonesTallas();
  }
}

function actualizarStockYCantidad() {
  const stockDisponible = calcularStockDisponible();
  const stockDiv = document.getElementById('stock-disponible');
  const cantidadSelect = document.getElementById('cantidad');

  if (stockDiv) {
    stockDiv.textContent = `Stock disponible: ${stockDisponible} unidades`;
  }

  if (cantidadSelect) {
    cantidadSelect.innerHTML = generarOpcionesCantidad(stockDisponible);
  }
}

async function cargarDetalleProducto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const puedeComprar = usuario && usuario.rol === 'comprador';

  if (!id) {
    document.getElementById('detalle-producto').innerHTML =
      '<p>Producto no encontrado.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_DETALLE}/productos/${id}`);
    const producto = await res.json();

    if (!res.ok || !producto) {
      document.getElementById('detalle-producto').innerHTML =
        '<p>Producto no encontrado.</p>';
      return;
    }

    productoActual = producto;
    colorSeleccionado = null;
    tallaSeleccionada = null;

    const imagenes = obtenerImagenes(producto);
    const colores = obtenerColoresGlobales();
    const tallas = obtenerTallasGlobales();
    const stockInicial = calcularStockDisponible();

    document.getElementById('detalle-producto').innerHTML = `
      <div class="detalle-temu">
        <div class="detalle-galeria">
          <div class="miniaturas">
            ${imagenes.map((img, index) => `
              <img 
                src="${img}" 
                alt="Vista ${index + 1}" 
                onclick="cambiarImagenPrincipal('${limpiarTextoParaJS(img)}', this)"
                class="${index === 0 ? 'activa' : ''}"
                onerror="this.src='https://via.placeholder.com/120x120?text=Sin+imagen'"
              >
            `).join('')}
          </div>

          <div class="imagen-principal-box">
            <img 
              id="imagen-principal"
              src="${imagenes[0]}"
              alt="${corregirTexto(producto.nombre)}"
              onerror="this.src='https://via.placeholder.com/650x650?text=Sin+imagen'"
            >
          </div>
        </div>

        <div class="detalle-info-temu">
          <h2>${corregirTexto(producto.nombre)}</h2>

          <div class="detalle-precio-temu">
            $${parseFloat(producto.precio).toFixed(2)}
          </div>

          <div id="stock-disponible" class="detalle-stock-temu">
            Stock disponible: ${stockInicial} unidades
          </div>

          ${colores.length > 0 ? `
            <div class="opciones-box">
              <h4>Color:</h4>
              <div id="lista-colores" class="opciones-lista"></div>
            </div>
          ` : ''}

          ${tallas.length > 0 ? `
            <div class="opciones-box">
              <div class="opciones-header">
                <h4>Talla:</h4>
                <span class="guia-tallas">📏 Guía de tallas</span>
              </div>

              <div id="lista-tallas" class="opciones-lista"></div>
            </div>
          ` : ''}

          ${
            puedeComprar
              ? `
                <div class="cantidad-box-temu">
                  <label>Cant.</label>
                  <select id="cantidad">
                    ${generarOpcionesCantidad(stockInicial)}
                  </select>
                </div>

                <button class="btn-agregar-temu" onclick="agregarAlCarrito(${producto.id})">
                  Agregar al carrito
                </button>
              `
              : `
                <div class="mensaje-info">
                  ${
                    usuario
                      ? 'Este producto solo puede ser agregado al carrito por compradores.'
                      : 'Inicia sesión como comprador para agregar este producto al carrito.'
                  }
                </div>
              `
          }

          <div class="beneficios-producto">
            <p>✅ Pagos seguros</p>
            <p>🚚 Entrega gestionada por ShopFácil</p>
            <p>🛡️ Garantía de pedido</p>
          </div>

          <div class="descripcion-completa">
            <h3>Descripción del producto</h3>
            <p>${corregirTexto(producto.descripcion || 'Sin descripción disponible.')}</p>
          </div>
        </div>
      </div>

      <section class="comentarios-card">
        <div class="comentarios-header">
          <h3>Comentarios y calificación</h3>
          <div id="promedio-calificacion" class="promedio-calificacion">Sin calificaciones</div>
        </div>

        ${puedeComprar ? `
          <div class="form-comentario">
            <label>Tu calificación:</label>
            <select id="calificacion">
              <option value="5">⭐⭐⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐</option>
              <option value="3">⭐⭐⭐</option>
              <option value="2">⭐⭐</option>
              <option value="1">⭐</option>
            </select>
            <textarea id="comentario" rows="3" placeholder="Escribe tu experiencia con el producto..."></textarea>
            <button class="btn-primary" onclick="enviarComentario(${producto.id})">Publicar comentario</button>
          </div>
        ` : `
          <p class="mensaje-info">Inicia sesión como comprador para comentar y calificar.</p>
        `}

        <div id="lista-comentarios" class="lista-comentarios">Cargando comentarios...</div>
      </section>
    `;

    renderizarOpcionesVariantes();
    actualizarStockYCantidad();
    cargarComentariosProducto(producto.id);

  } catch (error) {
    console.error(error);
    document.getElementById('detalle-producto').innerHTML =
      '<p>Error al cargar el producto.</p>';
  }
}

function generarOpcionesCantidad(stock) {
  const max = Math.min(Number(stock || 0), 10);
  let opciones = '';

  if (max <= 0) {
    return '<option value="0">0</option>';
  }

  for (let i = 1; i <= max; i++) {
    opciones += `<option value="${i}">${i}</option>`;
  }

  return opciones;
}

function cambiarImagenPrincipal(src, elemento) {
  document.getElementById('imagen-principal').src = src;

  document.querySelectorAll('.miniaturas img').forEach(img => {
    img.classList.remove('activa');
  });

  elemento.classList.add('activa');
}

function seleccionarColor(color) {
  colorSeleccionado = color;

  if (tallaSeleccionada && !existeCombinacionDisponible(colorSeleccionado, tallaSeleccionada)) {
    tallaSeleccionada = null;
  }

  renderizarOpcionesVariantes();
  actualizarStockYCantidad();
}

function seleccionarTalla(talla) {
  tallaSeleccionada = talla;

  if (colorSeleccionado && !existeCombinacionDisponible(colorSeleccionado, tallaSeleccionada)) {
    colorSeleccionado = null;
  }

  renderizarOpcionesVariantes();
  actualizarStockYCantidad();
}

// ================================
// Agregar al carrito
// ================================
async function agregarAlCarrito(productoId) {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const cantidadSelect = document.getElementById('cantidad');

  if (!token || !usuario) {
    alert('Debes iniciar sesión para agregar productos al carrito');
    window.location.href = 'login.html';
    return;
  }

  if (usuario.rol !== 'comprador') {
    alert('Solo los compradores pueden agregar productos al carrito');
    return;
  }

  const variantes = variantesDisponibles();
  const tallas = obtenerTallasGlobales();
  const colores = obtenerColoresGlobales();

  if (variantes.length > 0) {
    if (colores.length > 0 && !colorSeleccionado) {
      alert('Selecciona un color antes de agregar al carrito');
      return;
    }

    if (tallas.length > 0 && !tallaSeleccionada) {
      alert('Selecciona una talla antes de agregar al carrito');
      return;
    }
  }

  const varianteSeleccionada = obtenerVarianteSeleccionada();

  if (variantes.length > 0 && !varianteSeleccionada) {
    alert('La combinación seleccionada no está disponible');
    return;
  }

  const cantidad = cantidadSelect ? parseInt(cantidadSelect.value) : 1;
  const stockDisponible = varianteSeleccionada
    ? Number(varianteSeleccionada.stock)
    : Number(productoActual.stock);

  if (!cantidad || cantidad <= 0) {
    alert('Selecciona una cantidad válida');
    return;
  }

  if (cantidad > stockDisponible) {
    alert('Stock insuficiente');
    return;
  }

  try {
    const res = await fetch(`${API_DETALLE}/carrito/agregar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        producto_id: productoId,
        cantidad,
        variante_id: varianteSeleccionada ? varianteSeleccionada.id : null,
        talla: tallaSeleccionada,
        color: colorSeleccionado
      })
    });

    const data = await leerJSONSeguro(res);

    if (res.ok) {
      alert('Producto agregado al carrito');
      window.location.href = 'carrito.html';
    } else {
      alert(data?.error || 'Error al agregar al carrito');
    }

  } catch (error) {
    console.error(error);
    alert('No se pudo conectar con el servidor');
  }
}


// ================================
// HU-20: Comentarios y calificación por estrellas
// ================================
function pintarEstrellas(valor) {
  const numero = Number(valor || 0);
  return '⭐'.repeat(numero) + '☆'.repeat(Math.max(0, 5 - numero));
}

async function cargarComentariosProducto(productoId) {
  const contenedor = document.getElementById('lista-comentarios');
  const promedioDiv = document.getElementById('promedio-calificacion');

  if (!contenedor) return;

  try {
    const res = await fetch(`${API_DETALLE}/productos/${productoId}/comentarios`);
    const comentarios = await res.json();

    if (!res.ok || !Array.isArray(comentarios)) {
      contenedor.innerHTML = '<p>No se pudieron cargar los comentarios.</p>';
      return;
    }

    if (comentarios.length === 0) {
      if (promedioDiv) promedioDiv.textContent = 'Sin calificaciones';
      contenedor.innerHTML = '<p>Aún no hay comentarios para este producto.</p>';
      return;
    }

    const promedio = comentarios.reduce((suma, c) => suma + Number(c.calificacion || 0), 0) / comentarios.length;

    if (promedioDiv) {
      promedioDiv.textContent = `${promedio.toFixed(1)} / 5 ⭐ (${comentarios.length})`;
    }

    contenedor.innerHTML = comentarios.map(c => `
      <div class="comentario-item">
        <div class="comentario-top">
          <strong>${escaparHTML(c.usuario || 'Usuario')}</strong>
          <span>${pintarEstrellas(c.calificacion)}</span>
        </div>
        <p>${escaparHTML(c.comentario || '')}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = '<p>Error al cargar comentarios.</p>';
  }
}

async function enviarComentario(productoId) {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const calificacion = document.getElementById('calificacion')?.value;
  const comentario = document.getElementById('comentario')?.value.trim();

  if (!token || !usuario || usuario.rol !== 'comprador') {
    alert('Solo los compradores registrados pueden comentar');
    return;
  }

  if (!comentario) {
    alert('Escribe un comentario antes de publicar');
    return;
  }

  try {
    const res = await fetch(`${API_DETALLE}/productos/${productoId}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ calificacion, comentario })
    });

    const data = await leerJSONSeguro(res);

    if (!res.ok) {
      alert(data?.error || 'No se pudo registrar el comentario');
      return;
    }

    document.getElementById('comentario').value = '';
    alert('Comentario registrado correctamente');
    cargarComentariosProducto(productoId);
  } catch (error) {
    console.error(error);
    alert('No se pudo conectar con el servidor');
  }
}
