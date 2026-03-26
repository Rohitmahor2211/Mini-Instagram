require('dotenv').config()
const express = require('express')
const app = express()
const PORT = process.env.PORT
const cors = require('cors')
const router = require('./routes/routes')
const db_connection = require('./config/db')
app.use(express.json())

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

app.use('/', router);

db_connection()
app.listen(PORT, () => {
    console.log('Server is running on PORT', PORT)
})
