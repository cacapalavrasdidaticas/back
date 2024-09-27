import express from "express";
import cors from "cors";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import compression from 'compression';
import validateApiKey from './middleware.js';

import { obterPDF } from './modules/pdf/getPdf.js';
import { obterTodosPDFs } from './modules/pdf/getAllPdf.js';
import { createPdf } from './modules/pdf/postPdf.js';
import { loginUsuario } from './modules/login/login.js';
import { criarConta } from './modules/login/createLogin.js';
import { associatePdf } from './modules/pdf/postPdfDescription.js';
import { associatePdfWithImage } from './modules/pdf/getAllAssociations.js';
import { upload, uploadImage, getImage, getAllImages } from './modules/pdf/imageUpload.js';
import { getPdfImageAssociations } from './modules/pdf/getPdfImageAssociations.js';
import { atualizarConta } from './modules/login/putUser.js';
import { buscarContas } from './modules/login/getAccount.js';
import { createProduto } from "./modules/produtos/postProdutos.js";
import { obterProduto } from "./modules/produtos/getProdutoId.js";
import { obterTodosProdutos } from "./modules/produtos/getProdutos.js";
import { obterTodosProdutosDescricao } from "./modules/produtos/getDescription.js";
import { updateProduto } from "./modules/produtos/putProdutos.js";
import { deleteProduto } from "./modules/produtos/deleteProdutos.js";
import { obterTodasContas } from "./modules/login/getContas.js";
import { obterTodosProdutosV2 } from "./modules/produtos/getProdutos2.js";
import { createProdutoV2 } from "./modules/produtos/postProdutos2.js";
import { postPagamento } from "./modules/pagamento/postPagamento.js"
const app = express();


import WebSocket, { WebSocketServer } from 'ws';

// Cria o servidor WebSocket
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Cliente conectado via WebSocket');

  // Envia uma mensagem de boas-vindas para o cliente
  ws.send('Conexão WebSocket estabelecida');

  ws.on('message', (message) => {
    console.log('Mensagem recebida do cliente:', message);
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

// Função para enviar informações de pagamento para todos os clientes conectados
function broadcastPaymentUpdate(clientId, paymentId) {
  const message = JSON.stringify({ clientId, paymentId, status: 'confirmed' });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}



// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar diretório temporário em ambientes serverless
const uploadDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do CORS
const corsOptions = {
    origin: ['http://localhost:3000', 'https://front-end-pdf.vercel.app', 'http://localhost:3000/home/pdf'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'api-key']
};
app.use(compression());
app.use(cors(corsOptions));

app.use(express.json());

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(uploadDir));

// Aplicar validação de chave API a todas as rotas, exceto as de arquivos estáticos
// app.use((req, res, next) => {
//   if (req.path.startsWith('/uploads')) {
//     return next();
//   }
//   return validateApiKey(req, res, next);
// });

app.get('/', (req, res) => {
    res.send('Funcionou sapohha');
});

app.get('/pdf/:id', async (req, res) => {
    const pdfId = req.params.id;

    try {
        const pdf = await obterPDF(pdfId);

        if (pdf) {
            res.setHeader(
                "Content-disposition",
                "attachment; filename=" + pdf.nome_do_arquivo
            );
            res.setHeader("Content-type", "application/pdf");
            res.send(pdf.dados);
        } else {
            res.status(404).json({ error: "PDF não encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar o PDF" });
    }
});

app.get('/pdfs', async (req, res) => {
    try {
        const pdfs = await obterTodosPDFs();
        res.status(200).json(pdfs);
    } catch (error) {
        console.error("Erro ao buscar todos os PDFs:", error);
        res.status(500).json({ error: "Erro ao buscar todos os PDFs" });
    }
});

app.get('/associacoes', async (req, res) => {
    try {
        const associacoes = await obterAssociacoes();
        res.status(200).json(associacoes);
    } catch (error) {
        console.error("Erro ao buscar todas as associações:", error);
        res.status(500).json({ error: "Erro ao buscar todas as associações" });
    }
});

app.post('/adicionar-pdf', upload.array('files'), async (req, res) => {
    try {
        await createPdf(req, res);
    } catch (error) {
        console.error("Erro ao adicionar PDF:", error);
        res.status(500).json({ error: "Erro ao adicionar PDF" });
    }
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const { token } = await loginUsuario(email, senha);

        res.status(200).json({ token });
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(401).json({ error: "Credenciais inválidas" });
    }
});

app.post('/criar-conta', async (req, res) => {
    const usuario = req.body;

    try {
        const { id } = await criarConta(usuario);

        res.status(201).json({ message: "Conta criada com sucesso", id });
    } catch (error) {
        console.error("Erro ao criar conta:", error);
        res.status(500).json({ error: "Erro ao criar conta" });
    }
});

app.post('/associar-pdf', upload.array('fotos'), async (req, res) => {
    try {
        await associatePdf(req, res);
    } catch (error) {
        console.error("Erro ao associar PDF:", error);
        res.status(500).json({ error: "Erro ao associar PDF" });
    }
});

app.put('/atualizar-conta/:id', async (req, res) => {
    const { id } = req.params;
    const usuario = req.body;

    try {
        const updatedAccount = await atualizarConta(id, usuario);
        res.status(200).json({ message: "Conta atualizada com sucesso", updatedAccount });
    } catch (error) {
        console.error("Erro ao atualizar conta:", error.message);

        res.status(error.statusCode || 500).json({ 
            error: error.statusCode === 422 ? "Erro de validação" : "Erro ao atualizar conta", 
            message: error.message 
        });
    }
});

app.get('/contas/:id', async (req, res) => {
    const { id } = req.params; 

    try {
        const usuario = await buscarContas(id); 
        res.status(200).json(usuario);
    } catch (error) {
        console.error("Erro ao buscar a conta:", error);
        res.status(500).json({ error: "Erro ao buscar a conta" });
    }
});




// Novas rotas para upload e recuperação de imagem
app.post('/upload-image', upload.single('image'), uploadImage);
app.get('/image/:id', getImage);
app.get('/images', getAllImages);
app.post('/associar-pdf-imagem', async (req, res) => {
    await associatePdfWithImage(req, res);
});

app.get('/associacoes-pdf-imagem', async (req, res) => {
    await getPdfImageAssociations(req, res);
});

app.post('/adicionar-produto', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'fotos', maxCount: 10 }]), async (req, res) => {
    try {
        await createProduto(req, res);
    } catch (error) {
        console.error("Erro ao adicionar produto:", error);
        res.status(500).json({ error: "Erro ao adicionar produto" });
    }
});

