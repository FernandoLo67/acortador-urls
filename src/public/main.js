const formulario = document.getElementById('formulario');
const urlInput = document.getElementById('url-input');
const errorEl = document.getElementById('error');
const resultadoEl = document.getElementById('resultado');
const urlCortaEl = document.getElementById('url-corta');
const btnCopiar = document.getElementById('btn-copiar');
const cuerpoTabla = document.getElementById('cuerpo-tabla');
const totalEl = document.getElementById('total');
const vacioEl = document.getElementById('vacio');
const tablaEl = document.getElementById('tabla');

const BASE = window.location.origin;

function mostrarError(mensaje) {
    errorEl.textContent = mensaje;
    errorEl.hidden = false;
    resultadoEl.hidden = true;
}

function ocultarError() {
    errorEl.hidden = true;
}

function formatearFecha(iso) {
    const fecha = new Date(iso);
    return fecha.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function truncar(texto, max) {
    return texto.length > max ? texto.slice(0, max) + '...' : texto;
}

async function cargarUrls() {
    try {
        const res = await fetch('/api/urls');
        const urls = await res.json();
        renderizarTabla(urls);
    } catch {
        // silenciar error de red al cargar
    }
}

function renderizarTabla(urls) {
    totalEl.textContent = `(${urls.length})`;
    vacioEl.hidden = urls.length > 0;
    tablaEl.hidden = urls.length === 0;

    cuerpoTabla.innerHTML = urls.map(url => `
        <tr>
            <td data-label="Codigo">
                <a href="${BASE}/${url.codigo}" target="_blank">${url.codigo}</a>
            </td>
            <td data-label="Original" class="url-original">
                <a href="${url.original}" target="_blank" title="${url.original}">
                    ${truncar(url.original, 50)}
                </a>
            </td>
            <td data-label="Clicks">${url.clicks}</td>
            <td data-label="Creada">${formatearFecha(url.creadoEn)}</td>
            <td>
                <button class="btn-borrar" data-codigo="${url.codigo}">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarError();

    const url = urlInput.value.trim();
    if (!url) return;

    try {
        const res = await fetch('/api/urls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const datos = await res.json();

        if (!res.ok) {
            mostrarError(datos.error);
            return;
        }

        const urlCorta = `${BASE}/${datos.codigo}`;
        urlCortaEl.href = urlCorta;
        urlCortaEl.textContent = urlCorta;
        resultadoEl.hidden = false;
        urlInput.value = '';

        cargarUrls();
    } catch {
        mostrarError('Error de conexion con el servidor');
    }
});

btnCopiar.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(urlCortaEl.href);
        btnCopiar.textContent = 'Copiado!';
        setTimeout(() => { btnCopiar.textContent = 'Copiar'; }, 2000);
    } catch {
        btnCopiar.textContent = 'Error';
        setTimeout(() => { btnCopiar.textContent = 'Copiar'; }, 2000);
    }
});

cuerpoTabla.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('btn-borrar')) return;

    const codigo = e.target.dataset.codigo;
    try {
        await fetch(`/api/urls/${codigo}`, { method: 'DELETE' });
        cargarUrls();
    } catch {
        // silenciar error
    }
});

cargarUrls();
