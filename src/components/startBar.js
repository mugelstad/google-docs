import React from 'react';
import { InputGroup, FormGroup, Glyphicon, FormControl, Button } from 'react-bootstrap';


export default class StartBar extends React.Component{
  constructor(props){
    super(props);

  }

  render() {
    return (
      <form>
        <FormGroup>
          Start New Document
          <InputGroup>
            <FormControl
              type="text"
              placeholder="Enter Name of Document"
              onChange={e => this.props.change(e)}
              value={this.props.title}
            />
            <InputGroup.Addon
              onClick={() => this.props.create()}
            >
              <Glyphicon glyph="file" />
            </InputGroup.Addon>
          </InputGroup>
        </FormGroup>
        <FormGroup>
          Add Shared Document
          <InputGroup>
            <FormControl type="text" placeholder="Enter ID of Document" />
            <InputGroup.Addon
              onClick={() => this.props.addShared()}
            >
              <Glyphicon glyph="plus" />
            </InputGroup.Addon>
          </InputGroup>
        </FormGroup>
      </form>
    )
  }
}
