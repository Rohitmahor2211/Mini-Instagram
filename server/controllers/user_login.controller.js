const userSchema = require('../modal/user.schema')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const user_login = async (req, res) => {
    const { email, password } = req.body
    console.log(email)

    try {
        const exist_user = await userSchema.findOne({ email })
        if (!exist_user) {
            return res.status(404).json({
                message: "User not found..!"
            })
        }

        const isPasswordMatched = await bcrypt.compare(password, exist_user.password)
        if (!isPasswordMatched) {
            return res.status(400).json({
                message: "password not mathced..!"
            })
        }

        if (exist_user && isPasswordMatched) {

            const token = jwt.sign(
                { userId: exist_user._id },
                process.env.JWT_secret,
                { expiresIn: "5d" }
            )

            // send token in cookie
            res.cookie("token", token, {
                httpOnly: true, // security (important)
                secure: false,  // true in production (https)
                sameSite: "lax",
                maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days
            });

            return res.status(200).json({
                message: "Login Successful..!",
                jwt_token: token,
                user: {
                    _id: exist_user._id,
                    profileName: exist_user.profileName,
                    profilePic: exist_user.profilePic
                }
            })
        }
    } catch (error) {
        res.status(500).json({
            message: "Internal server error..!"
        })
    }
}



const user_logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: false, // true in production (HTTPS)
        sameSite: "lax"
    });

    return res.status(200).json({
        message: "token removed..!"
    })
}



module.exports = { user_login, user_logout }