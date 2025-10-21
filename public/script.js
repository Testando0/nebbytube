document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const statusMessage = document.getElementById('statusMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const totalDuration = document.getElementById('totalDuration');
    
    // Mostrar mensagem inicial
    statusMessage.classList.remove('hidden');

    // ##################################################################
    // ## INÍCIO DA REMOÇÃO ##
    // ## A função playVideo inteira foi removida porque o 
    // ## HTML do player ('video-player' e 'youtube-player') não existe mais.
    // ##################################################################
    /*
    function playVideo(videoUrl) {
        // ... todo o conteúdo desta função foi removido ...
    }   
    */
    // ##################################################################
    // ## FIM DA REMOÇÃO ##
    // ##################################################################
    
    // Formatar números (ex: 66043268 → 66.0M)
    function formatNumber(num) {
        if (!num) return '0';
        
        // Se já for uma string (ex: "6.6M views"), usa direto
        if (typeof num === 'string' && isNaN(parseInt(num))) {
            return num;
        }

        const number = parseInt(num);
        if (isNaN(number)) return num; // Retorna o original se não for número

        if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M';
        if (number >= 1000) return (number / 1000).toFixed(1) + 'K';
        return number.toString();
    }
    
   async function searchVideos(query) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Buscando...';
        try {
            // Limpar resultados
            resultsContainer.innerHTML = '';
            
            // ##################################################################
            // ## INÍCIO DA ALTERAÇÃO ##
            // ## As linhas que limpavam o 'youtube-player' foram removidas.
            // ##################################################################
            /*
            const player = document.getElementById('youtube-player');
            if (player) player.src = ''; // Limpar iframe
            */
            // ##################################################################
            // ## FIM DA ALTERAÇÃO ##
            // ##################################################################
            
            totalDuration.classList.add('hidden'); // Esconder duração total
            
            // Mostrar loading e esconder outras mensagens
            loadingIndicator.classList.remove('hidden');
            statusMessage.classList.add('hidden');
            errorMessage.classList.add('hidden');
            
            // Fazer requisição ao endpoint local (/api/search)
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao buscar vídeos.');
            }
            
            // O server.js retorna { results: [ ... ] }
            const videos = data.results || [];
            
            // ##################################################################
            // ## INÍCIO DA ALTERAÇÃO ##
            // ## A variável 'videoPlayer' foi removida pois o elemento não existe.
            // ##################################################################
            
            if (videos.length === 0) {
                statusMessage.classList.remove('hidden');
                statusMessage.innerHTML = `<p class="text-gray-400">${data.message || 'Nenhum vídeo encontrado.'}</p>`;
                
                // ##################################################################
                // ## INÍCIO DA ALTERAÇÃO ##
                // ## A linha abaixo foi removida. Ela causava o erro
                // ## "Cannot read properties of null (reading 'classList')"
                // ##################################################################
                // videoPlayer.classList.add('hidden'); // Esconder reprodutor
                // ##################################################################
                
                return;
            }
            
            // ##################################################################
            // ## INÍCIO DA ALTERAÇÃO ##
            // ## A linha abaixo foi removida. Ela também causaria o erro.
            // ##################################################################
            // videoPlayer.classList.remove('hidden');
            // ##################################################################
            
            // Criar cards para cada vídeo
            videos.forEach(video => {
                const card = document.createElement('div');
                card.className = 'card bg-gray-800 rounded-lg overflow-hidden shadow-lg';
                
                // ##################################################################
                // ## INÍCIO DA ALTERAÇÃO ##
                // ## Removido 'cursor-pointer' e 'video-thumbnail' da imagem,
                // ## já que a funcionalidade de clique foi removida.
                // ##################################################################
                const thumbnailHtml = `
                    <div class="relative">
                        <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-48 object-cover" data-video-url="${video.url}">
                        <span class="duration-badge absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded">
                            ${video.duration || 'N/A'}
                        </span>
                    </div>
                `;
                // ##################################################################
                // ## FIM DA ALTERAÇÃO ##
                // ##################################################################
                
                // Informações do vídeo
                const infoHtml = `
                    <div class="p-4">
                        <a href="${video.url}" target="_blank" class="text-white font-semibold hover:text-nebula-purple transition duration-300 line-clamp-2">
                            ${video.title}
                        </a>
                        <div class="flex items-center mt-2 text-gray-400 text-sm">
                            <span>${video.channel || 'Desconhecido'}</span>
                        </div>
                        <div class="flex justify-between items-center mt-3 text-gray-400 text-xs">
                            <span class="views-count">${formatNumber(video.views)}</span>
                        </div>
                    </div>
                `;
                
                // Botões de download (MP3 e MP4)
                const downloadHtml = `
                    <div class="px-4 pb-4">
                        <div class="download-buttons flex flex-col gap-2">
                            <button 
                                class="btn-download download-button w-full py-2 text-white rounded-lg font-medium flex items-center justify-center"
                                data-video-title="${video.title}"
                                data-video-url="${video.url}" 
                                data-format="mp3"
                                aria-label="Baixar MP3 de ${video.title}"
                            >
                                <i class="fas fa-download mr-2"></i>
                                Baixar MP3
                            </button>
                            <button 
                                class="btn-download-mp4 download-button w-full py-2 text-white rounded-lg font-medium flex items-center justify-center"
                                data-video-title="${video.title}"
                                data-video-url="${video.url}"
                                data-format="mp4"
                                aria-label="Baixar MP4 de ${video.title}"
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
            searchBtn.innerHTML = '<i class="fas fa-search mr-2"></i> Buscar';
        }
    }
    
    // Baixar arquivo (MP3 ou MP4)
    async function downloadFile(videoTitle, videoUrl, downloadBtn, format) {
        if (format !== 'mp3' && format !== 'mp4') {
            console.error('Formato de download não suportado:', format);
            return;
        }

        const card = downloadBtn.closest('.card');
        const errorDiv = card.querySelector('.download-error');
        const originalText = downloadBtn.innerHTML;
        
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Iniciando...';
        downloadBtn.disabled = true;
        errorDiv.classList.add('hidden');
        
        try {
            const endpoint = `/api/download?title=${encodeURIComponent(videoTitle)}&url=${encodeURIComponent(videoUrl)}&format=${encodeURIComponent(format)}`;
            
            // Cria um link temporário
            const a = document.createElement('a');
            a.href = endpoint;
            
            a.download = `${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
            a.style.display = 'none';
            
            // Adiciona, clica e remove o link
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Feedback de sucesso
            downloadBtn.innerHTML = `<i class="fas fa-check mr-2"></i> Download iniciado!`;
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao iniciar download:', error.message);
            errorDiv.textContent = 'Erro ao iniciar o download.';
            errorDiv.classList.remove('hidden');
            downloadBtn.innerHTML = `<i class="fas fa-times mr-2"></i> Erro`;
            setTimeout(() => {
                errorDiv.classList.add('hidden');
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 3000);
        }
    }
    
    // Evento de busca
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) searchVideos(query);
    });
    
    // Permitir busca com Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) searchVideos(query);
        }
    });
    
    // Delegar eventos de clique no container de resultados
    resultsContainer.addEventListener('click', (e) => {
        // Evento de Download (MP3 ou MP4)
        const button = e.target.closest('.download-button'); 
        if (button) {
            const videoTitle = button.getAttribute('data-video-title');
            const videoUrl = button.getAttribute('data-video-url');
            const format = button.getAttribute('data-format');
            
            if (videoTitle && videoUrl && format) {
                downloadFile(videoTitle, videoUrl, button, format);
            }
            return; 
        }

        // ##################################################################
        // ## INÍCIO DA REMOÇÃO ##
        // ## O bloco de código abaixo foi removido pois 
        // ## 'video-thumbnail' não deve mais ser clicável 
        // ## e a função 'playVideo' não existe mais.
        // ##################################################################
        /*
        // Evento de clique nas thumbnails
        const thumbnail = e.target.closest('.video-thumbnail');
        if (thumbnail) {
            const videoUrl = thumbnail.getAttribute('data-video-url');
            if (videoUrl) {
                console.log('Thumbnail clicada, URL:', videoUrl);
                playVideo(videoUrl);
            }
        }
        */
        // ##################################################################
        // ## FIM DA REMOÇÃO ##
        // ##################################################################
    });
});
