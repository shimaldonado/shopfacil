(function () {
  const TOAST_DURATION = 3400;

  function crearContenedor() {
    if (document.getElementById('sf-toast-container')) return;
    const c = document.createElement('div');
    c.id = 'sf-toast-container';
    c.style.cssText = [
      'position:fixed',
      'bottom:28px',
      'right:28px',
      'z-index:9999',
      'display:flex',
      'flex-direction:column',
      'gap:10px',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(c);
  }

  const TIPOS = {
    exito: {
      bg: '#EAF3DE',
      border: '#27500A',
      text: '#27500A',
      icon: '&#10003;',
      iconBg: '#27500A'
    },
    error: {
      bg: '#FAECE7',
      border: '#712B13',
      text: '#712B13',
      icon: '&#x2715;',
      iconBg: '#712B13'
    },
    info: {
      bg: '#E6F1FB',
      border: '#0C447C',
      text: '#0C447C',
      icon: '&#x2139;',
      iconBg: '#0C447C'
    },
    carrito: {
      bg: '#EEEDFE',
      border: '#3C3489',
      text: '#3C3489',
      icon: '&#128722;',
      iconBg: '#3C3489'
    }
  };

  window.sfToast = function (mensaje, tipo, subtexto) {
    tipo = tipo || 'info';
    crearContenedor();
    const c = document.getElementById('sf-toast-container');
    const t = TIPOS[tipo] || TIPOS.info;

    const toast = document.createElement('div');
    toast.style.cssText = [
      'pointer-events:all',
      'display:flex',
      'align-items:flex-start',
      'gap:12px',
      'background:' + t.bg,
      'border:1.5px solid ' + t.border,
      'border-radius:12px',
      'padding:14px 18px',
      'min-width:280px',
      'max-width:360px',
      'box-shadow:0 4px 18px rgba(0,0,0,0.13)',
      'opacity:0',
      'transform:translateX(40px)',
      'transition:opacity 0.28s ease,transform 0.28s ease'
    ].join(';');

    const iconCircle = document.createElement('div');
    iconCircle.style.cssText = [
      'width:32px',
      'height:32px',
      'min-width:32px',
      'border-radius:50%',
      'background:' + t.iconBg,
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:15px',
      'color:white',
      'font-weight:700',
      'margin-top:1px'
    ].join(';');
    iconCircle.innerHTML = t.icon;

    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'flex:1;';

    const titulo = document.createElement('div');
    titulo.style.cssText = 'font-weight:600;font-size:14px;color:' + t.text + ';font-family:Segoe UI,Arial,sans-serif;line-height:1.35;';
    titulo.textContent = mensaje;

    textWrap.appendChild(titulo);

    if (subtexto) {
      const sub = document.createElement('div');
      sub.style.cssText = 'font-size:12px;color:' + t.text + ';opacity:0.78;margin-top:3px;font-family:Segoe UI,Arial,sans-serif;';
      sub.textContent = subtexto;
      textWrap.appendChild(sub);
    }

    const barra = document.createElement('div');
    barra.style.cssText = [
      'position:absolute',
      'bottom:0',
      'left:0',
      'height:3px',
      'border-radius:0 0 12px 12px',
      'background:' + t.border,
      'width:100%',
      'transform-origin:left',
      'transition:transform ' + TOAST_DURATION + 'ms linear'
    ].join(';');

    toast.style.position = 'relative';
    toast.appendChild(iconCircle);
    toast.appendChild(textWrap);
    toast.appendChild(barra);
    c.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
        barra.style.transform = 'scaleX(0)';
      });
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 320);
    }, TOAST_DURATION);
  };

  window.sfToastCarrito = function (nombreProducto) {
    sfToast(
      'Producto agregado al carrito',
      'carrito',
      nombreProducto ? '\u201c' + nombreProducto + '\u201d listo para comprar'  : 'Revisa tu carrito cuando quieras'
    );
  };

  window.sfToastExito = function (msg, sub) { sfToast(msg, 'exito', sub); };
  window.sfToastError = function (msg, sub) { sfToast(msg, 'error', sub); };
  window.sfToastInfo = function (msg, sub) { sfToast(msg, 'info', sub); };
})();