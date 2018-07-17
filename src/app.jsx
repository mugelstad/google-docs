import React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
<<<<<<< HEAD
// import io from '../server/index';
const io = require('socket.io-client');

// Components
=======

// Components
import ToolBar from './components/toolbar';
// Custom Styles
import styleMap from './components/stylemap';

// import io from '../server/index';
const io = require('socket.io-client');
>>>>>>> editor-view

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
<<<<<<< HEAD
=======
      fontSize: 34,
      fontColor: 'black',
      textAlignment: 'left',
>>>>>>> editor-view
    };
    this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  componentDidMount() {
    const socket = io('http://127.0.0.1:8080');
    socket.on('connect', () => { console.log('ws connect'); });
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
    // Custom Styles
    return (<div>
      <button type="button">Back to Documents Portal</button>
      <br />
      <h2>Sample Document</h2>
      <br />
      <p>Shareable Document ID:</p>
      <button type="button">Save Changes</button>

      <div>
<<<<<<< HEAD
        <button type="button" onClick={() => this.onBoldClick()}><bold>B</bold></button>
        <button type="button" onClick={() => this.onItalicsClick()}><i>I</i></button>
        <button type="button">Custom</button>
      </div>
      <div style={{ border: '1px red solid' }}>
=======
        <ToolBar
          edit={value => this.makeEdit(value)}
          alignEdits={value => this.alignEdit(value)}
          blockEdit={value => this.toggleBlock(value)}
        />
      </div>
      <div style={{ border: '1px red solid', textAlign: this.state.align }}>
>>>>>>> editor-view
        <Editor
          editorState={this.state.editorState}
          onChange={this.onChange}
          handleKeyCommand={this.handleKeyCommand}
<<<<<<< HEAD
=======
          customStyleMap={styleMap}
>>>>>>> editor-view
        />
      </div>
    </div>);
  }
}
