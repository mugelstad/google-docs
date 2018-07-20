import React from 'react';
import { Row, Col, Button, Glyphicon, Modal } from 'react-bootstrap';


export default class EditorHeader extends React.Component{
  constructor(props){
    super(props);
  }


  render() {
    return (
      <div>
        <Row style={{ marginTop: 20 }}>
          <Col xs={9} sm={9} md={9}>
            <Button type="button" onClick={() => this.props.toggle()}>
              <Glyphicon glyph="arrow-left" /> Back to Documents Portal
            </Button>
          </Col>
          <Col xs={3} sm={3} md={3}>
            <Button bsStyle="primary" onClick={() => this.props.open()}>
              <Glyphicon glyph="share" /> Share Document
            </Button>
          </Col>
        </Row>
        <Modal
          show={this.props.shareShow}
          onHide={() => this.props.close()}
        >
          <Modal.Body>Shareable Id: {this.props.doc._id} </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.props.close()}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}
