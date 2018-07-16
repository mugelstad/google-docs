import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import passport from 'passport';
import cookieParser from 'cookie-parser';

// Express setup
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// Databased (mlab) setup
mongoose.connect(process.env.MLAB);

// Passport setup

const LocalStrategy = require('passport-local').Strategy;

// Models
const User = mongoose.model('User', mongoose.Schema({
  name: String,
  password: String,
}));

// set passport middleware to first try local strategy
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(session({ secret: 'keyboard cat' }));

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


// Socket IO setup
server.listen(8080);
io.on('connection', function (socket) {
  socket.emit('msg', { hello: 'world' });
  socket.on('cmd', function (data) {
    console.log(data);
  });
});


export default io;
