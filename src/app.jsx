import React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
// import io from '../server/index';
const io = require('socket.io-client');

// Components
// import Doc from './components/doc';
import DocPortal from './components/docPortal';
import Home from './components/home';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      home: true
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

  toDoc() {
    this.setState({
      home: !this.state.home
    })
  }

  render() {
    return (
      <div>
        {this.state.home ? <Home toDoc={() => this.toDoc()}/> :
          <DocPortal />
        }
      </div>
    );
  }
}
