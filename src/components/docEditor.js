import React from 'react';
import { Editor, EditorState, SelectionState, RichUtils, convertToRaw, convertFromRaw, Modifier } from 'draft-js';
// import createHighlightPlugin from 'draft-js-highlight-plugin';

const io = require('socket.io-client');

// Components
import ToolBar from './toolbar';
import DocumentHistory from './docHistory';
// import createHighlightPlugin from 'draft-js-highlight-plugin';

// Custom Styles
import styleMap from './stylemap';

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
      history: [],
      search: ''
    };
    // this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  componentDidMount() {
    const { socket } = this.state
    const user = JSON.parse(localStorage.getItem('user'));
    socket.on('connect', () => {
      console.log('ws connect');
      console.log('Emitting document event, ', this.props.id);

      // This line is needed to load file (don't know why)
      socket.emit('document', { id: this.props.id, user, title: this.props.title, document: this.props.selectedDoc });
      // socket.emit('document', this.props.id);
      // call in document portal front-end side
      socket.on('document', (obj) => {
        if (obj.doc.contents) {
          this.setState({
            document: obj.doc,
            editors: obj.doc.editors,
            editorState: EditorState.createWithContent(convertFromRaw({
              entityMap: {},
              blocks: obj.doc.contents.blocks,
            })),
          })
        } else {
          this.setState({
            document: obj.doc,
            editors: obj.doc.editors,
          })
        }
      });

      socket.on('history', (history) => {
        console.log(history);
        this.setState({ history });
      });

      //
      socket.on('color', (color) => {
        console.log('Color us: ', color);
        this.setState({ myColor: color })
      });

      socket.on('content', (content) => {

        var c = convertFromRaw(content.contentState);
        console.log("C: ", c);
        var selectionState = SelectionState.createEmpty();
        var s = selectionState.merge(content.selectionState);
        console.log("S: ", s);

        if (content.start === content.end) {
          // var content = Modifier.applyInlineStyle(c, s, content.inlineStyle.cursor);
          var modified = Modifier.insertText(c, s, '|')
        } else {
          var modified = Modifier.applyInlineStyle(c, s, content.inlineStyle.highlight);
        }

        console.log("Content: ", modified);
        var e = EditorState.createWithContent(modified);
        console.log("E", e);
        // var s = this.state.editorState.getSelection();

        var newEditor = EditorState.forceSelection(e, s);
        this.setState({
          editorState: newEditor
        })
      })

    });

    socket.on('errorMessage', message => {
      // YOUR CODE HERE (3)
      console.log(message);
      alert(message);
    });

    socket.on('disconnect', () => { console.log('ws disconnect'); });
  }

  // Funtions
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
    // Real-time Cursor loc changes

    // WILL CHANGE THE INLINESTYLE BE CONCAT BASED ON MYCOLOR
    this.state.socket.emit('content', {
      contentState: convertToRaw(currentContent),
      selectionState: selectionState,
      inlineStyle: {cursor: "CURSORRED", highlight: "HIGHLIGHTRED"},
      start: start,
      end: end
      // color: this.state.myColor
    })

    // Real-time Highlight changes
    // this.state.socket.emit('highlight',
    // {
    //   contentState: convertToRaw(currentContent),
    //   selectionState: selectionState,
    //   inlineStyle: 'HIGHLIGHT'
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

  save() {
    let currentContent = this.state.editorState.getCurrentContent();
    console.log("Save the content ", currentContent);
    const doc = this.props.doc._id;
    const user = JSON.parse(localStorage.getItem('user'));
    // fetch post request: save
    this.state.socket.emit('save', { content: convertToRaw(currentContent), id: this.props.doc._id, user });
  }

  handleSearch(e) {
    this.setState({
      search: e.target.value
    })
  }

  handleClose() {
    this.setState({ historyShow: false });
  }

  handleShow() {
    this.setState({ historyShow: true });
  }

  getHistory() {
    this.handleShow();
    this.state.socket.emit('history', { docId: this.props.doc._id });
  }

  search() {
    var text = document.getElementById('editor').textContent;
    console.log('Text: ', text);

  }

  render() {
    // console.log('portal: ', this.state.docPortal);
    return (
      <div>
        <button
          type="button"
          onClick={() =>
          this.props.toggle(this.props.id)}>Back to Documents Portal</button>
        <br />
        <h2>{this.props.doc.title}</h2>
        <br />
        <p>Shareable Document ID: {this.props.doc._id}</p>
        <p style={{ overflowY: 'scroll', maxHeight: 30 }}>Current editors: <ul>{this.state.editors.map(editor =>
          (<li>{editor.username}</li>))}</ul></p>
        <div>
          <input
            type="text"
            placeholder="Find in document"
            onChange={e => this.handleSearch(e)}
            value={this.state.search}
          />
          <button type="button" onClick={() => this.search()} >Search</button>
        </div>
        <button type="button" onClick={() => this.save()} >Save Changes</button>
        <button type="button" onClick={() => this.getHistory()} >History</button>
        <div>
          <ToolBar
            edit={value => this.makeEdit(value)}
            toggleBlockType={value => this.toggleBlockType(value)}
            blockEdit={value => this.toggleBlock(value)}
          />
        </div>
        <div id='editor' style={{ border: '1px red solid', textAlign: this.state.align }}>
          <Editor
            textAlignment="right"
            editorState={this.state.editorState}
            onChange={this.onChange.bind(this)}
            handleKeyCommand={this.handleKeyCommand}
            customStyleMap={styleMap}
            blockStyleFn={this.myBlockStyleFn}
          />
        </div>
        {this.state.historyShow ? <DocumentHistory
          close={() => this.handleClose()}
          revisions={this.state.history}
          open={() => this.handleShow()}
          show={this.state.historyShow}
          title={this.props.doc.title}
          hide={() => this.handleClose()}
          doc={this.props.doc}
        /> : <div />}
      </div>
    );
  }
}
