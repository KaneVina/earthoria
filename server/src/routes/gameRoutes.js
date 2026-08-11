const express = require('express')
const router = express.Router()
const { getGame, completeGame, getLeaderboard } = require('../controllers/gameController')
const { optionalAuth } = require('../middlewares/optionalAuth')

router.get('/:code', optionalAuth, getGame)
router.post('/:code/complete', optionalAuth, completeGame)
router.get('/:code/leaderboard', getLeaderboard)

module.exports = router