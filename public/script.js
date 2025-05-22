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

// Carregar vídeo no iframe usando a URL completa e rolar para o reprodutor
// Carregar vídeo no iframe usando a URL embed do YouTube e rolar para o reprodutor
function playVideo(videoUrl) {
    console.log('URL recebido:', videoUrl); // Debug: verificar URL
    
    try {
        let videoId = null;
        // Extrair videoId de diferentes formatos de URL
        if (videoUrl.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(new URL(videoUrl).search);
            videoId = urlParams.get('v');
        } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split(/[\?&]/)[0];
        } else if (videoUrl.includes('youtube.com/embed/')) {
            videoId = videoUrl.split('youtube.com/embed/')[1].split(/[\?&]/)[0];
        } else {
            // Tentar extrair ID de 11 caracteres alfanuméricos
            const match = videoUrl.match(/[a-zA-Z0-9_-]{11}/);
            if (match) videoId = match[0];
        }
        
        console.log('Video ID extraído:', videoId); // Debug: verificar ID
        
        if (!videoId) {
            console.error('Erro: Não foi possível extrair o videoId do URL:', videoUrl);
            return;
        }
        
        const player = document.getElementById('youtube-player');
        if (!player) {
            console.error('Erro: Elemento #youtube-player não encontrado');
            return;
        }
        
        // Usar a URL de incorporação sem autoplay
        player.src = `https://www.youtube.com/embed/${videoId}`;
        console.log('Iframe src atualizado:', player.src); // Debug: verificar src
        
        const videoPlayer = document.getElementById('video-player');
        if (!videoPlayer) {
            console.error('Erro: Elemento #video-player não encontrado');
            return;
        }
        
        // Tentar scroll com fallback
        videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const topOffset = videoPlayer.getBoundingClientRect().top + window.pageYOffset - 50;
        window.scrollTo({ top: topOffset, behavior: 'smooth' });
        console.log('Tentando rolar para video-player, offset:', topOffset); // Debug: verificar scroll
    } catch (error) {
        console.error('Erro ao carregar vídeo:', error.message);
    }
}   
    
    // Formatar números (ex: 1309520 → 1.3M)
    function formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    // Converter segundos para formato HH:MM:SS
    function formatDuration(seconds) {
        if (!seconds) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 3600 % 60);
        return [
            h > 0 ? h.toString().padStart(2, '0') : null,
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].filter(Boolean).join(':');
    }
    
    // Calcular e exibir a duração total
    function showTotalDuration(videos) {
        const totalSeconds = videos.reduce((sum, video) => sum + (parseInt(video.duration?.seconds) || 0), 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        let durationText = '';
        if (hours > 0) durationText += `${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) {
            if (hours > 0) durationText += ', ';
            durationText += `${minutes} minuto${minutes > 1 ? 's' : ''}`;
        }
        if (durationText) {
            totalDuration.innerHTML = `<p><i class="fas fa-clock mr-2"></i> Duração total: ${durationText}</p>`;
            totalDuration.classList.remove('hidden');
        }
    }
    
   async function searchVideos(query) {
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Buscando...';
    try {
        // Limpar resultados e iframe
        resultsContainer.innerHTML = '';
        const player = document.getElementById('youtube-player');
        if (player) player.src = ''; // Limpar iframe
        totalDuration.classList.add('hidden');
        
        // Mostrar loading e esconder outras mensagens
        loadingIndicator.classList.remove('hidden');
        statusMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        // Detectar se o query é um link do YouTube
        const isYouTubeLink = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}(&.*)?$/.test(query.trim());
        console.log('Query é um link do YouTube:', isYouTubeLink, 'Query:', query); // Debug: verificar detecção
        
        // Fazer requisição ao endpoint local
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao buscar vídeos.');
        }
        
        const videos = data.results || [];
        const videoPlayer = document.getElementById('video-player');
        if (videos.length === 0) {
            statusMessage.classList.remove('hidden');
            statusMessage.innerHTML = `<p class="text-gray-400">${data.message || 'Nenhum vídeo encontrado.'}</p>`;
            videoPlayer.classList.add('hidden'); // Esconder reprodutor
            return;
        }
        
        // Mostrar reprodutor
        videoPlayer.classList.remove('hidden');
        
        // Mostrar duração total
        showTotalDuration(videos);
        
        // Criar cards para cada vídeo
        videos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'card bg-gray-800 rounded-lg overflow-hidden shadow-lg';
            
            // Thumbnail com duração
            const thumbnailHtml = `
                <div class="relative">
                    <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-48 object-cover cursor-pointer video-thumbnail" data-video-url="${video.url}">
                    <span class="duration-badge absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded">
                        ${video.duration?.timestamp || 'N/A'}
                    </span>
                </div>
            `;
            
            // Informações do vídeo
            const infoHtml = `
                <div class="p-4">
                    <a href="${video.url}" target="_blank" class="text-white font-semibold hover:text-nebula-purple transition duration-300 line-clamp-2">
                        ${video.title}
                    </a>
                    <div class="flex items-center mt-2 text-gray-400 text-sm">
                        <a href="${video.author?.url || '#'}" target="_blank" class="hover:text-white transition duration-300">
                            ${video.author?.name || 'Desconhecido'}
                        </a>
                    </div>
                    <div class="flex justify-between items-center mt-3 text-gray-400 text-xs">
                        <span class="views-count">${formatNumber(video.views)}</span>
                        <span>${video.ago || 'N/A'}</span>
                    </div>
                </div>
            `;
            
            // Botões de download (MP3 e MP4)
            const downloadHtml = `
                <div class="px-4 pb-4">
                    <div class="download-buttons flex gap-2">
                        <button 
                            class="btn-download w-full py-2 text-white rounded-lg font-medium flex items-center justify-center"
                            data-video-url="${video.url}"
                            data-format="mp3"
                            aria-label="Baixar MP3 de ${video.title}"
                        >
                            <i class="fas fa-download mr-2"></i>
                            Baixar MP3
                        </button>
                        <button 
                            class="btn-download-mp4 w-full py-2 text-white rounded-lg font-medium flex items-center justify-center"
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
    async function downloadFile(videoUrl, card, format) {
        const downloadBtn = card.querySelector(`.btn-download${format === 'mp4' ? '-mp4' : ''}`);
        const errorDiv = card.querySelector('.download-error');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Gerando link...';
        downloadBtn.disabled = true;
        errorDiv.classList.add('hidden');
        
        try {
            const endpoint = format === 'mp4' ? `/api/download/mp4?url=${encodeURIComponent(videoUrl)}` : `/api/download?url=${encodeURIComponent(videoUrl)}`;
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro ao gerar link de download (${format.toUpperCase()}).`);
            }
            
            if (format === 'mp3') {
                const data = await response.json();
                const a = document.createElement('a');
                a.href = data.downloadLink;
                a.download = data.filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                // Para MP4, criar um link temporário com o blob
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nebby_video_${Date.now()}.mp4`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
            
            // Feedback de sucesso
            downloadBtn.innerHTML = `<i class="fas fa-check mr-2"></i> Download ${format.toUpperCase()} pronto!`;
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error(`Erro no download (${format.toUpperCase()}):`, error.message);
            errorDiv.textContent = error.message || `Erro ao gerar link de download (${format.toUpperCase()}).`;
            errorDiv.classList.remove('hidden');
            downloadBtn.innerHTML = `<i class="fas fa-times mr-2"></i> Erro ${format.toUpperCase()}`;
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
    
    // Delegar evento de download
    resultsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-download, .btn-download-mp4');
        if (button) {
            const videoUrl = button.getAttribute('data-video-url');
            const format = button.getAttribute('data-format');
            const card = button.closest('.card');
            if (videoUrl && format) downloadFile(videoUrl, card, format);
        }
    });
    
    // Delegar evento de clique nas thumbnails
resultsContainer.addEventListener('click', (e) => {
    const thumbnail = e.target.closest('.video-thumbnail');
    if (thumbnail) {
        const videoUrl = thumbnail.getAttribute('data-video-url');
        if (videoUrl) {
            console.log('Thumbnail clicada, URL:', videoUrl); // Debug: verificar clique
            playVideo(videoUrl);
        }
    }
});
});
