import db from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = 'seu_segredo_secreto'; // Chave secreta para assinar o token JWT

export async function criarConta(nome, sexo, dataNascimento, email, cpf, telefoneCelular, senha, endereco, bairro, cidadeUF, cep, pais) {
    if (typeof senha !== 'string' || senha.trim() === '') {
        throw new Error("Senha é obrigatória e deve ser uma string válida");
    }
    
    try {
        // Verificar se o login já está em uso
        // const existingUser = await db.oneOrNone("SELECT * FROM login WHERE nome = $1", [login]);
        // if (existingUser) {
        //     throw new Error("O login já está em uso.");
        // }

        // Verificar se o CPF já está em uso
        const existingCPF = await db.oneOrNone("SELECT * FROM contas WHERE cpf = $1", [cpf]);
        if (existingCPF) {
            throw new Error("O CPF já está em uso.");
        }

        // Verificar se o email já está em uso
        const existingEmail = await db.oneOrNone("SELECT * FROM contas WHERE email = $1", [email]);
        if (existingEmail) {
            throw new Error("O email já está em uso.");
        }

        // Criptografar a senha antes de armazená-la no banco de dados
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Iniciar uma transação para garantir a consistência dos dados
        await db.tx(async t => {
            // Inserir os dados do novo usuário na tabela de login
            await t.none("INSERT INTO login (email, senha, cpf) VALUES ($1, $2, $3)", [email, hashedPassword, cpf]);

            // Inserir os dados na tabela de contas
            await t.none(
                `INSERT INTO contas (nome, sexo, data_nascimento, email, cpf, telefone_celular, endereco, bairro, cidade_uf, cep, pais)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, bairro, cidadeUF, cep, pais]
            );
        });

        // Gerar token de autenticação
        const token = jwt.sign({ login }, JWT_SECRET, { expiresIn: '1h' }); // O token expira em 1 hora

        return token;
    } catch (error) {
        throw error;
    }
}
