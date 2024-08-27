import db from "../../db.js";

export async function updateProduto(req, res) {
    const { nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular } = req.body;
    const { id } = req.params;
    const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;
    const fotosFiles = req.files['fotos'] || [];

    try {
        // Converter o valor para um número com duas casas decimais
        const valorNumerico = parseFloat(valor).toFixed(2);
        console.log('Valor atualizado:', valorNumerico);

        // Atualizar o produto na tabela 'produtos'
        await db.none(`
            UPDATE produtos
            SET 
                nome_produto = $1,
                descricao = $2,
                categoria = $3,
                nivel_ensino = $4,
                valor = $5,
                componente_curricular = $6,
                pdf = COALESCE($7, pdf)  -- Atualizar o PDF apenas se um novo for enviado
            WHERE id = $8
        `, [nome_produto, descricao, categoria, nivel_ensino, valorNumerico, componente_curricular, pdfFile ? pdfFile.buffer : null, id]);

        // Se novas fotos forem enviadas, atualizar as fotos relacionadas ao produto
        if (fotosFiles.length > 0) {
            // Primeiro, remover as fotos antigas (ou você pode decidir manter as antigas e apenas adicionar as novas)
            await db.none(`
                DELETE FROM fotos_produtos
                WHERE produto_id = $1
            `, [id]);

            // Inserir as novas fotos
            for (const foto of fotosFiles) {
                await db.none(`
                    INSERT INTO fotos_produtos (produto_id, foto)
                    VALUES ($1, $2)
                `, [id, foto.buffer]);
            }
        }

        res.status(200).json({ message: "Produto atualizado com sucesso" });
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        res.status(500).json({ error: "Erro ao atualizar produto" });
    }
}
