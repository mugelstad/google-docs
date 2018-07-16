var mongoose = require('mongoose');

if (! process.env.MLAB) {
  console.log('Error: MONGODB_URI is not set. Did you run source env.sh ?');
  process.exit(1);
}

var connect = process.env.MLAB;
mongoose.connect(connect);

var userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

var documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  collaborators: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
})

var User = mongoose.model('User', userSchema);
var Document = mongoose.model('Document', documentSchema);

module.exports = {
  User: User,
  Document: Document
};
