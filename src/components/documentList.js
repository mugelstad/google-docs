import React from 'react';
import { InputGroup, FormGroup, Glyphicon, FormControl, Button, ButtonGroup } from 'react-bootstrap';


export default class DocumentList extends React.Component{
  constructor(props){
    super(props);

  }

  render() {
    return (
      <div>
        {this.props.documents.map(doc =>
          <ButtonGroup vertical onClick={() => this.props.view(doc._id)}>
            <Button><Glyphicon glyph="file" /></Button>
            <Button>{doc.title}</Button>
          </ButtonGroup>
        )}
      </div>

    )
  }
}
