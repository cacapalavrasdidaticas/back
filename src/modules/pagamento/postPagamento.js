import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { loadTokens, getTokenById } from "../../tokenManager.js";

dotenv.config();

// Função para processar pagamento
export async function postPagamento({ cpf, billingType, value, dueDate, description }) {
  // Primeira etapa: Listar clientes e encontrar pelo CPF
  const customerId = await buscarClientePorCpf(cpf);

  if (!customerId) {
    throw new Error('Cliente com o CPF fornecido não encontrado.');
  }

  // Segunda etapa: Enviar informações de pagamento
  return enviarPagamento({
    customer: customerId,
    billingType,
    value,
    dueDate,
    description
  });
}

// Função para buscar o cliente com base no CPF
async function buscarClientePorCpf(cpf) {
    const url = "https://sandbox.asaas.com/api/v3/customers";
    const token = getTokenById(1).token;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      access_token: token
    },
  };

  try {
    const response = await fetch(url, options);
    const json = await response.json();

    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro ao buscar clientes: ${json.message || 'Erro desconhecido'}`);
    }

    // Encontra o cliente cujo CPF corresponde ao fornecido
    const cliente = json.data.find(cliente => cliente.cpfCnpj === cpf);

    return cliente ? cliente.id : null;
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    throw err;
  }
}

// Função para enviar as informações de pagamento
async function enviarPagamento({ customer, billingType, value, dueDate, description }) {
    const url = "https://sandbox.asaas.com/api/v3/customers";
    const token = getTokenById(1).token;

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      access_token: token
    },
    body: JSON.stringify({
      billingType,
      customer,
      value,
      dueDate,
      description,
    }),
  };

  try {
    const response = await fetch(url, options);
    const json = await response.json();

    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro ao processar pagamento: ${json.message || 'Erro desconhecido'}`);
    }

    return json;
  } catch (err) {
    console.error('Erro ao enviar pagamento:', err);
    throw err;
  }
}
