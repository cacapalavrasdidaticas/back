import db from "../../db.js";
import bcrypt from "bcrypt";

app.get('/conta/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Consulta SQL para obter os dados da conta pelo ID
        const query = `
            SELECT 
                id, 
                nome, 
                senha, 
                datanascimento, 
                email, 
                cpf, 
                telefonecelular, 
                sexo, 
                rua, 
                bairro, 
                cidadeuf, 
                cep, 
                pais
            FROM contas
            WHERE id = $1;
        `;

        // Executa a consulta com o ID fornecido
        const conta = await db.oneOrNone(query, [id]);

        if (!conta) {
            // Retorna 404 se a conta não for encontrada
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        // Retorna os dados da conta
        res.status(200).json(conta);
    } catch (error) {
        console.error("Erro ao buscar conta:", error.message);

        // Retorna 500 em caso de erro interno do servidor
        res.status(500).json({ error: 'Erro ao buscar conta', message: error.message });
    }
});
