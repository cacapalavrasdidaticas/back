// import nodemailer from 'nodemailer';
// import archiver from 'archiver';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { obterProduto } from '../produtos/getProdutoIdV2.js';
// import { buscarContas } from '../login/getAccount.js';
// import archiverZipEncrypted from 'archiver-zip-encrypted';
// import { atualizarComprasCliente } from '../login/atualizarCompras.js';

// const MAX_ATTEMPTS = 5; // Limite de tentativas de busca
// const WAIT_TIME_MS = 2000; // Tempo de espera entre tentativas (2 segundos)

// archiver.registerFormat('zip-encrypted', archiverZipEncrypted);
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Função que faz polling para aguardar até que o PDF esteja disponível
// async function aguardarPDF(idProduto, tentativas = 0) {
//   let produto = await obterProduto(idProduto);

//   // Desembrulhar o array, se necessário
//   if (Array.isArray(produto)) {
//     produto = produto[0]; // Pegue o primeiro item, caso esteja aninhado
//   }

//   if (produto && produto.pdf && Buffer.isBuffer(produto.pdf)) {
//     return produto;
//   } else if (tentativas >= MAX_ATTEMPTS) {
//     throw new Error(`PDF para o produto com ID ${idProduto} não está disponível após ${MAX_ATTEMPTS} tentativas.`);
//   } else {
//     console.log(`Tentativa ${tentativas + 1}: PDF para o produto com ID ${idProduto} não disponível. Aguardando...`);
//     await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS)); // Aguardar antes da próxima tentativa
//     return aguardarPDF(idProduto, tentativas + 1); // Tentar novamente
//   }
// }

// export async function processarEEnviarEmail(productIds, clientId, paymentId) {
//   try {
//     console.log("Iniciando o processamento do e-mail...");

//     // 1. Buscar o cliente pelo ID
//     const cliente = await buscarContas(clientId);
//     if (!cliente || cliente.usuario.length === 0) {
//       throw new Error('Cliente não encontrado.');
//     }

//     console.log(cliente, 'Cliente encontrado');
//     const clienteInfo = cliente.usuario;
//     const clienteEmail = clienteInfo.email;
//     const cpf = clienteInfo.cpf;
//     const zipPassword = cpf.slice(0, 3); // Extrair os 3 primeiros dígitos do CPF para a senha do ZIP

//     console.log(`Cliente encontrado: ${clienteInfo.nome} (${clienteEmail})`);

//     // 2. Atualizar o campo "compras" do cliente com os IDs dos produtos adquiridos
//     await atualizarComprasCliente(clientId, productIds);

//     // 3. Buscar os produtos e aguardar que os PDFs estejam disponíveis
//     const produtos = await Promise.all(
//       productIds.map(async (id) => {
//         console.log(`Buscando produto com ID: ${id}`);
//         return aguardarPDF(id); // Aguardar até que o PDF esteja disponível
//       })
//     );

//     const produtosValidos = produtos.filter((produto) => produto !== null);
//     console.log('Produtos válidos encontrados:', produtosValidos);

//     if (produtosValidos.length === 0) {
//       throw new Error('Nenhum produto válido encontrado para os IDs fornecidos.');
//     }

//     // 4. Gerar o arquivo ZIP com os PDFs diretamente na memória
//     const archive = archiver('zip-encrypted', {
//       zlib: { level: 9 },
//       encryptionMethod: 'aes256',
//       password: zipPassword,
//     });

//     const buffers = [];
//     archive.on('data', (data) => buffers.push(data));
//     archive.on('error', (err) => {
//       throw err;
//     });

//     // Adicionar cada PDF ao arquivo ZIP
//     produtosValidos.forEach((produto) => {
//       if (!produto.pdf || !Buffer.isBuffer(produto.pdf)) {
//         throw new Error(`PDF para o produto com ID ${produto.id} não encontrado no banco de dados ou não é um Buffer válido.`);
//       }
//       console.log(`Adicionando PDF do produto ID ${produto.id} ao ZIP.`);
//       archive.append(produto.pdf, { name: `produto_${produto.id}.pdf` });
//     });

//     // Finalizar o ZIP
//     await archive.finalize();

//     // Concatenar os buffers para criar o arquivo ZIP completo em memória
//     const zipBuffer = Buffer.concat(buffers);
//     console.log('ZIP gerado em memória.');

//     // 5. Configurar o transporte de e-mail
//     console.log('Configurando transporte de e-mail...');
//     let transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: 'palavrasdidaticas@gmail.com',
//         pass: 'hqikugaoocmzrhld',
//       },
//     });

//     // Verificar se o transporte está configurado corretamente
//     await transporter.verify((error, success) => {
//       if (error) {
//         console.error('Erro ao configurar o transporte de e-mail:', error);
//         throw new Error('Erro ao configurar o transporte de e-mail.');
//       } else {
//         console.log('Transporte de e-mail configurado corretamente:', success);
//       }
//     });

