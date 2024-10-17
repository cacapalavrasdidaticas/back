import db from "../../db.js";

export async function atualizarComprasCliente(clientId, productIds) {
  try {
    const query = `
      UPDATE contas
      SET compras = array_cat(coalesce(compras, '{}'), $1::text[])
      WHERE id = $2
    `;
    await db.query(query, [productIds.map(String), clientId]); // Convertendo os IDs para strings
    console.log('Compras atualizadas com sucesso para o cliente:', clientId);
  } catch (error) {
    console.error('Erro ao atualizar compras:', error);
    throw error;
  }
}
