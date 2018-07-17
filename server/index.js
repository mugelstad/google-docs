import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import passport from 'passport';
import cookieParser from 'cookie-parser';

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

var url = 'http://localhost:8080'

app.post('/signup', (req, res) => {
  // if (req.body.password === req.body.passwordRepeat && req.body.username && req.body.password) {
  console.log("USER: ", req.body);
  if (req.body.username && req.body.password) {
    new User({
      username: req.body.username,
      password: req.body.password,
    }).save()
      .then((user) => {
        console.log("User:", user);
        res.json({success: true, id: user._id});
      })
      .catch((err) => {
        console.log("Error in signup: ", err);
        res.json({success: false})
      })
  } else {
    console.log("No username or password");
    res.json({success: false})
  }
});

app.post('/login', passport.authenticate('local'), (req, res) => {
  console.log('LOGIN: ', req.user)
  res.json({success: true});
});

app.post('/newDocument', (req, res) => {
  new Document({
    title: req.body.title,
    password: req.body.password,
    owner: req.user
  }).save()
    .then((doc) => {
      res.json({success: true, id: doc._id})
    })
    .catch((err) => {
      res.json({success: false})
    })
})

app.get('/documents', (req, res) => {
  Document.find()
    .then((docs) => {
      console.log("DOC: ", docs);
      res.json({success: true, document: docs})
    })
})

app.get('/document/:id', (req, res) => {
  Document.findById(req.params.id)
    .populate('collaborators')
    .then((doc) => {
      console.log("Success");
      res.json({success: true, document: doc})
      // fix this part
      // if (req.user in doc.collaborators) {
      //   res.json({success: true, document: doc})
      // } else {
      //   // prompt document password
      //   if (req.user.password === doc.password) {
      //     res.json({success: true, document: doc})
      //   } else {
      //     res.json({success:false})
      //   }
      // }
    })
    .catch((err) => {
      console.log("ERROR in loading a doc: ", err)
      res.json({success:false})
    })
})

// Socket IO setup
server.listen(8080);

var limit = 6;
var colors = ['red', 'blue', 'yellow', 'black', 'green', 'white'];
var color;

io.on('connection', (socket) => {
  console.log('connected');

  limit --;
  color = colors.pop();
  // load document
  socket.on('document', (id) => {
    Document.findById(id)
      .then((doc) => {
        console.log("Joined the document");
        socket.emit('document', doc)
      })

  })

  // color
  socket.emit('color', color)

  // content
  socket.on('content', content => {
    console.log("Content: ", content);
    socket.broadcast.emit('content', content)
  })

  socket.emit('msg', { hello: 'world' });

  socket.on('cmd', (data) => {
    console.log(data);
  });
});


export default io;
