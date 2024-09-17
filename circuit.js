const axios = require('axios')
const CircuitBreaker = require('opossum')

//? Servis isteğini yapan bir fonksiyon oluşturuyoruz
const requestToService = () => { 
    return axios.get('http://localhost:5000/test')
}

//? Circuit Breaker opsiyonları
const options = {
    timeout: 5000, // İsteğin başarısız sayılmadan önceki zaman limiti (ms)
    errorThresholdPercentage: 50, // Hataların %50’si geçerse devre açılır
    resetTimeout: 10000, // 10 saniye sonra devre tekrar kapanır (yani yeniden denemeye başlar)
}

// Circuit Breaker oluşturuyoruz
const breaker = new CircuitBreaker(requestToService, options)

// Hataları logluyoruz ve fallback tanımlıyoruz
breaker.fallback(() => 'Service currently unavailable')

// Devrenin açık, kapalı veya yarı açık olup olmadığı durumları izliyor
breaker.on('open', () => console.log('Circuit open: Requests are being short-circuited!'))
breaker.on('halfOpen', () => console.log('Circuit half open: service is being tested...'))
breaker.on('close', () => console.log('Circuit closed: Requests can be made normally.'))

const express = require('express')
const app = express()

// Proxy route - Circuit Breaker kullanarak istek yapıyoruz
app.get('/proxy', async (req, res) => {
    const response = await breaker.fire() // Circuit Breaker ile servis çağrısı
    if(response ==="Service currently unavailable") res.status(500).send('Service unavailable')
    else res.send(response.data)
})

// Test route - Servisin rastgele hata vermesi sağlanıyor
app.get('/test', (req, res) => {
    const shouldFail = Math.random() < 0.5 // %50 oranında başarısızlık
    if (shouldFail) {
        res.status(500).send('Internal Server Error') // Hata durumu
    } else {
        res.send('Success')
    }
})

// Sunucu başlatma
app.listen(5000, () => {
    console.log('Server is running on port 5000...')
})
