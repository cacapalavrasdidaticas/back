import db from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = 'seu_segredo_secreto'; // Chave secreta para assinar o token JWT

export async function criarConta(login, senha, cpf) {
    try {
        // Verificar se o login já está em uso
        const existingUser = await db.oneOrNone("SELECT * FROM login WHERE login = $1", login);
        if (existingUser) {
            throw new Error("O login já está em uso.");
        }

        // Criptografar a senha antes de armazená-la no banco de dados
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Inserir os dados do novo usuário na tabela de login
        await db.none("INSERT INTO login (login, senha, cpf) VALUES ($1, $2)", [login, hashedPassword]);

        // Gerar token de autenticação
        const token = jwt.sign({ login }, JWT_SECRET, { expiresIn: '1h' }); // O token expira em 1 hora

        return token;
    } catch (error) {
        throw error;
    }
}
