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
    const query = req.query.query; // O termo de busca enviado pelo cliente
    if (!query) {
        return res.status(400).json({ error: 'Parâmetro "query" é obrigatório para a busca.' });
    }

    try {
        // Faz a requisição para a API de pesquisa do YouTube (Exatamente a que você pediu)
        const response = await fetch(`https://api.nexfuture.com.br/api/pesquisas/youtube?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            // Lança um erro se a resposta da API não for bem-sucedida (status 2xx)
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Resposta da API de busca (NexFuture):', data); // Log para depuração

        // Verifica se há resultados válidos na resposta da API
        if (!data || !data.resultado) {
            // Retorna uma lista vazia se nenhum resultado for encontrado
            return res.status(200).json({ results: [], message: 'Nenhum resultado encontrado para a sua busca.' });
        }

        // A API NexFuture retorna um único objeto 'resultado'.
        // Mapeamos para um formato que o script.js espera (baseado na resposta que você forneceu)
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

        // Retorna o resultado dentro de um array para manter consistência com o script.js
        res.json({ results: [videoResult] });

    } catch (error) {
        console.error('Erro na busca de músicas:', error.message);
        res.status(500).json({ error: error.message || 'Erro ao buscar músicas.' });
    }
});

// Endpoint para baixar MP3 usando a API Kuromi-System-Tech
app.get('/api/download', async (req, res) => {
    const songTitle = req.query.title; // Espera o título da música do cliente
    if (!songTitle) {
        return res.status(400).json({ error: 'Parâmetro "title" é obrigatório para o download.' });
    }

    try {
        // Faz a requisição para a API de download MP3
        const response = await fetch(`https://kuromi-system-tech.onrender.com/api/play?name=${encodeURIComponent(songTitle)}`);

        if (!response.ok) {
            // Lança um erro se a resposta da API não for bem-sucedida (status 2xx)
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        // Assume que a API de download MP3 retorna o fluxo de áudio diretamente.
        // Configura os cabeçalhos para indicar um download de arquivo MP3.
        const filename = `${songTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`; // Gera um nome de arquivo seguro
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Redireciona o fluxo de dados da resposta da API diretamente para o cliente
        response.body.pipe(res);

    } catch (error) {
        console.error('Erro no download MP3:', error.message);
        res.status(500).json({ error: error.message || 'Erro ao gerar ou baixar o MP3.' });
    }
});

// Rota padrão para servir o arquivo 'index.html' quando a raiz do site é acessada
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
