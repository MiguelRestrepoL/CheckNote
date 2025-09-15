const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const {authenticateToken} = require('../middleware/authMiddleware');

const userController = UserController;


router.post("/", (req, res) => userController.create(req, res));
router.get('/me', authenticateToken, userController.getProfile.bind(userController));
router.put('/me', authenticateToken, userController.updateProfile.bind(userController));
router.delete('/me', authenticateToken, userController.deleteProfile.bind(userController));

module.exports = router;
