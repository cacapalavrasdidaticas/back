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

    // 🔄 Garantir que materia seja sempre um array
    const materiasArray = Array.isArray(materia)
      ? materia
      : typeof materia === "string"
      ? materia.split(",").map((m) => m.trim())
      : [];

    // 🚀 Converter o array JS em literal SQL do tipo {item1,item2,...}
    const materiasSQL =
      materiasArray.length > 0
        ? `{${materiasArray.map((m) => `"${m}"`).join(",")}}`
        : "{}";

    // 🧩 Inserir o registro no banco
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
