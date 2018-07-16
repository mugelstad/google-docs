import http from 'http';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import passport from 'passport';
import cookieParser from 'cookie-parser'

// Express setup
import express from 'express';
const app = express();
const path = require('path');
// Socket IO setup
const server = require('http').Server(app);
const io = require('socket.io')(server);
const session = require('cookie-session');

// Databased (mlab) setup
var connect = process.env.MLAB;
mongoose.connect(connect);

var models = require('./models/models');
var User = models.User;
var Document = models.Document;

// Passport setup

const LocalStrategy = require('passport-local').Strategy;


// set passport middleware to first try local strategy
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'keyboard cat' }));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// passport strategy
passport.use(new LocalStrategy((username, password, done) => {
  // Find the user with the given username
  User.findOne({ username: username }, (err, user) => {
    // if there's an error, finish trying to authenticate (auth failed)
    if (err) {
      console.log(err);
      return done(err);
    }
    // if no user present, auth failed
    if (!user) {
      console.log(user);
      return done(null, false, { message: 'Incorrect username.' });
    }
    // if passwords do not match, auth failed
    if (user.password !== password) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    // auth has has succeeded
    return done(null, user);
  });
}));

// connect passport to express via express middleware
app.use(passport.initialize());
app.use(passport.session());


app.post('/signup', (req, res) => {
  // if (req.body.password === req.body.passwordRepeat && req.body.username && req.body.password) {
  new User({
    username: req.body.username,
    password: req.body.password,
  }).save()
    .then((user) => {
      res.json({success: true, id: user._id});
    })
    .catch((err) => {
      console.log("Error in signup: ", err);
      res.json({success: false})
    })
});

app.post('/login', passport.authenticate('local'), (req, res) => {
  console.log('LOGIN: ', req.user)
  res.json({success: true});
});

app.post('/newDocument', (req, res) => {
  new Document({
    title: req.body.title,
    password: req.body.password
  }).save()
    .then((doc) => {
      res.json({success: true, id: doc._id})
    })
    .catch((err) => {
      res.json({success: false})
    })
})

app.get('/document', (req, res) => {
  Document.findById(req.body.id)
    .populate('collaborators')
    .then((doc) => {
      if (req.body.user in doc.collaborators) {
        res.json({success:true})
      } else {
        // prompt document password
      }
    })
    .catch((err) => {
      console.log("ERROR in loading a doc: ", err)
      res.json({success:false})
    })
})


server.listen(8080);
io.on('connection', (socket) => {
  console.log('connected');
  //
  // socket.on('username', username => {
  //   if (!username || !username.trim()) {
  //     return socket.emit('errorMessage', 'No username!');
  //   }
  //   socket.username = String(username);
  //   passport.authenticate('local', { successFlash: 'Welcome!' })
  // });
  //
  socket.emit('msg', { hello: 'world' });




  socket.on('cmd', (data) => {
    console.log(data);
  });
});

// Server Creation
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
