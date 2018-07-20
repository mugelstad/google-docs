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
      search: '',
      selection: SelectionState.createEmpty(),
      yourStyle: null,
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
      // socket.emit('document', {id: this.props.id, user: user, title: this.props.title});
      // socket.emit('document', this.props.id);
      this.state.socket.emit('document', { document: this.props.doc, user: user, title: this.props.title, id: this.props.id, color: this.state.myColor });
      // call in document portal front-end side
      socket.on('document', (obj) => {

        console.log('Color us: ', obj.color);
        if (obj.doc.contents) {
          this.setState({
            document: obj.doc,
            user: user,
            editors: obj.doc.editors,
            editorState: EditorState.createWithContent(convertFromRaw({
              entityMap: {},
              blocks: obj.doc.contents.blocks,
            })),
            myColor: obj.color
          })
        } else {
          this.setState({
            document: obj.doc,
            editors: obj.editors,
            myColor: obj.color
          })
        }
      });

      socket.on('history', (history) => {
        this.setState({ history });
      });

      //

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
          editorState: newEditor,
          selection: s,
          yourStyle: content.inlineStyle.highlight
        })
      })

    });

    socket.on('errorMessage', message => {
      // YOUR CODE HERE (3)
      console.log(message);
      alert(message);
    });

    socket.on('disconnect', () => { console.log('ws disconnect'); });

    // autoSave every 5 minutes
    this.autoSave = setInterval(() => this.autosave(), 30000);
  }

  componentWillUnmount() {
    clearInterval(this.autoSave);
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
    // console.log("Selection state: ", selectionState);
    let currentContent = editorState.getCurrentContent();
    let anchorKey = selectionState.getAnchorKey();
    let currentContentBlock = currentContent.getBlockForKey(anchorKey);
    let start = selectionState.getStartOffset();
    //console.log("Start: ", start);
    let end = selectionState.getEndOffset();
    //console.log("End: ", end);
    let selectedText = currentContentBlock.getText().slice(start, end);
    //console.log('selected: ', selectedText);

    // Real-time Content changes
    // Real-time Cursor loc changes

    // remove inline style
    console.log("State: ", this.state.selection);
    console.log("State: ", currentContent);
    console.log(": ", this.state.yourStyle);

    if (this.state.yourStyle) {
      var modified = Modifier.removeInlineStyle(currentContent, this.state.selection, this.state.yourStyle);
    } else {
      var modified = currentContent;
    }

    console.log("M: ", modified);
    // WILL CHANGE THE INLINESTYLE BE CONCAT BASED ON MYCOLOR
    this.state.socket.emit('content', {
      contentState: convertToRaw(modified),
      selectionState: selectionState,
      inlineStyle: {cursor: `CURSOR${this.state.myColor}`, highlight: `HIGHLIGHT${this.state.myColor}`},
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

  // Different Function to implement autosave only when different
  autosave() {
    const currentContent = convertToRaw(this.state.editorState.getCurrentContent());
    if (!this.sameContent(currentContent.blocks,
      this.state.document.history[this.state.document.history.length - 1].blocks)) {
      this.save();
    } else {
      console.log('Same COnetnet');
    }
  }

  save() {
    if (this.state) {
      const currentContent = this.state.editorState.getCurrentContent();
      console.log('Save the content ', currentContent);
      const doc = this.props.doc._id;
      const user = JSON.parse(localStorage.getItem('user'));
      // fetch post request: save
      this.setState({ lastSaved: new Date() });
      this.state.socket.emit('save', { content: convertToRaw(currentContent), id: this.props.doc._id, user });
    }
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

  sameContent(blocksA, blocksB) {
    const checks = (blocksA.map((block, index) => (block.key === blocksB[index].key &&
        block.text === blocksB[index].text &&
        block.type === blocksB[index].type &&
        block.depth === blocksB[index].depth &&
        block.inlineStyleRanges.length ===
        blocksB[index].inlineStyleRanges.length &&
        ((block.inlineStyleRanges.length > 0) &&
        (blocksB[index].inlineStyleRanges.length > 0) ?
        block.inlineStyleRanges.map((style, j) => (
          style.offset === blocksB[index].inlineStyleRanges[j].offset &&
          style.length === blocksB[index].inlineStyleRanges[j].length &&
          style.style === blocksB[index].inlineStyleRanges[j].style))
          .reduce((a, b) => a && b) : true)
      )));

    return checks.reduce((a, b) => a && b);
  }

  search() {
    var text = document.getElementById('editor').textContent;
    console.log('Text: ', text);

    let input = this.state.search.split(' ');
    console.log('INPUT', input)

    text = text.split(' ');
    console.log('TEXT', text)
    let found = false;

    for (var i=0; i<text.length; i++){
      for (var j=0; j<input.length; j++){
        if (text[i] === input[j]){
          found = true;
          break;
        }
      }
    }

    console.log(found)
    //
    // let selection = window.getSelection();
    //
    // var range = document.createRange();
    // range.selectNode(text[0])
    // selection.addRange(range)
    // selection.addRange()
    //
    // console.log('selection', selectionRange)


  }

  render() {
    // console.log('portal: ', this.state.docPortal);
    return (
      <div>
        <button type="button" onClick={() => this.props.toggle(this.state.myColor)}>Back to Documents Portal</button>
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
        <div id="editor" style={{ border: '1px red solid', textAlign: this.state.align, maxHeight: 400, overflowY: 'scroll' }}>
          <Editor
            textAlignment="right"
            editorState={this.state.editorState}
            onChange={this.onChange.bind(this)}
            handleKeyCommand={this.handleKeyCommand}
            customStyleMap={styleMap}
            blockStyleFn={this.myBlockStyleFn}
          />
        </div>
        <p>Last Saved: <i>{this.state.lastSaved ? this.state.lastSaved.toTimeString() : ''}</i></p>
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
