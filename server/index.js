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
  const colors = ['red', 'blue', 'yellow', 'black', 'green', 'white'];
  new Document({
    title: req.body.title,
    password: req.body.password,
    owner: req.params.user,
    colors: colors
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
      console.log("DOCS: ", docs);
      res.send(docs);
    });
});

app.get('/document/:id/:user', (req, res) => {
  Document.findById(req.params.id)
    // .populate('collaborators')
    .then((doc) => {
      // fix this part
      console.log(doc)
      if (doc.owner && (doc.collaborators.indexOf(req.params.id) !== -1 ||
         req.params.user === doc.owner._id)) {
        res.json({ success: true, document: doc });
      } else {
        // prompt document password on front end
        res.json({ success: true, passNeeded: true, user: req.params.user, document: doc });
      }
    })
    .catch((err) => {
      console.log('ERROR in loading a doc: ', err);
      res.json({ success: false })
    });
});

// Socket IO setup
server.listen(8080);



io.on('connection', (socket) => {
  console.log('connected');

  // Q: limit decreases every time : Load capacity
  // load document
  socket.on('document', (obj) => {
    Document.findById(obj.id)
      .then((doc) => {
        if (doc){
          socket.join(obj.title, () => {
            var room = io.sockets.adapter.rooms[obj.title];
            var rooms = io.sockets.adapter.rooms
            console.log('Rooms: ', rooms);
            console.log('L:', room.length);
            if (room.length > 6) {
              return socket.emit('errorMessage', 'Document cannot hold more than 6 editors')
            }
            console.log('Clients: ', room);
            io.to(obj.id, 'a new user has joined');

            if (doc.editors.filter(item => item.id === obj.user.username).length === 0) {
              doc.editors.push(obj.user);
            }
            socket.emit('document', { doc, editor: obj.user.username });
            // socket.emit('color', doc.colors.pop())
            return doc.save();
          });
        } else {
          console.log('Document is Null');
        }
      })
  });


  // highlight
  socket.on('highlight', highlight => {
    socket.broadcast.emit('highlight', highlight)
  })

  // cursor
  socket.on('cursor', cursor => {
    socket.broadcast.emit('cursor', cursor)
  })

  // content
  socket.on('content', content => {
    console.log('Content: ', content);
    socket.broadcast.emit('content', content)
  })

  // save
  socket.on('save', obj => {
    console.log('Socket Save Obj', obj);
    Document.findByIdAndUpdate(obj.id, { contents: obj.content })
      .then((doc) => {
        console.log('Updated doc to: ', doc);
      })
  })

  socket.on('exit', obj => {
    // socket.leave(room)
  })

});


export default io;
