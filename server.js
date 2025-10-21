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
            url: data.resultado.url, // Esta URL é crucial
        };

        res.json({ results: [videoResult] });

    } catch (error) {
        console.error('Erro na busca de músicas:', error.message);
        res.status(500).json({ error: error.message || 'Erro ao buscar músicas.' });
    }
});

// Endpoint para baixar MP3 ou MP4
app.get('/api/download', async (req, res) => {
    // Pega 'title', 'url' e 'format' da query
    // 'url' agora é a URL do YouTube vinda da pesquisa
    const { title, url, format } = req.query; 

    // Validação do formato
    if (!format || (format !== 'mp3' && format !== 'mp4')) {
        return res.status(400).json({ error: 'Parâmetro "format" inválido. Deve ser "mp3" ou "mp4".' });
    }
    
    // O 'title' é usado apenas para nomear o arquivo
    if (!title) {
        return res.status(400).json({ error: 'Parâmetro "title" é obrigatório para nomear o arquivo.' });
    }
    
    // 'url' (do vídeo específico do YouTube) é necessária 
    // para garantir o download do item correto.
    if (!url) {
        return res.status(400).json({ error: 'Parâmetro "url" (do vídeo do YouTube) é obrigatório.' });
    }
    
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;

    
    if (format === 'mp3') {
        // --- LÓGICA DO MP3 (Usa 'url') ---
        try {
            // Passamos a 'url' do vídeo (vinda da pesquisa) para o parâmetro 'name'
            // da API kuromi. Isso garante que ela baixe o vídeo exato.
            const apiUrl = `https://kuromi-system-tech.onrender.com/api/play?name=${encodeURIComponent(url)}`;
            
            console.log(`Iniciando download MP3 (proxy) de: ${url}`);
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
        try {
            // *** MUDANÇA REALIZADA AQUI ***
            // A API agora é 'ytmp4' e o parâmetro é 'url'.
            const apiUrl = `https://kuromi-system-tech.onrender.com/api/ytmp4?url=${encodeURIComponent(url)}`;
            
            // 1. Faz o fetch para a API de vídeo
            console.log(`Iniciando download MP4 (proxy) de: ${url}`);
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`Iniciando stream proxy para MP4: ${title}`);
            
            // 2. Define os cabeçalhos para o cliente (navegador)
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // 3. Envia (pipe) o stream de vídeo da API para o cliente
            response.body.pipe(res);

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
