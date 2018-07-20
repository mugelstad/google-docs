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
    if (!user) {
      res.json({ success: false });
    }
    res.json({ success: true, user: user });
  });
});

app.post('/logout', (req, res) => {
  req.logout();
  res.json({success: true, })
})

app.post('/newDocument/:user', (req, res) => {
  const colors = ['red', 'orange', 'yellow', 'blue', 'green', 'purple'];
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
      //console.log("DOCS: ", docs);
      res.send(docs);
    });
});

app.get('/document/:id/:user', (req, res) => {
  Document.findById(req.params.id)
    // .populate('collaborators')
    .then((doc) => {
      // fix this part
      if (doc.owner && (doc.collaborators.indexOf(req.params.user) !== -1 ||
         req.params.user === doc.owner._id)) {
        res.json({ success: true, passNeeded: false, document: doc });
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
        if (doc) {
          socket.join(obj.title, () => {
            var room = io.sockets.adapter.rooms[obj.title];
            var rooms = io.sockets.adapter.rooms
            console.log("ROOM: ", room);
            console.log('Rooms: ', rooms);
            console.log('L:', room.length);
            if (room.length > 6) {
              socket.leave(obj.title);
              return socket.emit('leave', {message: 'Document cannot hold more than 6 editors', editor: obj.user.username})
            }
            console.log('Clients: ', room);
            io.to(obj.id, 'a new user has joined');
            var color = '';
            if (obj.color) {
              color = obj.color;
            } else {
              color = doc.colors.pop();
              doc.colors.unshift(color);
            }
            console.log("SENDING COLOR: ", color);
            // Checks if user is already in editors
            //console.log("EDITors: ", doc.editors);
            // if (doc.editors.filter(item => {
            //   //console.log("ITEM: ", item);
            //   return item.id === obj.user.id
            // }).length === 0) {
            //   doc.editors.push(obj.user);
            // }

            // check if collaborators are Updated
            // if (doc.collaborators[doc.collaborators.length - 1] !== obj.document.collaborators[doc.collaborators.length - 1]) {
            //   doc.collaborators = obj.document.collaborators; // overriding ...-> FIX THIS
            // }
            // doc.collaborators = obj.document.collaborators; // overriding ...-> FIX THIS
            socket.emit('document', {doc: doc, color: color});
            console.log('save doc')
            return doc.save();
          });
        } else {
          console.log('Document is Null');
        }
      })
      .then((updated) => {
        console.log('UDPATED to: ', updated);
      })
      .catch(err =>  console.log('Could not get history', err));

  });

  // add shared
  socket.on('addshared', obj => {
    console.log("ADD SHARED");
    // console.log('obj: ', obj);
    Document.findById(obj.id)
      .then((doc) => {
        doc.collaborators = obj.document.collaborators;
        return doc.save();
      })
      .then((saved) => {
        console.log('Successfully saved ', saved);
      })
      .catch((err) => {
        console.log("ERROR in adding shared ", err);
      })
  })

  // add Editors
  socket.on('addeditor', obj => {
    console.log("ADD Editors");
    socket.broadcast.to(obj.document.title).emit('editors', obj.editor)
  })


  // content (doc's content, highlight, cursor)
  socket.on('content', content => {
    console.log('Content: ', content);
    socket.broadcast.to(content.room).emit('content', content)
  })

  // save
  socket.on('save', obj => {
    Document.findByIdAndUpdate(obj.id, { contents: obj.content })
      .then((doc) => {
        doc.history.push({
          time: new Date(),
          user: obj.user,
          blocks: obj.content.blocks,
        });
        doc.save();
      });
  })

  // History
  socket.on('history', obj => {
    Document.findById(obj.docId, (err, doc) => {
      socket.emit('history', doc.history);
    })
    .catch(err =>  console.log('Could not get history', err));
  });

  socket.on('exit', obj => {
    // Document.find
    var editor = obj.editor;
    console.log("Editor: ", editor);
    socket.broadcast.to(obj.doc.title).emit('leave', {message: '', editor: editor});
    var client = io.sockets.adapter.rooms[obj.doc.title];
    console.log('Clients: ', client);
    console.log(obj.doc.title);
    socket.leave(obj.doc.title);
    console.log('Clients after: ', client);

  })

});


export default io;
