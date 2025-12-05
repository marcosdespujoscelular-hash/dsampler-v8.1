const config = {
    // Automáticamente usa localhost en tu PC y la URL de internet cuando está publicado
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8005'              // En tu PC (desarrollo)
        : 'https://dsampler-v8-1.onrender.com' // En internet (producción)
};

export default config;
