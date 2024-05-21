import db from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = 'seu_segredo_secreto'; // Chave secreta para assinar o token JWT

export async function criarConta(dados) {
    const { email, senha, nome, sexo, dataNascimento, cpf, telefoneCelular, login, endereco, bairro, cidadeUF, cep, pais } = dados;
    console.log("Recebido em criarConta:", dados);

    // Criptografar a senha antes de armazená-la no banco de dados
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir os dados do novo usuário na tabela de login
    await db.none("INSERT INTO login (login, senha, cpf) VALUES ($1, $2, $3)", [login || email, hashedPassword, cpf]);

    // Inserir os dados na tabela de contas
    await db.none(
        `INSERT INTO contas (nome, sexo, data_nascimento, email, cpf, telefone_celular, endereco, bairro, cidade_uf, cep, pais)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, bairro, cidadeUF, cep, pais]
    );
}

