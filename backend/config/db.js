const mongoose = require('mongoose');

const db = () => {
    mongoose.connect('', {
        useNewUrlParser: true,
        useUnifiedTopology:true
    }).then(() => {
    console.log("mongoDB connected");
    })
        .catch((err) => {
        console.log(err)
    })
}

module.exports = db;