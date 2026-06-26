const express = require('express')
const router  = express.Router()
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefault,
} = require('../controllers/addressController')
const { protect } = require('../middlewares/authMiddleware')

router.use(protect)

router.get   ('/',              getAddresses)
router.post  ('/',              createAddress)
router.put   ('/:id',           updateAddress)
router.delete('/:id',           deleteAddress)
router.patch ('/:id/default',   setDefault)

module.exports = router