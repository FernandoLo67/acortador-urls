const crearApp = require('./app');
const Almacen = require('./almacen');
const path = require('path');

const PUERTO = process.env.PORT || 3000;
const ARCHIVO = path.join(__dirname, '..', 'datos.json');

const almacen = new Almacen(ARCHIVO);
const app = crearApp(almacen);

app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
