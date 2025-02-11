export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Habilitar CORS
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // Criar a tabela estoque se não existir
        await createEstoqueTable(env);

        // Rota para /estoque
        if (url.pathname === "/estoque") {
            if (request.method === "GET") {
                return getEstoque(env);
            } else if (request.method === "POST") {
                return addEstoque(request, env);
            }
        }

        return new Response("Rota não encontrada", {
            status: 404,
            headers: headers,
        });
    }
};

// Criar a tabela 'estoque' se não existir
async function createEstoqueTable(env) {
    try {
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS estoque (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                modelo TEXT NOT NULL,
                numero_serie TEXT,
                descricao TEXT,
                preco REAL NOT NULL,
                quantidade INTEGER NOT NULL,
                data_aquisicao TEXT NOT NULL,
                fornecedor TEXT,
                observacoes TEXT
            )
        `).run();
        console.log("Tabela 'estoque' criada ou já existe.");
    } catch (error) {
        console.error("Erro ao criar tabela estoque:", error);
    }
}

// Retornar os itens do estoque
async function getEstoque(env) {
    try {
        const { results } = await env.DB.prepare("SELECT * FROM estoque").all();

        return new Response(JSON.stringify(results.length ? results : { message: "Nenhum item no estoque" }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Erro ao buscar estoque:", error);
        return new Response(JSON.stringify({ error: "Erro ao buscar estoque" }), { status: 500 });
    }
}

// Adicionar um novo item no estoque
async function addEstoque(request, env) {
    try {
        const data = await request.json();

        if (!data.nome || !data.modelo || !data.preco || !data.quantidade) {
            return new Response(JSON.stringify({ error: "Todos os campos são obrigatórios!" }), { status: 400 });
        }

        await env.DB.prepare(`
            INSERT INTO estoque (nome, modelo, preco, quantidade, descricao, numero_serie, fornecedor, observacoes, data_aquisicao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            data.nome,
            data.modelo,
            data.preco,
            data.quantidade,
            data.descricao || null,
            data.numero_serie || null,
            data.fornecedor || null,
            data.observacoes || null,
            new Date().toISOString()
        ).run();

        return new Response(JSON.stringify({ message: "Item adicionado com sucesso!" }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Erro ao adicionar item:", error);
        return new Response(JSON.stringify({ error: "Erro ao adicionar item" }), { status: 500 });
    }
}
