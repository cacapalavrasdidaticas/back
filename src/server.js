import express from "express";
import cors from "cors";
import multer from 'multer';
import validateApiKey from './middleware.js';

import { obterPDF } from './modules/pdf/getPdf.js';
import { createPdf } from './modules/pdf/postPdf.js';
import { loginUsuario } from './modules/login/login.js';
import { criarConta } from "./modules/login/createLogin.js";

const app = express();

app.use(cors());
app.use(express.json());  // Para parsear JSON no corpo das requisições
app.use(validateApiKey);

// Configurando o multer para usar armazenamento em memória
const upload = multer({ storage: multer.memoryStorage() });

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
    const { login, senha } = req.body;

    try {
        const { token } = await loginUsuario(login, senha);

        res.status(200).json({ token });
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(401).json({ error: "Credenciais inválidas" });
    }
});

app.post('/criar-conta', async (req, res) => {
    console.log("Recebido no endpoint /criar-conta:", req.body);

    await criarConta(req.body);

    res.status(201).json({ message: "Conta criada com sucesso" });
});

// Adaptando para que a porta seja configurada corretamente na Vercel
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});


































// import express from "express";
// import cors from "cors";
// import multer from 'multer';
// import validateApiKey from './middleware.js';

// import { obterPDF } from './modules/pdf/getPdf.js';
// import { createPdf } from './modules/pdf/postPdf.js';
// import { loginUsuario } from './modules/login/login.js';
// import { criarConta } from "./modules/login/createLogin.js";

// const app = express();
// app.use(cors());
// app.use(validateApiKey);

// // const upload = multer({ dest: 'uploads/' });
// const upload = multer({ storage: multer.memoryStorage() });

// app.get('/', (req, res) => {
//     res.send('Funcionou sapohha');
// });
 
// app.get('/pdf/:id', async (req, res) => {
//     const pdfId = req.params.id;

//     try {
//         const pdf = await obterPDF(pdfId);

//         if (pdf) {
//             res.setHeader(
//                 "Content-disposition",
//                 "attachment; filename=" + pdf.nome_do_arquivo
//             );
//             res.setHeader("Content-type", "application/pdf");
//             res.send(pdf.dados);
//         } else {
//             res.status(404).json({ error: "PDF não encontrado" });
//         }
//     } catch (error) {
//         res.status(500).json({ error: "Erro ao buscar o PDF" });
//     }
// });

// app.post('/adicionar-pdf', upload.array('files'), async (req, res) => {
//     try {
//         await createPdf(req, res);
//     } catch (error) {
//         console.error("Erro ao adicionar PDF:", error);
//         res.status(500).json({ error: "Erro ao adicionar PDF" });
//     }
// });


// app.post('/login', async (req, res) => {
//     const { login, senha } = req.body;

//     try {
//         const { token } = await loginUsuario(login, senha);

//         res.status(200).json({ token });
//     } catch (error) {
//         console.error("Erro ao fazer login:", error);
//         res.status(401).json({ error: "Credenciais inválidas" });
//     }
// });

// app.post('/criar-conta', async (req, res) => {
//     const { login, senha } = req.body;

//     try {
//         const token = await criarConta(login, senha);
//         res.status(201).json({ token });
//     } catch (error) {
//         console.error("Erro ao criar conta:", error);
//         res.status(400).json({ error: error.message });
//     }
// });
  
// app.listen(5000, () => {
//     console.log("API rodando na porta 5000");
// });
