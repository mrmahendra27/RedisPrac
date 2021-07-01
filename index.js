const express = require('express')
const axios = require('axios')
const cors = require('cors')
const { createClient } = require('redis')

const EXPIRYTIME = 1000;

const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(cors());

const redisServer = createClient();


/**without a single redis function */
//all data
// app.get('/photos', async (req, res) => {
//     const albumId = req.query.albumId
//     redisServer.get(`photos?albumId=${albumId}`, async (error, data) => {
//         if (error) console.error('Error')
//         if (data != null) {
//             console.log('MISS')
//             return res.json(JSON.parse(data))
//         } else {
//             console.log('HIT')
//             const { data } = await axios.get(
//                 "https://jsonplaceholder.typicode.com/photos", { params: { albumId } }
//             )
//             redisServer.setex(`photos?albumId=${albumId}`, EXPIRYTIME, JSON.stringify(data))
//             res.json(data)
//         }
//     })
// })

// //individual folder
// app.get('/photos/:id', async (req, res) => {
//     redisServer.get(`photos:${req.params.id}`, async (error, data) => {
//         if (error) console.error(error)
//         if (data != null) {
//             console.log('HIT')
//             return res.json(JSON.parse(data))
//         } else {
//             console.log('MISS')
//             const { data } = await axios.get(
//                 `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
//             )
//             redisServer.setex(`photos:${req.params.id}`, EXPIRYTIME, JSON.stringify(data))
//             res.json(data)
//         }
//     })
// });
/**end */

//using a single function to get and set cache
app.get('/photos', async (req, res) => {
    const albumId = req.query.albumId
    const datas = await fetchAndSetCache(`photos?albumId=${albumId}`, async () => {
        console.log('ALBUMGET')
        const { data } = await axios.get(
            "https://jsonplaceholder.typicode.com/photos", { params: { albumId } }
        )
        return data;
    })

    res.json(datas);
})

//
app.get('/photos/:id', async (req, res) => {
    const datas = await fetchAndSetCache(`photos:${req.params.id}`, async () => {
        console.log('IDGET')
        const { data } = await axios.get(
            `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
        )
        return data;
    })

    res.json(datas);
})


//Createing a Function
function fetchAndSetCache(key, cb) {
    return new Promise((resolve, reject) => {
        redisServer.get(key, async (error, data) => {
            if (error) return reject(error)
            if (data != null) {
                console.log('FETCH')
                return resolve(JSON.parse(data))
            }
            const fetchedData = await cb()
            redisServer.setex(key, EXPIRYTIME, JSON.stringify(fetchedData))

            resolve(fetchedData)
        })
    })
}


app.listen(3000)