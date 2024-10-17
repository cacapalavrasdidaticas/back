import db from "../../db.js";

export async function atualizarComprasCliente(clientId, productIds) {
  try {
    const query = `
      UPDATE contas
      SET compras = array_cat(coalesce(compras, '{}'), $1)
      WHERE id = $2
    `;
    await db.query(query, [productIds, clientId]);
    console.log('Compras atualizadas com sucesso para o cliente:', clientId);
  } catch (error) {
    console.error('Erro ao atualizar compras:', error);
    throw error;
  }
}
