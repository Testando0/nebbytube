document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os principais elementos da página
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const statusMessage = document.getElementById('statusMessage');

    // Seleciona os elementos do player de vídeo
    const videoPlayerContainer = document.getElementById('video-player');
    const youtubePlayer = document.getElementById('youtube-player');

    // Define a URL base da API
    const API_BASE = 'https://kuromi-system-tech.onrender.com/api';

    // Funções auxiliares para mostrar/esconder elementos
    const showLoading = () => loadingIndicator.classList.remove('hidden');
    const hideLoading = () => loadingIndicator.classList.add('hidden');
    const showError = (message) => {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    };
    const hideError = () => errorMessage.classList.add('hidden');
    const hideStatus = () => statusMessage.classList.add('hidden');
    const showStatus = (message) => {
        statusMessage.querySelector('p').textContent = message;
        statusMessage.classList.remove('hidden');
    }

    // Função principal para realizar a busca
    const performSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) {
            showError('Por favor, digite o nome da música ou vídeo.');
            return;
        }

        // Limpa a interface para a nova busca
        showLoading();
        hideError();
        hideStatus();
        resultsContainer.innerHTML = '';
        videoPlayerContainer.classList.add('hidden'); // Esconde o player

        try {
            const encodedQuery = encodeURIComponent(query);
            // 1. Busca os vídeos na API de pesquisa
            const response = await fetch(`${API_BASE}/pesquisayt?query=${encodedQuery}`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            const data = await response.json();
            hideLoading();

            // Verifica se encontrou resultados
            if (!data || !data.formattedVideos || data.formattedVideos.length === 0) {
                showError('Nenhum resultado encontrado para sua busca.');
                return;
            }

            // 2. Cria os cards para cada resultado
            data.formattedVideos.forEach(video => {
                const card = createVideoCard(video);
                resultsContainer.appendChild(card);
            });

        } catch (error) {
            console.error('Erro ao buscar:', error);
            hideLoading();
            showError('Ocorreu um erro ao buscar. Tente novamente mais tarde.');
        }
    };

    /**
     * Tenta extrair o ID do vídeo do YouTube da URL da miniatura.
     * Ex: https://i.ytimg.com/vi/[VIDEO_ID]/hqdefault.jpg
     */
    const extractVideoId = (thumbnailUrl) => {
        try {
            const match = thumbnailUrl.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
            return match ? match[1] : null;
        } catch (e) {
            return null;
        }
    };

    // Função para criar o HTML de cada card de vídeo
    const createVideoCard = (video) => {
        const card = document.createElement('div');
        card.className = 'card rounded-lg overflow-hidden shadow-lg p-4 flex flex-col justify-between';

        // Codifica o título para usar na URL de download
        const encodedTitle = encodeURIComponent(video.title);
        
        // 2. Define a URL de download de MP3 (conforme a API fornecida)
        const mp3Url = `${API_BASE}/play?name=${encodedTitle}`;
        
        // 3. (Suposição) Define a URL de MP4 baseada no padrão da API
        //    Estou assumindo que exista um endpoint 'ytmp4'
        const mp4Url = `${API_BASE}/ytmp4?name=${encodedTitle}`;

        // Extrai o ID do vídeo para o player
        const videoId = extractVideoId(video.thumbnail);

        card.innerHTML = `
            <div>
                <div class="relative">
                    <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-48 object-cover rounded-md">
                    <span class="duration-badge absolute bottom-2 right-2 px-2 py-1 text-xs font-semibold rounded">${video.duration}</span>
                </div>
                <div class="py-4">
                    <h3 class="font-bold text-lg mb-2 truncate" title="${video.title}">${video.title}</h3>
                    <p class="text-gray-400 text-sm mb-2">${video.channel}</p>
                    <p class="text-gray-400 text-sm views-count">${video.views}</p>
                </div>
            </div>
            <div>
                <div class="flex flex-col sm:flex-row gap-2 download-buttons">
                    <a href="${mp3Url}" target="_blank" class="btn-download w-full text-white font-bold py-2 px-4 rounded text-center">
                        <i class="fas fa-music mr-2"></i> Baixar MP3
                    </a>
                    <a href="${mp4Url}" target="_blank" class="btn-download-mp4 w-full text-white font-bold py-2 px-4 rounded text-center">
                        <i class="fas fa-video mr-2"></i> Baixar MP4
                    </a>
                </div>
                ${videoId ? `
                <button data-videoid="${videoId}" class="watch-btn w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-center transition duration-300">
                    <i class="fas fa-play mr-2"></i> Assistir
                </button>
                ` : ''}
            </div>
        `;

        // Adiciona o evento de clique para o botão "Assistir"
        const watchBtn = card.querySelector('.watch-btn');
        if (watchBtn) {
            watchBtn.addEventListener('click', () => {
                const id = watchBtn.getAttribute('data-videoid');
                youtubePlayer.src = `https://www.youtube.com/embed/${id}`;
                videoPlayerContainer.classList.remove('hidden');
                // Rola a página até o player
                videoPlayerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        return card;
    };

    // Adiciona os eventos de clique e "Enter"
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Define a mensagem inicial
    showStatus('Digite algo para buscar...');
});
