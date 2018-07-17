import React from 'react';
import { EditorState } from 'draft-js';

// Components
import DocEditor from './docEditor';

const prompt = require('electron-prompt');
const io = require('socket.io-client');

const socket = io('http://127.0.0.1:8080');


export default class DocPortal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      documents: [],
      title: '',
      docPortal: false,
    };
    this.onChange = editorState => this.setState({ editorState });
  }
  componentDidMount() {
    fetch('http://localhost:8080/documents/', {
      method: 'GET',
    }).then(docsJ => docsJ.json())
    .then((docs) => {
      console.log('DOCS: ', docs);
      this.setState({
        documents: docs,
      });
    });
  }

  handleTitle(e) {
    this.setState({
      title: e.target.value,
    })
  }

  onCreate() {
    // prompt password
    prompt('Enter password')
    .then((password) => {
      fetch('http://localhost:8080/newDocument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: this.state.title,
          password: password
        })
      })
      .then(response => response.json())
      .then((responseJson) => {
        if (responseJson.success) {
          console.log('Successfully created doc');
          this.toggle();  // move to docEditor
        }
      })
      .catch((err) => {
        console.log('Error: ', err);
      });
    });
  }


  viewDoc(id) {
    // call in document portal front-end side
    this.setState({ selectedDocId: id });
    fetch(`http://localhost:8080/document/${id}`, {
      method: 'GET',
    }).then(response => response.json())
    .then((responseJson) => {
      if (responseJson.success) {
        socket.emit('document', responseJson.document);
        this.toggle();
      } else {
        console.log('fetching the document was unsuccessful');
      }
    }).catch(error => console.log('error', error));

    socket.on('message', (message) => {
      alert(message.content);
    })

  }

  // onAddShared(){
  //
  // }

  toggle() {
    this.setState({ docPortal: !this.state.docPortal })
  }

  render() {
    return (
      <div>
        {this.state.docPortal ?
          <div>
            <h1>Documents Portal</h1>
            <input
              type="text"
              onChange={e => this.handleTitle(e)}
              placeholder="new document title"
              value={this.state.title}
            />
            <button onClick={() => this.onCreate()}>Create Document</button>
            <input type="text" placeholder="parse a doc id shared with you" />
            <button onClick={() => this.onAddShared()}>Add Shared Document</button>
            <div>
              {(this.state.documents).map(doc =>
                <p><a onClick={() => this.viewDoc(doc._id)}>{doc.title}</a></p>
              )}
            </div>

          </div>
        :
          <DocEditor toggle={() => this.toggle()} id={this.state.selectedDocId} /> }
      </div>
    );
  }
}
