const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch'); // Certifique-se de ter 'node-fetch' instalado (npm install node-fetch)

const app = express();
const port = 3000;

// Configurar CORS para permitir requisições de diferentes origens
app.use(cors());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para buscar músicas/vídeos no YouTube usando a API NexFuture
app.get('/api/search', async (req, res) => {
    const query = req.query.query; 
    if (!query) {
        return res.status(400).json({ error: 'Parâmetro "query" é obrigatório para a busca.' });
    }

    try {
        const response = await fetch(`https://api.nexfuture.com.br/api/pesquisas/youtube?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Resposta da API de busca (NexFuture):', data); 

        if (!data || !data.resultado) {
            return res.status(200).json({ results: [], message: 'Nenhum resultado encontrado para a sua busca.' });
        }

        const videoResult = {
            title: data.resultado.titulo,
            id: data.resultado.id,
            thumbnail: data.resultado.imagem,
            channel: data.resultado.canal,
            description: data.resultado.descricao,
            views: data.resultado.views,
            duration: data.resultado.duracao,
            url: data.resultado.url,
        };

        res.json({ results: [videoResult] });

    } catch (error) {
        console.error('Erro na busca de músicas:', error.message);
        res.status(500).json({ error: error.message || 'Erro ao buscar músicas.' });
    }
});

// Endpoint para baixar MP3 ou MP4
// *** ATUALIZADO: Agora usa 'title' para MP3 e 'url' para MP4 ***
app.get('/api/download', async (req, res) => {
    // Pega 'title', 'url' e 'format' da query
    const { title, url, format } = req.query; 

    // Validação do formato
    if (!format || (format !== 'mp3' && format !== 'mp4')) {
        return res.status(400).json({ error: 'Parâmetro "format" inválido. Deve ser "mp3" ou "mp4".' });
    }
    
    // O título é usado para nomear o arquivo em ambos os casos
    if (!title) {
        return res.status(400).json({ error: 'Parâmetro "title" é obrigatório para nomear o arquivo.' });
    }
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;

    
    if (format === 'mp3') {
        // --- LÓGICA DO MP3 (Usa 'title') ---
        try {
            const apiUrl = `https://kuromi-system-tech.onrender.com/api/play?name=${encodeURIComponent(title)}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            // Faz o proxy do stream de áudio
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            response.body.pipe(res);

        } catch (error) {
            console.error(`Erro no download MP3:`, error.message);
            res.status(500).json({ error: error.message || `Erro ao gerar ou baixar o MP3.` });
        }

    } else {
        // --- LÓGICA DO MP4 (Usa 'url') ---
        // Validação específica para MP4
        if (!url) {
            return res.status(400).json({ error: 'Parâmetro "url" é obrigatório para o download de MP4.' });
        }
        
        try {
            // *** ATUALIZADO: Usa a nova API speedhosting e o parâmetro 'url' ***
            const apiUrl = `http://speedhosting.cloud:2009/download/play-video?&url=${encodeURIComponent(url)}`;
            
            // Usa a mesma tática de redirecionamento
            console.log(`Redirecionando MP4 para: ${apiUrl}`);
            res.redirect(apiUrl);

        } catch (error) {
            console.error(`Erro no redirecionamento MP4:`, error.message);
            res.status(500).json({ error: error.message || `Erro ao processar o pedido de MP4.` });
        }
    }
});

// Rota padrão para servir o arquivo 'index.html'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
