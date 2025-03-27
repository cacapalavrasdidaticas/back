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
        rua,       // Novo campo para rua
        bairro,
        cidadeUF,
        cep,
        pais,
        senha,
        termos
    } = usuario;

    let hashedSenha;
    if (senha) {
        hashedSenha = await bcrypt.hash(senha, 10);
    }

    try {
        if (email) {
            const existingEmail = await db.oneOrNone('SELECT id FROM contas WHERE email = $1 AND id != $2', [email, id]);
            if (existingEmail) {
                const error = new Error('O email já está em uso por outra conta.');
                error.statusCode = 422;
                throw error;
            }
        }

        // Convertendo 'termos' para um formato de data válido se for passado
        const termosData = termos ? new Date(termos) : null;
        
        const query = `
            UPDATE contas
            SET nome = COALESCE($1, nome),
                sexo = COALESCE($2, sexo),
                dataNascimento = COALESCE($3, dataNascimento),
                email = COALESCE($4, email),
                cpf = COALESCE($5, cpf),
                telefoneCelular = COALESCE($6, telefoneCelular),
                rua = COALESCE($7, rua),
                bairro = COALESCE($8, bairro),
                cidadeUF = COALESCE($9, cidadeUF),
                cep = COALESCE($10, cep),
                pais = COALESCE($11, pais),
                senha = COALESCE($12, senha),
                termos = COALESCE($13, termos)
            WHERE id = $14
            RETURNING *;
        `;

        const updatedAccount = await db.one(query, [
            nome ?? null, 
            sexo ?? null,
            dataNascimento ?? null,
            email ?? null,
            cpf ?? null,
            telefoneCelular ?? null,
            rua ?? null,
            bairro ?? null,
            cidadeUF ?? null,
            cep ?? null,
            pais ?? null,
            hashedSenha ?? null,
            termosData  ?? null,
            id
        ]);

        return updatedAccount;
    } catch (error) {
        console.error("Erro ao atualizar a conta:", error.message);

        if (!error.statusCode) {
            if (error.code === '23505') {
                error.statusCode = 422;
                error.message = 'Já existe um registro com o mesmo valor para um campo único.';
            } else {
                error.statusCode = 500;
            }
        }

        throw error;
    }
}
