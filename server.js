const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cookie = require('cookie-parser');
const GoogleStrategy = require('passport-google-oauth2').Strategy
const FacebookStrategy = require('passport-facebook').Strategy

const app = express();
dotenv.config();

mongoose.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, ()=>{
    console.log('Connected to DB');
});


const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const projectRoute = require('./routes/projectRoute');

app.use(bodyParser.json());
app.use(express.json());
app.use(session({
    secret: 'session-secret',
    resave: true,
    saveUninitialized: true
}));
app.use(cookie('session-secret'));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done)=>{
    User.findOne({email: username}, (err, user)=>{
        if(err) throw err;
        if(!user){
            return done(null, false, {message: 'Email does not exist'});
        }
        bcrypt.compare(password, user.password, (err, result)=>{
            if(err) throw err;
            if(result){
                return done(null, user);
            }else{
                
                return done(null, false, {message: 'Wrong email or password'});
            }
        });
    });
}));

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://still-brook-51810.herokuapp.com/api/v1/auth/google/callback",
    passReqToCallback   : true
  },
  async(request, accessToken, refreshToken, profile, done) => {
    const defaultUser = {
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id
    }
    
    try {
        let user = await User.findOne({ googleId: profile.id })

        if (user) {
          user = await User.updateOne({ googleId: profile.id }, {name: profile.displayName})
          let user2 = await User.findOne({ googleId: profile.id })
          done(null, user2)
        } else {
          let userEmail = await User.findOne({ email: profile.emails[0].value})
          if (userEmail) {
            userEmail = await User.updateOne({email: profile.emails[0].value}, {googleId: profile.id, name: profile.displayName})
            done(null, user)
          } else {
            user = await User.create(defaultUser)
            done(null, user)
          }
        }
      } catch (err) {
        console.error(err)
      }
  }
));

passport.use(new FacebookStrategy({
    clientID:     process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://still-brook-51810.herokuapp.com/api/v1/auth/facebook/callback",
    profileFields: ['emails', 'displayName', 'name', 'picture']
  },
  async(accessToken, refreshToken, profile, done) => {
    const defaultUser = {
        name: profile.displayName,
        email: profile.emails[0].value,
        facebookId: profile.id
    }
    
    try {
        let user = await User.findOne({ facebookId: profile.id })

        if (user) {
          user = await User.updateOne({ facebookId: profile.id }, {name: profile.displayName})
          let user2 = await User.findOne({ facebookId: profile.id })
          done(null, user2)
        } else {
          let userEmail = await User.findOne({ email: profile.emails[0].value})
          if (userEmail) {
            userEmail = await User.updateOne({email: profile.emails[0].value}, {facebookId: profile.id, name: profile.displayName})
            let user2 = await User.findOne({ facebookId: profile.id })
            done(null, user2)
          } else {
            user = await User.create(defaultUser)
            done(null, user)
          }
        }
      } catch (err) {
        console.error(err)
      }
  }
));

passport.serializeUser((user, cb) => {
    app.locals.user = user;
    cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
    User.findOne({ _id: id }, (err, user) => {
      cb(err, user);
    });
});

if(process.env.NODE_ENV = 'development'){
    app.use(cors({
        origin: process.env.CLIENT_URL
    }));
    app.use(morgan('dev'));
}

app.use('/api', authRoute);
app.use('/api', userRoute);
app.use('/api', projectRoute);

app.use((req, res, next)=>{

})


const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log('Server running on http://localhost:'+ PORT);
});