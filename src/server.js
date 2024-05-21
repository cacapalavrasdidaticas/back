import express from "express";
import cors from "cors";
import multer from 'multer';
import validateApiKey from './middleware.js';

import { obterPDF } from './modules/pdf/getPdf.js';
import { createPdf } from './modules/pdf/postPdf.js';
import { loginUsuario } from './modules/login/login.js';
import { criarConta } from './modules/login/createLogin.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(validateApiKey);

const upload = multer({ dest: 'uploads/' });

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

app.listen(5000, () => {
    console.log("API rodando na porta 5000");
});
