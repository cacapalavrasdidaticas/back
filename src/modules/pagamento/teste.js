import nodemailer from 'nodemailer';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url'; // Importação necessária para resolver __dirname
import { obterProduto } from '../produtos/getProdutoId.js';
import { buscarContas } from '../login/getAccount.js';
import archiverZipEncrypted from 'archiver-zip-encrypted';

// Registrar o formato 'zip-encrypted' no archiver
archiver.registerFormat('zip-encrypted', archiverZipEncrypted);

// Resolver __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function processarEEnviarEmail(productIds, clientId, paymentId) {
  try {
    console.log("Iniciando o processamento do e-mail...");

    // 1. Buscar o cliente pelo ID e verificar o retorno
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

    // 2. Buscar os produtos pelo array de IDs fornecido
    const produtos = await Promise.all(
      productIds.map(async (id) => {
        console.log(`Buscando produto com ID: ${id}`);
        const produto = await obterProduto(id);

        if (!produto) {
          console.warn(`Produto com ID ${id} não foi encontrado.`);
          return null;
        }

        return produto;
      })
    );

    const produtosValidos = produtos.filter((produto) => produto !== null);
    console.log('Produtos válidos encontrados:', produtosValidos);

    if (produtosValidos.length === 0) {
      throw new Error('Nenhum produto válido encontrado para os IDs fornecidos.');
    }

    // 3. Gerar PDFs para cada produto e adicionar ao arquivo ZIP diretamente em memória
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
        console.warn(`PDF para o produto com ID ${produto.id} não encontrado ou inválido. Produto será ignorado.`);
        return; // Ignora o produto se o PDF não for válido
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
        pass: 'hqikugaoocmzrhld', // Use a senha do aplicativo ou a senha correta
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
          content: zipBuffer, // Usando o Buffer gerado em memória
          contentType: 'application/zip',
        },
        {
          filename: 'Logo.svg', // Certifique-se de que o caminho para a logo está correto
          path: path.join(__dirname, '../../assets/img/Logo.svg'), // Aqui usa o 'path' com __dirname resolvido
          cid: 'logo', // Definir cid para usar no HTML
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
