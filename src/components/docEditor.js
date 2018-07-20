import React, {Component} from 'react';
import { Editor, EditorState, SelectionState, RichUtils, convertToRaw, convertFromRaw, Modifier, CompositeDecorator } from 'draft-js';
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
      editorState: EditorState.createEmpty(),
      docPortal: false,
      myColor: null,
      document: {},
      editors: [],
      history: [],
      search: '',
      replace: '',
      selection: SelectionState.createEmpty(),
      yourStyle: null,
      cursorStyle: {}
    };
    // this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  updateSetState(editorState){
    this.setState({editorState: editorState})
  }

  componentDidMount() {
    var socket = this.props.socket;
    // const { socket } = this.state
    const user = JSON.parse(localStorage.getItem('user'));
    // console.log("Emitting document event, ", this.props.id);
    // socket.emit('document', {id: this.props.id, user: user, title: this.props.title});
    // socket.emit('document', this.props.id);
    // socket.emit('document', { document: this.props.doc, user: user, title: this.props.title, id: this.props.id, color: this.state.myColor });
    // call in document portal front-end side
    socket.on('document', (obj) => {
      console.log('Color us: ', obj.color);
      if (obj.doc.contents) {
        this.setState({
          document: obj.doc,
          user: user,
          // editors: obj.doc.editors,
          editorState: EditorState.createWithContent(convertFromRaw({
            entityMap: {},
            blocks: obj.doc.contents.blocks,
          })),
          myColor: obj.color
        })
      } else {
        this.setState({
          document: obj.doc,
          // editors: obj.editors,
          myColor: obj.color
        })
      }
    });

    socket.on('leave', obj => {
      // var array = this.state.editors.splice();
      // var index = array.indexOf(obj.editor);
      // array.splice(index, 1);
      // this.setState({
      //   editors: array
      // })
      this.props.toggle();
      if (obj.message) {
        alert(obj.message);
      }
    })

    socket.on('editors', (editor) => {
      var arr = this.state.editors.slice();
      arr.push(editor);
      console.log("MY ED: ", arr);
      this.setState({
        editors: arr
      })
    })

    socket.on('history', (history) => {
      console.log(history);
      this.setState({ history });
    });

    socket.on('content', (content) => {

     var c = convertFromRaw(content.contentState);
     // console.log("C: ", c);
     var selectionState = SelectionState.createEmpty();
     var s = selectionState.merge(content.selectionState);
     // console.log("S: ", s);
     var mySelection = this.state.editorState.getSelection()
     //making cursor
     if (content.start === content.end) {

       //find x and y of mouse

       var e = EditorState.createWithContent(c);
       var edit = this.updateSetState(EditorState.forceSelection(e, s));
       var range = window.getSelection().getRangeAt(0);
       // let range = document.createRange(selection);

       this.updateSetState(EditorState.forceSelection(e, mySelection))
       // console.log('selection', selection)

       // range.selectNode(document.getElementById("editor"));
       let rect = range.getBoundingClientRect();
       // let rect = range.getClientRects();
       console.log('rect', rect)

       var modified = c;

       //set div styles for cursor
       this.setState({cursorStyle: {
         top: rect.top, bottom: rect.bottom,
         left: rect.left, right: rect.right,
         width: '2px',
         height: rect.height,
         backgroundColor: content.color, position: 'absolute'
       }})

     } else {
       var modified = Modifier.applyInlineStyle(c, s, content.inlineStyle.highlight);
       // console.log("Content: ", modified);
       var e = EditorState.createWithContent(modified);
       // console.log("E", e);
       // var s = this.state.editorState.getSelection();

       var newEditor = EditorState.forceSelection(e, mySelection);
       this.setState({
         editorState: newEditor,
         selection: s,
         yourStyle: content.inlineStyle.highlight
       })
     }
   })

   socket.on('errorMessage', message => {
     // YOUR CODE HERE (3)
     console.log(message);
     alert(message);
   });
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
    //console.log("Selection state: ", selectionState);
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
    this.props.socket.emit('content', {
      contentState: convertToRaw(modified),
      selectionState: selectionState,
      inlineStyle: {cursor: `CURSOR${this.state.myColor}`, highlight: `HIGHLIGHT${this.state.myColor}`},
      start: start,
      end: end,
      room: this.props.title,
      color: this.state.myColor
    })

    this.setState({
      editorState,
    })


  }

  save() {
    let currentContent = this.state.editorState.getCurrentContent();
    console.log("Save the content ", currentContent);
    const doc = this.props.doc._id;
    const user = JSON.parse(localStorage.getItem('user'));
    // fetch post request: save
    this.props.socket.emit('save', { content: convertToRaw(currentContent), id: this.props.doc._id, user });
  }

  handleClose() {
    this.setState({ historyShow: false });
  }

  handleShow() {
    this.setState({ historyShow: true });
  }

  getHistory() {
    this.handleShow();
    this.props.socket.emit('history', { docId: this.props.doc._id, title: this.props.title });
  }


  generateDecorator(highlightTerm){
    const regex = new RegExp(highlightTerm, 'g');
    return new CompositeDecorator([{
      strategy: (contentBlock, callback) => {
        if (highlightTerm !== '') {
          this.findWithRegex(regex, contentBlock, callback);
        }
      },
      component: this.SearchHighlight
    }])
  };

  findWithRegex(regex, contentBlock, callback){
    const text = contentBlock.getText();
    let matchArr, start, end;
    while ((matchArr = regex.exec(text)) !== null) {
      start = matchArr.index;
      end = start + matchArr[0].length;
      callback(start, end);
    }
};

  SearchHighlight(props) {
    return <span style={{backgroundColor: 'yellow'}} className="search-and-replace">{props.children}</span>
  }


  onChangeSearch(e){
      const search = e.target.value;
      this.setState({
        search,
        editorState: EditorState.set(this.state.editorState, { decorator: this.generateDecorator(search) }),
      });
    }

  onChangeReplace(e) {
    this.setState({
      replace: e.target.value,
    });
  }

  onReplace(){
    console.log(`replacing "${this.state.search}" with "${this.state.replace}"`);
    const regex = new RegExp(this.state.search, 'g');
    const { editorState } = this.state;
    const selectionsToReplace = [];
    const blockMap = editorState.getCurrentContent().getBlockMap();

    blockMap.forEach((contentBlock) => (
      this.findWithRegex(regex, contentBlock, (start, end) => {
        const blockKey = contentBlock.getKey();
        const blockSelection = SelectionState
          .createEmpty(blockKey)
          .merge({
            anchorOffset: start,
            focusOffset: end,
          });

        selectionsToReplace.push(blockSelection)
      })
    ));

    let contentState = editorState.getCurrentContent();

    selectionsToReplace.forEach(selectionState => {
      contentState = Modifier.replaceText(
        contentState,
        selectionState,
        this.state.replace,
      )
      this.props.socket.emit('content', {
        contentState: convertToRaw(contentState),
        selectionState: selectionState,
      })
    });

    this.setState({
      editorState: EditorState.push(
        editorState,
        contentState,
      )
    })
  }

  render() {
    // console.log('portal: ', this.state.docPortal);
    return (
      <div>
        <button type="button" onClick={() => this.props.toggle()}>Back to Documents Portal</button>
        <br />
        <h2>{this.props.doc.title}</h2>
        <br />
        <p>Shareable Document ID: {this.props.doc._id}</p>
        <p style={{ overflowY: 'scroll', maxHeight: 30 }}>Current editors: <ul>{this.state.editors.map(editor =>
          (<li>{editor}</li>))}</ul></p>
        <div className="search-and-replace">
          <input
            value={this.state.search}
            onChange={this.onChangeSearch.bind(this)}
            placeholder="Search..."
          />
          <input
            value={this.state.replace}
            onChange={this.onChangeReplace.bind(this)}
            placeholder="Replace..."
          />
          <button type="button" onClick={() => this.onReplace()} >Replace</button>
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
        <div id="cursor" style={this.state.cursorStyle}></div>
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
