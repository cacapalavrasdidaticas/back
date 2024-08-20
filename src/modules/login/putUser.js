import db from "../../db.js";
import bcrypt from "bcrypt";

export async function atualizarConta(id, usuario) {
    const { nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, senha } = usuario;

    // Se a senha for fornecida, precisamos criptografá-la
    let hashedSenha;
    if (senha) {
        hashedSenha = await bcrypt.hash(senha, 10);
    }

    try {
        // Atualizando os dados da conta no banco de dados
        const query = `
            UPDATE contas
            SET nome = $1,
                sexo = $2,
                dataNascimento = $3,
                email = $4,
                cpf = $5,
                telefoneCelular = $6,
                endereco = $7,
                senha = COALESCE($8, senha)
            WHERE id = $9
            RETURNING *;
        `;

        const updatedAccount = await db.one(query, [
            nome,
            sexo,
            dataNascimento,
            email,
            cpf,
            telefoneCelular,
            endereco,
            hashedSenha,
            id
        ]);

        return updatedAccount;
    } catch (error) {
        throw error;
    }
}