app.post('/adicionar-produto-v2', upload.fields([{ name: 'part', maxCount: 1 }, { name: 'fotos', maxCount: 10 }]), async (req, res) => {
    try {
        await createProdutoV2(req, res);
    } catch (error) {
        console.error("Erro ao adicionar produto:", error);
        res.status(500).json({ error: "Erro ao adicionar produto" });
    }
});

app.get('/produtos-v2', async (req, res) => {
    try {
        const produtos = await obterTodosProdutosV2();
        res.status(200).json(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ error: "Erro ao buscar produtos" });
    }
});

app.get('/produtos', async (req, res) => {
    try {
        const produtos = await obterTodosProdutos();
        res.status(200).json(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ error: "Erro ao buscar produtos" });
    }
});

app.get('/produto/:id', async (req, res) => {
    const produtoId = req.params.id;

    try {
        const produto = await obterProduto(produtoId);

        if (produto) {
            res.status(200).json(produto);
        } else {
            res.status(404).json({ error: "Produto não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        res.status(500).json({ error: "Erro ao buscar produto" });
    }
});

app.get('/produtos/descricao', async (req, res) => {
    try {
        const produtos = await obterTodosProdutosDescricao();
        res.status(200).json(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ error: "Erro ao buscar produtos" });
    }
});

app.put('/produto/:id', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'fotos', maxCount: 10 }]), async (req, res) => {
    try {
        await updateProduto(req, res);
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        res.status(500).json({ error: "Erro ao atualizar produto" });
    }
});

app.delete('/produto/:id', async (req, res) => {
    try {
        await deleteProduto(req, res);
    } catch (error) {
        console.error("Erro ao deletar produto:", error);
        res.status(500).json({ error: "Erro ao deletar produto" });
    }
});

app.get('/contas', async (req, res) => {
    try {
        const contas = await obterTodasContas();
        res.status(200).json(contas);
    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        res.status(500).json({ error: "Erro ao buscar contas" });
    }
});

app.post('/webhook/asaas', (req, res) => {
  const { event, payment } = req.body;
  
  if (event === 'PAYMENT_RECEIVED') {
    const paymentId = payment.id;
    const clientId = payment.customer;
    
    // Atualize o status da compra no banco de dados
    // updatePaymentStatus(clientId, paymentId, 'confirmed');

    // Envia a atualização de pagamento para o front-end via WebSocket
    broadcastPaymentUpdate(clientId, paymentId);

    res.status(200).send('OK');
  } else {
    res.status(400).send('Event not handled');
  }
});


app.post('/payment/:cpf', async (req, res) => {
    const cpf = req.params.cpf; // Captura o CPF da URL
    const { billingType, value, dueDate, description, idProduto, idUsuario } = req.body; // Captura os dados de pagamento

    try {
        // Processa o pagamento com os dados recebidos
        const resultadoPagamento = await postPagamento({
            cpf,
            billingType,
            value,
            dueDate,
            description,
            idProduto,
            idUsuario
        });

        // Retorna sucesso após processar o pagamento
        res.status(201).json({ message: "Pagamento realizado com sucesso", resultado: resultadoPagamento });
    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        res.status(500).json({ error: "Erro ao processar pagamento" });
    }
});


app.listen(5000, () => {
    console.log("API rodando na porta 5000");
});
