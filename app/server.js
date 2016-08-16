import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
// at top
import socketio from 'socket.io';
import http from 'http';


// add server and io initialization after app
const app = express();
const server = http.createServer(app);
const io = socketio(server);


// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// DB Setup
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/notes';
mongoose.connect(mongoURI);
// set mongoose promises to es6 default
mongoose.Promise = global.Promise;


// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
server.listen(port);

console.log(`listening on: ${port}`);

// pushes notes to everybody
const pushNotes = () => {
  Notes.getNotes().then(result => {
    // broadcasts to all sockets including ourselves
    io.sockets.emit('notes', result);
  });
};

io.on('connection', (socket) => {
  // on first connection emit notes
  Notes.getNotes().then(result => {
    socket.emit('notes', result);
  });

  // pushes notes to everybody
  const pushNotes = () => {
    Notes.getNotes().then(result => {
      // broadcasts to all sockets including ourselves
      io.sockets.emit('notes', result);
    });
  };

  // creates notes and
  socket.on('createNote', (fields) => {
    Notes.createNote(fields).then((result) => {
      pushNotes();
    }).catch(error => {
      console.log(error);
      socket.emit('error', 'create failed');
    });
  });
});
