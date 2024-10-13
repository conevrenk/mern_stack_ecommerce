const User = require('../models/user.js')
const bcrypt = require('bcryptjs')
const jwt = require('bcryptjs')
const cloudinary = require('cloudinary').v2;mnb m.
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { format } = require('path');

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
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const passwordUrl = `${req.protocol}://${req.get('host')}/reset/${resetToken}`
        
    const message = `Şifreni sıfırlamak için kullanacagın token: ${passwordUrl}`
    
    try {
        const transporter = nodemailer.createTransport({
            port: 465,
            service: "gmail",
            host: "smtp.gmail.com",
            auth: {
                user: 'evrenkbedirhan@gmail.com',
                pass: 'password',
            },
            secure: true,
        });
        const mailData = {
            from: "evrenkbedirhan@gmail.com",
            to: request.body.email,
            subject: "şifre sıfırlama",
            text: message,
        };
        await transporter.sendMail(mailData);
        res.status(200).json({ message: "Mailinize sıfırlama linki gönderildi" })

    } catch (error) {
       user.resetPasswordToken=undefined
        user.resetPasswordExpire = undefined
        
        await user.save({ validateBeforeSave: false });
        res.status(500).json({message:error.message})
    }

    

}

const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt:Date.now()}
    });
    if (!user) {
        return res.status(500).json({message:"Gecersiz tokené!!"})
    }
    user.password = req.body.password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;

    await user.save();
    const token = jwt.sign({ id: user._id }, "SECRETTOKEN", { expiresIn: "1h" });
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    }
        res.status(200).cookie("token", token, cookieOptions).json({
            user,
            token
        })
    
}
const userDetail = async (req, res, next) => {
    const user = await User.findById(req.params.id);
    res.status(200).json({
        user
    })

}
module.exports ={register,login,logout,forgotPassword,resetPassword,userDetail}