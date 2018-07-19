this.onChange = (editorState) => {
      let currentContent = editorState.getCurrentContent()
      const currentSelection = editorState.getSelection()
      const firstBlock = currentContent.getFirstBlock()
      const lastBlock = currentContent.getLastBlock()
      const allSelection = SelectionState.createEmpty(firstBlock.getKey()).merge({
        focusKey: lastBlock.getKey(),
        focusOffset: lastBlock.getLength(),
      })

      // each active user gets assigned one color when selecting text in the editor
      this.selectionObj[ this.color ] = currentSelection;
      for( var color in this.selectionObj ) {
        // Clear all Highlighs for the entire document for each User's color
        var userSelection = SelectionState.createWithObj( this.selectionObj[ color ] );
        currentContent = Modifier.removeInlineStyle(currentContent, allSelection, 'HIGHLIGHT'+color);
        //currentContent = Modifier.removeInlineStyle(currentContent, allSelection, 'CURSOR'+color);
        // Highlight the User's selection with their Highlight Color
        if( selectionIsHighlighted( userSelection ) ) currentContent = Modifier.applyInlineStyle(currentContent, userSelection, 'HIGHLIGHT'+color);
        //else currentContent = Modifier.applyInlineStyle(currentContent, userSelection, 'CURSOR'+color);
        editorState = EditorState.createWithContent(currentContent);
      }

      // focus on editor if user is not focusing on title field
      if( !this.state.titleFocus ) editorState = EditorState.forceSelection(editorState, currentSelection)

      // save EditorState, then send an update event the server
      this.setState({editorState}, () => {
        if( this.editorToken ) { this.editorToken = false; return; }
        var dataObj = {
          content: convertToRaw(this.state.editorState.getCurrentContent()),
          token: this.state.userId,
          docId: this.props.docId,
          userColor: this.color,
          selectionObj: this.selectionObj,
          title: this.state.title,
        }
        this.socket.emit('editDoc', dataObj );
      });
    }




          // WILL WORK LATER

          // socket.on('cursor', (cursor) => {
          //   // inline styling?
          //   // add a line
          //   console.log(this.state.editorState.getCurrentContent());
          //
          //
          //   var selectionState = SelectionState.createEmpty();
          //   selectionState = selectionState.merge(cursor.selectionState);
          //   console.log("Selection: ", selectionState);
          //   console.log("CUrsor: ", convertFromRaw(cursor.contentState));
          //   console.log("Style: ", cursor.inlineStyle);
          //
          //   // var e = EditorState.createWithContent(convertFromRaw(cursor.contentState));
          //   // var s = cursor.selectionState;
          //   // var newEditor = EditorState.forceSelection(e, s);
          //
          //   Modifier.applyInlineStyle(convertFromRaw(cursor.contentState), selectionState, cursor.inlineStyle)
          //   // this.setState({
          //   //   editorState: newEditor
          //   // })
          //   // getSelection()
          //   // console.log("Editor: ", newEditor);
          //   // Modifier.applyInlineStyle(newEditor.getCurrentContent(), newEditor.getSelection(), cursor.inlineStyle)
          // })
          //
          // socket.on('highlight', (highlight) => {
          //   // editorState = RichUtils.toggleInlineStyle(editorState, 'HIGHLIGHT');
          //
          //   Modifier.applyInlineStyle(highlight.contentState, highlight.selectionState, highlight.inlineStyle)
          // })
