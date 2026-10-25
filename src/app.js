const express = require('express');
const path = require('path');
const crearUrlsRouter = require('./rutas/urls');

function crearApp(almacen) {
    const app = express();

    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/api/urls', crearUrlsRouter(almacen));

    app.get('/:codigo', (req, res) => {
        const url = almacen.incrementarClicks(req.params.codigo);
        if (!url) {
            return res.status(404).json({ error: 'URL no encontrada' });
        }
        res.redirect(301, url.original);
    });

    app.use((err, req, res, _next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Error interno del servidor' });
    });

    return app;
}

module.exports = crearApp;
