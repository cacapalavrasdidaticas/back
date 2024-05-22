import db from "../../db.js";

export async function obterAssociacoes() {
  try {
    const associacoes = await db.any(`
      SELECT pd.id, p.nome_do_arquivo, pd.descricao, pd.fotos
      FROM pdf_descriptions pd
      JOIN pdfs p ON pd.pdf_id = p.id
      LIMIT 100 -- Limite adicionado para teste, ajuste conforme necessário
    `);

    // Mapear as associações e garantir que fotos seja um array
    return associacoes.map(assoc => ({
      ...assoc,
      fotos: assoc.fotos ? assoc.fotos : [] // Garantir que fotos seja um array
    }));
  } catch (error) {
    console.log("Erro ao obter associações:", error);
    throw error;
  }
}
