import multer from 'multer';
import db from '../../db.js';

// Configuração do multer para armazenamento em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Função para fazer upload da imagem
const uploadImage = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
  }
  
  try {
    const result = await db.query('INSERT INTO images (image) VALUES ($1) RETURNING id', [file.buffer]);
    res.json({ id: result.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
};

// Função para recuperar a imagem
const getImage = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT image FROM images WHERE id = $1', [id]);
    if (result.length > 0) {
      const image = result.image;
      res.set('Content-Type', 'image/jpeg');
      res.send(image);
    } else {
      res.status(404).json({ error: 'Imagem não encontrada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao recuperar a imagem' });
  }
};

// Função para listar todas as imagens
const getAllImages = async (req, res) => {
  try {
    const result = await db.query('SELECT id FROM images');
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar imagens' });
  }
};

export { upload, uploadImage, getImage, getAllImages };
