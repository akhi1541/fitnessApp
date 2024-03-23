const Users = require("../model/userModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");

const loginTo = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECURITY_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
};

const createSendToken = (user, statusCode, message, res) => {
  //*cookie is just a piece of txt which is sent from server to client which client stores it and sends it  back to the server for (like jwt to get acess) all future reqs

  const token = loginTo(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: "sucess",
    token,
    message: message,
    data: user,
  });
};

exports.signUpController = async (req, res, next) => {
  const newUser = await Users.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordModifiedAt: req.body.passwordModifiedAt,
    role: req.body.role,
  });
  createSendToken(newUser, 200, "user created sucesfully", res);
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  //*1 check if email password exists
  if (!email || !password) {
    console.log('"please provide email and password"');
    return res.status(400).json({
      message: "please provide email and password",
    });
    // return next(new AppError(400, "please provide email and password"));
  }
  //*2 check  if user  exists  in database and password is correct
  const user = await Users.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    // return next(new AppError(400, "Incorrect email or password"));
    return res.status(400).json({
      message: "please provide email and password",
    });
  }
  //*3 if everything is of generate the token and send it to the client
  createSendToken(user, 200, "login sucessful", res);
};

exports.protect = async (req, res, next) => {
  let token;
  //1.check token n if its there
  if (req.headers.jwt && req.headers.jwt.startsWith("Bearer")) {
    token = req.headers.jwt.split(" ")[1];
    //     req.headers.authorization &&
    //     req.headers.authorization.startsWith("Bearer")
    //   ) {
    //     token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    // return next(new AppError(401, "you are not logged in please login"));
    return res.status(400).json({
      message: "you are not logged in please login",
    });
  }
  //2.verify token using jwt verify to get payload(id)
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECURITY_KEY
  );

  if (!decoded) {
    // return next(new AppError(401, "jwt verification is failed"));
    return res.status(400).json({
      message: "please provide email and password",
    });
  }
  //3.check if user still exists
  const currentUser = await Users.findOne({ _id: decoded.id });
  if (!currentUser) {
    return res.status(400).json({
      message: "please provide email and password",
    });
    // return next(
    // //   new AppError(401, "The user belong to this token does no longer exists")

    // );
  }

  //4.check if password is modified or not afer token is issued

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // return next(new AppError(401, "password is changed please login agian"));
    return res.status(400).json({
      message: "please provide email and password",
    });
  }
  //5.grant acess
  req.user = currentUser;
  next();
};
