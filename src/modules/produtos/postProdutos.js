// // modules/produto/postProduto.js
import db from "../../db.js";

// export async function createProduto(req, res) {
//     const { nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular } = req.body;
//     const pdfFile = req.files['pdf'][0]; // Supõe-se que você envie o PDF com o nome 'pdf'
//     const fotosFiles = req.files['fotos']; // Supõe-se que você envie as fotos com o nome 'fotos'

//     try {
//         // Inserir o produto no banco de dados
//         const produto = await db.one(`
//             INSERT INTO produtos 
//                 (nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, fotos, pdf)
//             VALUES 
//                 ($1, $2, $3, $4, $5, $6, $7, $8)
//             RETURNING id
//         `, [nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, fotosFiles.length > 0 ? fotosFiles[0].buffer : null, pdfFile.buffer]);

//         res.status(201).json({ message: "Produto criado com sucesso", produtoId: produto.id });
//     } catch (error) {
//         console.error("Erro ao criar produto:", error);
//         res.status(500).json({ error: "Erro ao criar produto" });
//     }
// }

export async function createProduto(req, res) {
    const { nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular } = req.body;
    const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;
    const fotosFiles = req.files['fotos'] || [];

    try {
        // Converter o valor para um número com duas casas decimais
        const valorNumerico = parseFloat(valor.replace(',', '.')).toFixed(2);
        console.log('Valor inserido:', valorNumerico);


        const produto = await db.one(`
            INSERT INTO produtos 
                (nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, pdf)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [nome_produto, descricao, categoria, nivel_ensino, valorNumerico, componente_curricular, pdfFile ? pdfFile.buffer : null]);

        // Inserir as fotos relacionadas ao produto
        for (const foto of fotosFiles) {
            await db.none(`
                INSERT INTO fotos_produtos (produto_id, foto)
                VALUES ($1, $2)
            `, [produto.id, foto.buffer]);
        }

        res.status(201).json({ message: "Produto criado com sucesso", produtoId: produto.id });
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        res.status(500).json({ error: "Erro ao criar produto" });
    }
}
