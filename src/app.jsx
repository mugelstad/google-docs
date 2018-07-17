import React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
// import io from '../server/index';


// import io from '../server/index';
const io = require('socket.io-client');
// import Doc from './components/doc';
import DocPortal from './components/docPortal';
import Home from './components/home';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      fontSize: 34,
      fontColor: 'black',
      textAlignment: 'left',
      home: true
    };
    this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  componentDidMount() {
    // const socket = io('http://127.0.0.1:8080');
    // socket.on('connect', () => { console.log('ws connect'); });
    // socket.on('disconnect', () => { console.log('ws disconnect'); });
    // socket.on('msg', (data) => {
    //   console.log('ws msg:', data);
    //   socket.emit('cmd', { foo: 123 });
    // });
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
