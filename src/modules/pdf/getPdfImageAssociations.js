import db from '../../db.js';

const getPdfImageAssociations = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        pdfs.id AS pdf_id,
        pdfs.nome_do_arquivo AS pdf_name,
        images.id AS image_id,
        images.title,
        images.description,
        images.price,
        images.link,
        images.imageAlt
      FROM 
        pdfs
      INNER JOIN 
        images ON pdfs.id = images.pdf_id
    `);
    
    if (result) {
      res.json(result);
    } else {
      res.status(500).json({ error: 'Erro ao buscar associações entre PDFs e imagens' });
    }
  } catch (error) {
    console.error('Erro ao buscar associações entre PDFs e imagens:', error);
    res.status(500).json({ error: 'Erro ao buscar associações entre PDFs e imagens' });
  }
};

export { getPdfImageAssociations };
