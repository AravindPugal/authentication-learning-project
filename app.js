const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
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
    password : String
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// request hadlers
app.get("/",(req,res)=>{
    res.render("home");
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
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});



app.listen(3000,()=>{
    console.log("port 3000 is listening");
});
