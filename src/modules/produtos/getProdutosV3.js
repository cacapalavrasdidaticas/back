import express from "express";
import db from "../../db.js"; // Ajuste o caminho conforme necessário

const app = express();

app.get("/produtos", async (req, res) => {
    const { ids } = req.query;

    if (!ids) {
        return res.status(400).json({ error: "IDs dos produtos são necessários" });
    }

    const idsArray = ids.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (idsArray.length === 0) {
        return res.status(400).json({ error: "Nenhum ID válido fornecido" });
    }

    try {
        const produtos = await db.any(`
            SELECT id, nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, fotos, pdf
            FROM produtos
            WHERE id IN ($1:csv)
        `, [idsArray]);

        res.status(200).json(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ error: "Erro ao buscar produtos" });
    }
});

export default app;
