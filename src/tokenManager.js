import db from './db.js'; // Importe a conexão com o banco de dados que você forneceu

let globalTokensArray = [];

// Função para carregar todos os tokens do banco de dados
async function loadTokens() {
  if (globalTokensArray.length === 0) { // Carrega os tokens apenas se não estiverem carregados
    try {
      const results = await db.any('SELECT * FROM asaas_key');
      globalTokensArray = results; // Armazena todos os tokens no array
      console.log('Tokens carregados com sucesso:', globalTokensArray);
    } catch (error) {
      console.error('Erro ao carregar os tokens:', error);
      throw error;
    }
  }
  return globalTokensArray;
}

// Função para obter um token específico por ID (caso a array tenha IDs únicos)
function getTokenById(id) {
  return globalTokensArray.find(token => token.id === id) || null;
}

// Função para obter todos os tokens
function getAllTokens() {
  return globalTokensArray;
}

export { loadTokens, getTokenById, getAllTokens };