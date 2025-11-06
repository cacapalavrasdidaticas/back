import db from "../../db.js";
import pgPromise from "pg-promise";

const pgp = pgPromise({ capSQL: true });

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
    // Verifica se o e-mail já existe
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

    // Garante que materia é um array de strings
    const materiasArray = Array.isArray(materia)
      ? materia
      : typeof materia === "string"
      ? materia.split(",").map((m) => m.trim())
      : [];

    // Se vier vazio → '{}'
    // Se tiver valores → '{item1,item2,...}'
    const materiasSQL =
      materiasArray.length > 0
        ? `'{"${materiasArray.join('","')}"}'`
        : `'{}'`;

    // Monta a query
    const query = `
      INSERT INTO prospect_clients (nome, email, telefone, materia)
      VALUES ($1, $2, $3, ${materiasSQL}::text[])
      RETURNING id, nome, email, telefone, materia, created_at
    `;

    // Executa
    const novoProspect = await db.one(query, [nome, email, telefone]);
    return novoProspect;
  } catch (error) {
    console.error("Erro ao criar prospect:", error);
    throw error;
  }
}
