import db from "../../db.js";
import fs from "fs";
import path from "path";

// Diretório temporário para armazenar partes de PDFs
const tempDir = path.join(process.env.TEMP || '/tmp', 'pdf-uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

export async function createProdutoV2(req, res) {
    const { nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, partIndex, totalParts, nomeArquivo } = req.body;
    const fotosFiles = req.files['fotos'] || [];  // Captura os arquivos de fotos
    const pdfPart = req.files['part'] ? req.files['part'][0] : null;  // Captura a parte do PDF

    try {
        if (pdfPart) {
            const caminhoArquivoTemporario = path.join(tempDir, `${nomeArquivo}-part-${partIndex}`);

            // Salvar a parte temporariamente em binário
            fs.writeFileSync(caminhoArquivoTemporario, pdfPart.buffer, 'binary');
            console.log(`Parte ${parseInt(partIndex) + 1} de ${totalParts} recebida`);

            if (parseInt(partIndex) + 1 === parseInt(totalParts)) {
                const arquivoFinalPath = path.join(tempDir, nomeArquivo);
                const writeStream = fs.createWriteStream(arquivoFinalPath, { flags: 'w' });

                // Montar o PDF completo unindo todas as partes
                for (let i = 0; i < totalParts; i++) {
                    const partePath = path.join(tempDir, `${nomeArquivo}-part-${i}`);
                    const parteData = fs.readFileSync(partePath, 'binary');
                    writeStream.write(parteData, 'binary');
                    fs.unlinkSync(partePath);  // Remover a parte após juntar
                }

                writeStream.end();

                // Após o término, ler o arquivo montado e salvá-lo no banco de dados
                writeStream.on('finish', async () => {
                    try {
                        const pdfData = fs.readFileSync(arquivoFinalPath);  // Lê o PDF como binário

                        // Inserir o produto com o PDF no banco de dados
                        const produto = await db.one(`
                            INSERT INTO produtos 
                                (nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular, pdf)
                            VALUES 
                                ($1, $2, $3, $4, $5, $6, $7::bytea)
                            RETURNING id
                        `, [nome_produto, descricao, categoria, nivel_ensino, parseFloat(valor).toFixed(2), componente_curricular, pdfData]);

                        // Remover o arquivo PDF temporário
                        fs.unlinkSync(arquivoFinalPath);

                        res.status(201).json({ message: "Produto criado com sucesso", produtoId: produto.id });
                    } catch (error) {
                        console.error("Erro ao salvar o PDF no banco de dados:", error);
                        res.status(500).json({ error: "Erro ao salvar o PDF no banco de dados" });
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

        // Salvar as fotos logo na primeira parte recebida
        if (partIndex === '0' && fotosFiles.length > 0) {
            try {
                // Salvar as fotos no banco de dados
                const produto = await db.one(`
                    INSERT INTO produtos 
                        (nome_produto, descricao, categoria, nivel_ensino, valor, componente_curricular)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `, [nome_produto, descricao, categoria, nivel_ensino, parseFloat(valor).toFixed(2), componente_curricular]);

                for (const foto of fotosFiles) {
                    await db.none(`
                        INSERT INTO fotos_produtos (produto_id, foto)
                        VALUES ($1, $2)
                    `, [produto.id, foto.buffer]);
                }

                console.log("Fotos salvas com sucesso.");
            } catch (error) {
                console.error("Erro ao salvar fotos:", error);
                res.status(500).json({ error: "Erro ao salvar fotos" });
            }
        }
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        res.status(500).json({ error: "Erro ao criar produto" });
    }
}
