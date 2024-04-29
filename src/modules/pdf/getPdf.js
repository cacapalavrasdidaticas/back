import db from "../../db.js";

export async function obterPDF(pdfId) {
  try {
    const pdf = await db.oneOrNone("SELECT * FROM pdfs WHERE id = $1", [pdfId]);

    return pdf;
  } catch (error) {
    console.log("Erro ao obter PDF:", error);
    throw error;
  }
}
