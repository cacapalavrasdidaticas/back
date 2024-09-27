import db from "../../db.js";

// Função para buscar um cliente na tabela de contas
async function buscarCliente(clientId) {
    try {
        const query = 'SELECT * FROM contas WHERE id = $1'; // Ajuste conforme a sua tabela de contas
        const result = await db.query(query, [clientId]);

        if (result) {
            return result; // Retorna o cliente
        } else {
            throw new Error('Cliente não encontrado');
        }
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        throw error;
    }
}

// Função para buscar um produto na tabela de produtos
async function buscarProduto(productId) {
    try {
        const query = 'SELECT * FROM produtos WHERE id = $1'; // Ajuste conforme a sua tabela de produtos
        const result = await db.query(query, [productId]);

        if (result) {
            return result; // Retorna o produto
        } else {
            throw new Error('Produto não encontrado');
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        throw error;
    }
}

export { buscarCliente, buscarProduto };
