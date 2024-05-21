import db from "../../db.js";

export async function createPdf(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo PDF enviado" });
    }

    // Iterar sobre os arquivos enviados
    for (const file of req.files) {
      const nomeArquivo = file.originalname;
      const pdfData = file.buffer;

      console.log(`Processando arquivo: ${nomeArquivo}`);

      // Inserir o PDF na tabela do banco de dados
      await db.none("INSERT INTO pdfs (nome_do_arquivo, dados) VALUES ($1, $2)", [
        nomeArquivo,
        pdfData,
      ]);
    }

    res.status(200).json({ mensagem: "PDFs adicionados com sucesso" });
  } catch (error) {
    console.error("Erro ao adicionar PDFs:", error);
    res.status(500).json({ error: "Erro ao adicionar PDFs" });
  }
}