//     // 6. Configurar as opções de e-mail com o ZIP protegido como anexo
//     let mailOptions = {
//       from: 'palavrasdidaticas@gmail.com',
//       // Para enviar para o cliente real, use o email do cliente
//       to: clienteEmail,
//       // to: "anderson_felipetavares@hotmail.com",
//       subject: 'Produtos adquiridos',
//       html: `
//         <!DOCTYPE html>
//         <html lang="pt-br">
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Caça Atividades Escolares</title>
//           <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
//           <style>
//             body, html {
//     margin: 0;
//     padding: 0;
//     font-family: Arial, sans-serif;
//     background-color: #f8f8f8;
// }

// .container {
//     max-width: 600px;
//     margin: 20px auto;
//     background: #fff;
//     box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
//     border-radius: 10px;
//     overflow: hidden;
//     padding: 20px;
// }

// .header {
//     display: flex;
//     align-items: center;
//     padding: 20px;
//     /* background-color: #eef6ff; */
//     /* border-bottom: 2px solid #007bff; */
// }

// .logo {
//     width: 320px;
//     margin-left: -40px;

// }

// .header-text {
//     display: flex;
//     flex-direction: column;
// }

// .header-text h1 {
//     color: #007bff;
//     margin: 0;
//     font-size: 32px;
// }

// .header-text p {
//     margin: 5px 0 0;
//     font-size: 32px;
//     font-weight: bold;
// }

// .main-content {
//     text-align: center;
//     padding: 20px;
// }

// .main-content p {
//     margin: 15px 0;
//     line-height: 1.6;
// }

// .password {
//     font-weight: bold;
//     font-size: 18px;
//     /* background: #eef6ff; */
//     padding: 10px;
//     text-align: center;
//     border-radius: 5px;
//     /* border: 1px solid #007bff; */
// }

// .disclaimer {
//     margin-top: 20px;
//     padding: 15px;
//     /* background-color: #fff3cd; */
//     background-color: #eef6ff;
//     border: 1px solid #007bff;
//     border-radius: 5px;
//     font-size: 16px;
//     text-align: justify;
// }

// .education-pillars {
//     text-align: center;
//     margin: 20px 0;
// }

// .education-pillars h3 {
//     margin-bottom: 10px;
// }

// .education-pillars p {
//     margin: 5px 0;
// }

// .features {
//     display: flex;
//     flex-wrap: wrap;
//     justify-content: space-around;
//     text-align: justify;
// }

// .feature {
//     width: 45%;
//     text-align: center;
//     margin-bottom: 20px;
// }

// .feature img {
//     width: 200px;
//     height: auto; 
//     margin-bottom: 10px;
// }

// .feature p {
//     margin: 5px 0;
// }

// .footer {
//     text-align: center;
//     padding: 30px;
//     /* background-color: #eef6ff; */
//     /* border-top: 2px solid #007bff; */
// }

// .footer p {
//     margin: 15px 0;
// }

// .text{
//     text-align: center;
// }

//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <img src="cid:logo" alt="Logo Caça Atividades Escolares" class="logo">
//               <div class="header-text">
//                 <h1>Obrigado (a)!</h1>
//                 <p>É uma honra para nós tê-lo como cliente.</p>
//               </div>
//             </div>
//             <main class="main-content">
//               <p class="text">“Olá, ${clienteInfo.nome}! Obrigado por comprar com a gente!</p>
//               <p class="text">Estamos empolgados para saber o que achou dos produtos que adquiriu. Por isso, não esqueça de compartilhar feedback nas redes sociais e marcar a gente para que possamos repostar”</p>
//               <p class="text">Abaixo segue a senha para acessar o seu produto:</p>
//               <p class="password">${zipPassword}</p>

//               <div class="disclaimer">
//                 <strong>
//                 <p>É PROIBIDA A REPRODUÇÃO, VENDA E COMPARTILHAMENTO DESTE MATERIAL. TODAS AS APOSTILAS DE CAÇA-PALAVRAS DIDÁTICOS ESTÃO PROTEGIDAS COM SENHA, DE USO PESSOAL DO COMPRADOR. ALÉM DISSO, EM TODAS AS PÁGINAS, ESTÁ O SEU E-MAIL E UM CÓDIGO INTERNO PARA LOCALIZAR RAPIDAMENTE O DONO DO MATERIAL.</p>
//                 <p>A VIOLAÇÃO DOS DIREITOS EXCLUSIVOS DO PRODUTOR SERÁ CONSIDERADA CRIME (ARTIGO 184 DO CÓDIGO PENAL), SENDO ESTA FEITA A REPRODUÇÃO, VENDA OU COMPARTILHAMENTO. NÓS SEGUIMOS O DIREITO AUTORAL EM PROCESSOS E AÇÕES LEGAIS PARA RESPONSABILIZÁ-LO POR PLÁGIO E DANOS AOS CLIENTES AUTORAIS. DESDE JÁ CONTAMOS COM A SUA COLABORAÇÃO PARA QUE ESTE MATERIAL NÃO SEJA REPRODUZIDO.</p>
//               </strong>
//               </div>

