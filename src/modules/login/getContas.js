import db from "../../db.js";

export async function obterTodasContas() {
    try {
        const contas = await db.any(`
            SELECT id, nome, senha, datanascimento, email, cpf, telefonecelular, sexo, bairro, cidadeuf, cep, pais, rua, admin, compras
            FROM contas
        `);

        return contas;
    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        throw error;
    }
}
