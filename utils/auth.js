const express = require("express");
const app = express();
const passport = require("passport");
const fs = require("fs");

const session = require("express-session");
require("dotenv").config();
require("./auth"); // we are just loading this module as we are not gonna use it anywhere we will not store it in a ref
app.use(express.json());
app.use(
  session({
    secret: "cat",
    resave: true,
    saveUninitialized: true,
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res, next) => {
  res.send(`<a href='/auth/google'>click to login<\a>
  <br>
  <a href='/auth/facebook'>facebook<\a>
  `);
});
var GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
// const AppleStrategy = require("passport-apple").Strategy;
const client_ID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
passport.use(
  new GoogleStrategy(
    {
      clientID: client_ID, // get this from google oauth credentials
      clientSecret: clientSecret,
      callbackURL: "http://localhost:3000/auth/login/callback", //where to redirect after successful login
    },
    function (accessToken, refreshToken, user, done) {
      //*we now will have access to the users profile obj we can use it as per our needs like storing the user entry in the DB
      /*if(accessToken){
        const newUser = await Users.create({
          name: req.body.name,
          email: req.body.email,
          isOAuth: true;
        })
        else{
          const newUser = await Users.create({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          passwordConfirm: req.body.passwordConfirm,
          passwordModifiedAt: req.body.passwordModifiedAt,
          role: req.body.role,
    
  });
        }

      }
      
      */
      //
      return done(null, user); //data that is being passed to the next step in the authentication process. i.e to the next middleware function
    }
  )
);

const fb_client_id = process.env.FB_CLIENT_ID;
const fb_client_secret = process.env.FB_CLIENT_SECRET;
passport.use(
  new FacebookStrategy(
    {
      clientID: fb_client_id,
      clientSecret: fb_client_secret,
      callbackURL: "http://localhost:3000/auth/facebook/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // You can handle user authentication and creation here
      return done(null, profile);
    }
  )
);

// passport.use(new AppleStrategy({
//   clientID: 'your_apple_client_id',
//   teamID: 'your_apple_team_id',
//   callbackURL: 'http://localhost:3000/auth/apple/callback',
//   keyID: 'your_key_id',
//   privateKeyPath: '/path/to/your/private-key.p8'
// }, (accessToken, refreshToken, profile, done) => {
//   // You can handle user authentication and creation here
//   return done(null, profile);
// }));

passport.serializeUser((user, done) => {
  done(null, user); //data(user) that is being passed to the next step in the authentication process. i.e to the next middleware function
  //the first arg here is the error as there is no error it is set to null i mean this func it self that the process was successfull
});

passport.deserializeUser((user, done) => {
  done(null, user);
});


app.get(
  "/auth/google",
  (req, res, next) => {
    res.json({name:'kahi'})
    next();
  },
  passport.authenticate("google", { scope: ["email", "profile"] }) //this is a middleware fun in the auth process this triggers the actual auth process
);

app.get(
  "/auth/login/callback",passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to Angular callback route
    res.redirect('http://localhost:4200/');
  }
);

////////

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/home",
    failureRedirect: "/auth/failure",
  })
);

app.get("/auth/failure", (req, res, next) => {
  res.send(`
    <h3>authentication failed</h3>
    <a href='/'>click to login again</a>
    `);
});

function saveTofile(reqObj) {
  fs.writeFile("data.txt", JSON.stringify(reqObj), (err) => console.log(err));
}
function securedUser(id) {
  //const retrivedId = await User.findOneById({id})
  // return !!retrivedId
}

function isLoggedIn(req, res, next) {
  console.log(req.user);

  //   (req.isAuthenticated() || getLoginStatus()) && secureUser(req.user.id)
  req.isAuthenticated()
    ? (saveTofile(req.user), next())
    : res.send(`<h1>you are not logged in please login</h1>`);
  //in order allow this user a part of the req we need seession managment
}

//we want to users to only view this page only if he/sh3e is logged in so we introduce a middleware to check that
app.get("/home", isLoggedIn, (req, res) => {
  console.log(req.user);
  res.send(`<h1>login sucessful</h1>
    

    `);

  //this user obj is from deserialization as we are storing it in session storage
});

app.get("/logout", isLoggedIn, (req, res, next) => {
  console.log("logout calllesd", req.user.displayName);

  req.session.destroy((err) => {
    if (err) {
      // Handle error, such as displaying an error page or logging the error
      console.error(err);
      return res.status(500).send("Error logging out");
    }
    // Redirect to the home page or any other desired page after logout
    res.clearCookie("connect.sid");
    res.redirect("/");
  });

  //   req.logout((err) => {
  //     console.log(err);
  //   });
});

app.listen(3000, (req, res) => {
  console.log("server connecteed");
});
