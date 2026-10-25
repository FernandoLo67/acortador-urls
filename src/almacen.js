const fs = require('fs');

class Almacen {
    constructor(archivo) {
        this.archivo = archivo;
        this.urls = new Map();
        if (archivo) this._cargar();
    }

    _cargar() {
        try {
            const datos = JSON.parse(fs.readFileSync(this.archivo, 'utf-8'));
            for (const url of datos) {
                this.urls.set(url.codigo, url);
            }
        } catch {
            // archivo no existe todavia
        }
    }

    _guardar() {
        if (!this.archivo) return;
        fs.writeFileSync(this.archivo, JSON.stringify(Array.from(this.urls.values()), null, 2));
    }

    crear(entrada) {
        this.urls.set(entrada.codigo, entrada);
        this._guardar();
        return entrada;
    }

    buscarPorCodigo(codigo) {
        return this.urls.get(codigo) || null;
    }

    listar() {
        return Array.from(this.urls.values())
            .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
    }

    incrementarClicks(codigo) {
        const url = this.urls.get(codigo);
        if (!url) return null;
        url.clicks++;
        url.ultimoAcceso = new Date().toISOString();
        this._guardar();
        return url;
    }

    eliminar(codigo) {
        const existia = this.urls.delete(codigo);
        if (existia) this._guardar();
        return existia;
    }

    limpiar() {
        this.urls.clear();
        if (this.archivo) this._guardar();
    }
}

module.exports = Almacen;
