import React from 'react';

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

export default class App extends React.Component {

  componentDidMount() {
    const socket = io('http://localhost:8080');
    socket.on('connect', () => { console.log('ws connect'); });
    socket.on('disconnect', () => { console.log('ws disconnect'); });
    socket.on('msg', (data) => {
      console.log('ws msg:', data);
      socket.emit('cmd', { foo: 123 });
    });
  }
  render() {
    return (<div>
      <h2>Welcome to React!</h2>
    </div>);
  }
}
