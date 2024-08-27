// modules/produto/getProduto.js
import db from "../../db.js";

export async function obterProduto(id) {
    try {
        const produto = await db.oneOrNone(`
            SELECT id, nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, fotos, pdf
            FROM produtos
            WHERE id = $1
        `, [id]);

        return produto;
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        throw error;
    }
}
