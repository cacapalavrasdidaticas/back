import db from "../../db.js";
import bcrypt from "bcrypt";

export async function atualizarConta(id, usuario) {
    const {
        nome,
        sexo,
        dataNascimento,
        email,
        cpf,
        telefoneCelular,
        endereco,
        bairro,
        cidadeUF,
        cep,
        pais,
        senha
    } = usuario;

    // Se a senha for fornecida, precisamos criptografá-la
    let hashedSenha;
    if (senha) {
        hashedSenha = await bcrypt.hash(senha, 10);
    }

    try {
        // Verifique se o email já existe em outro registro
        if (email) {
            const existingEmail = await db.oneOrNone('SELECT id FROM contas WHERE email = $1 AND id != $2', [email, id]);
            if (existingEmail) {
                throw new Error('O email já está em uso por outra conta.');
            }
        }

        // Atualizando os dados da conta no banco de dados
        const query = `
            UPDATE contas
            SET nome = COALESCE($1, nome),
                sexo = COALESCE($2, sexo),
                dataNascimento = COALESCE($3, dataNascimento),
                email = COALESCE($4, email),
                cpf = COALESCE($5, cpf),
                telefoneCelular = COALESCE($6, telefoneCelular),
                endereco = COALESCE($7, endereco),
                bairro = COALESCE($8, bairro),
                cidadeUF = COALESCE($9, cidadeUF),
                cep = COALESCE($10, cep),
                pais = COALESCE($11, pais),
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
            JSON.stringify(endereco),
            bairro,
            cidadeUF,
            cep,
            pais,
            hashedSenha,
            id
        ]);

        return updatedAccount;
    } catch (error) {
        console.error("Erro ao atualizar a conta:", error.message);
        throw error;
    }
}
