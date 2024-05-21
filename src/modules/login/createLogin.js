import db from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = 'seu_segredo_secreto'; // Chave secreta para assinar o token JWT

export async function criarConta({ nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco }) {
    console.log("Recebido em criarConta:", { nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco });

    // Verificar se todos os campos obrigatórios estão preenchidos
    if (!nome || !sexo || !dataNascimento || !email || !cpf || !telefoneCelular || !endereco) {
        throw new Error("Todos os campos obrigatórios devem ser preenchidos.");
    }

    try {
        // Verificar se o login já está em uso
        const existingUser = await db.oneOrNone("SELECT * FROM login WHERE login = $1", [email]);
        if (existingUser) {
            throw new Error("O e-mail já está em uso.");
        }

        // Criptografar a senha antes de armazená-la no banco de dados
        const hashedPassword = await bcrypt.hash(email, 10);

        // Inserir os dados do novo usuário na tabela de login
        await db.none("INSERT INTO login (login, senha, cpf) VALUES ($1, $2, $3)", [email, hashedPassword, cpf]);

        // Inserir os dados na tabela de contas
        await db.none(
            `INSERT INTO contas (nome, sexo, data_nascimento, email, cpf, telefone_celular, endereco, bairro, cidade_uf, cep, pais)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco.endereco, endereco.bairro, endereco.cidadeUF, endereco.cep, endereco.pais]
        );

        // Gerar token de autenticação
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' }); // O token expira em 1 hora

        return token;
    } catch (error) {
        throw error;
    }
}
