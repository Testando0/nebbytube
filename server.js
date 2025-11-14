const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

// Configurar CORS para permitir requisições de diferentes origens
app.use(cors());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para buscar músicas/vídeos no YouTube usando a API Kuromi/Redzin
app.get('/api/search', async (req, res) => {
    const query = req.query.query; 
    if (!query) {
        return res.status(400).json({ error: 'Parâmetro "query" é obrigatório para a busca.' });
    }

    try {
        const apiUrl = `https://kuromi-system-tech.onrender.com/api/pesquisayt?query=${encodeURIComponent(query)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data || !data.formattedVideos || !Array.isArray(data.formattedVideos) || data.formattedVideos.length === 0) {
            return res.status(200).json({ results: [], message: 'Nenhum resultado encontrado para a sua busca.' });
        }

        const videoResults = data.formattedVideos.map(video => {
            return {
                title: video.title || video.título || 'Sem Título',
                url: video.link || video.url || '',
                thumbnail: video.thumbnail || video.miniatura || '',
                channel: video.channel || video.canal || 'Desconhecido',
                views: video.views || video.visualizações || 0,
                duration: video.duration || video.duração || 'N/A'
            };
        });

        res.json({ results: videoResults });

    } catch (error) {
        console.error('Erro na busca de músicas:', error.message);
        res.status(500).json({ error: error.message || 'Erro ao buscar músicas.' });
    }
});

// Endpoint para baixar MP3 ou MP4
app.get('/api/download', async (req, res) => {
    const { title, url, format } = req.query; 

    if (!format || (format !== 'mp3' && format !== 'mp4')) {
        return res.status(400).json({ error: 'Parâmetro "format" inválido. Deve ser "mp3" ou "mp4".' });
    }
    
    if (!title) {
        return res.status(400).json({ error: 'Parâmetro "title" é obrigatório para nomear o arquivo.' });
    }
    
    if (!url) {
        return res.status(400).json({ error: 'Parâmetro "url" (do vídeo do YouTube) é obrigatório.' });
    }
    
    // Sanitiza o nome do arquivo
    const filename = `${title.replace(/[^a-zA-Z0-9\s-_]/g, '_').replace(/\s+/g, '_')}.${format}`;

    if (format === 'mp3') {
        // --- LÓGICA DO MP3 (API VREDEN) ---
        try {
            const jsonApiUrl = `https://api.vreden.my.id/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=128`;
            
            console.log(`Buscando link de download MP3 (Vreden) para: ${url}`);
            const jsonResponse = await fetch(jsonApiUrl);

            if (!jsonResponse.ok) {
                const errorText = await jsonResponse.text();
                throw new Error(`Erro HTTP ${jsonResponse.status} na API Vreden MP3: ${errorText.substring(0, 100)}`);
            }

            const data = await jsonResponse.json();
            
            // Tenta pegar 'result' ou 'resultado' para compatibilidade
            const rootData = data.result || data.resultado;
            const downloadUrl = rootData?.download?.url;
            
            if (!downloadUrl) {
                 console.error('Resposta da API MP3:', JSON.stringify(data));
                 throw new Error(`Link de download MP3 não encontrado na resposta da API.`);
            }

            console.log(`Iniciando download do áudio: ${downloadUrl}`);
            const streamResponse = await fetch(downloadUrl);

            if (!streamResponse.ok) {
                throw new Error(`Erro HTTP ${streamResponse.status} ao baixar o arquivo de áudio.`);
            }

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            streamResponse.body.pipe(res);

        } catch (error) {
            console.error(`Erro no download MP3:`, error.message);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message || `Erro ao gerar ou baixar o MP3.` });
            }
        }

    } else {
        // --- LÓGICA DO MP4 (ATUALIZADA PARA API VREDEN) ---
        try {
            // 1. Chama a API Vreden solicitando vídeo quality=360
            const jsonApiUrl = `https://api.vreden.my.id/api/v1/download/youtube/video?url=${encodeURIComponent(url)}&quality=360`;
            
            console.log(`Buscando link de download MP4 (Vreden 360p) para: ${url}`);
            const jsonResponse = await fetch(jsonApiUrl);

            if (!jsonResponse.ok) {
                const errorText = await jsonResponse.text(); 
                throw new Error(`Erro HTTP ${jsonResponse.status} na API Vreden MP4: ${errorText.substring(0, 150)}`);
            }

            const data = await jsonResponse.json();
            
            // Tenta pegar 'result' ou 'resultado'
            const rootData = data.result || data.resultado;
            const downloadUrl = rootData?.download?.url;

            if (!downloadUrl) {
                console.error('Resposta da API MP4:', JSON.stringify(data));
                throw new Error(`Link de download MP4 não encontrado na resposta da API.`);
            }

            // 2. Faz o proxy do stream de vídeo
            console.log(`Iniciando download do vídeo: ${downloadUrl}`);
            const streamResponse = await fetch(downloadUrl);

            if (!streamResponse.ok) {
                throw new Error(`Erro HTTP ${streamResponse.status} ao baixar o arquivo de vídeo.`);
            }

            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            streamResponse.body.pipe(res);

        } catch (error) {
            console.error(`Erro no download MP4:`, error.message);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message || `Erro ao gerar ou baixar o MP4.` });
            }
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
