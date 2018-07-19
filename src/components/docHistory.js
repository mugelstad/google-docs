import React from 'react';
import { Editor, EditorState, convertFromRaw } from 'draft-js';
import { Modal, Alert, Grid, Row, Col, Button } from 'react-bootstrap';

import styleMap from './stylemap';

export default class DocHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      revisions: this.props.revisions.reverse(),
      currVersion: this.props.revisions[this.props.revisions.length-1],
      index: 0,
    };
  }

  componentDidMount() {
    this.setState({ currVersion: this.props.revisions[0] });
  }

  restore(){

  }

  selectVersion(index) {
    this.setState({ currVersion: this.state.revisions[index], index });
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
            <Modal.Title
              id="contained-modal-title-lg"
            >
              History of {this.state.currVersion.title} as of {
                new Date().toLocaleString()}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Grid>
              <Row className="show-grid">
                <Col xs={6} sm={6} md={7}>
                  <Row
                    className="show-grid"
                    style={{
                      paddingLeft: 20,
                      paddingRight: 20,
                      border: '1px solid gray',
                      borderRadius: 3,
                      overflowY: 'scroll',
                      maxHeight: 500,
                    }}
                  >
                    {this.state.currVersion ?
                      <Editor
                        editorState={EditorState.createWithContent(convertFromRaw({
                          entityMap: {},
                          blocks: this.state.currVersion.blocks,
                        }))}
                        customStyleMap={styleMap}
                        readOnly
                      />
                      : <div>
                        Hmm.....There should be something here.
                        Try reopening this section, I'm sure everything will be good.
                      </div>
                    }
                  </Row>
                  <Row className="show-grid" style={{ textAlign: 'center' }}>
                    <Col xs={9} sm={5} md={6}>
                      <h4>Added</h4>
                    </Col>
                    <Col xs={9} sm={5} md={6}>
                      <h4>Removed</h4>
                    </Col>

                  </Row>

                </Col>
                <Col xs={3} sm={3} md={3} style={{ overflowY: 'scroll', maxHeight: 500 }}>
                  {this.state.revisions.map((doc, index) => {
                    return (
                      <Alert
                        bsStyle={(this.state.index === index) ? 'success' : 'warning'}
                        onClick={() => this.selectVersion(index)}
                        style={{ cursor: 'pointer' }}
                      >
                        <strong>{`${new Date(doc.time).toDateString()} ${new Date(doc.time).toTimeString()}`}</strong>: by {doc.user.username}
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
