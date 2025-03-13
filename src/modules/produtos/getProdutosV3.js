import db from "../../db.js";

export async function obterProdutoPdf(id) {
    try {
        const produto = await db.oneOrNone(`
            SELECT pdf FROM produtos WHERE id = $1
        `, [id]);

        if (!produto || !produto.pdf) {
            return null;
        }

        // Converter BLOB (binário) para Base64
        return Buffer.from(produto.pdf).toString("base64");
    } catch (error) {
        console.error("Erro ao buscar PDF do produto:", error);
        throw error;
    }
}
