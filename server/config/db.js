const mongoose = require('mongoose')

const db_connection = async () => {
    try {
        await mongoose.connect(process.env.Mongo_DB_URI)
        console.log("DB_Connect..!")
    } catch (error) {
        console.error(error)
    }
}

module.exports = db_connection;