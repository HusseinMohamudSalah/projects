const mongoose = require('mongoose');

const connectDB = async () => {
    try {
       
        const URI = process.env.MONGO_URI || "your_default_mongo_connection_string";  // Haddii aan la helin .env file
        const conn = await mongoose.connect(URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error("Error connecting to MongoDB:", err.message);
        process.exit(1);  // Stop the process if DB connection fails
    }
};

module.exports = connectDB;
