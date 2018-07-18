import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import passport from 'passport';
import cookieParser from 'cookie-parser';

// Express setup
import express from 'express';

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
    owner: req.user,
    counter: 0
  }).save()
    .then((doc) => {
      res.json({ success: true, id: doc._id, doc: doc });
    })
    .catch((err) => {
      res.json({ success: false, error: err });
    })
})

app.get('/documents', (req, res) => {
  Document.find()
    .then((docs) => {
      console.log("DOCS: ", docs);
      res.send(docs);
    });
});

app.get('/document/:id', (req, res) => {
  Document.findById(req.params.id)
    // .populate('collaborators')
    .then((doc) => {
      // fix this part
      res.json({ success: true, document: doc });
      // if (req.user._id in doc.collaborators) {
      //   res.json({ success: true, document: doc })
      // } else {
      //   // prompt document password
      //   if (req.user.password === doc.password) {
      //     res.json({ success: true, document: doc })
      //   } else {
      //     res.json({ success: false })
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

const colors = ['red', 'blue', 'yellow', 'black', 'green', 'white'];
let color;
let editors = [];

io.on('connection', (socket) => {
  console.log('connected');

  // Q: limit decreases every time : Load capacity
  // load document
  socket.on('document', (obj) => {
    Document.findById(obj.id)
      .then((doc) => {
        console.log("Joined the document");
        console.log("Counter: ", doc.counter);
        doc.counter = doc.counter + 1;
        if (doc.counter > 6) {
          return socket.emit('errorMessage', 'Document cannot hold more than 6 editors')
        } else {
          doc.editors.push(obj.user);
        }
        return doc.save()
      })
      .then((updated) => {
        console.log("Editors: ", updated.editors);
        socket.emit('document', {doc: updated, editors: updated.editors})
      })
    })

  // var room = io.sockets.adapter.rooms['my_room'];

  // socket.on('document', obj => {
  //     Document.findById(obj.id)
  //       .then((doc) => {
  //         socket.room = obj.id;
  //         if (io.sockets.adapter.rooms[obj.id])
  //         socket.join(obj.id, () => {
  //           io.to(requestedRoom, 'a new user has joined');
  //         });
  //       })
  //   });

  // color
  color = colors.pop();
  socket.emit('color', color)

  // // highlight
  // socket.on('highlight', highlight => {
  //   socket.broadcast.emit('highlight', highlight)
  // })
  //
  // // cursor
  // socket.on('cursor', cursor => {
  //   socket.broadcast.emit('cursor', cursor)
  // })

  // content
  socket.on('content', content => {
    console.log("Content: ", content);
    socket.broadcast.emit('content', content)
  })

  // save
  socket.on('save', obj => {
    Document.findByIdAndUpdate(obj.id, {contents: obj.content})
      .then((doc) => {
        console.log("Updated doc to: ", doc);
      })
  })

  socket.on('exit', obj => {
    Document.findById(obj.docID)
      .then((doc) => {
        doc.counter = doc.counter - 1;
        var index = doc.editors.indexOf(doc.user);
        if (index > -1) {
          doc.editors.splice(index, 1);
        }
        return doc.save()
      })
      .then((updated) => {
        console.log("Updated doc to: ", updated);
      })
  })

});


export default io;
