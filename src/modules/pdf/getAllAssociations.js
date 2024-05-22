import db from "../../db.js";

export async function obterAssociacoes(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  try {
    const total = await db.one('SELECT COUNT(*) FROM pdf_descriptions');
    const associacoes = await db.any(`
      SELECT pd.id, p.nome_do_arquivo, pd.descricao, pd.fotos
      FROM pdf_descriptions pd
      JOIN pdfs p ON pd.pdf_id = p.id
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return {
      associacoes: associacoes.map(assoc => ({
        ...assoc,
        fotos: assoc.fotos || [] // Garantir que fotos seja um array
      })),
      totalPages: Math.ceil(total.count / limit)
    };
  } catch (error) {
    console.log("Erro ao obter associações:", error);
    throw error;
  }
}
