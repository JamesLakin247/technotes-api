const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

// @desc    Login
// @route   POST /auth
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body

    if (!username || !password ) {
        return res.status(400).json({message: 'All fields are required'})
    }

    const foundUser = await User.findOne({username}).exec()

    if (!foundUser || !foundUser.active) { // DanD can set his users to be either active or inactive, if a user is not active we dont want them to have access hence !foundUser.active
        return res.status(401).json({message: 'Unauthorised'})
    }

    const match = await bcrypt.compare(password, foundUser.password)

    if (!match) {
        return res.status(401).json({message: 'Unauthorised'})
    }

    // create access token
    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": foundUser.username,
                "roles": foundUser.roles
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m'}
    )

    // create refresh token
    const refreshToken = jwt.sign(
        { "username": foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    // Create secure cookie with refresh token
    res.cookie('jwt', refreshToken, { // naming it jwt and passing it the refreshToken
        httpOnly: true, // accessible only by web server
        secure: true, // https
        sameSite: 'None', //cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000 // cookie expiry: set to match rT
    })

    // Send accessToken containing username and roles
    res.json({ accessToken })
})

// @desc    Refresh
// @route   Get /auth/refresh
// @access  Public - bacause access token has expired
const refresh = (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) {
        return res.status(401).json({message: 'Unauthorised'})
    }

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async(err, decoded) => {
            if (err) {
                return res.status(403).json({message: 'Forbidden' })
            }
            const foundUser = await User.findOne({ usernmae: decoded.username})

            if (!foundUser) {
                return res.status(401).json({message: 'Unautorised'})
            }

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.username,
                        "roles": foundUser.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m'}
            )

            res.json({ accessToken })
        })
    )
}

// @desc    Logout
// @route   Get /auth/logout
// @access  Public - just to clear the cookie if exists
const logout = (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) {
        return res.sendStatus(204) //no content
    }

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
}

module.exports = {
    login,
    refresh,
    logout
}