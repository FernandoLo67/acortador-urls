const supertest = require('supertest');
const crearApp = require('../src/app');
const Almacen = require('../src/almacen');

let app;
let almacen;
let request;

beforeEach(() => {
    almacen = new Almacen();
    app = crearApp(almacen);
    request = supertest(app);
});

describe('POST /api/urls', () => {
    test('acorta una URL valida', async () => {
        const res = await request
            .post('/api/urls')
            .send({ url: 'https://example.com' });

        expect(res.status).toBe(201);
        expect(res.body.original).toBe('https://example.com');
        expect(res.body.codigo).toHaveLength(7);
        expect(res.body.clicks).toBe(0);
        expect(res.body.creadoEn).toBeDefined();
    });

    test('rechaza URL vacia', async () => {
        const res = await request
            .post('/api/urls')
            .send({ url: '' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test('rechaza URL invalida', async () => {
        const res = await request
            .post('/api/urls')
            .send({ url: 'no-es-una-url' });

        expect(res.status).toBe(400);
    });

    test('rechaza sin cuerpo', async () => {
        const res = await request
            .post('/api/urls')
            .send({});

        expect(res.status).toBe(400);
    });

    test('rechaza protocolo ftp', async () => {
        const res = await request
            .post('/api/urls')
            .send({ url: 'ftp://files.example.com' });

        expect(res.status).toBe(400);
    });

    test('limpia espacios alrededor de la URL', async () => {
        const res = await request
            .post('/api/urls')
            .send({ url: '  https://example.com  ' });

        expect(res.status).toBe(201);
        expect(res.body.original).toBe('https://example.com');
    });

    test('acepta URL con http', async () => {
        const res = await request
            .post('/api/urls')
            .send({ url: 'http://example.com' });

        expect(res.status).toBe(201);
    });
});

describe('GET /api/urls', () => {
    test('lista vacia al inicio', async () => {
        const res = await request.get('/api/urls');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('lista las URLs creadas ordenadas por fecha', async () => {
        await request.post('/api/urls').send({ url: 'https://a.com' });
        await request.post('/api/urls').send({ url: 'https://b.com' });

        const res = await request.get('/api/urls');

        expect(res.body).toHaveLength(2);
        expect(res.body[0].original).toBe('https://b.com');
    });
});

describe('GET /api/urls/:codigo', () => {
    test('devuelve stats de una URL', async () => {
        const crear = await request
            .post('/api/urls')
            .send({ url: 'https://example.com' });

        const res = await request
            .get(`/api/urls/${crear.body.codigo}`);

        expect(res.status).toBe(200);
        expect(res.body.clicks).toBe(0);
        expect(res.body.original).toBe('https://example.com');
    });

    test('404 para codigo inexistente', async () => {
        const res = await request.get('/api/urls/noexist');

        expect(res.status).toBe(404);
    });
});

describe('GET /:codigo (redireccion)', () => {
    test('redirige a la URL original con 301', async () => {
        const crear = await request
            .post('/api/urls')
            .send({ url: 'https://example.com' });

        const res = await request.get(`/${crear.body.codigo}`);

        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('https://example.com');
    });

    test('incrementa el contador de clicks', async () => {
        const crear = await request
            .post('/api/urls')
            .send({ url: 'https://example.com' });

        const codigo = crear.body.codigo;

        await request.get(`/${codigo}`);
        await request.get(`/${codigo}`);
        await request.get(`/${codigo}`);

        const stats = await request.get(`/api/urls/${codigo}`);

        expect(stats.body.clicks).toBe(3);
        expect(stats.body.ultimoAcceso).toBeDefined();
    });

    test('404 para codigo inexistente', async () => {
        const res = await request.get('/noexiste');

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/urls/:codigo', () => {
    test('elimina una URL', async () => {
        const crear = await request
            .post('/api/urls')
            .send({ url: 'https://example.com' });

        const res = await request
            .delete(`/api/urls/${crear.body.codigo}`);

        expect(res.status).toBe(204);
    });

    test('404 para codigo inexistente', async () => {
        const res = await request.delete('/api/urls/noexist');

        expect(res.status).toBe(404);
    });

    test('la URL deja de redirigir despues de eliminarla', async () => {
        const crear = await request
            .post('/api/urls')
            .send({ url: 'https://example.com' });

        await request.delete(`/api/urls/${crear.body.codigo}`);

        const redirect = await request.get(`/${crear.body.codigo}`);

        expect(redirect.status).toBe(404);
    });

    test('la URL desaparece de la lista', async () => {
        const crear = await request
            .post('/api/urls')
            .send({ url: 'https://example.com' });

        await request.delete(`/api/urls/${crear.body.codigo}`);

        const lista = await request.get('/api/urls');

        expect(lista.body).toHaveLength(0);
    });
});
