import React from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
// import createHighlightPlugin from 'draft-js-highlight-plugin';

const io = require('socket.io-client');

import DocPortal from './docPortal'
// Components
import ToolBar from './toolbar';
// Custom Styles
import styleMap from './stylemap';

// Components
export default class DocEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      socket: io('http://127.0.0.1:8080'),
      editorState: EditorState.createEmpty(),
      docPortal: false,
      myColor: null,
      document: {},

    };
    // this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  componentDidMount() {
    let { socket } = this.state
    socket.on('connect', () => {
      console.log('ws connect');
      console.log(this.state.editorState);
      let selectionState = this.state.editorState.getSelection()
      console.log('');
      let anchorKey = selectionState.getAnchorKey();
      console.log("anchor", anchorKey);
      let currentContent = this.state.editorState.getCurrentContent();
      let currentContentBlock = currentContent.getBlockForKey(anchorKey);
      let start = selectionState.getStartOffset();
      let end = selectionState.getEndOffset();
      let selectedText = currentContentBlock.getText().slice(start, end);

      socket.emit('document', '5b4e37aae7179a508a8d0c64');
      //call in document portal front-end side
      socket.on('document', (doc) => {
        this.setState({
          document: doc
        })
        console.log("The doc is: ", doc);
      })
      //
      socket.on('color', (color) => {
        console.log("Color us: ", color);
        this.setState({myColor: color})
      })


      socket.on('content', (content) => {
        console.log("content: ", content);
        var e = EditorState.createWithContent(convertFromRaw(content));
        var s = this.state.editorState.getSelection();
        var newEditor = EditorState.forceSelection(e, s);
        this.setState({
          editorState: newEditor
        })
      })

    });
    //   //get document information
    //   socket.emit('document', doc)
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
    console.log('here');
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  onChange (editorState) {
    console.log('in on change');
    let currentContent = this.state.editorState.getCurrentContent();
    this.state.socket.emit('content', convertToRaw(currentContent));
    this.setState({
      editorState,
    })
    selectedText.applyInlineStyle({
      contentState: currentContent,
      selectionState: selectionState,
      inlineStyle: `backgroundColor: ${this.state.myColor}`
    })

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
            onChange={this.onChange.bind(this)}
            handleKeyCommand={this.handleKeyCommand}
            customStyleMap={styleMap}
          />
        </div>
      </div>
    );
  }
}
