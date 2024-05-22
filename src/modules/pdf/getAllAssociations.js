import db from "../../db.js";

export async function obterAssociacoes() {
  try {
    const associacoes = await db.any(`
      SELECT pdfs.id, pdfs.nome_do_arquivo, pdf_descriptions.descricao, pdf_descriptions.fotos
      FROM pdfs
      LEFT JOIN pdf_descriptions ON pdfs.id = pdf_descriptions.pdf_id
    `);
    return associacoes;
  } catch (error) {
    console.log("Erro ao obter associações:", error);
    throw error;
  }
}
