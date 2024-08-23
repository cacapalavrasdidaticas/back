import db from "../../db.js";
import bcrypt from "bcrypt";

export async function atualizarConta(id, usuario) {
    const { nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, bairro, cidadeUF, cep, pais, senha } = usuario;

    console.log(usuario)
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
                bairro = $8,
                cidadeUF = $9,
                cep = $10,
                pais = $11,
                senha = COALESCE($12, senha)
            WHERE id = $13
            RETURNING *;
        `;

        const updatedAccount = await db.one(query, [
            nome,
            sexo,
            dataNascimento,
            email,
            cpf,
            telefoneCelular,
            JSON.stringify(endereco), // Converte o objeto para string JSON
            bairro,
            cidadeUF,
            cep,
            pais,
            hashedSenha,
            id
        ]);

        console.log(updatedAccont, 'dados atualizados')

        return updatedAccount;
    } catch (error) {
        console.error("Erro ao atualizar a conta:", error);
        throw error;
    }
}
