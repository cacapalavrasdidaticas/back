import multer from 'multer';
import db from '../../db.js';

// Configuração do multer para armazenamento em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Função para fazer upload da imagem
const uploadImage = async (req, res) => {
  const { title, description, price, link, imageAlt } = req.body;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
  }
  
  try {
    const result = await db.query(
      'INSERT INTO images (image, title, description, price, link, imageAlt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [file.buffer, title, description, price, link, imageAlt]
    );
    if (result && result.length > 0) {
      res.json({ id: result[0].id });
    } else {
      res.status(500).json({ error: 'Erro ao salvar a imagem no banco de dados' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
};

// Função para recuperar a imagem
const getImage = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT image, title, description, price, link, imageAlt FROM images WHERE id = $1', [id]);
    if (result && result.length > 0) {
      const { image, title, description, price, link, imageAlt } = result[0];
      res.set('Content-Type', 'image/jpeg');
      res.send(image);
      // Você pode adicionar outras informações no cabeçalho ou corpo da resposta, conforme necessário
    } else {
      res.status(404).json({ error: 'Imagem não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao recuperar a imagem:', error);
    res.status(500).json({ error: 'Erro ao recuperar a imagem' });
  }
};

// Função para listar todas as imagens
const getAllImages = async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, description, price, link, imageAlt FROM images');
    if (result) {
      res.json(result);
    } else {
      res.status(500).json({ error: 'Erro ao buscar imagens' });
    }
  } catch (error) {
    console.error('Erro ao buscar imagens:', error);
    res.status(500).json({ error: 'Erro ao buscar imagens' });
  }
};

export { upload, uploadImage, getImage, getAllImages };
