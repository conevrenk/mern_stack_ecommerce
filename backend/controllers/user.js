const User = require('../models/user.js')
const bcrypt = require('bcryptjs')
const jwt = require('bcryptjs')
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

const register = async (req, res) => {

    const avatar = await cloudinary.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 130,
        crop:"scale"

    })

    const { name, email, password } = req.body;

    const user = await User.findOne({ email })
    if (user) {
        return res.status(500).json({message:"Böyle bir kullanıcı zaten var!!!"})
    }
    const passwordHash = await bcrypt.hash(password, 10);
    if (password.lenght < 6) {
        return res.status(500).json({message:"şifre 6 karakterden küçük olamaz"})
    }
    const newUser = await User.create({
        name,
        email,
        passsword: passwordHash,
        avatar: {
            public_id: avatar.public_id,
            url: avatar.secure_url
        }

    })
    const token = await jwt.sign({ id: newUser._id }, "SECRETTOKEN", { expiresIn: "1h" });

    const cookieOptions = {
        httpOnly: true,
        expires:new Date(Date.now()+5*24*60*60*1000)
    }
    res.status(201).cookie("token", token, cookieOptions).json({
        newUser,
        token
    })
}

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(500).json({message:"Böyle  bir kullanıcı bulunamadı"})
    }
    const comparePassword = await bcrypt.compare(password, user.password)
    if (!comparePassword) {
        return res.status(500).json({message:"yanlış şifre girdiniz"})
    }
    const token = await jwt.sign({ id: user._id }, "SECRETTOKEN", { expiresIn: "1h" });
    const cookieOptions = {
        httpOnly: true,
        expires:new Date(Date.now()+5*24*60*60*1000)
    }
    res.status(200).cookie("token", token, cookieOptions).json({
        user,
        token
    })
}
const logout = async (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        expires:new Date(Date.now())
    }
    res.status(200).cookie("token", null, cookieOptions).json({
        message:"Çıkış başarılı"
    })

}
const forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return res.status(500).json({ message: "Böyle bir kullanıcı bulunamadı" })
    }
    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const passwordUrl = `${req.protocol}://${req.get('host')}/reset/${resetToken}`
        
    const message = `Şifreni sıfırlamak için kullanacagın token: ${passwordUrl}`
    
    try {
    } catch (error) {
       user.resetPasswordToken=undefined
        user.resetPasswordExpire = undefined
        
        await user.save({ validateBeforeSave: false });
        res.status(500).json({message:error.message})
    }

    

}

const resetPassword = async (req, res) => {

}
module.exports ={register,login,logout,forgotPassword,resetPassword,}