import nodemailer from 'nodemailer';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { obterProduto } from '../produtos/getProdutoId.js';
import { buscarContas } from '../login/getContasId.js';
import archiverZipEncrypted from 'archiver-zip-encrypted';

// Limites e tempos de espera
const MAX_ATTEMPTS = 5;
const WAIT_TIME_MS = 2000;

archiver.registerFormat('zip-encrypted', archiverZipEncrypted);

// Função que faz polling para aguardar até que o PDF esteja disponível
async function aguardarPDF(idProduto, tentativas = 0) {
  const produto = await obterProduto(idProduto);

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

    const clienteInfo = cliente.usuario;
    const clienteEmail = clienteInfo.email;
    const cpf = clienteInfo.cpf;
    const zipPassword = cpf.slice(0, 3); // Extrair os 3 primeiros dígitos do CPF para a senha do ZIP

    // 2. Buscar os produtos e aguardar que os PDFs estejam disponíveis
    const produtos = await Promise.all(
      productIds.map(async (id) => {
        return aguardarPDF(id);
      })
    );

    const produtosValidos = produtos.filter((produto) => produto !== null);

    if (produtosValidos.length === 0) {
      throw new Error('Nenhum produto válido encontrado para os IDs fornecidos.');
    }

    // 3. Criar o arquivo ZIP diretamente na memória
    const passThrough = new PassThrough();
    const archive = archiver('zip-encrypted', {
      zlib: { level: 9 },
      encryptionMethod: 'aes256',
      password: zipPassword,
    });

    // Transmitir os dados de archiver para o buffer
    let zipBuffer = Buffer.alloc(0);
    archive.on('data', (chunk) => {
      zipBuffer = Buffer.concat([zipBuffer, chunk]);
    });

    // Adicionar cada PDF ao arquivo ZIP
    produtosValidos.forEach((produto) => {
      archive.append(produto.pdf, { name: `produto_${produto.id}.pdf` });
    });

    // Finalizar o ZIP
    await archive.finalize();

    // 4. Configurar o transporte de e-mail
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'palavrasdidaticas@gmail.com',
        pass: 'hqikugaoocmzrhld',
      },
    });

    // 5. Configurar as opções de e-mail com o ZIP protegido como anexo
    let mailOptions = {
      from: 'palavrasdidaticas@gmail.com',
      to: clienteEmail,
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
      ],
    };

    // 6. Enviar o e-mail e capturar sucesso/falha
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso:', info);

    return 'E-mail com ZIP protegido enviado com sucesso.';
  } catch (error) {
    console.error('Erro ao processar e enviar e-mail:', error);
    throw error;
  }
}
