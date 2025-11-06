import db from "../../db.js";
import pgPromise from "pg-promise";

const pgp = pgPromise({ capSQL: true }); // habilita SQL seguro com formatação correta

// 📨 POST - criar novo prospect
export async function criarProspect({ nome, email, telefone, materia }) {
  try {
    // Verificar se o e-mail já existe
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

    // Garante que materia é array e converte para literal SQL {item1,item2}
    const materiasArray = Array.isArray(materia)
      ? materia
      : typeof materia === "string"
      ? materia.split(",").map((m) => m.trim())
      : [];

    // formata corretamente para o PostgreSQL
    const materiasSQL = pgp.as.array(materiasArray);

    // Query de inserção
    const novoProspect = await db.one(
      `
      INSERT INTO prospect_clients (nome, email, telefone, materia)
      VALUES ($1, $2, $3, $4::text[])
      RETURNING id, nome, email, telefone, materia, created_at
      `,
      [nome, email, telefone, materiasSQL]
    );

    return novoProspect;
  } catch (error) {
    console.error("Erro ao criar prospect:", error);
    throw error;
  }
}
