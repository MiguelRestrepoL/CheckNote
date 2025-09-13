const express = require("express")
require("dotenv").config()
const cors = require("cors")
const app = express()
const routes = require("./routes/routes.js");
const { connectDB } = require("./config/database");



app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

connectDB();

app.get("/", (req, res) => res.send("Server is running"))

app.use("/api/v1", routes);





if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);

    });

}