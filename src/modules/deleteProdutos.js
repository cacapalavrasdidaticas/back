import db from "../../db.js";

export async function deleteProduto(req, res) {
    const { id } = req.params;

    try {
        // Remover as fotos relacionadas ao produto
        await db.none(`
            DELETE FROM fotos_produtos
            WHERE produto_id = $1
        `, [id]);

        // Remover o produto
        await db.none(`
            DELETE FROM produtos
            WHERE id = $1
        `, [id]);

        res.status(200).json({ message: "Produto deletado com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar produto:", error);
        res.status(500).json({ error: "Erro ao deletar produto" });
    }
}
