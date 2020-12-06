const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("views","views");
app.set("view engine","ejs");

// database setup
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true});
const db = mongoose.connection;
db.on("open",()=>{
    console.log("successfully connected to the database");
});

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

const User = mongoose.model("User",userSchema);


// request hadlers
app.get("/",(req,res)=>{
    res.render("home");
});
app.get("/register",(req,res)=>{
    res.render("register");
});
app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password,10,(err,hashed)=>{
        if (!err) {
            const newUser = new User({
            email:req.body.username,
            password:hashed
            });
            newUser.save((err)=>{
                if(!err){
                    res.render("secrets");
                }else{
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }
    });
});
app.get("/login",(req,res)=>{
    res.render("login");
});
app.post("/login",(req,res)=>{
    const email = req.body.username;
    const password = req.body.password;
    User.findOne({email:email},(err,match)=>{
        if(!err){
            if(match){
                bcrypt.compare(password,match.password,(err,passwordMatch)=>{
                    if (passwordMatch){
                        res.render("secrets");
                    }else{
                        console.log("incorrect password");
                    }
                });
            }else{
                console.log("account not found");
            }
        }else{
            console.log(err);
        }
    });
});



app.listen(3000,()=>{
    console.log("port 3000 is listening");
});
