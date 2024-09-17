const axios = require('axios')

const retryRequest = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            // İsteği yapıyoruz
            const response = await axios.get(url, options)
            return response.data // Başarılı ise yanıtı döneriz
        } catch (err) {
            // Hata durumunda yeniden denemek için bir bekleme süresi belirliyoruz
            if (i < retries - 1) { // Son deneme değilse
                console.log(`Retrying... (${i + 1}/${retries})`)
                await new Promise(resolve => setTimeout(resolve, delay)) // Bekleme süresi
            } else {
                // Bütün denemeler başarısız olduysa hatayı fırlatıyoruz
                throw new Error('Max retries reached. Request failed.')
            }
        }
    }
};

const express = require('express')
const app = express()

// Proxy route
app.get('/proxy', async (req, res) => {
    try {
        // Retry fonksiyonu kullanılarak servise istek yapıyoruz
        const response = await retryRequest('http://localhost:5000/test', {}, 3, 2000) // 3 deneme, 2 saniye bekleme
        console.log(response)
        res.send(response)
    } catch (err) {
        res.status(500).send(err.message)
    }
});

// Test route - %50 hata oluşturma
app.get('/test', (req, res) => {
    const shouldFail = Math.random() < 0.9; // %50 oranında hata oluşturuyoruz
    if (shouldFail) {
        res.status(500).send('Internal Server Error')
    } else {
        res.send('Success')
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000...')
})
