import React from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';

// Components
import ToolBar from './toolbar';
// import createHighlightPlugin from 'draft-js-highlight-plugin';

// Custom Styles
import styleMap from './stylemap';

const io = require('socket.io-client');

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
    const { socket } = this.state
    socket.on('connect', () => {
      console.log('ws connect');
      console.log(this.state.editorState);
      const selectionState = this.state.editorState.getSelection()
      console.log('');
      const anchorKey = selectionState.getAnchorKey();
      console.log("anchor", anchorKey);
      const currentContent = this.state.editorState.getCurrentContent();
      const currentContentBlock = currentContent.getBlockForKey(anchorKey);
      const start = selectionState.getStartOffset();
      const end = selectionState.getEndOffset();
      const selectedText = currentContentBlock.getText().slice(start, end);

      socket.emit('document', '5b4e37aae7179a508a8d0c64');
      // call in document portal front-end side
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

  alignLeft(){
    const type = contentBlock.getType();
    if (type === 'blockquote') {
      return 'leftAligned';
    }
  }

  alignRight(){
    const type = contentBlock.getType();
    if (type === 'blockquote') {
      return 'rightAligned';
    }
  }

  alignCenter(contentBlock){
    const type = contentBlock.getType();
    if (type === 'blockquote') {
      return 'centeredContent';
    }
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

  onChange(editorState) {
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
        <h2>{this.props.title}</h2>
        <br />
        <p>Shareable Document ID: {this.props.id}</p>
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
