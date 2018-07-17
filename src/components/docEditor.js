import React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
// import io from '../server/index';
const io = require('socket.io-client');

import DocPortal from './docPortal'

// Components
export default class DocEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      docPortal: false
    };
    this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  componentDidMount() {
    const socket = io('http://127.0.0.1:8080');
    socket.on('connect', () => {
      console.log('ws connect');

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

  onBoldClick() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  }

  onItalicsClick() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'ITALIC'));
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
        <button type="button" onClick={() => this.props.toggle()}>Back to Documents Portal</button>
        <br />
        <h2>Sample Document</h2>
        <br />
        <p>Shareable Document ID:</p>
        <button type="button">Save Changes</button>

        <div>
          <button type="button" onClick={() => this.onBoldClick()}><bold>B</bold></button>
          <button type="button" onClick={() => this.onItalicsClick()}><i>I</i></button>
          <button type="button">Custom</button>
        </div>
        <div style={{ border: '1px red solid' }}>
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
            handleKeyCommand={this.handleKeyCommand}
          />
        </div>
      </div>
    );
  }
}
