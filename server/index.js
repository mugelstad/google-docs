import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import React from 'react';
import { EditorState } from 'draft-js';

// Express setup
import express from 'express';
import session from 'express-session';

const app = express();
// Socket IO setup
const server = require('http').Server(app);
const io = require('socket.io')(server);


// Databased (mlab) setup
const connect = process.env.MLAB;
mongoose.connect(connect);

const models = require('./models/models');

const User = models.User;
const Document = models.Document;
// const prompt = require('electron-prompt');

// Passport setup

const LocalStrategy = require('passport-local').Strategy;


// set passport middleware to first try local strategy
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));

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

const url = 'http://localhost:8080'

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
  User.findOne({ username: req.body.username, password: req.body.password })
  .exec((err, user) => {
    res.json({ success: true, user });
  });
});

app.post('/newDocument/:user', (req, res) => {
  new Document({
    title: req.body.title,
    password: req.body.password,
    owner: req.params.user,
  }).save()
    .then((doc) => {
      if (req.params.user) {
        res.json({ success: true, document: doc });
      } else {
        res.json({ success: false, message: 'user not logged in' });
      }

    })
    .catch((err) => {
      res.json({ success: false, error: err });
    })
})

app.get('/documents', (req, res) => {
  console.log('USER', req.user)
  Document.find()
    .then((docs) => {
      res.send(docs);
    });
});

app.get('/document/:id/:user', (req, res) => {
  Document.findById(req.params.id)
    // .populate('collaborators')
    .then((doc) => {
      // fix this part
      console.log(doc)

      if (req.params.user in doc.collaborators || req.params.user === doc.owner._id) {
        res.json({ success: true, document: doc });
      } else {
        // prompt document password
        // prompt('Enter Password for this document')
        // .then((password) => {
        // console.log(doc);
        if (doc.password) {
          const docCopy = JSON.parse(JSON.stringify(doc));
          docCopy.collaborators.push(req.params.user);
          res.json({ success: true, document: docCopy });
        } else {
          res.json({ success: false });
        }
        // })
      }
    })
    .catch((err) => {
      console.log('ERROR in loading a doc: ', err);
      res.json({ success: false })
    });
});

// Socket IO setup
server.listen(8080);

let limit = 6;
const colors = ['red', 'blue', 'yellow', 'black', 'green', 'white'];
let color;

io.on('connection', (socket) => {
  console.log('connected');

  // socket.on('username', username => {
  //   if (!username || !username.trim()) {
  //     return socket.emit('errorMessage', 'No username!');
  //   }
  //   socket.username = String(username);
  //   passport.authenticate('local', { successFlash: 'Welcome!' })
  // });

  // socket.username = req.user.username;

  socket.on('document', (requestedDoc) => {
    if (!requestedDoc) {
      return socket.emit('errorMessage', 'No room!');
    }
    if (limit === 0) {
      return socket.emit('errorMessage', 'The document cannot support more than 6 editors');
    }

    socket.join(requestedDoc, () => {
      socket.to(requestedDoc).emit('message', {
        content: `${socket.username} has joined`
      });
      color = colors.pop();
      limit--;
      socket.emit('color', color);
    });
  })

  // color
  socket.emit('color', color)

  // content
  socket.on('content', content => {
    console.log('Content: ', content);
    socket.broadcast.emit('content', content)
  })

  socket.emit('msg', { hello: 'world' });

  socket.on('cmd', (data) => {
    console.log(data);
  });
});


export default io;
