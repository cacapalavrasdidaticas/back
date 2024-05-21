import db from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = 'seu_segredo_secreto'; // Chave secreta para assinar o token JWT

export async function criarConta({ nome, sexo, dataNascimento, email, cpf, telefoneCelular, login, senha, endereco, bairro, cidadeUF, cep, pais }) {
    console.log("Recebido em criarConta:", { nome, sexo, dataNascimento, email, cpf, telefoneCelular, login, senha, endereco, bairro, cidadeUF, cep, pais });

    if (typeof senha !== 'string' || senha.trim() === '') {
        throw new Error("Senha é obrigatória e deve ser uma string válida");
    }
    
    try {
        // Verificar se o login já está em uso
        const existingUser = await db.oneOrNone("SELECT * FROM login WHERE login = $1", [login]);
        if (existingUser) {
            throw new Error("O login já está em uso.");
        }

        // Criptografar a senha antes de armazená-la no banco de dados
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Inserir os dados do novo usuário na tabela de login
        await db.none("INSERT INTO login (login, senha, cpf) VALUES ($1, $2, $3)", [login, hashedPassword, cpf]);

        // Inserir os dados na tabela de contas
        await db.none(
            `INSERT INTO contas (nome, sexo, data_nascimento, email, cpf, telefone_celular, endereco, bairro, cidade_uf, cep, pais)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, bairro, cidadeUF, cep, pais]
        );

        // Gerar token de autenticação
        const token = jwt.sign({ login }, JWT_SECRET, { expiresIn: '1h' }); // O token expira em 1 hora

        return token;
    } catch (error) {
        throw error;
    }
}
