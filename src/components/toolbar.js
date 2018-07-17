import React from 'react';
import { ButtonGroup, Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
import FontSizeSelect from './fontSizeSelect';
import FontColourSelect from './fontColourSelect';


// Components

export default class ToolBar extends React.Component {
  constructor(props) {
    super(props);
  }

  onFontSizeChange(value) {
    this.props.edit(`FONTSIZE${value}`);
  }

  onFontColourChange(value) {
    this.props.edit(`FONTCOLOR${value}`);
  }

  render() {
    return (
      <div>
        <FontSizeSelect edit={value => this.onFontSizeChange(value)} />
        <FontColourSelect edit={value => this.onFontColourChange(value)} />
        <ButtonToolbar>
          <ButtonGroup>
            <Button onClick={() => this.props.edit('BOLD')}><bold>B</bold></Button>
            <Button onClick={() => this.props.edit('ITALIC')}><i>I</i></Button>
            <Button onClick={() => this.props.edit('UNDERLINE')}>
              <underline>U</underline>
            </Button>
            <Button onClick={() => this.props.edit('STRIKETHROUGH')}>Strikethrough</Button>
            <Button onClick={() => this.props.alignEdits('left')}>
              <Glyphicon glyph="align-left" />
            </Button>
            <Button onClick={() => this.props.alignEdits('center')}>
              <Glyphicon glyph="align-center" />
            </Button>
            <Button onClick={() => this.props.alignEdits('right')}>
              <Glyphicon glyph="align-right" />
            </Button>
            <Button onClick={() => this.props.alignEdits('justify')}>
              <Glyphicon glyph="align-justify" />
            </Button>
            <Button onClick={() => this.props.blockEdit('unordered-list-item')}>
              <Glyphicon glyph="th-list" />
            </Button>
            <Button onClick={() => this.props.blockEdit('ordered-list-item')}>
              <Glyphicon glyph="sort-by-order" />
            </Button>
          </ButtonGroup>
        </ButtonToolbar>
      </div>
    );
  }
}
