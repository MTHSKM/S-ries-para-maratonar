import fs from 'node:fs/promises';
import 'dotenv/config';

const DB_URL = process.env.DB_URL
const databasePath = new URL(DB_URL, import.meta.url);

export class Database {
    #database = {};

    constructor() {
        this.init().catch(err => console.error('Erro ao inicializar o banco de dados:', err));
    }

    async init() {
        try {
            const data = await fs.readFile(databasePath, 'utf8');
            this.#database = JSON.parse(data);
        } catch (error) {
            this.#persist(); // Persiste um banco de dados vazio se falhar ao carregar
        }
    }

    async #persist() {
        try {
            await fs.writeFile(databasePath, JSON.stringify(this.#database, null, 2));
        } catch (error) {
            console.error('Erro ao persistir dados:', error);
        }
    }

    select(table, search = null) {
        let data = this.#database[table] ?? [];
    
        if (search) {
            data = data.filter(row =>
                Object.entries(search).some(([key, value]) =>
                    row[key] && row[key].toString().toLowerCase().includes(value.toLowerCase())
                )
            );
        }
        return data;
    }
    

    insert(table, data) {
        this.#database[table] = this.#database[table] || [];
        this.#database[table].push(data);
        this.#persist();
        return data;
    }

    delete(table, id) {
        if (!Array.isArray(this.#database[table])) {
            console.error(`Tabela ${table} não encontrada ou não é um array`);
            return false;
        }

        const index = this.#database[table].findIndex(item => item.id === id);
        if (index === -1) {
            console.error(`Registro com ID ${id} não encontrado na tabela ${table}`);
            return false;
        }

        this.#database[table].splice(index, 1);
        this.#persist();
        return true;
    }

    update(table, id, newData) {
        if (!Array.isArray(this.#database[table])) {
            console.error(`Tabela ${table} não encontrada ou não é um array`);
            return false;
        }

        const item = this.#database[table].find(item => item.id === id);
        if (!item) {
            console.error(`Registro com ID ${id} não encontrado na tabela ${table}`);
            return false;
        }

        Object.assign(item, newData);
        this.#persist();
        return true;
    }

    // Novo método para atualizar o status de uma série
    updateSerieStatus(plataforma, nomeDaSerie, status) {
        const plataformaData = this.#database[plataforma];

        if (!plataformaData) {
            console.error(`Plataforma ${plataforma} não encontrada`);
            return false;
        }

        const serie = plataformaData.series.find(s => s.nome_da_serie === nomeDaSerie);

        if (!serie) {
            console.error(`Série ${nomeDaSerie} não encontrada na plataforma ${plataforma}`);
            return false;
        }

        serie.assistiu = status;
        this.#persist();
        return true;
    }
}