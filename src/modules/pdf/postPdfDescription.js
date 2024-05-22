import db from "../../db.js";
import path from "path";

export async function associatePdf(req, res) {
  try {
    const { pdf_id, descricao } = req.body;
    const fotos = req.files.map(file => `/uploads/${file.filename}`); // Armazenar paths das fotos

    if (!pdf_id || !descricao) {
      return res.status(400).json({ error: "PDF ID e descrição são obrigatórios" });
    }

    // Verificar se o PDF existe
    const pdfExists = await db.oneOrNone("SELECT 1 FROM pdfs WHERE id = $1", [pdf_id]);
    if (!pdfExists) {
      return res.status(404).json({ error: "PDF não encontrado" });
    }

    // Inserir a descrição e fotos na tabela pdf_descriptions
    await db.none("INSERT INTO pdf_descriptions (pdf_id, descricao, fotos) VALUES ($1, $2, $3)", [
      pdf_id,
      descricao,
      fotos,
    ]);

    res.status(200).json({ mensagem: "Associação de PDF, descrição e fotos realizada com sucesso" });
  } catch (error) {
    console.error("Erro ao associar PDF, descrição e fotos:", error);
    res.status(500).json({ error: "Erro ao associar PDF, descrição e fotos" });
  }
}
