
require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const {logger} = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const { logEvents } = require('./middleware/logger')
const PORT = process.env.PORT || 3500

console.log(process.env.NODE_ENV)

connectDB()

app.use(logger)

app.use(cors(corsOptions))

// lets app recieve and parse json
app.use(express.json())
// third party middleware
app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, 'public')))
// this works because its the public file is found relative to the server.js file
// app.use(express.static('public'))

// api routes
app.use('/', require('./routes/root'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/notes', require('./routes/notesRoutes'))

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views/404.html'))
    } else if (req.accepts('json')) {
        res.json({message: '404 not found'})
    } else {
        res.type('txt').send('404 not found')
    }
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log("Connected to mongoDB")
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.once('error', err => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syncall}\t${err.hostname}`, 'mongoErrLog.log')
})