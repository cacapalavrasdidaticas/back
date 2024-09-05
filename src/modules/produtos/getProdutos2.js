import db from "../../db.js";

// Função para obter todos os produtos com fotos e PDFs
export async function obterTodosProdutosV2() {
    try {
        const produtos = await db.any(`
            SELECT p.id, p.nome_produto, p.descricao, p.categoria, p.nivel_ensino, p.valor, p.componente_curricular, 
                   encode(p.pdf, 'base64') AS pdf,  -- Codificar o PDF para Base64
                   COALESCE(json_agg(encode(f.foto, 'base64')) FILTER (WHERE f.foto IS NOT NULL), '[]') AS fotos  -- Codificar as fotos para Base64
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
