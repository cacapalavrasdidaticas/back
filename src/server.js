import express from "express";
import cors from "cors";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import validateApiKey from './middleware.js';

import { obterPDF } from './modules/pdf/getPdf.js';
import { obterTodosPDFs } from './modules/pdf/getAllPdf.js';
import { createPdf } from './modules/pdf/postPdf.js';
import { loginUsuario } from './modules/login/login.js';
import { criarConta } from './modules/login/createLogin.js';
import { associatePdf } from './modules/pdf/postPdfDescription.js';
import { obterAssociacoes } from './modules/pdf/getAllAssociations.js';

const app = express();

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
    origin: 'http://localhost:3000', // Permitir requisições de http://localhost:3000
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'api-key'] // Cabeçalhos permitidos
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(validateApiKey);

// Configuração do multer para armazenamento em disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Usar o diretório temporário
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(uploadDir)); // Servir arquivos estáticos da pasta uploads

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

app.listen(5000, () => {
    console.log("API rodando na porta 5000");
});
