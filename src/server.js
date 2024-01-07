import http from 'node:http'
import { json } from './middlewares/json.js'
import 'dotenv/config';
import { routes } from './routes.js';
import { extractQueryParams } from './utils/extract-query-params.js';

// Query Parameters: URL Stateful  => Filtros, paginação, não-obrigatórios
// http://localhost:3333/users?userId=1

// Route Parameters: Identificação de recurso
// GET http://localhost:3333/users/1
// DELETE http://localhost:3333/users/1

// Request Body: Envio de informações de um formulário (HTTPs)
// POST http://localhost:3333/users

//Edição e remoção


const port = process.env.PORT

const server = http.createServer(requestHandler);

async function requestHandler(req, res) {
    const { method, url } = req;

    try {
        await json(req, res);
    } catch {
        return res.writeHead(400).end('JSON Inválido');
    }

    const route = routes.find(route => {
        return route.method === method && route.path.test(url);
    })

    if (route) {
        const routeParams = req.url.match(route.path)

        // console.log(extractQueryParams(routeParams.groups.query))

        const { query, ...params } = routeParams.groups

        req.params = params
        req.query = query ? extractQueryParams(query) : {}
        
        return route.handler(req, res)
    }

    return res.writeHead(404).end()
}

server.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});