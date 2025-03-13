import db from "../../db.js";

export async function obterProdutos(ids) {
    try {
        const produtos = await db.any(`
            SELECT id, nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, fotos
            FROM produtos
            WHERE id IN ($1:csv)
        `, [ids]);

        return produtos;
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        throw error;
    }
}

// 🔹 Busca o PDF do banco de dados (armazenado como BLOB)
export async function obterPDF(id) {
    try {
        const produto = await db.oneOrNone(`
            SELECT pdf FROM produtos WHERE id = $1
        `, [id]);

        if (!produto || !produto.pdf) {
            return null;
        }

        // Converter BLOB para Base64
        return Buffer.from(produto.pdf).toString("base64");
    } catch (error) {
        console.error("Erro ao buscar PDF:", error);
        throw error;
    }
}
