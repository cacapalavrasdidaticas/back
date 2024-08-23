import db from "../../db.js";
import jwt from "jsonwebtoken"; 

export async function loginUsuario(id) {
    try {
        const usuario = await db.oneOrNone("SELECT * FROM contas WHERE id = $1", [id]);

        if (!usuario) {
            throw new Error("Usuário não encontrado");
        }

        return usuario
        
    } catch (error) {
        console.error("Erro ao buscar o usuário e gerar o token:", error.message);
        throw error;
    }
}
