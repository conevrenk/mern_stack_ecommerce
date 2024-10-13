const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        requirede:true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
       minLength:6
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true,
        }
    },
    role: {
        type: String,
        default: 'user',
        required: true
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
},{timestamps:true})
module.exports =mongoose.model('User',userSchema);