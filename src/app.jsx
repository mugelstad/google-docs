import React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
// import io from '../server/index';
const io = require('socket.io-client');

// Custom Styles
const styleMap = {
  STRIKETHROUGH: {
    textDecoration: 'line-through',
  },
  FONTCOLOR: {
    fontColor: 'red',
  }
};

// Components

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      fontSize: 12,
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

  // Custom editor functions

  // Funtions

  onBoldClick() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  }

  onItalicsClick() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'ITALIC'));
  }

  onUnderlineClick() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'UNDERLINE'));
  }

  onStrikeClick() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'STRIKETHROUGH'));
  }

  onFontSizeChange(value) {
    this.setState({ fontSize: value });
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'FONTSIZE'));
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
    return (<div>
      <button type="button">Back to Documents Portal</button>
      <br />
      <h2>Sample Document</h2>
      <br />
      <p>Shareable Document ID:</p>
      <button type="button">Save Changes</button>

      <div>
        <button type="button" onClick={() => this.onBoldClick()}><bold>B</bold></button>
        <button type="button" onClick={() => this.onItalicsClick()}><i>I</i></button>
        <button type="button" onClick={() => this.onUnderlineClick()}>
          <underline>U</underline>
        </button>
        <select onChange={() => this.onFontSizeChange(this.value)}>
          <option value={8}>8</option>
          <option value={9}>9</option>
          <option value={10}>10</option>
          <option value={12}>12</option>
        </select>
        <button type="button" onClick={() => this.onStrikeClick()}>Strikethrough</button>
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
