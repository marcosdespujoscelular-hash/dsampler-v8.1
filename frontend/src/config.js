const config = {
    // Automáticamente usa localhost en tu PC y la URL de internet cuando está publicado
    API_URL: import.meta.env.DEV
        ? 'http://localhost:8005'           // En tu PC (desarrollo)
        : 'https://dsampler-v8.onrender.com' // En internet (producción)
};

export default config;
