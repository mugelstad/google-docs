import React from 'react';
import { EditorState } from 'draft-js';

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);


export default class DocPortal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      documents: [],
      title: '',
      password: ''
    };
    this.onChange = editorState => this.setState({ editorState })
  }
  componentDidMount() {
    const socket = io('http://localhost:8080');
    socket.on('connect', () => { console.log('ws connect'); });
    socket.on('disconnect', () => { console.log('ws disconnect'); });
    socket.on('msg', (data) => {
      console.log('ws msg:', data);
      socket.emit('cmd', { foo: 123 });
    });

    fetch('/documents', {

    }).then((docs) => {
      this.setState({
        documents: docs
      })
    })
  }

  viewDoc(id) {
    //call in document portal front-end side
    // fetch('/document/' + docId, {
    //   method: 'GET'
    // }).then((response) => response.json())
    // .then((responseJson) => {
    //   if (responseJson.success) {
    //     socket.emit('document', responseJson.document)
    //   } else {
    //     console.log('fetching the document was unsuccessful')
    //   }
    // }).catch((error) => console.log('error', error))
    //
    // socket.on('message', message => {
    //   alert(message.content);
    // })

  }

  handleTitle(e) {
    this.setState({
      title: e.target.value,
    })
  }

  onCreate(){
    // prompt password

    fetch('http://localhost:8080/newDocument', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: this.state.title,
        password: this.state.password
      })
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.success) {
        console.log("Successfully created doc");
        this.props.toggle();  // move to docEditor
      }
    })
    .catch((err) => {
      console.log("Error: ", err);
    });
  }

  onAddShared(){

  }

  render() {
    return (
      <div>
        <h1>Documents Portal</h1>
        <input type='text' onChange={(e) => this.handleTitle(e)} placeholder='new document title' value={this.state.title}></input>
        <button onClick={() => this.onCreate()}>Create Document</button>

        <div>
          {this.state.documents.map((doc) =>{
            <span><a onClick={() => this.props.toggle()}>{doc.title}</a></span>
          })}
        </div>

        <input type='text' placeholder='pase a doc id shared with you'></input>
        <button onClick={() => this.onAddShared()}>Add Shared Document</button>
      </div>
    );
  }
}
