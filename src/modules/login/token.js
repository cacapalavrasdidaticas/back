import nodemailer from 'nodemailer';

// Armazena temporariamente os códigos de verificação
const verificationCodes = new Map(); // Chave: email | Valor: código e tempo de expiração

export async function enviarCodigoVerificacao(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'E-mail obrigatório' });
    }

    // Gerar um código de verificação de 6 dígitos
    const codigoVerificacao = Math.floor(100000 + Math.random() * 900000); // Gera um número entre 100000 e 999999
    const expiraEm = Date.now() + 5 * 60 * 1000; // Expira em 5 minutos

    // Salvar o código temporariamente
    verificationCodes.set(email, { code: codigoVerificacao, expiresAt: expiraEm });

    // Configurar transporte de e-mail
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
             user: 'palavrasdidaticas@gmail.com',
             pass: 'hqikugaoocmzrhld',
        }
    });

    // Opções do e-mail
    let mailOptions = {
        from: 'seuemail@gmail.com',
        to: email,
        subject: 'Seu Código de Verificação',
        text: `Seu código de verificação é: ${codigoVerificacao}. Ele expira em 5 minutos.`,
        html: `<p>Seu código de verificação é: <strong>${codigoVerificacao}</strong></p><p>Ele expira em 5 minutos.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Código enviado com sucesso' });
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        res.status(500).json({ error: 'Erro ao enviar código de verificação' });
    }
}

export async function verificarCodigoVerificacao(req, res) {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
        return res.status(400).json({ error: 'E-mail e código são obrigatórios' });
    }

    const dados = verificationCodes.get(email);
    
    if (!dados) {
        return res.status(400).json({ error: 'Nenhum código encontrado para este e-mail' });
    }

    // Verificar se o código expirou
    if (Date.now() > dados.expiresAt) {
        verificationCodes.delete(email); // Remover código expirado
        return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
    }

    // Verificar se o código está correto
    if (dados.code !== parseInt(codigo)) {
        return res.status(400).json({ error: 'Código inválido' });
    }

    // Código correto, remover para evitar reuso
    verificationCodes.delete(email);

    res.status(200).json({ message: 'Código verificado com sucesso!' });
}


