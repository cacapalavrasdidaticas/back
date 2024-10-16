import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { getTokenById } from "../../tokenManager.js";

dotenv.config();

// Função para buscar pagamentos
export async function getPagamentos() {
  const url = 'https://sandbox.asaas.com/api/v3/payments'; // Certifique-se que o URL está correto
  const token = getTokenById(1).token; // Assumindo que o token é o mesmo do post

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      access_token: token
    }
  };

  try {
    const response = await fetch(url, options);
    const json = await response.json();

    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro ao buscar pagamentos: ${json.message || 'Erro desconhecido'}`);
    }

    return json; // Retorna os dados de pagamentos
  } catch (err) {
    console.error('Erro ao buscar pagamentos:', err);
    throw err;
  }
}
