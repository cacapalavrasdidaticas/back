import db from "../../db.js";
import fs from "fs";
import path from "path";

// Diretório temporário para armazenar partes de PDFs
const tempDir = path.join(process.env.TEMP || '/tmp', 'pdf-uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

export async function createProdutoV2(req, res) {
    const {
        nome_produto,
        descricao,
        categoria,
        nivel_ensino,
        valor,
        componente_curricular,
        partIndex,
        totalParts,
        nomeArquivo,
        selectedProducts,
        url
    } = req.body;

    const fotosFiles = req.files?.['fotos'] || [];
    const pdfPart = req.files?.['part']?.[0] || null;
    let produtoId = null;

    try {
        if (!pdfPart) {
            return res.status(400).json({ error: "Parte do PDF não recebida." });
        }

        const partIdx = parseInt(partIndex);
        const total = parseInt(totalParts);

        if (isNaN(partIdx) || isNaN(total)) {
            return res.status(400).json({ error: "partIndex ou totalParts inválido" });
        }

        const caminhoParte = path.join(tempDir, `${nomeArquivo}-part-${partIdx}`);
        fs.writeFileSync(caminhoParte, pdfPart.buffer, 'binary');
        console.log(`Parte ${partIdx + 1} de ${total} recebida e salva em disco: ${caminhoParte}`);

        if (partIdx + 1 === total) {
            // Última parte recebida, montar PDF final
            const arquivoFinalPath = path.join(tempDir, nomeArquivo);
            const writeStream = fs.createWriteStream(arquivoFinalPath, { flags: 'w' });

            for (let i = 0; i < total; i++) {
                const partePath = path.join(tempDir, `${nomeArquivo}-part-${i}`);

                if (!fs.existsSync(partePath)) {
                    console.error(`Erro: Parte ${i} não encontrada: ${partePath}`);
                    return res.status(500).json({ error: `Parte ${i} não encontrada no servidor.` });
                }

                const parteData = fs.readFileSync(partePath, 'binary');
                writeStream.write(parteData, 'binary');
                fs.unlinkSync(partePath); // limpa a parte após uso
            }

            writeStream.end();

            writeStream.on("finish", async () => {
                try {
                    const pdfData = fs.readFileSync(arquivoFinalPath);
                    console.log("PDF montado com sucesso, tamanho:", pdfData.length);

                    // Processar selectedProducts
                    let selectedProductsValue = null;
                    if (selectedProducts) {
                        try {
                            const parsed = JSON.parse(selectedProducts);
                            selectedProductsValue = Array.isArray(parsed)
                                ? parsed.map(id => parseInt(id))
                                : [];
                        } catch (err) {
                            console.warn("Erro ao processar selectedProducts:", err.message);
                            selectedProductsValue = [];
                        }
                    }

                    // Inserir produto no banco
                    const produto = await db.one(`
                        INSERT INTO produtos 
                            (nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, pdf, url, selectedProducts)
                        VALUES 
                            ($1, $2, $3, $4, $5, $6, $7::bytea, $8, $9)
                        RETURNING id
                    `, [
                        nome_produto,
                        descricao,
                        categoria,
                        nivel_ensino,
                        parseFloat(valor).toFixed(2),
                        componente_curricular,
                        pdfData,
                        url,
                        selectedProductsValue || null
                    ]);

                    produtoId = produto.id;

                    // Inserir fotos no banco
                    for (const foto of fotosFiles) {
                        if (!foto || !foto.buffer) {
                            console.warn("Foto ignorada por estar vazia.");
                            continue;
                        }

                        await db.none(`
                            INSERT INTO fotos_produtos (produto_id, foto)
                            VALUES ($1, $2)
                        `, [produtoId, foto.buffer]);
                    }

                    fs.unlinkSync(arquivoFinalPath);
                    console.log("Produto e fotos salvos com sucesso.");
                    return res.status(201).json({ message: "Produto criado com sucesso", produtoId });

                } catch (err) {
                    console.error("Erro ao salvar no banco de dados:", err.message, err.stack);
                    return res.status(500).json({ error: "Erro ao salvar no banco de dados", detail: err.message });
                }
            });

            writeStream.on("error", (err) => {
                console.error("Erro ao montar PDF:", err.message);
                return res.status(500).json({ error: "Erro ao montar PDF final", detail: err.message });
            });

        } else {
            return res.status(200).json({ message: `Parte ${partIdx + 1} de ${total} recebida com sucesso.` });
        }
    } catch (err) {
        console.error("Erro geral ao criar produto:", err.message, err.stack);
        return res.status(500).json({ error: "Erro ao criar produto", detail: err.message });
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
//     const { nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, partIndex, totalParts, nomeArquivo, selectedProducts, url } = req.body;
//     const fotosFiles = req.files['fotos'] || [];
//     const pdfPart = req.files['part'] ? req.files['part'][0] : null;
//     let produtoId = null;

//     try {
//         if (pdfPart) {
//             const caminhoArquivoTemporario = path.join(tempDir, `${nomeArquivo}-part-${partIndex}`);
//             fs.writeFileSync(caminhoArquivoTemporario, pdfPart.buffer, 'binary');
//             console.log(`Parte ${parseInt(partIndex) + 1} de ${totalParts} recebida`);

//             if (parseInt(partIndex) + 1 === parseInt(totalParts)) {
//                 const arquivoFinalPath = path.join(tempDir, nomeArquivo);
//                 const writeStream = fs.createWriteStream(arquivoFinalPath, { flags: 'w' });

//                 for (let i = 0; i < totalParts; i++) {
//                     const partePath = path.join(tempDir, `${nomeArquivo}-part-${i}`);
//                     const parteData = fs.readFileSync(partePath, 'binary');
//                     writeStream.write(parteData, 'binary');
//                     fs.unlinkSync(partePath);
//                 }

//                 writeStream.end();

//                 writeStream.on('finish', async () => {
//                     try {
//                         const pdfData = fs.readFileSync(arquivoFinalPath);

//                         // Processar `selectedProducts`
//                         let selectedProductsValue = null;
//                         if (selectedProducts) {
//                             try {
//                                 const parsedProducts = JSON.parse(selectedProducts);
//                                 selectedProductsValue = Array.isArray(parsedProducts)
//                                     ? parsedProducts.map(id => parseInt(id)) // Converte IDs para inteiros
//                                     : [];
//                             } catch (e) {
//                                 console.error("Erro ao processar selectedProducts:", e);
//                                 selectedProductsValue = [];
//                             }
//                         }

//                         // Inserir o produto no banco de dados com `url` e `selectedProducts`
//                         const produto = await db.one(`
//                             INSERT INTO produtos 
//                                 (nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, pdf, url, selectedProducts)
//                             VALUES 
//                                 ($1, $2, $3, $4, $5, $6, $7::bytea, $8, $9)
//                             RETURNING id
//                         `, [
//                             nome_produto, descricao, categoria, nivel_ensino,
//                             parseFloat(valor).toFixed(2), componente_curricular,
//                             pdfData, url, selectedProductsValue || null
//                         ]);

//                         produtoId = produto.id;

//                         // Salvar as fotos no banco de dados
//                         for (const foto of fotosFiles) {
//                             await db.none(`
//                                 INSERT INTO fotos_produtos (produto_id, foto)
//                                 VALUES ($1, $2)
//                             `, [produtoId, foto.buffer]);
//                         }

//                         console.log("Fotos e produtos relacionados salvos com sucesso.");
//                         fs.unlinkSync(arquivoFinalPath);

//                         res.status(201).json({ message: "Produto criado com sucesso", produtoId: produto.id });
//                     } catch (error) {
//                         console.error("Erro ao salvar no banco de dados:", error);
//                         res.status(500).json({ error: "Erro ao salvar no banco de dados" });
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
//         res.status(500).json({ error: "Erro ao criar produto",  details: error.message, });
//     }
// }













































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


