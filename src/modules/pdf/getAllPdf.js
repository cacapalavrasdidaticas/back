import db from "../../db.js";

export async function obterTodosPDFs() {
  try {
    const pdfs = await db.any("SELECT id, nome_do_arquivo FROM pdfs");
    return pdfs;
  } catch (error) {
    console.log("Erro ao obter todos os PDFs:", error);
    throw error;
  }
}
