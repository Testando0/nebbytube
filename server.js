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
    
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;

    
    if (format === 'mp3') {
        // --- LÓGICA DO MP3 (2 PASSOS: JSON -> STREAM) ---
        try {
            // PASSO 1: Chamar a API da NexFuture para obter o link direto de download
            const jsonApiUrl = `https://api.nexfuture.com.br/api/downloads/youtube/mp3/v3?url=${encodeURIComponent(url)}`;
            
            console.log(`Buscando link de download MP3 (NexFuture JSON) para: ${url}`);
            const jsonResponse = await fetch(jsonApiUrl);

            if (!jsonResponse.ok) {
                const errorText = await jsonResponse.text();
                throw new Error(`Erro HTTP ${jsonResponse.status} na API JSON (MP3): ${errorText.substring(0, 100)}`);
            }

            const data = await jsonResponse.json();
            
            // Procura o link de download em locais comuns da resposta
            const downloadLink = data.downloadLink || data.resultado?.downloadLink || data.download?.downloadLink;
            
            if (!downloadLink) {
                 throw new Error(`Link de download MP3 não encontrado na resposta da API. Resposta: ${JSON.stringify(data).substring(0, 100)}...`);
            }

            // PASSO 2: Fazer o fetch do link direto e proxy do stream
            console.log(`Iniciando proxy MP3 do link direto: ${downloadLink}`);
            const streamResponse = await fetch(downloadLink);

            if (!streamResponse.ok) {
                throw new Error(`Erro HTTP ${streamResponse.status} ao fazer fetch do link de download (MP3).`);
            }

            // Faz o proxy do stream de áudio
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            streamResponse.body.pipe(res);

        } catch (error) {
            console.error(`Erro no download MP3:`, error.message);
            res.status(500).json({ error: error.message || `Erro ao gerar ou baixar o MP3.` });
        }

    } else {
        // --- LÓGICA ATUALIZADA DO MP4 (2 PASSOS: JSON -> STREAM via NexFuture) ---
        try {
            // PASSO 1: Chamar a nova API da NexFuture para obter o link direto de download
            const jsonApiUrl = `https://api.nexfuture.com.br/api/downloads/youtube/mp4?url=${encodeURIComponent(url)}`;
            
            console.log(`Buscando link de download MP4 (NexFuture JSON) para: ${url}`);
            const jsonResponse = await fetch(jsonApiUrl);

            if (!jsonResponse.ok) {
                const errorText = await jsonResponse.text();
                throw new Error(`Erro HTTP ${jsonResponse.status} na API JSON (MP4): ${errorText.substring(0, 100)}`);
            }

            const data = await jsonResponse.json();
            
            // Procura o link de download (mesma lógica do MP3)
            const downloadLink = data.downloadLink || data.resultado?.downloadLink || data.download?.downloadLink;
            
            if (!downloadLink) {
                 throw new Error(`Link de download MP4 não encontrado na resposta da API. Resposta: ${JSON.stringify(data).substring(0, 100)}...`);
            }

            // PASSO 2: Fazer o fetch do link direto e proxy do stream
            console.log(`Iniciando proxy MP4 do link direto: ${downloadLink}`);
            const streamResponse = await fetch(downloadLink);

            if (!streamResponse.ok) {
                throw new Error(`Erro HTTP ${streamResponse.status} ao fazer fetch do link de download (MP4).`);
            }

            // Faz o proxy do stream de vídeo
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            streamResponse.body.pipe(res);

        } catch (error) {
            console.error(`Erro no download MP4:`, error.message);
            res.status(500).json({ error: error.message || `Erro ao gerar ou baixar o MP4.` });
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
