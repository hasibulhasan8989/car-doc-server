const express = require('express')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
require('dotenv').config()

const app = express()
const port = process.env.port || 5000

app.use(cors({
    credentials: true,
     origin: ['http://localhost:5173',
        'https://car-doctor-7d3e5.web.app',
       'https://car-doctor-7d3e5.firebaseapp.com']
}))
app.use(express.json())
app.use(cookieParser())

 // ,
//middleware

const tokenVerify = (req, res, next) => {

    const token = req?.cookies?.jwtToken
    if (!token) {
        return res.status(401).send({ massage: 'unauthorized access' })
    }


    jwt.verify(token, process.env.Access_Token_Secret, (err, decoded) => {
        if (err) {
            return res.status(401).send({ massage: 'unauthorized access' })
        }

        req.decodedUser = decoded
        next()
    })
}









const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zsgh3ij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        // await client.connect();

        const services = client.db('CarDoc').collection('services')
        const bookingCollection = client.db('CarDoc').collection('bookings')


        app.post('/jwt', async (req, res) => {
            const user = req.body

            const jwtToken = jwt.sign(user, process.env.Access_Token_Secret, {
                expiresIn: '3h'
            })

            res.cookie('jwtToken', jwtToken, {
                httpOnly: true,
                sameSite: 'none',
                secure: true

            })
                .send({ successful: true })
            console.log('jwt user is', user)
        })

        app.post('/logout', async (req, res) => {
            const user = req.body
            res.clearCookie('jwtToken', { maxAge: 0 }).send({ successful: true })

        })



        app.get('/services', async (req, res) => {
            const result = await services.find().toArray()
            res.send(result)
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            console.log(req.user)
            const query = { _id: new ObjectId(id) }
            const options = {

                projection: { title: 1, service_id: 1, price: 1, img: 1 },
            };
            const result = await services.findOne(query, options)
            res.send(result)

        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })

        app.get('/bookings', tokenVerify, async (req, res) => {


            const decodedUserEmail = req.decodedUser?.email
            const queryEmail = req.query?.email

            if (decodedUserEmail !== queryEmail) {
                return res.send({ massage: 'Unauthorized Access' })
            }


            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }

            const updatedDoc = {
                $set: {
                    status: req.body.status
                }
            }

            const result = await bookingCollection.updateOne(filter, updatedDoc)

            res.send(result)
        })



        // await client.db("admin").command({ ping: 1 });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {


    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
