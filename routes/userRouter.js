const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

router.get("/", (req, res) => {
  res.send("working");
});
router.post("/signup", authController.signUpController);
router.post("/login", authController.login);
router.get('/testing',authController.protect,(req,res,next)=>{
  console.log(req.headers.jwt);
  res.send('token is verified')
})

module.exports = router;
