import db from "../../db.js";

export async function deletarContaPorId(id) {
    try {
        // Deleta a conta com base no id fornecido
        await db.none(`
            DELETE FROM contas
            WHERE id = $1
        `, [id]);
        
        return { message: "Conta deletada com sucesso" };
    } catch (error) {
        console.error("Erro ao deletar conta:", error);
        throw error;
    }
}
