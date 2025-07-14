import db from "../../db.js";
import bcrypt from "bcrypt";
import fetch from 'node-fetch';
import { loadTokens, getTokenById } from "../../tokenManager.js";
import dotenv from 'dotenv';

dotenv.config();

await loadTokens();

export async function criarConta(usuario) {
    const { nome, dataNascimento, email, cpf, telefoneCelular, senha } = usuario;

    const sexo = null;
    const bairro = null;
    const cidadeuf = null;
    const cep = null;
    const pais = null;
    const rua = null;

    const hashedSenha = await bcrypt.hash(senha, 10);

    try {
        // Primeiro, envia para Asaas
        const resultadoAsaas = await enviarParaAsaas({ nome, cpf });

        // Se a resposta do Asaas indicar falha, lança erro e interrompe a criação da conta
        if (!resultadoAsaas || !resultadoAsaas.id) {
            throw new Error("Falha ao criar conta no Asaas");
        }

        // Agora insere no banco apenas se o Asaas for bem-sucedido
        const novaConta = await db.one(
            `INSERT INTO contas (nome, senha, datanascimento, email, cpf, telefonecelular, sexo, bairro, cidadeuf, cep, pais, rua)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
            [nome, hashedSenha, dataNascimento, email, cpf, telefoneCelular, sexo, bairro, cidadeuf, cep, pais, rua]
        );

        return { id: novaConta.id, asaas: resultadoAsaas };
    } catch (error) {
        console.error("Erro ao criar conta:", error.message);
        throw error?.message;
    }
}

async function enviarParaAsaas(cliente) {
    const url = "https://api.asaas.com/v3/customers"; 
    const token = getTokenById(2).token;

    const body = {
        name: cliente.nome,
        cpfCnpj: cliente.cpf
    };

    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            access_token: token,
        },
        body: JSON.stringify(body),
    };

    try {
        const response = await fetch(url, options);
        const json = await response.json();

        console.log('Resposta do Asaas:', json);

        if (!response.ok) {
            throw new Error(`Erro ao enviar para Asaas: ${json.errors[0].description || json.message || 'Erro desconhecido'}`);
        }

        return json;
    } catch (err) {
        console.error('Erro ao chamar API Asaas:', err);
        throw err?.message;
    }
}


















// import db from "../../db.js";
// import bcrypt from "bcrypt";
// import fetch from 'node-fetch';
// import { loadTokens, getTokenById } from "../../tokenManager.js";
// import dotenv from 'dotenv';

// dotenv.config();

// await loadTokens();

// export async function criarConta(usuario) {
//     const { nome, dataNascimento, email, cpf, telefoneCelular, senha } = usuario;

//     const sexo = null;
//     const bairro = null;
//     const cidadeuf = null;
//     const cep = null;
//     const pais = null;
//     const rua = null;

//     const hashedSenha = await bcrypt.hash(senha, 10);

//     try {
//         const novaConta = await db.one(
//             `INSERT INTO contas (nome, senha, datanascimento, email, cpf, telefonecelular, sexo, bairro, cidadeuf, cep, pais, rua)
//              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
//             [nome, hashedSenha, dataNascimento, email, cpf, telefoneCelular, sexo, bairro, cidadeuf, cep, pais, rua]
//         );

//         const resultadoAsaas = await enviarParaAsaas({ nome, cpf });

//         return { id: novaConta.id, asaas: resultadoAsaas };
//     } catch (error) {
//         throw error;
//     }
// }

// async function enviarParaAsaas(cliente) {
//   // const url = "https://sandbox.asaas.com/v3/customers";
//     const url = "https://api.asaas.com/v3/customers"; 

//   const token = getTokenById(2).token;;

//   const body = {
//     name: cliente.nome,
//     cpfCnpj: cliente.cpf
//   };

//   const options = {
//     method: 'POST',
//     headers: {
//       accept: 'application/json',
//       'content-type': 'application/json',
//       access_token: token,
//     },
//     body: JSON.stringify(body),
//   };

//   try {
//     const response = await fetch(url, options);
//     const json = await response.json();

//     console.log('Resposta do Asaas:', json);

//     if (!response.ok) {
//       throw new Error(`Erro ao enviar para Asaas: ${json.message || 'Erro desconhecido'}`);
//     }

//     return json;
//   } catch (err) {
//     console.error('Erro ao chamar API Asaas:', err);
//     throw err;
//   }
// }
