import db from "../../db.js";

export async function obterAssociacoes() {
  try {
    const associacoes = await db.any(`
      SELECT pd.id, p.nome_do_arquivo, pd.descricao, pd.fotos
      FROM pdf_descriptions pd
      JOIN pdfs p ON pd.pdf_id = p.id
    `);

    return associacoes.map(assoc => ({
      ...assoc,
      fotos: assoc.fotos ? JSON.parse(assoc.fotos) : [] // Converter fotos de string para array
    }));
  } catch (error) {
    console.log("Erro ao obter associações:", error);
    throw error;
  }
}
