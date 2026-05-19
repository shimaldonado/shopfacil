// ================================
// HU-06: Registrar producto (vendedor)
// HU-18: Registrar/editar variantes de producto
// HU-21: Galería de imágenes del producto
// ================================

const API_PRODUCTOS = 'http://localhost:3000/api';
let variantesProducto = [];
let modoEdicionProducto = false;
let productoEditarId = null;

// Verificar que el usuario es vendedor al cargar la página
window.onload = async function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const token = localStorage.getItem('token');

  if (!usuario || !token) {
    alert('Debes iniciar sesión para acceder a esta página');
    window.location.href = 'login.html';
    return;
  }

  if (usuario.rol !== 'vendedor') {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'index.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  productoEditarId = params.get('editar');
  modoEdicionProducto = Boolean(productoEditarId);

  if (modoEdicionProducto) {
    prepararFormularioEdicion();
    await cargarProductoParaEditar(productoEditarId);
  }

  renderizarVariantes();
};

function prepararFormularioEdicion() {
  const titulo = document.getElementById('titulo-form-producto');
  const boton = document.getElementById('btn-guardar-producto');
  const linkVolver = document.getElementById('link-volver-productos');

  if (titulo) titulo.textContent = 'Editar producto';
  if (boton) boton.textContent = 'Actualizar producto';
  if (linkVolver) linkVolver.href = 'panel-vendedor.html';
}

async function leerJSONSeguroProducto(res) {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) return null;
  return await res.json();
}

function normalizarBooleano(valor) {
  return valor === true || valor === 1 || valor === '1' || valor === 'true';
}

