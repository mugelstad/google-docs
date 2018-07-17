import React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';

// Components
import ToolBar from './components/toolbar';
// Custom Styles
import styleMap from './components/stylemap';

// import io from '../server/index';
const io = require('socket.io-client');

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      fontSize: 34,
      fontColor: 'black',
      textAlignment: 'right',
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
        <ToolBar edit={value => this.makeEdit(value)} />
      </div>
      <div style={{ border: '1px red solid' }}>
        <Editor
          editorState={this.state.editorState}
          onChange={this.onChange}
          handleKeyCommand={this.handleKeyCommand}
          customStyleMap={styleMap}
        />
      </div>
    </div>);
  }
}
