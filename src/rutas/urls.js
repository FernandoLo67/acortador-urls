const { Router } = require('express');
const { nanoid } = require('nanoid');

function esUrlValida(texto) {
    try {
        const url = new URL(texto);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function crearRouter(almacen) {
    const router = Router();

    router.get('/', (req, res) => {
        res.json(almacen.listar());
    });

    router.post('/', (req, res) => {
        const { url } = req.body;

        if (!url || typeof url !== 'string' || !url.trim()) {
            return res.status(400).json({ error: 'La URL es obligatoria' });
        }

        const limpia = url.trim();

        if (!esUrlValida(limpia)) {
            return res.status(400).json({
                error: 'La URL no es valida. Debe empezar con http:// o https://'
            });
        }

        const nueva = almacen.crear({
            codigo: nanoid(7),
            original: limpia,
            clicks: 0,
            creadoEn: new Date().toISOString(),
            ultimoAcceso: null
        });

        res.status(201).json(nueva);
    });

    router.get('/:codigo', (req, res) => {
        const url = almacen.buscarPorCodigo(req.params.codigo);
        if (!url) {
            return res.status(404).json({ error: 'URL no encontrada' });
        }
        res.json(url);
    });

    router.delete('/:codigo', (req, res) => {
        if (!almacen.eliminar(req.params.codigo)) {
            return res.status(404).json({ error: 'URL no encontrada' });
        }
        res.status(204).end();
    });

    return router;
}

module.exports = crearRouter;
