import React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
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
      editorState: EditorState.createEmpty(),
      docPortal: false,
      myColor: null
    };
    this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = () => this.handleKeyCommand;
  }

  componentDidMount() {
    const socket = io('http://127.0.0.1:8080');
    socket.on('connect', () => {
      console.log('ws connect');

      socket.emit('document', '5b4e37aae7179a508a8d0c64');
      //call in document portal front-end side
      socket.on('document', (doc) => {
        console.log("The doc is: ", doc);
      })
      //
      // socket.on('color', (color) => {
      //   console.log("Color us: ", color);
      //   this.setState({myColor: color})
      // })


      // fetch('/document/5b4e37aae7179a508a8d0c64', {
      //   method: 'GET',
      //   headers: {
      //     "Content-Type": "application/json"
      //   }
      // }).then((response) => response.json())
      // .then((responseJson) => {
      //   console.log("RES", responseJson);
      //   if (responseJson.success) {
      //     socket.emit('document', responseJson.document)
      //     console.log("Emit");
      //     //assign new user a color
      //     socket.on('color', (color) => {
      //       this.setState({myColor: color})
      //     })
      //     //send location of my cursor
      //     let selectionState = this.state.editorState.getSelection()
      //     let anchorKey = selectionState.getAnchorKey();
      //     let currentContent = this.state.editorState.getCurrentContent();
      //     let currentContentBlock = currentContent.getBlockForKey(anchorKey);
      //     let start = selectionState.getStartOffset();
      //     let end = selectionState.getEndOffset();
      //     let selectedText = currentContentBlock.getText().slice(start, end);
      //
      //     // const highlightPlugin = createHighlightPlugin({
      //     //   background: this.state.myColor,
      //     //   color: 'yellow',
      //     //   border: '1px solid black',
      //     // });
      //
      //     // socket.emit('cursor', {user: responseJson.document.owner, location: {
      //     //   start: start, end: end}
      //     // })
      //
      //     socket.emit('content', currentContent)
      //
      //   } else {
      //     console.log('fetching the document was unsuccessful')
      //   }
      // }).catch((error) => {
      //   socket.emit('errorMessage', error)
      // })
      // socket.on('message', message => {
      //   alert(message.content);
      // })

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
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  onChange (editorState) {
    this.setState({
      editorState,
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
            onChange={() => this.onChange()}
            handleKeyCommand={this.handleKeyCommand}
            customStyleMap={styleMap}
          />
        </div>
      </div>
    );
  }
}



// index.js

// socket.on('username', username => {
//   if (!username || !username.trim()) {
//     return socket.emit('errorMessage', 'No username!');
//   }
//   socket.username = String(username);
//   passport.authenticate('local', { successFlash: 'Welcome!' })
// });
//
// socket.username = req.user.username;

// socket.on('document', requestedDoc => {
//   if (!requestedDoc) {
//     return socket.emit('errorMessage', 'No doc!');
//   }
//   if (limit === 0) {
//     return socket.emit('errorMessage', 'The document cannot support more than 6 editors');
//   }
//   console.log("Joined the document");
//   limit --;
//   color = colors.pop();
//   socket.document = requestedDoc;
//
//   socket.join(requestedDoc, () => {
//     socket.to(requestedDoc).emit('message', {
//       content: `${socket.username} has joined`
//     });
//
//     socket.emit('color', color)
//
//     // location of cursor
//     // socket.on('cursor', cursor => {
//     //   socket.broadcast('cursor', cursor)
//     // })
//
//     // content
//     socket.on('content', content => {
//       socket.broadcast('content', content)
//     })
//
//   });