async function cargarProductoParaEditar(id) {
  try {
    const res = await fetch(`${API_PRODUCTOS}/productos/vendedor/mis-productos/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const producto = await leerJSONSeguroProducto(res);

    if (!res.ok || !producto) {
      mostrarMensaje(producto?.error || 'No se pudo cargar el producto para editar', 'error');
      return;
    }

    document.getElementById('nombre').value = producto.nombre || '';
    document.getElementById('descripcion').value = producto.descripcion || '';
    document.getElementById('precio').value = producto.precio || '';
    document.getElementById('stock').value = producto.stock || 0;
    document.getElementById('categoria').value = producto.categoria || 'ropa';

    const imagenes = [];
    if (producto.imagen) imagenes.push(producto.imagen);
    if (Array.isArray(producto.imagenes)) {
      producto.imagenes.forEach(img => {
        const url = typeof img === 'string' ? img : img.url;
        if (url && !imagenes.includes(url)) imagenes.push(url);
      });
    }
    document.getElementById('imagen').value = imagenes.join(', ');

    variantesProducto = Array.isArray(producto.variantes)
      ? producto.variantes.map(v => ({
          talla: v.talla || '',
          color: v.color || '',
          stock: Number(v.stock || 0),
          activo: normalizarBooleano(v.activo)
        }))
      : [];

    renderizarVariantes();
    actualizarStockDesdeVariantes();
  } catch (error) {
    console.error(error);
    mostrarMensaje('No se pudo conectar con el servidor', 'error');
  }
}

function agregarVarianteFormulario() {
  const talla = document.getElementById('variante-talla').value.trim();
  const color = document.getElementById('variante-color').value.trim();
  const stock = document.getElementById('variante-stock').value;

  if (!talla && !color) {
    mostrarMensaje('Ingresa al menos una talla o un color para la variante', 'error');
    return;
  }

  if (stock === '' || Number(stock) < 0) {
    mostrarMensaje('El stock de la variante debe ser 0 o mayor', 'error');
    return;
  }

  const existe = variantesProducto.some(v =>
    String(v.talla || '').toLowerCase() === talla.toLowerCase() &&
    String(v.color || '').toLowerCase() === color.toLowerCase()
  );

  if (existe) {
    mostrarMensaje('Esa combinación de talla y color ya fue agregada', 'error');
    return;
  }

  variantesProducto.push({
    talla,
    color,
    stock: parseInt(stock),
    activo: true
  });

  document.getElementById('variante-talla').value = '';
  document.getElementById('variante-color').value = '';
  document.getElementById('variante-stock').value = '';

  renderizarVariantes();
  actualizarStockDesdeVariantes();
  mostrarMensaje('Variante agregada al producto', 'exito');
}

function eliminarVarianteFormulario(index) {
  variantesProducto.splice(index, 1);
  renderizarVariantes();
  actualizarStockDesdeVariantes();
}

function cambiarEstadoVarianteFormulario(index) {
  variantesProducto[index].activo = !normalizarBooleano(variantesProducto[index].activo);
  renderizarVariantes();
}

function renderizarVariantes() {
  const contenedor = document.getElementById('lista-variantes');
  if (!contenedor) return;

  if (variantesProducto.length === 0) {
    contenedor.innerHTML = `
      <p style="font-size:13px;color:#777;">Todavía no has agregado variantes.</p>
    `;
    return;
  }

  contenedor.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:14px;"> 
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;border:1px solid #ddd;">Talla</th>
          <th style="padding:8px;border:1px solid #ddd;">Color</th>
          <th style="padding:8px;border:1px solid #ddd;">Stock</th>
          <th style="padding:8px;border:1px solid #ddd;">Estado</th>
          <th style="padding:8px;border:1px solid #ddd;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${variantesProducto.map((v, index) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${v.talla || '-'}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${v.color || '-'}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${v.stock}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">
              ${normalizarBooleano(v.activo) ? 'Activo' : 'Inactivo'}
            </td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
              <button type="button" onclick="cambiarEstadoVarianteFormulario(${index})" style="border:none;background:#1F4E79;color:white;padding:6px 10px;border-radius:6px;cursor:pointer;">
                ${normalizarBooleano(v.activo) ? 'Deshabilitar' : 'Habilitar'}
              </button>
              <button type="button" onclick="eliminarVarianteFormulario(${index})" style="border:none;background:#e74c3c;color:white;padding:6px 10px;border-radius:6px;cursor:pointer;">
                Eliminar
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function actualizarStockDesdeVariantes() {
  const stockInput = document.getElementById('stock');
  if (!stockInput || variantesProducto.length === 0) return;

  const stockTotal = variantesProducto.reduce((total, variante) => {
    return total + Number(variante.stock || 0);
  }, 0);

  stockInput.value = stockTotal;
}

async function agregarProducto() {
  if (modoEdicionProducto) {
    await actualizarProducto();
    return;
  }

  await guardarProducto('POST', `${API_PRODUCTOS}/productos`, '¡Producto registrado exitosamente!');
}

async function actualizarProducto() {
  await guardarProducto(
    'PUT',
    `${API_PRODUCTOS}/productos/${productoEditarId}`,
    '¡Producto actualizado exitosamente!'
  );
}

async function guardarProducto(metodo, url, mensajeExito) {
  const nombre = document.getElementById('nombre').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const precio = document.getElementById('precio').value;
  const stock = document.getElementById('stock').value;
  const imagen = document.getElementById('imagen').value.trim();
  const categoria = document.getElementById('categoria').value;

  // Si el vendedor agregó variantes, el stock general se calcula automáticamente.
  const stockFinal = variantesProducto.length > 0
    ? variantesProducto.reduce((total, variante) => total + Number(variante.stock || 0), 0)
    : parseInt(stock);

  // HU-21: permite varias imágenes separadas por coma en el mismo campo.
  const imagenes = imagen
    ? imagen.split(',').map(img => img.trim()).filter(img => img.length > 0)
    : [];

  // Validar campos obligatorios
  if (!nombre || !precio || Number.isNaN(stockFinal)) {
    mostrarMensaje('Nombre, precio y stock son obligatorios', 'error');
    return;
  }

  if (Number(precio) <= 0) {
    mostrarMensaje('El precio debe ser mayor a 0', 'error');
    return;
  }

  if (stockFinal < 0) {
    mostrarMensaje('El stock no puede ser negativo', 'error');
    return;
  }

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: stockFinal,
        imagen: imagenes.length > 0 ? imagenes[0] : null,
        imagenes: imagenes.slice(1),
        categoria,
        variantes: variantesProducto.map(v => ({
          talla: v.talla || null,
          color: v.color || null,
          stock: Number(v.stock || 0),
          activo: normalizarBooleano(v.activo)
        }))
      })
    });

    const data = await leerJSONSeguroProducto(res);

    if (res.ok) {
      mostrarMensaje(mensajeExito, 'exito');

      setTimeout(() => {
        window.location.href = modoEdicionProducto ? 'panel-vendedor.html' : 'index.html';
      }, 1200);
    } else {
      mostrarMensaje(data?.error || 'Error al guardar producto', 'error');
    }

  } catch (err) {
    console.error(err);
    mostrarMensaje('No se pudo conectar con el servidor', 'error');
  }
}
