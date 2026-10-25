# Acortador de URLs

Acortador de URLs completo con backend en Node.js + Express, frontend en vanilla JavaScript y persistencia en archivo JSON.

Pega una URL larga, obtene un codigo corto, y cada visita al codigo redirige a la original contando los clicks.

## Como ejecutar

```bash
npm install
npm start
```

Abrir `http://localhost:3000`. El formulario acorta URLs y la tabla muestra las creadas con su contador de clicks.

Para desarrollo con recarga automatica:

```bash
npm run dev
```

## La API

| Metodo | Ruta | Que hace |
|---|---|---|
| `POST` | `/api/urls` | Acorta una URL |
| `GET` | `/api/urls` | Lista todas las URLs con sus stats |
| `GET` | `/api/urls/:codigo` | Stats de una URL |
| `DELETE` | `/api/urls/:codigo` | Elimina una URL |
| `GET` | `/:codigo` | **Redirige** a la URL original (301) |

### Ejemplo

```bash
# Acortar una URL
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://developer.mozilla.org/es/docs/Web/JavaScript"}'

# Respuesta
{
  "codigo": "aB3xK9m",
  "original": "https://developer.mozilla.org/es/docs/Web/JavaScript",
  "clicks": 0,
  "creadoEn": "2026-10-24T...",
  "ultimoAcceso": null
}

# Visitar la URL corta (redirige con 301)
curl -I http://localhost:3000/aB3xK9m
# Location: https://developer.mozilla.org/es/docs/Web/JavaScript

# Ver stats despues de unos clicks
curl http://localhost:3000/api/urls/aB3xK9m
# { "clicks": 5, "ultimoAcceso": "2026-10-24T..." }
```

## Las decisiones

**El app se exporta como funcion, no como singleton.** `crearApp(almacen)` recibe el almacen por parametro. Eso permite que cada test cree su propia instancia con un almacen en memoria — sin archivos, sin estado compartido, sin limpiar entre tests. Es inyeccion de dependencias sin framework.

**El almacen es una clase con dos modos.** Con un path de archivo, persiste a JSON. Sin archivo, vive solo en memoria. Los tests usan el segundo modo; produccion usa el primero. La misma clase, sin mocks ni dobles.

**Codigos de 7 caracteres con nanoid.** 7 caracteres del alfabeto de nanoid (A-Za-z0-9_-) dan 64^7 combinaciones — mas de 4 billones. Para un acortador personal es mas que suficiente. Si un codigo colisionara, la probabilidad es tan baja que no vale la pena complicar el codigo con reintentos.

**Redireccion con 301, no 302.** 301 es permanente: el navegador la cachea y no vuelve a pedir al servidor. 302 es temporal y obliga al navegador a pasar por el servidor cada vez. Para un acortador donde la URL destino no cambia, 301 es lo correcto — y de paso reduce la carga.

**Validacion con el constructor de URL.** `new URL(texto)` lanza si el texto no es una URL valida. Es la misma validacion que usa el navegador, y no necesita regex. Se filtra ademas por protocolo: solo `http:` y `https:`, no `ftp:`, no `javascript:`, no `data:`.

**El frontend no usa frameworks.** `fetch()` para las llamadas, `innerHTML` con template literals para renderizar, event delegation para los botones de borrar. Es todo lo que hace falta para una interfaz de una sola pagina sin SPA router.

**CSS responsive sin media queries complicadas.** En movil, la tabla se convierte en tarjetas con `display: block` y `data-label` en cada celda. Funciona de 320px a pantalla completa.

## Estructura

```
src/
├── index.js           Punto de entrada, crea el almacen y arranca el servidor
├── app.js             Express app, exportada como funcion para testear
├── almacen.js         Map en memoria + persistencia opcional a JSON
├── rutas/
│   └── urls.js        CRUD de URLs y validacion
└── public/
    ├── index.html     Formulario + tabla de URLs
    ├── estilos.css    Responsive, sin frameworks CSS
    └── main.js        fetch + DOM, sin frameworks JS
__tests__/
└── api.test.js        18 pruebas con Jest + supertest
```

## Las 18 pruebas

Todas son pruebas de integracion: hacen peticiones HTTP reales contra la app de Express con supertest. Cada test arranca con un almacen limpio en memoria.

**POST** (7) — URL valida, vacia, invalida, sin cuerpo, protocolo ftp, espacios, http.

**GET lista** (2) — vacia al inicio, ordenadas por fecha.

**GET stats** (2) — stats de una URL, 404.

**GET redireccion** (3) — redirige con 301, incrementa clicks, 404.

**DELETE** (4) — elimina, 404, deja de redirigir, desaparece de la lista.

```bash
npm test
```

## Requisitos

- Node.js 18+
- npm
