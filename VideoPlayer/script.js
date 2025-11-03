document.addEventListener('DOMContentLoaded', function() {
    const videoInput = document.getElementById('videoInput');
    const subtitleInput = document.getElementById('subtitleInput');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoContainer = document.getElementById('videoContainer');
    const videoInfo = document.getElementById('videoInfo');
    const subtitleInfo = document.getElementById('subtitleInfo');
    const subtitleTrack = document.getElementById('subtitleTrack');

    let currentSubtitleUrl = null;

    // Handle video file selection
    videoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('video/')) {
                const fileURL = URL.createObjectURL(file);
                videoPlayer.src = fileURL;
                videoContainer.style.display = 'block';
                videoInfo.textContent = `Video: ${file.name} (${formatFileSize(file.size)})`;
                
                // Scroll to video
                videoContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('Please select a valid video file.');
                videoInput.value = '';
            }
        }
    });

    // Handle subtitle file selection
    subtitleInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.name.endsWith('.srt') || file.name.endsWith('.vtt')) {
                // Clean up previous subtitle URL if exists
                if (currentSubtitleUrl) {
                    URL.revokeObjectURL(currentSubtitleUrl);
                }

                if (file.name.endsWith('.srt')) {
                    // Convert SRT to WebVTT
                    convertSrtToVtt(file).then(vttContent => {
                        const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
                        currentSubtitleUrl = URL.createObjectURL(vttBlob);
                        subtitleTrack.src = currentSubtitleUrl;
                        subtitleInfo.textContent = `Subtitle: ${file.name} (converted from SRT)`;
                        
                        // Enable subtitles
                        videoPlayer.textTracks[0].mode = 'showing';
                    }).catch(error => {
                        console.error('Error converting subtitle:', error);
                        alert('Error converting subtitle file. Please try again.');
                        subtitleInput.value = '';
                    });
                } else {
                    // Direct VTT file
                    currentSubtitleUrl = URL.createObjectURL(file);
                    subtitleTrack.src = currentSubtitleUrl;
                    subtitleInfo.textContent = `Subtitle: ${file.name} (${formatFileSize(file.size)})`;
                    
                    // Enable subtitles
                    videoPlayer.textTracks[0].mode = 'showing';
                }
            } else {
                alert('Please select a valid subtitle file (.srt or .vtt).');
                subtitleInput.value = '';
            }
        }
    });

    // Convert SRT to WebVTT format
    async function convertSrtToVtt(srtFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const srtContent = e.target.result;
                    const vttContent = 'WEBVTT\n\n' + srtContent
                        .replace(/\r\n/g, '\n')
                        .replace(/\r/g, '\n')
                        .replace(/\n{3,}/g, '\n\n')
                        .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4')
                        .replace(/\uFEFF/g, '') // Remove BOM
                        .replace(/\u00A0/g, ' '); // Replace non-breaking spaces
                    resolve(vttContent);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(srtFile);
        });
    }

    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Clean up URLs when page is unloaded
    window.addEventListener('beforeunload', function() {
        if (videoPlayer.src) {
            URL.revokeObjectURL(videoPlayer.src);
        }
        if (currentSubtitleUrl) {
            URL.revokeObjectURL(currentSubtitleUrl);
        }
    });

    // Keyboard shortcuts for the built-in player
    document.addEventListener('keydown', function(e) {
        if (!videoPlayer.src) return;

        switch(e.key.toLowerCase()) {
            case 'c':
                e.preventDefault();
                // Toggle subtitles
                const track = videoPlayer.textTracks[0];
                if (track) {
                    track.mode = track.mode === 'showing' ? 'hidden' : 'showing';
                }
                break;
        }
    });
});