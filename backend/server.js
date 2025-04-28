import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import userRouter from './routes/userRoute.js'

import { createServer } from 'http'


// app config
const app = express()
const httpServer = createServer(app)

connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}))

// api endpoints
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)


app.get('/', (req, res) => {
    res.send("API WORKING")
})



const PORT = process.env.PORT || 4000
httpServer.listen(PORT, '0.0.0.0', () => console.log('Server Started on port:', PORT))