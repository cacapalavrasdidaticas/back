// modules/produto/getProdutos.js
import db from "../../db.js";

// export async function obterTodosProdutos() {
//     try {
//         const produtos = await db.any(`
//             SELECT p.id, p.nome_produto, p.descricao, p.categoria, p.nivel_ensino, p.valor, p.componente_curricular, p.pdf,
//                    json_agg(f.foto) AS fotos
//             FROM produtos p
//             LEFT JOIN fotos_produtos f ON p.id = f.produto_id
//             GROUP BY p.id
//         `);
//         return produtos;
//     } catch (error) {
//         console.error("Erro ao buscar produtos:", error);
//         throw error;
//     }
// }
export async function obterTodosProdutos() {
    try {
        const produtos = await db.any(`
            SELECT p.id, p.nome_produto, p.descricao, p.categoria, p.nivel_ensino, p.valor, p.componente_curricular, p.pdf,
                   json_agg(encode(f.foto, 'base64')) AS fotos
            FROM produtos p
            LEFT JOIN fotos_produtos f ON p.id = f.produto_id
            GROUP BY p.id
        `);
        return produtos;
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        throw error;
    }
}


