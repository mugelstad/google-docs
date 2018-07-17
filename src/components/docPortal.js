import React from 'react';
import { EditorState } from 'draft-js';

// const prompt = require('electron-prompt');
import DocEditor from './docEditor'

export default class DocPortal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      documents: [],
      title: '',
      docPortal: false,
    };
    this.onChange = editorState => this.setState({ editorState })
  }
  componentDidMount() {
    // fetch('/documents')
    // .then((response) => {
    //   console.log(response);
    //   return response.json()})
    // .then((responseJson) => {
    //   console.log("DOCS: ", docs);
    //   this.setState({
    //     documents: docs
    //   })
    // })
    // .catch((err) => {
    //   console.log("ERR: ", err);
    // })
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
    var password = prompt('Enter password');
    console.log("PASSWORD: ", password);
    fetch('http://localhost:8080/newDocument', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: this.state.title,
        password: password
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

  toggle(){
    this.setState({docPortal: !this.state.docPortal})
  }

  render() {
    return (
      <div>
      {this.state.docPortal ?
        <div>
          <h1>Documents Portal</h1>
          <input type='text' onChange={(e) => this.handleTitle(e)} placeholder='new document title' value={this.state.title}></input>
          <button onClick={() => this.onCreate()}>Create Document</button>

          <div>
            {this.state.documents.map((doc) =>
              <span><a onClick={() => this.toggle()}>{doc.title}</a></span>
            )}
          </div>

          <input type='text' placeholder='pase a doc id shared with you'></input>
          <button onClick={() => this.onAddShared()}>Add Shared Document</button>
        </div>
        :
        <DocEditor toggle={() => this.toggle()} /> }
      </div>
    );
  }
}
