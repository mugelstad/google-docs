import React from 'react';
import { Glyphicon, Button, ButtonGroup } from 'react-bootstrap';


export default class DocumentList extends React.Component{
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div style={{
        backgroundColor: '#0057e7',
        width: 10000,
        marginLeft: -50,
        paddingLeft: 50,
        paddingTop: 30 }}
      >
        {this.props.documents.map(doc =>
          (<ButtonGroup
            vertical
            onClick={() => this.props.view(doc._id)}
            style={{ marginRight: 20, width: 100, height: 200 }}
          >
            <Button style={{ height: 100 }}>
              <Glyphicon glyph="file" />
              <hr />
              <p>{doc.title}</p>
            </Button>
          </ButtonGroup>)
        )}
      </div>

    )
  }
}