//               <div class="education-pillars">
//                 <h3>4 Pilares da Educação</h3>
//                 <p>Aprender a Conhecer</p>
//                 <p>Aprender a Fazer</p>
//                 <p>Aprender a Ser</p>
//                 <p>Aprender a Conviver</p>
//               </div>

//               <div class="features">
//                 <div class="feature">
//                   <i class="fas fa-comments"></i>
//                   <p><strong>Linguagem Dialógica</strong></p>
//                   <p>Nosso material busca promover uma linguagem dialógica, proporcionando oportunidades para diálogos e trocas de experiências.</p>
//                 </div>
//                 <div class="feature">
//                   <i class="fas fa-dollar-sign"></i>
//                   <p><strong>Investimento</strong></p>
//                   <p>Adquirir nosso material é investir em economia de tempo, melhor qualidade de vida, redução de estresse e maior qualidade nas suas aulas.</p>
//                 </div>
//                 <div class="feature">
//                   <i class="fas fa-award"></i>
//                   <p><strong>Fácil de Acessar</strong></p>
//                   <p>Todos os nossos materiais incluem uma variedade de modelos e amostras para que você possa verificar se eles atendem às suas necessidades.</p>
//                 </div>
//                 <div class="feature">
//                   <i class="fas fa-medal"></i>
//                   <p><strong>Credibilidade</strong></p>
//                   <p>Trabalhamos com seriedade e carinho, e há mais de 5 anos no mercado, atendemos milhares de professores em todo o Brasil. Estamos sempre em busca de oferecer o melhor.</p>
//                 </div>
//               </div>
//             </main>
//             <footer class="footer">
//               <p class="text">Esperamos que sua experiência com nosso material proporcione momentos enriquecedores de aprendizagem com seus alunos.</p>
//               <p><strong>Atenciosamente,</strong></p>
//               <p>Equipe Caça Atividades Escolares</p>
//             </footer>
//           </div>
//         </body>
//         </html>
//       `,
//       attachments: [
//         {
//           filename: 'produtos_protegidos.zip',
//           content: zipBuffer,
//           contentType: 'application/zip',
//         },
//         {
//           filename: 'Logo.svg',
//           path: path.join(__dirname, '../../assets/img/Logo.svg'),
//           cid: 'logo',
//         },
//       ],
//     };

//     // 7. Enviar o e-mail e capturar sucesso/falha
//     console.log('Enviando e-mail...');
//     const info = await transporter.sendMail(mailOptions);
//     console.log('E-mail enviado com sucesso:', info);

//     return 'E-mail com ZIP protegido enviado com sucesso.';
//   } catch (error) {
//     console.error('Erro ao processar e enviar e-mail:', error);
//     throw error;
//   }
// }





import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import { obterProduto } from '../produtos/getProdutoIdV2.js';
import { buscarContas } from '../login/getAccount.js';
import archiverZipEncrypted from 'archiver-zip-encrypted';
import { atualizarComprasCliente } from '../login/atualizarCompras.js';

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
    console.log("Iniciando o processamento (sem envio de e-mail)...");

    // 1. Buscar o cliente pelo ID
    const cliente = await buscarContas(clientId);
    if (!cliente || cliente.usuario.length === 0) {
      throw new Error('Cliente não encontrado.');
    }

    console.log(cliente, 'Cliente encontrado');
    const clienteInfo = cliente.usuario;
    const cpf = clienteInfo.cpf;
    const zipPassword = cpf.slice(0, 3); // Extrair os 3 primeiros dígitos do CPF para a senha do ZIP

    console.log(`Cliente encontrado: ${clienteInfo.nome} (${clienteInfo.email})`);

    // 2. Atualizar o campo "compras" do cliente com os IDs dos produtos adquiridos
    await atualizarComprasCliente(clientId, productIds);

    // 3. Buscar os produtos e aguardar que os PDFs estejam disponíveis
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

    // 4. Gerar o arquivo ZIP com os PDFs diretamente na memória
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
    console.log('ZIP gerado em memória com sucesso.');

    // ✅ Em vez de enviar o e-mail, apenas retorna os dados processados
    return {
      message: 'ZIP gerado e dados processados com sucesso (sem envio de e-mail).',
      cliente: clienteInfo,
      produtos: produtosValidos.map(p => ({
        id: p.id,
        nome: p.nome || 'Sem nome',
      })),
      zipPassword,
      zipBufferLength: zipBuffer.length,
      paymentId,
    };

  } catch (error) {
    console.error('Erro ao processar os produtos:', error);
    throw error;
  }
}


