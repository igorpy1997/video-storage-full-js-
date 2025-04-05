const express = require('express');
const videosRoutes = require('./videos');

const router = express.Router();

router.use('/videos', videosRoutes);

module.exports = router;