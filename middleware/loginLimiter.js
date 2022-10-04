const rateLimit = require('express-rate-limit')
const logEvents = require('./logger')

const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 login requests per 'window' per minute
    message: 
        {message: 'Too many login attempts fron this IP, please try again after a 60 second pause'},
    // Handle what happens when the login limit is achieved
    handler: (req, res, next, optionis) => {
        logEvents(`Too many requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log')
        res.status(options.statusCode).send(options.message)
    },
    standardHeaders: true, // Return rate limit info in the 'RareLimit-*' headers
    legacyHeaders: false, // Disable the 'X-RateLimit-*' headers
})

module.exports = loginLimiter