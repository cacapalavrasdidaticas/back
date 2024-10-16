// modules/produto/getProduto.js
import db from "../../db.js";

export async function obterProduto(id) {
    try {
        // Fazer a query e logar os resultados
        const produto = await db.oneOrNone(`
            SELECT id, nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, fotos, pdf
            FROM produtos
            WHERE id = $1
        `, [id]);

        console.log(`Produto retornado pelo banco de dados para ID ${id}:`, produto);

        // Se `produto` for null, retornar null explicitamente
        if (!produto) {
            console.warn(`Produto com ID ${id} não encontrado no banco de dados.`);
            return null;
        }

        return produto;
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        throw error;
    }
}
