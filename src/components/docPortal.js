import React from 'react';
import { EditorState } from 'draft-js';

// Components
import DocEditor from './docEditor';
import StartBar from './startBar';
import DocumentList from './documentList'

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
      const user = JSON.parse(localStorage.getItem('user'));
      this.setState({
        documents: docs, user,
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
    prompt({ title: 'Password Needed', label: 'Enter A Password' })
    .then((password) => {
      fetch(`http://localhost:8080/newDocument/${this.state.user.id}`, {
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
    fetch(`http://localhost:8080/document/${id}/${this.state.user.id}`, {
      method: 'GET',
    }).then(response => response.json())
    .then((responseJson) => {
      if (responseJson.passNeeded) {
        const doc = responseJson.doc;
        prompt({ title: 'Password Needed', label: 'Enter Password for this document' })
        .then((password) => {
          if (password === doc.password) {
            const docCopy = JSON.parse(JSON.stringify(doc));
            docCopy.collaborators.push(responseJson.user);
            this.setState({ selectedDocTitle: doc.title });
            this.state.socket.emit('document', { username: responseJson.user.username, doc: docCopy });
            this.toggle();
          } else {
            alert('Password Was Incorrect');
          }
        })
      } else if (responseJson.success) {
        this.setState({ selectedDocTitle: responseJson.document.title });
        this.state.socket.emit('document', responseJson.document);
        this.toggle();
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
      <div style={{ paddingLeft: 40, paddingRight: 40 }}>
        {this.state.docPortal ?
          <div>
            <h1>Documents Portal</h1>
            <StartBar
              create={() => this.onCreate()}
              addShared={() => this.onAddShared()}
              change={(e) => this.handleTitle(e)}
              title={this.state.title}
            />
            {/* <div>
              {(this.state.documents).map(doc =>
                <p><a onClick={() => this.viewDoc(doc._id, doc.title)}>{doc.title}</a></p>
              )}
            </div> */}
            <DocumentList documents={this.state.documents} view={id => this.viewDoc(id)} />

          </div>
        :
          <DocEditor
            toggle={() => this.toggle()}
            id={this.state.selectedDocId}
            title={this.state.selectedDocTitle}
          /> }
      </div>
    );
  }
}
