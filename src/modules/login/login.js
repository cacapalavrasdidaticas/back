import db from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // Importe o módulo jsonwebtoken

const JWT_SECRET = "seu_segredo_secreto"; // Chave secreta para assinar o token JWT

export async function loginUsuario(email, senha) {
    try {
        // Buscar o usuário pelo login no banco de dados
        const usuario = await db.oneOrNone("SELECT * FROM contas WHERE email = $1", email);

        // Verificar se o usuário existe
        if (!usuario) {
            throw new Error("Usuário não encontrado");
        }

        // Verificar se a senha fornecida corresponde à senha armazenada no banco de dados
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            throw new Error("Senha incorreta");
        }

        // Gerar um token JWT com os dados do usuário
        const token = jwt.sign({ usuario }, JWT_SECRET, { expiresIn: "1h" });

        return { token }; // Retorna o token JWT
    } catch (error) {
        throw error;
    }
}
