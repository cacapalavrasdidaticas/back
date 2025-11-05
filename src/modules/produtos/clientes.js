import db from "../../db.js";

// 🧾 GET - listar todos os prospects
export async function obterTodosProspects() {
  try {
    const prospects = await db.any(`
      SELECT id, nome, email, telefone, created_at
      FROM prospect_clients
      ORDER BY created_at DESC
    `);
    return prospects;
  } catch (error) {
    console.error("Erro ao buscar prospects:", error);
    throw error;
  }
}

// 📨 POST - criar novo prospect
export async function criarProspect({ nome, email, telefone }) {
  try {
    const novoProspect = await db.one(
      `
      INSERT INTO prospect_clients (nome, email, telefone)
      VALUES ($1, $2, $3)
      RETURNING id, nome, email, telefone, created_at
      `,
      [nome, email, telefone]
    );

    return novoProspect;
  } catch (error) {
    console.error("Erro ao criar prospect:", error);
    throw error;
  }
}
