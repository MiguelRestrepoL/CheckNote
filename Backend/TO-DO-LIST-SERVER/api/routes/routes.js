const express = require("express");
const router = express.Router();

const userRoutes = require("./UserRoutes");
const authRoutes = require("./AuthRoutes");
const taskRoutes = require("./TaskRoutes");

router.use("/tasks", taskRoutes);
router.use("/users", userRoutes);
router.use("/auth", authRoutes)

module.exports = router;