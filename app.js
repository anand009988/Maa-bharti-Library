require('dotenv').config();
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB Cloud"))
    .catch(err => console.error("Could not connect to MongoDB Cloud", err));

const express = require("express");
const path = require("path");

const app = express();

// Serve static files globally
app.use(express.static(path.join(__dirname, 'public')));

// for user routes
const userRoute = require("./routers/userRoute");
app.use('/', userRoute);

app.listen(PORT, function() {
    console.log(`Server is running on port ${PORT}`);
});
