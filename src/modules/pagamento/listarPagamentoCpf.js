import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { loadTokens, getTokenById } from "../../tokenManager.js";

dotenv.config();

export async function buscarClientePorCpf(cpf) {
    const url = "https://sandbox.asaas.com/api/v3/customers";
    const token = getTokenById(1).token;

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            access_token: token,
        },
    };

    try {
        const response = await fetch(url, options);
        const json = await response.json();

        console.log(json, 'dados da api antes');

        if (!response.ok) {
            throw new Error(`Erro ao buscar clientes: ${json.message || 'Erro desconhecido'}`);
        }

        const cliente = json.data.find(cliente => cliente.cpfCnpj === cpf);

        console.log(cliente, 'dados da api depois');

        if (cliente) {
            const customerId = cliente.id;
            return buscarPagamentosPorCliente(customerId);
        } else {
            console.log('Cliente não encontrado');
            return null;
        }
    } catch (err) {
        console.error('Erro ao listar clientes:', err);
        throw err;
    }
}

// Certifique-se de também exportar buscarPagamentosPorCliente se for necessário
export async function buscarPagamentosPorCliente(customerId) {
    const url = `https://api.asaas.com/v3/payments?customer=${customerId}`;
    const token = getTokenById(1).token;

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            access_token: token,
        },
    };

    try {
        const response = await fetch(url, options);
        const json = await response;

        console.log(json, 'dados de pagamentos');

        if (!response.ok) {
            throw new Error(`Erro ao buscar pagamentos: ${json.message || 'Erro desconhecido'}`);
        }

        return json; // Retorna os dados dos pagamentos
    } catch (err) {
        console.error('Erro ao buscar pagamentos:', err);
        throw err;
    }
}
