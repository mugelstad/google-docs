import React from 'react';
import { EditorState } from 'draft-js';

// Components
import DocEditor from './docEditor';

const prompt = require('electron-prompt');
const io = require('socket.io-client');


export default class DocPortal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      documents: [],
      title: '',
      docPortal: true,
      socket: io('http://127.0.0.1:8080')
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
          var docs = this.state.documents.slice();
          docs.push(responseJson.doc)
          this.setState({
            documents: docs
          })
          this.toggle();  // move to docEditor
        }
      })
      .catch((err) => {
        console.log('Error: ', err);
      });
    });
  }


  viewDoc(id, title) {
    // call in document portal front-end side
    this.setState({ selectedDocId: id });
    this.setState({ title: title });
    fetch(`http://localhost:8080/document/${id}`, {
      method: 'GET',
    }).then(response => response.json())
    .then((responseJson) => {
      if (responseJson.success) {
        // this.state.socket.emit('document', {id: id, user: user});
        this.toDoc();
      } else {
        console.log('fetching the document was unsuccessful');
      }
    }).catch(error => console.log('error', error));

    // this.state.socket.on('message', (message) => {
    //   alert(message.content);
    // })

  }

  // onAddShared(){
  //
  // }
  toDoc() {
    this.setState({ docPortal: false })
  }

  toPortal(id) {
    const user = JSON.parse(localStorage.getItem('user'));
    this.state.socket.emit('exit', {user: user, docID: id});
    this.setState({ docPortal: true })
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
                <p><a onClick={() => this.viewDoc(doc._id, doc.title)}>{doc.title}</a></p>
              )}
            </div>

          </div>
        :
          <DocEditor toggle={(id) => this.toPortal(id)} title={this.state.title} id={this.state.selectedDocId} /> }
      </div>
    );
  }
}
