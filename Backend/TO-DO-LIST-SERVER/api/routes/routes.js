const express = require("express");
const userRoutes = require("./UserRoutes");
const router = express.Router();
router.use("/users", userRoutes);
module.exports = router;