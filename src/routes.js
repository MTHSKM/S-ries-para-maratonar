import { Database } from "./database.js";
import { randomUUID } from 'node:crypto';
import { buildRoutePath } from "./utils/build-route-path.js";

const database = new Database();

// Handler para adicionar uma nova série
function handleAddSerie(req, res) {
    const { plataformaNome, nome_da_serie, assistiu } = req.body;

    if (!plataformaNome || !nome_da_serie) {
        res.writeHead(400).end('Dados inválidos');
        return;
    }

    // Adiciona a plataforma se ela não existir
    let plataforma = database.select('plataformas', { nome: plataformaNome })[0];
    if (!plataforma) {
        plataforma = { id: randomUUID(), nome: plataformaNome, series: [] };
        database.insert('plataformas', plataforma);
    }

    const serie = { id: randomUUID(), nome_da_serie, assistiu: assistiu || 'Não' };
    plataforma.series.push(serie);

    database.update('plataformas', plataforma.id, plataforma);

    res.writeHead(201, { 'Content-Type': 'text/plain' });
    res.end('Série adicionada com sucesso');
}

// Handler para atualizar o status de uma série
function handleUpdateSerieStatus(req, res) {
    const { plataformaId, serieId, assistiu } = req.body;

    if (!plataformaId || !serieId || !assistiu) {
        res.writeHead(400).end('Dados inválidos');
        return;
    }

    const plataformas = database.select('plataformas');
    let serieAtualizada = false;

    for (let plataforma of plataformas) {
        if (plataforma.id === plataformaId) {
            const serie = plataforma.series.find(s => s.id === serieId);
            if (serie) {
                serie.assistiu = assistiu;
                database.update('plataformas', plataforma.id, plataforma);
                serieAtualizada = true;
                break; // Série encontrada e atualizada, não é necessário continuar
            }
        }
    }

    if (serieAtualizada) {
        res.writeHead(200).end('Status da série atualizado com sucesso');
    } else {
        res.writeHead(404).end('Série ou plataforma não encontrada');
    }
}

// Handler para remover uma série
function handleDeleteSerie(req, res) {
    const { plataformaId, serieId } = req.body;

    if (!plataformaId || !serieId) {
        res.writeHead(400).end('IDs de plataforma ou série não especificados');
        return;
    }

    // Procura na plataforma especificada para encontrar e remover a série
    const plataformas = database.select('plataformas');
    let serieRemovida = false;

    const plataforma = plataformas.find(plat => plat.id === plataformaId);
    if (plataforma) {
        const index = plataforma.series.findIndex(serie => serie.id === serieId);
        if (index !== -1) {
            plataforma.series.splice(index, 1);
            database.update('plataformas', plataforma.id, plataforma);
            serieRemovida = true;
        }
    }

    if (serieRemovida) {
        res.writeHead(200).end('Série removida com sucesso');
    } else {
        res.writeHead(404).end('Plataforma ou série não encontrada');
    }
}

// Handler para GET em /series/:plataformaId
function handleGetSeries(req, res) {
    const plataformaId = req.url.split('/')[2];

    if (!plataformaId) {
        res.writeHead(400).end('Plataforma não especificada');
        return;
    }

    const plataforma = database.select('plataformas', { id: plataformaId })[0];

    if (plataforma && plataforma.series.length > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(plataforma.series));
    } else {
        res.writeHead(404).end('Nenhuma série encontrada para a plataforma especificada');
    }
}

function handleGetAllSeries(req, res) {
    const plataformas = database.select('plataformas');

    let todasSeries = [];
    plataformas.forEach(plataforma => {
        const seriesComInfoPlataforma = plataforma.series.map(serie => {
            return {
                plataformaId: plataforma.id,
                plataformaNome: plataforma.nome,
                ...serie
            };
        });
        todasSeries = todasSeries.concat(seriesComInfoPlataforma);
    });

    if (todasSeries.length > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(todasSeries));
    } else {
        res.writeHead(404).end('Nenhuma série encontrada');
    }
}

// Definição das rotas para séries
const Seriesroutes = [
    {
        method: 'POST',
        path: buildRoutePath('/series/add'),
        handler: handleAddSerie
    },
    {
        method: 'PUT',
        path: buildRoutePath('/series/update'),
        handler: handleUpdateSerieStatus
    },
    {
        method: 'DELETE',
        path: buildRoutePath('/series/delete'),
        handler: handleDeleteSerie
    },   
    {
        method: 'GET',
        path: buildRoutePath('/series/:plataformaId'),
        handler: handleGetSeries
    },
    {
        method: 'GET',
        path: buildRoutePath('/series'),
        handler: handleGetAllSeries
    }
];

export const routes = [...Seriesroutes]