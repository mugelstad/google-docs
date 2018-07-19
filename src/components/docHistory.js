import React from 'react';
import { EditorState, convertFromRaw } from 'draft-js';
import { Modal, Alert, Grid, Row, Col, Button } from 'react-bootstrap';

const prompt = require('electron-prompt');
const io = require('socket.io-client');


export default class DocHistory extends React.Component {
  constructor(props) {
    super(props);
    console.log(this.props.revisions[this.props.revisions.length-1]);
    this.state = {
      currVersion: this.props.revisions[this.props.revisions.length-1],
      index: this.props.revisions.length-1,
    };
  }

  componentDidMount() {
    this.setState({ currVersion: this.props.revisions[this.props.revisions.length-1] });
  }

  restore(){

  }

  selectVersion(index) {
    this.setState({ currVersion: this.props.revisions[index], index });
  }

  render() {
    const date = new Date();
    return (
        <Modal
          bsSize="large"
          aria-labelledby="contained-modal-title"
          show={this.props.show}
          onHide={() => this.props.hide()}
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-lg">History</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Grid>
              <Row className="show-grid">
                <Col xs={12} md={8} sm={6}>
                  <Row className="show-grid">
                    <h4>{this.props.title} as of {date.toLocaleString()}</h4>
                    <div style={{ paddingLeft: 20, paddingRight: 20 }}>
                      {(convertFromRaw({
                        entityMap: {},
                        blocks: this.state.currVersion.blocks,
                      })).getPlainText()
                    })</div>
                  </Row>
                  <Row className="show-grid" style={{ textAlign: 'center'}}>
                    <Col md={6} xs={9} sm={5}>
                      <h4>Added</h4>
                    </Col>
                    <Col md={6} xs={9} sm={5}>
                      <h4>Removed</h4>
                    </Col>

                  </Row>

                </Col>
                <Col xs={6} md={4} sm={3} style={{ overFlowY: 'scroll', maxHeight: 400 }}>
                  {this.props.revisions.map((doc, index) => {
                    return (
                      <Alert
                        bsStyle={(this.state.index === index) ? 'success' : 'warning' }
                        onClick={() => this.selectVersion(index)}
                        style={{ cursor: 'pointer' }}
                      >
                        <strong>{new Date(doc.time).toTimeString()}</strong>: by {doc.user.username}
                      </Alert>
                    );
                  })
                }
                </Col>
              </Row>
            </Grid>
          </Modal.Body>
          <Modal.Footer>
          <Button onClick={() => this.props.hide()}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
