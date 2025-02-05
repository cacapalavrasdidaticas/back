import db from "../../db.js";
import bcrypt from "bcrypt";

// Função para redefinir a senha direto pelo e-mail
export async function redefinirSenha(email, novaSenha) {
    try {
        const user = await db.oneOrNone('SELECT id FROM contas WHERE email = $1', [email]);
        
        if (!user) {
            return null;
        }

        const hashedSenha = await bcrypt.hash(novaSenha, 10);

        await db.none('UPDATE contas SET senha = $1 WHERE id = $2', [hashedSenha, user.id]);

        return true;
    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        throw error;
    }
}
