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
    console.log("📦 Payload recebido:", { nome, email, telefone, materia });

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

    // Garante que sempre envia algo pro campo JSONB
    const materiaJSON = Array.isArray(materia)
      ? materia
      : typeof materia === "string" && materia.length > 0
      ? materia.split(",").map((m) => m.trim())
      : [];

    // Inserção segura com JSONB
    const novoProspect = await db.one(
      `
      INSERT INTO prospect_clients (nome, email, telefone, materia)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id, nome, email, telefone, materia, created_at
      `,
      [nome, email, telefone, JSON.stringify(materiaJSON)]
    );

    console.log("✅ Prospect salvo:", novoProspect);
    return novoProspect;
  } catch (error) {
    console.error("❌ Erro ao criar prospect:", error);
    throw error;
  }
}
