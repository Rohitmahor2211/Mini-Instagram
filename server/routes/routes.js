const router = require('express').Router()
const { sign_up, email_verification } = require('../controllers/sign_up.controller')


router.post('/signup', sign_up)
router.post('/email-verify', email_verification)


module.exports = router;
