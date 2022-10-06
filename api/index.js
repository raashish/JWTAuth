const express = require("express");
const app = express();
const jwt = require("jsonwebtoken")
app.use(express.json()) //if this is not written you cannot send anything inside the body

const users = [
    {
        id: 1,
        username: "Aashish",
        password: "Aashish@707",
        isAdmin: true
    },
    {
        id: 2,
        username: "Neha",
        password: "Neha@707",
        isAdmin: false
    }
]

const verify = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, "mySecretKey", (err, user) => {
            if (err) {
                res.status(403).json("JSON Token is not Valid!")
            }
            req.user = user;
            next();
        })
    } else {
        res.status(401).json("You are not Authenticated!")
    }
}

app.delete("/api/users/:userId", verify, (req, res) => {
    if (req.user.id === req.params.userId || req.user.isAdmin) {
        res.status(200).json("User has been DELETED..")
    } else {
        res.status(403).json("You are not allowed to delete this user!")
    }
})
let refreshTokens = [];

app.post("/api/refresh", (req,res) => {
    //Take the refresh token from User
    const refreshToken = req.body.token

    //Send error if there is no token or token is invalid
    if(!refreshToken){
        return res.status(401).json("You are not Authenticated!")
    }
    if(!refreshTokens.includes(refreshToken)){
        res.status(403).json("Refresh Token is not Valid.!")
    }
    jwt.verify(refreshToken,"myRefreshSecretKey", (err,user) => {
        err && cpnsole.log(err);
        refreshTokens = refreshTokens.filter((token) => token != refreshToken)

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    })

    //if everything is Okay, create new access token, refresh token and send to user
})

const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {expiresIn: "15m"});
}

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "myRefreshSecretKey");
}
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => {
        return u.username === username && u.password === password;
    });
    if (user) {
        //Generate an Access Token
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.push(refreshToken);

        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken
        })
    } else {
        res.status(400).json("Username or Password incorrect!")
    }
})

app.post("/api/logout", verify, (req,res) => {
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter(token => token != refreshToken )
    res.status(200).json("You are Logged out Successfully!")
})

app.listen(5000, () => {
    console.log("Server running on 5000");
})

