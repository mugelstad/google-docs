import React from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import { Button } from 'react-bootstrap';
// import createHighlightPlugin from 'draft-js-highlight-plugin';

// Components
import ToolBar from './toolbar';
import DocumentHistory from './docHistory';
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
      editors: [],
      user: {},
      history: [],
    };
    // this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  componentDidMount() {
    let { socket } = this.state
    const user = JSON.parse(localStorage.getItem('user'));
    socket.on('connect', () => {
      console.log('ws connect');

      socket.emit('document', { user, document: this.props.doc });
      // socket.emit('document', this.props.id);
      // call in document portal front-end side
      socket.on('document', (obj) => {
        if (obj.doc.contents) {
          this.setState({
            document: obj.doc,
            user,
            editors: obj.editors,
            editorState: EditorState.createWithContent(convertFromRaw({
              entityMap: {},
              blocks: obj.doc.contents.blocks,
            })),
          })
        } else {
          this.setState({
            user,
            document: obj.doc,
            editors: obj.editors,
          })
        }
      })

      socket.on('history', (history) => {
        this.setState({ history });
      })
      //
      socket.on('color', (color) => {
        console.log('Color us: ', color);
        this.setState({ myColor: color })
      });

      socket.on('content', (content) => {
        console.log('content: ', content);
        var e = EditorState.createWithContent(convertFromRaw(content));
        var s = this.state.editorState.getSelection();
        var newEditor = EditorState.forceSelection(e, s);
        this.setState({
          editorState: newEditor
        })
      })

      socket.on('cursor', (cursor) => {
        // inline styling?
        // add a line
      })

      // socket.on('highlight', (highlight) => {
      //   Modifier.applyInlineStyle({
      //     contentState: highlight.currentContent,
      //     selectionState: highlight.selectionState,
      //     inlineStyle: highlight.inlineStyle
      //   })
      // })

    });

    socket.on('errorMessage', message => {
      // YOUR CODE HERE (3)
      console.log(message);
      alert(message);
    });

    socket.on('disconnect', () => { console.log('ws disconnect'); });
  }

  // Style Funtions
  makeEdit(value) {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, value));
  }

  toggleBlock(value) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, value));
  }

  myBlockStyleFn(contentBlock){
    const type = contentBlock.getType();
    if (type === 'right') return 'rightAligned'
     else if (type === 'left') return 'leftAligned'
     else if (type === 'center') return 'centeredContent'
     else if (type === 'justify') return 'justify'
  }

  toggleBlockType(blockType){
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType))
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

    let selectionState = editorState.getSelection();
    console.log("Selection state: ", selectionState);
    let currentContent = editorState.getCurrentContent();
    let anchorKey = selectionState.getAnchorKey();
    let currentContentBlock = currentContent.getBlockForKey(anchorKey);
    let start = selectionState.getStartOffset();
    console.log("Start: ", start);
    let end = selectionState.getEndOffset();
    console.log("End: ", end);
    let selectedText = currentContentBlock.getText().slice(start, end);
    console.log('selected: ', selectedText);

    // Real-time Content changes
    this.state.socket.emit('content', convertToRaw(currentContent));

    // Real-time Cursor loc changes
    // this.state.socket.emit('cursor', {
    // user: this.state.document.owner,
    // color: this.state.myColor,
    // location: {
    //   start: start, end: end}
    // })

    // Real-time Highlight changes
    // this.state.socket.emit('highlight',
    // {
    //   contentState: currentContent,
    //   selectionState: selectionState,
    //   inlineStyle: `${this.state.myColor}`
    // })

    this.setState({
      editorState,
    })

    // selectedText.applyInlineStyle({
    //   contentState: currentContent,
    //   selectionState: selectionState,
    //   inlineStyle: `backgroundColor: ${this.state.myColor}`
    // })
  }

  // Operational Functions

  handleClose() {
    this.setState({ historyShow: false });
  }

  handleShow() {
    this.setState({ historyShow: true });
  }

  save() {
    let currentContent = this.state.editorState.getCurrentContent();
    console.log("Save the content ", currentContent);
    const doc = this.props.doc._id;
    // fetch post request: save
    this.state.socket.emit('save', { content: convertToRaw(currentContent), id: this.props.doc._id, user: this.state.user });
  }

  // History Fucntions
  getHistory() {
    this.handleShow();
    this.state.socket.emit('history', { docId: this.props.doc._id });
  }

  render() {
    // console.log('portal: ', this.state.docPortal);
    return (
      <div>
        <button type="button" onClick={() => this.props.toggle(this.props.id)}>Back to Documents Portal</button>
        <br />
        <h2>{this.props.doc.title}</h2>
        <br />
        <p>Shareable Document ID: {this.props.doc._id}</p>
        <p>Current editors: <ul>{this.state.editors.map((editor) => {
          <li>{editor}</li>
        })}</ul></p>
        <button type="button" onClick={() => this.save()} >Save Changes</button>
        <button type="button" onClick={() => this.getHistory()} >History</button>
        <div>
          <ToolBar
            edit={value => this.makeEdit(value)}
            toggleBlockType={value => this.toggleBlockType(value)}
            blockEdit={value => this.toggleBlock(value)}
          />
        </div>
        <div style={{ border: '1px red solid', textAlign: this.state.align }}>
          <Editor
            editorState={this.state.editorState}
            onChange={() => this.onChange()}
            handleKeyCommand={this.handleKeyCommand}
            customStyleMap={styleMap}
            blockStyleFn={this.myBlockStyleFn}
          />
        </div>
        {this.state.historyShow ? <DocumentHistory
          close={() => this.handleClose()}
          open={() => this.handleShow()}
          revisions={this.state.history}
          show={this.state.historyShow}
          title={this.props.doc.title}
          hide={() => this.handleClose()}
          doc={this.props.doc}
        /> : <div />}
      </div>
    );
  }
}
