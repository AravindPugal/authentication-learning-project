require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('https').globalAgent.options.rejectUnauthorized = false;

console.log(process.env.CLIENT_ID);
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret:"some secret",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
app.set("views","views");
app.set("view engine","ejs");

// database setup
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on("open",()=>{
    console.log("successfully connected to the database");
});

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId:String,
    secret : String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
// request hadlers
app.get("/",(req,res)=>{
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get("/register",(req,res)=>{
    res.render("register");
});
app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(!err){
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            });
        }else{
            console.log(err);
        }
    });
    
});
app.get("/login",(req,res)=>{
    res.render("login");
});
app.post("/login",(req,res)=>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,(err)=>{
        if(!err){
            User.authenticate("local")(req,res,()=>{res.redirect("/secrets")});
        }else{
            console.log(err);
        }
    }); 
});
app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});
app.get("/secrets",(req,res)=>{
    User.find({secret:{$ne:null}},(err,usersWithSecret)=>{
        if(!err){
            console.log(usersWithSecret);
            res.render("secrets",{usersWithSecret:usersWithSecret});
        }
    });
});
app.get("/submit",(req,res)=>{
    res.render("submit");
});
app.post("/submit",(req,res)=>{
    const submittedSecret = req.body.secret;
    User.findById(req.user.id,(err,foundUser)=>{
        if(!err){
            if(foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save();
                res.redirect("/secrets");
            }
        }
    });
});


app.listen(3000,()=>{
    console.log("port 3000 is listening");
});


