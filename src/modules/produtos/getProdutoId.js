import db from "../../db.js";

export async function obterProduto(id) {
    try {
        const produto = await db.oneOrNone(`
            SELECT p.id, p.nome_produto, p.descricao, p.categoria, p.nivel_ensino, p.valor, p.componente_curricular,
                   json_agg(encode(f.foto, 'base64')) AS fotos
            FROM produtos p
            LEFT JOIN fotos_produtos f ON p.id = f.produto_id
            WHERE p.id = $1
            GROUP BY p.id
        `, [id]);

        console.log(produto);

        return produto;
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        throw error;
    }
}
