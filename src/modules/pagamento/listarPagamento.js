import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { getTokenById } from "../../tokenManager.js";

dotenv.config();

// Função para buscar pagamentos
export async function getPagamentos() {
  const url = "https://sandbox.asaas.com/api/v3/payments"; // Certifique-se que o URL está correto
  const token = getTokenById(1); // Assumindo que o token é o mesmo do post

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      access_token: token
    }
  };

  try {
    const response = await fetch(url, options);

    // Verifique o status da resposta
    if (!response.ok) {
      const text = await response.text(); // Pega a resposta bruta
      throw new Error(`Erro ao buscar pagamentos: Status ${response.status}. Resposta: ${text}`);
    }

    // Verifique se há conteúdo na resposta antes de tentar parsear o JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      return json; // Retorna os dados de pagamentos
    } else {
      const text = await response.text(); // Captura qualquer outro tipo de resposta
      console.warn('A resposta não é JSON. Conteúdo bruto:', text);
      return { message: 'A resposta não é um JSON válido', data: text };
    }

  } catch (err) {
    console.error('Erro ao buscar pagamentos:', err);
    throw err;
  }
}
