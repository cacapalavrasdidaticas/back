import db from "../../db.js";
import bcrypt from "bcrypt";

export async function criarConta(usuario) {
    const { nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, senha } = usuario;
    const hashedSenha = await bcrypt.hash(senha, 10);

    try {
        const novaConta = await db.one(
            `INSERT INTO contas (nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, senha)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, hashedSenha]
        );

        return { id: novaConta.id };
    } catch (error) {
        throw error;
    }
}
