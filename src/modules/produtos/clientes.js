import db from "../../db.js";

// 🧾 GET - listar todos os prospects
export async function obterTodosProspects() {
  try {
    const prospects = await db.any(`
      SELECT id, nome, email, telefone, materia, created_at
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
export async function criarProspect({ nome, email, telefone, materia }) {
  try {
    // Verificar se já existe e-mail
    const existente = await db.oneOrNone(
      `SELECT id FROM prospect_clients WHERE email = $1`,
      [email]
    );

    if (existente) {
      return {
        error: true,
        message: "Já existe um prospect com este e-mail.",
        existenteId: existente.id,
      };
    }

    const novoProspect = await db.one(
      `
      INSERT INTO prospect_clients (nome, email, telefone, materia)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nome, email, telefone, materia, created_at
      `,
      [nome, email, telefone, materia]
    );

    return novoProspect;
  } catch (error) {
    console.error("Erro ao criar prospect:", error);
    throw error;
  }
}

