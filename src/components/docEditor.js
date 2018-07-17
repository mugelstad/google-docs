import React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';

// Components
import ToolBar from './toolbar';
import DocPortal from './docPortal';

// import io from '../server/index';
const io = require('socket.io-client');

export default class DocEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      docPortal: false,
    };
    this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  componentDidMount() {
    const socket = io('http://127.0.0.1:8080');
    socket.on('connect', () => {
      console.log('ws connect');

      // call in document portal front-end side
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

      /////////////////////////////////////

    //   //get document information
    //   socket.emit('document', doc)
    });
    socket.on('disconnect', () => { console.log('ws disconnect'); });
    socket.on('msg', (data) => {
      console.log('ws msg:', data);
      socket.emit('cmd', { foo: 123 });
    });
  }

  // Funtions
  makeEdit(value) {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, value));
  }

  alignEdit(value) {
    this.setState({ align: value });
  }

  toggleBlock(value) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, value));
  }

  handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  render() {
    console.log('portal: ', this.state.docPortal);
    return (
      <div>
        <button type="button">Back to Documents Portal</button>
        <br />
        <h2>Sample Document</h2>
        <br />
        <p>Shareable Document ID:</p>
        <button type="button">Save Changes</button>
        <div>
          <ToolBar
            edit={value => this.makeEdit(value)}
            alignEdits={value => this.alignEdit(value)}
            blockEdit={value => this.toggleBlock(value)}
          />
        </div>
        <div style={{ border: '1px red solid', textAlign: this.state.align }}>
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
            handleKeyCommand={this.handleKeyCommand}
            customStyleMap={styleMap}
          />
        </div>
      </div>
    );
  }
}
