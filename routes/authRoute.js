const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mailgun = require("mailgun-js");
const DOMAIN = 'sandbox5223439769d24251a4cb473b4827be1b.mailgun.org';
const mg = mailgun({apiKey: process.env.MG_API_KEY, domain: DOMAIN});
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const passport = require('passport');
const nodemailer = require('nodemailer');

const successLoginUrl = "http://localhost:3000/login/success"
const errorLoginUrl = "http://localhost:3000/login"

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "mitchjaga@gmail.com",
        pass: "ljgyyzkwkzgbtljj"
    }
});

router.get('/login/google', passport.authenticate("google", {scope: ["profile", "email"]}))

router.get('/v1/auth/google/callback', passport.authenticate("google", {failureMessage: "cannot login to google", failureRedirect: errorLoginUrl, successRedirect: successLoginUrl}), (req, res)=>{
    res.status(200)
})

router.get('/login/facebook', passport.authenticate("facebook", {scope: ["email"]}))

router.get('/v1/auth/facebook/callback', passport.authenticate("facebook", {failureMessage: "cannot login to facebook", failureRedirect: errorLoginUrl, successRedirect: successLoginUrl}), (req, res)=>{
    res.status(200)
})

router.get('/v1/google/get/details', async(req, res)=>{
    res.status(200).send(req.app.locals.user)
})

router.post('/register', async (req, res)=>{
    const {name, email, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    

    User.findOne({email: email}, (err, user)=>{
        if (err) throw err;
        if(user){
            res.status(200).send({message: 'Email already exists'});
        }else{
            const token = jwt.sign({name, email, password: hashedPassword}, process.env.JWT_ACC_ACTIVATE, {expiresIn: '20m'})

            const data = {
                from: 'mitchjaga@gmail.com',
                to: email,
                subject: 'Account Activation',
                html: `
                    <h2>Click the link below to activate your account</h2>
                    <a href=${process.env.CLIENT_URL}/authentication/activate/${token}>click here to activate your account</a>
                `
            };
            transporter.sendMail(data, function(error, info){
                if(error){
                    res.status(200).send({
                        message: error.message
                    });
                }else{
                    res.status(200).send({
                        message: 'Email has been sent, Kindly activate the account'
                    });
                }
            });
        }
    })
});

router.post('/password-reset/email', async (req, res)=>{
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    User.findOne({email: req.body.email}, (err, user)=>{
        if(err){
            throw err;
        }
        if(user){
            const token = jwt.sign({ email: req.body.email, password: hashedPassword}, process.env.JWT_RESET_PASSWORD, {expiresIn: '20m'})

            const data = {
                from: 'mitchjaga@gmail.com',
                to: req.body.email,
                subject: 'PASSWORD_RESET',
                html: `
                    <h2>Click the link below to reset your password</h2>
                    <a href=${process.env.CLIENT_URL}/password-reset/${token}>click here to reset your password</a>
                `
            };
            transporter.sendMail(data, function(error, info){
                if(error){
                    res.status(200).send({
                        message: error.message
                    });
                }else{
                    res.status(200).send({
                        message: 'Email has been sent, Kindly activate the account'
                    });
                }
            });
        }else{
            res.status(200).send({err: 'Email does not exist'});
        }
    })
});

router.post('/login', passport.authenticate("local"), (req, res, next)=>{
    console.log(req.user)
    res.send(req.user);
});

router.get('/logout', (req, res)=>{
    req.logOut();
});


router.post('/email-activate', (req, res)=>{
    const {token} = req.body;
    console.log(req.body)
    if(token){
        jwt.verify(token, process.env.JWT_ACC_ACTIVATE, (err, decodedToken)=>{
            if(err){
                res.status(400).send({message: 'Invalid or Expired link'});
            }else{
                const {name, email, password } = decodedToken;

                const newUser = new User({ email: email, name: name, password: password});
        
                newUser.save(err => {
                    if (err) {
                        res.header('Access-Control-Allow-Origin', '*');
                        res.status(200).send({message: 'Make sure all fields are filled'});  
                    }else{
                        res.header('Access-Control-Allow-Origin', '*');
                        res.status(200).send({message: 'User Sucessfully Created'});  
                    }
                });

            }
        })
    }else{
        res.header('Access-Control-Allow-Origin', '*');
        res.status(200).send({error: 'Oops, Something went wrong'});
    }
});

router.post('/reset', (req, res)=>{
    const {token} = req.body;
    if(token){
        jwt.verify(token, process.env.JWT_RESET_PASSWORD, (err, decodedToken)=>{
            if(err){
                res.status(200).send({err: 'Invalid or Expired link'});
            }else{
                const {email, password } = decodedToken;

                User.updateOne({email: email}, {password: password}, (err)=>{
                    if(err) throw err
                    res.status(200).send({msg: 'Password sucessfully reset'});
                });
            }
        })
    }else{
        res.status(200).send({error: 'Oops, Something went wrong'});
    }
});


module.exports = router;