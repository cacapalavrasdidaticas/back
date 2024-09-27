import db from "../../db.js";
import bcrypt from "bcrypt";
const fetch = require('node-fetch');

// Função para criar conta
export async function criarConta(usuario) {
  const { nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, senha } = usuario;
  
  // Criptografa a senha do usuário
  const hashedSenha = await bcrypt.hash(senha, 10);

  try {
    // Insere o usuário no banco de dados
    const novaConta = await db.one(
      `INSERT INTO contas (nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, senha)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, hashedSenha]
    );

    // Se a conta for criada com sucesso, envia o nome e o CPF para a API Asaas
    const resultadoAsaas = await enviarParaAsaas({ nome, cpf });
    
    return { id: novaConta.id, asaas: resultadoAsaas };
  } catch (error) {
    throw error;
  }
}

// Função para enviar apenas o nome e o CPF do cliente para o Asaas
async function enviarParaAsaas(cliente) {
  const url = 'https://sandbox.asaas.com/api/v3/customers';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      access_token: '$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwODk3NDE6OiRhYWNoXzJmZmFkNjFiLWMzZDQtNDE5Ny05YTI3LWZlZjM3Y2NhY2RlMg==',
    },
    body: JSON.stringify({
      name: cliente.nome,
      cpfCnpj: cliente.cpf,
    }),
  };

  try {
    const response = await fetch(url, options);
    const json = await response.json();
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro ao enviar para Asaas: ${json.message}`);
    }

    return json;
  } catch (err) {
    console.error('Erro ao chamar API Asaas:', err);
    throw err;
  }
}










































// import db from "../../db.js";
// import bcrypt from "bcrypt";

// export async function criarConta(usuario) {
//     const { nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, senha } = usuario;
//     const hashedSenha = await bcrypt.hash(senha, 10);

//     try {
//         const novaConta = await db.one(
//             `INSERT INTO contas (nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, senha)
//              VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
//             [nome, sexo, dataNascimento, email, cpf, telefoneCelular, endereco, hashedSenha]
//         );

//         return { id: novaConta.id };
//     } catch (error) {
//         throw error;
//     }
// }
