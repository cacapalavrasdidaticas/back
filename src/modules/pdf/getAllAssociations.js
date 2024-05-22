import db from '../../db.js';

// Função para associar um PDF a uma imagem
const associatePdfWithImage = async (req, res) => {
  const { pdfId, imageId, title, description, price, link, imageAlt } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO pdf_image_associations (pdf_id, image_id, title, description, price, link, imageAlt) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [pdfId, imageId, title, description, price, link, imageAlt]
    );
    if (result && result.length > 0) {
      res.json({ id: result[0].id });
    } else {
      res.status(500).json({ error: 'Erro ao associar PDF à imagem no banco de dados' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Erro ao associar PDF à imagem' });
  }
};

export { associatePdfWithImage };
