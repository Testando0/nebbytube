document.addEventListener('DOMContentLoaded', function() {
    // --- Seletores de Elementos ---
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const statusMessage = document.getElementById('statusMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const totalDuration = document.getElementById('totalDuration');
    const videoPlayerContainer = document.getElementById('video-player');
    const youtubePlayer = document.getElementById('youtube-player');

    // --- Endereços das APIs ---
    // API de Busca ATUALIZADA
    const SEARCH_API = 'https://api.nexfuture.com.br/api/pesquisas/youtube?query=';
    
    // APIs de Download (ainda funcionam e serão mantidas)
    const DOWNLOAD_AUDIO_API = 'https://api.ytb.re/dl?type=mp3&id='; // Precisa do ID
    const DOWNLOAD_VIDEO_API = 'https://api.ytb.re/dl?type=mp4&id='; // Precisa do ID
    
    // Mostrar mensagem inicial
    statusMessage.classList.remove('hidden');

    // --- Funções Principais ---

    /**
     * Busca vídeos usando a nova API de pesquisa (api.nexfuture.com.br)
     */
    async function searchVideos(query) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Buscando...';
        
        try {
            // Limpar UI
            resultsContainer.innerHTML = '';
            if (youtubePlayer) youtubePlayer.src = '';
            if (videoPlayerContainer) videoPlayerContainer.classList.add('hidden');
            totalDuration.classList.add('hidden');
            loadingIndicator.classList.remove('hidden');
            statusMessage.classList.add('hidden');
            errorMessage.classList.add('hidden');
            
            // Fazer requisição à API de busca
            const response = await fetch(`${SEARCH_API}${encodeURIComponent(query)}`);
            const data = await response.json();
            
            // Verificar se a API retornou status 'true' e um resultado
            if (!response.ok || !data.status || !data.resultado) {
                let errorMsg = 'Nenhum vídeo encontrado.';
                if (data.message) errorMsg = data.message; // Usar msg de erro da API se existir
                if (!response.ok) errorMsg = 'Erro ao se conectar com a API de busca.';
                
                statusMessage.classList.remove('hidden');
                statusMessage.innerHTML = `<p class="text-gray-400">${errorMsg}</p>`;
                return;
            }

            // A API retorna um objeto 'resultado', não um array.
            // Colocamos esse objeto dentro de um array para o resto do código funcionar.
            const videos = [data.resultado];
            
            // Mostrar duração total
            showTotalDuration(videos);
            
            // Criar cards para cada vídeo (neste caso, apenas um)
            videos.forEach(video => {
                const card = document.createElement('div');
                card.className = 'card bg-gray-800 rounded-lg overflow-hidden shadow-lg';

                // Mapear os campos da nova API
                const videoId = video.id;
                const videoTitle = video.titulo;
                const videoThumbnail = video.imagem; // API já fornece a imagem
                const videoUrl = video.url;
                const videoChannel = video.canal;
                const videoViews = video.views;
                const videoDuration = video.duracao;

                // Thumbnail com duração
                const thumbnailHtml = `
                    <div class="relative">
                        <img src="${videoThumbnail}" alt="${videoTitle}" class="w-full h-48 object-cover cursor-pointer video-thumbnail" data-video-url="${videoUrl}">
                        <span class="duration-badge absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded">
                            ${videoDuration || 'N/A'}
                        </span>
                    </div>
                `;
                
                // Informações do vídeo
                const infoHtml = `
                    <div class="p-4">
                        <a href="${videoUrl}" target="_blank" class="text-white font-semibold hover:text-nebula-purple transition duration-300 line-clamp-2" title="${videoTitle}">
                            ${videoTitle}
                        </a>
                        <div class="flex items-center mt-2 text-gray-400 text-sm">
                            <span class="hover:text-white transition duration-300">
                                ${videoChannel || 'Desconhecido'}
                            </span>
                        </div>
                        <div class="flex justify-between items-center mt-3 text-gray-400 text-xs">
                            <span class="views-count"><i class="fas fa-eye mr-1"></i> ${formatNumber(videoViews)}</span>
                        </div>
                    </div>
                `;
                
                // Botões de download (MP3 e MP4)
                // Usar 'data-video-id' que é necessário para as APIs de download
                const downloadHtml = `
                    <div class="px-4 pb-4">
                        <div class="download-buttons flex gap-2">
                            <button 
                                class="btn-download w-full py-2 text-white rounded-lg font-medium flex items-center justify-center"
                                data-video-id="${videoId}"
                                data-format="mp3"
                                aria-label="Baixar MP3 de ${videoTitle}"
                            >
                                <i class="fas fa-music mr-2"></i>
                                Baixar MP3
                            </button>
                            <button 
                                class="btn-download-mp4 w-full py-2 text-white rounded-lg font-medium flex items-center justify-center"
                                data-video-id="${videoId}"
                                data-format="mp4"
                                aria-label="Baixar MP4 de ${videoTitle}"
                            >
                                <i class="fas fa-video mr-2"></i>
                                Baixar MP4
                            </button>
                        </div>
                        <div class="download-error text-red-400 text-sm mt-2 hidden"></div>
                    </div>
                `;
                
                card.innerHTML = thumbnailHtml + infoHtml + downloadHtml;
                resultsContainer.appendChild(card);
            });
            
        } catch (error) {
            console.error('Erro na busca:', error.message);
            errorText.textContent = error.message || 'Erro ao buscar vídeos. Tente novamente.';
            errorMessage.classList.remove('hidden');
        } finally {
            loadingIndicator.classList.add('hidden');
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fas fa-search mr-2"></i> 𝑩𝒖𝒔𝒄𝒂𝒓';
        }
    }

    /**
     * Inicia o download de MP3 ou MP4
     * As APIs de download (api.ytb.re) esperam o ID do vídeo.
     */
    async function downloadFile(videoId, card, format) {
        const downloadBtn = card.querySelector(format === 'mp4' ? '.btn-download-mp4' : '.btn-download');
        const errorDiv = card.querySelector('.download-error');
        const originalText = downloadBtn.innerHTML;
        
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Iniciando...';
        downloadBtn.disabled = true;
        errorDiv.classList.add('hidden');

        try {
            // Monta a URL da API de download correta com o ID
            const endpoint = format === 'mp4' 
                ? `${DOWNLOAD_VIDEO_API}${videoId}`
                : `${DOWNLOAD_AUDIO_API}${videoId}`;
            
            // Abre a URL em uma nova aba.
            window.open(endpoint, '_blank');
            
            // Feedback de sucesso
            downloadBtn.innerHTML = `<i class="fas fa-check mr-2"></i> Verifique...`;
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 3000);

        } catch (error) {
            console.error(`Erro no download (${format.toUpperCase()}):`, error.message);
            errorDiv.textContent = `Erro ao iniciar download (${format.toUpperCase()}).`;
            errorDiv.classList.remove('hidden');
            downloadBtn.innerHTML = `<i class="fas fa-times mr-2"></i> Erro`;
            setTimeout(() => {
                errorDiv.classList.add('hidden');
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 3000);
        }
    }

    /**
     * Carrega o vídeo no player do iframe
     */
    function playVideo(videoUrl) {
        if (!videoUrl || !videoPlayerContainer || !youtubePlayer) {
            console.error("Player ou URL não encontrados.");
            return;
        }

        try {
            let videoId = null;
            if (videoUrl.includes('youtube.com/watch')) {
                const urlParams = new URLSearchParams(new URL(videoUrl).search);
                videoId = urlParams.get('v');
            } else if (videoUrl.includes('youtu.be/')) {
                videoId = videoUrl.split('youtu.be/')[1].split(/[\?&]/)[0];
            } else if (videoUrl.includes('youtube.com/embed/')) {
                 videoId = videoUrl.split('/embed/')[1].split('?')[0];
            }
            
            if (!videoId) {
                // Tenta extrair o ID da API (ex: "e_AZJzYe7CU") se a URL for só o ID
                const match = videoUrl.match(/[a-zA-Z0-9_-]{11}/);
                if (match) videoId = match[0];
            }

            if (!videoId) {
                console.error('Não foi possível extrair o videoId do URL:', videoUrl);
                return;
            }

            youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            videoPlayerContainer.classList.remove('hidden');
            
            // Rolar para o player
            videoPlayerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Erro ao carregar vídeo:', error.message);
        }
    }

    // --- Funções Utilitárias ---

    /**
     * Converte "HH:MM:SS" ou "MM:SS" para segundos
     */
    function parseDurationString(timestamp) {
        if (!timestamp || typeof timestamp !== 'string') return 0;
        const parts = timestamp.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 3) { // HH:MM:SS
            seconds += parts[0] * 3600;
            seconds += parts[1] * 60;
            seconds += parts[2];
        } else if (parts.length === 2) { // MM:SS
            seconds += parts[0] * 60;
            seconds += parts[1];
        } else if (parts.length === 1) { // SS
            seconds += parts[0];
        }
        return seconds;
    }

    /**
     * Calcula e exibe a duração total
     */
    function showTotalDuration(videos) {
        const totalSeconds = videos.reduce((sum, video) => sum + parseDurationString(video.duracao), 0);
        
        if (totalSeconds === 0) return;

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        let durationText = '';
        if (hours > 0) durationText += `${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) {
            if (hours > 0) durationText += ', ';
            durationText += `${minutes} minuto${minutes > 1 ? 's' : ''}`;
        }
        
        if (durationText === '') {
             const seconds = totalSeconds % 60;
             durationText = `${seconds} segundo${seconds === 1 ? '' : 's'}`;
        }

        if (durationText) {
            totalDuration.innerHTML = `<p><i class="fas fa-clock mr-2"></i> Duração: ${durationText}</p>`;
            totalDuration.classList.remove('hidden');
        }
    }
    
    /**
     * Formata números (ex: 1309520 → 1.3M)
     */
    function formatNumber(num) {
        if (typeof num === 'string') {
             num = parseInt(num.replace(/,/g, ''), 10);
        }
        if (isNaN(num)) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    }
    
    // --- Event Listeners ---

    // Evento de busca por clique
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) searchVideos(query);
    });
    
    // Evento de busca com "Enter"
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) searchVideos(query);
        }
    });
    
    // Delegar eventos de clique dentro do container de resultados
    resultsContainer.addEventListener('click', (e) => {
        // Clique no botão de download (MP3 ou MP4)
        const downloadButton = e.target.closest('.btn-download, .btn-download-mp4');
        if (downloadButton) {
            // Pegar o 'data-video-id'
            const videoId = downloadButton.getAttribute('data-video-id');
            const format = downloadButton.getAttribute('data-format');
            const card = downloadButton.closest('.card');
            if (videoId && format && card) {
                downloadFile(videoId, card, format);
            }
            return;
        }

        // Clique na thumbnail para tocar o vídeo
        const thumbnail = e.target.closest('.video-thumbnail');
        if (thumbnail) {
            const videoUrl = thumbnail.getAttribute('data-video-url');
            if (videoUrl) {
                playVideo(videoUrl);
            }
            return;
        }
    });
});
