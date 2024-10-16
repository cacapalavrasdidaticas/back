import nodemailer from 'nodemailer';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import { obterProduto } from '../produtos/getProdutoIdV2.js';
import { buscarContas } from '../login/getAccount.js';
import archiverZipEncrypted from 'archiver-zip-encrypted';

const MAX_ATTEMPTS = 5; // Limite de tentativas de busca
const WAIT_TIME_MS = 2000; // Tempo de espera entre tentativas (2 segundos)

archiver.registerFormat('zip-encrypted', archiverZipEncrypted);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função que faz polling para aguardar até que o PDF esteja disponível
async function aguardarPDF(idProduto, tentativas = 0) {
  let produto = await obterProduto(idProduto);

  // Desembrulhar o array, se necessário
  if (Array.isArray(produto)) {
    produto = produto[0]; // Pegue o primeiro item, caso esteja aninhado
  }

  if (produto && produto.pdf && Buffer.isBuffer(produto.pdf)) {
    return produto;
  } else if (tentativas >= MAX_ATTEMPTS) {
    throw new Error(`PDF para o produto com ID ${idProduto} não está disponível após ${MAX_ATTEMPTS} tentativas.`);
  } else {
    console.log(`Tentativa ${tentativas + 1}: PDF para o produto com ID ${idProduto} não disponível. Aguardando...`);
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS)); // Aguardar antes da próxima tentativa
    return aguardarPDF(idProduto, tentativas + 1); // Tentar novamente
  }
}

export async function processarEEnviarEmail(productIds, clientId, paymentId) {
  try {
    console.log("Iniciando o processamento do e-mail...");

    // 1. Buscar o cliente pelo ID
    const cliente = await buscarContas(clientId);
    if (!cliente || cliente.usuario.length === 0) {
      throw new Error('Cliente não encontrado.');
    }

    console.log(cliente, 'Cliente encontrado');
    const clienteInfo = cliente.usuario;
    const clienteEmail = clienteInfo.email;
    const cpf = clienteInfo.cpf;
    const zipPassword = cpf.slice(0, 3); // Extrair os 3 primeiros dígitos do CPF para a senha do ZIP

    console.log(`Cliente encontrado: ${clienteInfo.nome} (${clienteEmail})`);

    // 2. Buscar os produtos e aguardar que os PDFs estejam disponíveis
    const produtos = await Promise.all(
      productIds.map(async (id) => {
        console.log(`Buscando produto com ID: ${id}`);
        return aguardarPDF(id); // Aguardar até que o PDF esteja disponível
      })
    );

    const produtosValidos = produtos.filter((produto) => produto !== null);
    console.log('Produtos válidos encontrados:', produtosValidos);

    if (produtosValidos.length === 0) {
      throw new Error('Nenhum produto válido encontrado para os IDs fornecidos.');
    }

    // 3. Gerar o arquivo ZIP com os PDFs diretamente na memória
    const archive = archiver('zip-encrypted', {
      zlib: { level: 9 },
      encryptionMethod: 'aes256',
      password: zipPassword,
    });

    const buffers = [];
    archive.on('data', (data) => buffers.push(data));
    archive.on('error', (err) => {
      throw err;
    });

    // Adicionar cada PDF ao arquivo ZIP
    produtosValidos.forEach((produto) => {
      if (!produto.pdf || !Buffer.isBuffer(produto.pdf)) {
        throw new Error(`PDF para o produto com ID ${produto.id} não encontrado no banco de dados ou não é um Buffer válido.`);
      }
      console.log(`Adicionando PDF do produto ID ${produto.id} ao ZIP.`);
      archive.append(produto.pdf, { name: `produto_${produto.id}.pdf` });
    });

    // Finalizar o ZIP
    await archive.finalize();

    // Concatenar os buffers para criar o arquivo ZIP completo em memória
    const zipBuffer = Buffer.concat(buffers);
    console.log('ZIP gerado em memória.');

    // 4. Configurar o transporte de e-mail
    console.log('Configurando transporte de e-mail...');
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'palavrasdidaticas@gmail.com',
        pass: 'hqikugaoocmzrhld',
      },
    });

    // Verificar se o transporte está configurado corretamente
    await transporter.verify((error, success) => {
      if (error) {
        console.error('Erro ao configurar o transporte de e-mail:', error);
        throw new Error('Erro ao configurar o transporte de e-mail.');
      } else {
        console.log('Transporte de e-mail configurado corretamente:', success);
      }
    });

    // 5. Configurar as opções de e-mail com o ZIP protegido como anexo
    let mailOptions = {
      from: 'palavrasdidaticas@gmail.com',
      // Para enviar para o cliente real, use o email do cliente
      // to: clienteEmail,
      to: "anderson_felipetavares@hotmail.com",
      subject: 'Produtos adquiridos',
      html: `
        <p>Olá, ${clienteInfo.nome},</p>
        <p>Obrigado por comprar com a gente!</p>
        <p>Abaixo segue a senha para acessar o seu produto:</p>
        <p><strong>Senha do ZIP: ${zipPassword}</strong></p>
        <p>É PROIBIDA A REPRODUÇÃO, VENDA E COMPARTILHAMENTO DESTE MATERIAL.</p>
      `,
      attachments: [
        {
          filename: 'produtos_protegidos.zip',
          content: zipBuffer,
          contentType: 'application/zip',
        },
        {
          filename: 'Logo.svg',
          path: path.join(__dirname, '../../assets/img/Logo.svg'),
          cid: 'logo',
        },
      ],
    };

    // 6. Enviar o e-mail e capturar sucesso/falha
    console.log('Enviando e-mail...');
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso:', info);

    return 'E-mail com ZIP protegido enviado com sucesso.';
  } catch (error) {
    console.error('Erro ao processar e enviar e-mail:', error);
    throw error;
  }
}
