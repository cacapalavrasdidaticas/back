import db from "../../db.js";
import fs from "fs";
import path from "path";

// Diretório temporário para armazenar partes de PDFs
const tempDir = path.join(process.env.TEMP || '/tmp', 'pdf-uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

export async function createProdutoV2(req, res) {
    const { nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, partIndex, totalParts, nomeArquivo, selectedProducts } = req.body;
    const fotosFiles = req.files['fotos'] || [];
    const pdfPart = req.files['part'] ? req.files['part'][0] : null;
    let produtoId = null;

    try {
        if (pdfPart) {
            const caminhoArquivoTemporario = path.join(tempDir, `${nomeArquivo}-part-${partIndex}`);
            fs.writeFileSync(caminhoArquivoTemporario, pdfPart.buffer, 'binary');
            console.log(`Parte ${parseInt(partIndex) + 1} de ${totalParts} recebida`);

            if (parseInt(partIndex) + 1 === parseInt(totalParts)) {
                const arquivoFinalPath = path.join(tempDir, nomeArquivo);
                const writeStream = fs.createWriteStream(arquivoFinalPath, { flags: 'w' });

                for (let i = 0; i < totalParts; i++) {
                    const partePath = path.join(tempDir, `${nomeArquivo}-part-${i}`);
                    const parteData = fs.readFileSync(partePath, 'binary');
                    writeStream.write(parteData, 'binary');
                    fs.unlinkSync(partePath);
                }

                writeStream.end();

                writeStream.on('finish', async () => {
                    try {
                        const pdfData = fs.readFileSync(arquivoFinalPath);

                        // Processar `selectedProducts`
                        let selectedProductsValue = null;
                        if (selectedProducts) {
                            try {
                                const parsedProducts = JSON.parse(selectedProducts);
                                selectedProductsValue = Array.isArray(parsedProducts)
                                    ? parsedProducts.map(id => parseInt(id)) // Converte IDs para inteiros
                                    : [];
                            } catch (e) {
                                console.error("Erro ao processar selectedProducts:", e);
                                selectedProductsValue = [];
                            }
                        }

                        // Inserir o produto no banco de dados com `selectedProducts`
                        const produto = await db.one(`
                            INSERT INTO produtos 
                                (nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, pdf, selectedProducts)
                            VALUES 
                                ($1, $2, $3, $4, $5, $6, $7::bytea, $8)
                            RETURNING id
                        `, [
                            nome_produto, descricao, categoria, nivel_ensino,
                            parseFloat(valor).toFixed(2), componente_curricular,
                            pdfData, selectedProductsValue || null
                        ]);

                        produtoId = produto.id;

                        // Salvar as fotos no banco de dados
                        for (const foto of fotosFiles) {
                            await db.none(`
                                INSERT INTO fotos_produtos (produto_id, foto)
                                VALUES ($1, $2)
                            `, [produtoId, foto.buffer]);
                        }

                        console.log("Fotos e produtos relacionados salvos com sucesso.");
                        fs.unlinkSync(arquivoFinalPath);

                        res.status(201).json({ message: "Produto criado com sucesso", produtoId: produto.id });
                    } catch (error) {
                        console.error("Erro ao salvar no banco de dados:", error);
                        res.status(500).json({ error: "Erro ao salvar no banco de dados" });
                    }
                });

                writeStream.on('error', (error) => {
                    console.error('Erro ao finalizar a gravação do arquivo PDF:', error);
                    res.status(500).json({ error: "Erro ao processar o PDF final" });
                });
            } else {
                res.status(200).json({ message: `Parte ${parseInt(partIndex) + 1} de ${totalParts} recebida com sucesso` });
            }
        }
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        res.status(500).json({ error: "Erro ao criar produto" });
    }
}













































// import db from "../../db.js";
// import fs from "fs";
// import path from "path";

// // Diretório temporário para armazenar partes de PDFs
// const tempDir = path.join(process.env.TEMP || '/tmp', 'pdf-uploads');
// if (!fs.existsSync(tempDir)) {
//     fs.mkdirSync(tempDir, { recursive: true });
// }



// export async function createProdutoV2(req, res) {
//     const { nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, partIndex, totalParts, nomeArquivo } = req.body;
//     const fotosFiles = req.files['fotos'] || [];  // Captura os arquivos de fotos
//     const pdfPart = req.files['part'] ? req.files['part'][0] : null;  // Captura a parte do PDF
//     let produtoId = null;

//     try {
//         if (pdfPart) {
//             const caminhoArquivoTemporario = path.join(tempDir, `${nomeArquivo}-part-${partIndex}`);

//             // Salvar a parte temporariamente em binário
//             fs.writeFileSync(caminhoArquivoTemporario, pdfPart.buffer, 'binary');
//             console.log(`Parte ${parseInt(partIndex) + 1} de ${totalParts} recebida`);

//             if (parseInt(partIndex) + 1 === parseInt(totalParts)) {
//                 const arquivoFinalPath = path.join(tempDir, nomeArquivo);
//                 const writeStream = fs.createWriteStream(arquivoFinalPath, { flags: 'w' });

//                 // Montar o PDF completo unindo todas as partes
//                 for (let i = 0; i < totalParts; i++) {
//                     const partePath = path.join(tempDir, `${nomeArquivo}-part-${i}`);
//                     const parteData = fs.readFileSync(partePath, 'binary');
//                     writeStream.write(parteData, 'binary');
//                     fs.unlinkSync(partePath);  // Remover a parte após juntar
//                 }

//                 writeStream.end();

//                 writeStream.on('finish', async () => {
//                     try {
//                         const pdfData = fs.readFileSync(arquivoFinalPath);  // Lê o PDF como binário

//                         // Inserir o produto com o PDF no banco de dados (após a última parte do PDF)
//                         const produto = await db.one(`
//                             INSERT INTO produtos 
//                                 (nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, pdf)
//                             VALUES 
//                                 ($1, $2, $3, $4, $5, $6, $7::bytea)
//                             RETURNING id
//                         `, [nome_produto, descricao, categoria, nivel_ensino, parseFloat(valor).toFixed(2), componente_curricular, pdfData]);

//                         produtoId = produto.id;

//                         // Salvar as fotos no banco de dados (depois de salvar o produto)
//                         for (const foto of fotosFiles) {
//                             await db.none(`
//                                 INSERT INTO fotos_produtos (produto_id, foto)
//                                 VALUES ($1, $2)
//                             `, [produtoId, foto.buffer]);
//                         }

//                         console.log("Fotos salvas com sucesso.");

//                         // Remover o arquivo PDF temporário
//                         fs.unlinkSync(arquivoFinalPath);

//                         res.status(201).json({ message: "Produto criado com sucesso", produtoId: produto.id });
//                     } catch (error) {
//                         console.error("Erro ao salvar o PDF no banco de dados:", error);
//                         res.status(500).json({ error: "Erro ao salvar o PDF no banco de dados" });
//                     }
//                 });

//                 writeStream.on('error', (error) => {
//                     console.error('Erro ao finalizar a gravação do arquivo PDF:', error);
//                     res.status(500).json({ error: "Erro ao processar o PDF final" });
//                 });
//             } else {
//                 res.status(200).json({ message: `Parte ${parseInt(partIndex) + 1} de ${totalParts} recebida com sucesso` });
//             }
//         }
//     } catch (error) {
//         console.error("Erro ao criar produto:", error);
//         res.status(500).json({ error: "Erro ao criar produto" });
//     }
// }


