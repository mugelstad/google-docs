import React from 'react';

export default class FontColourSelect extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<div style={{ display: 'inline' }}>
      <select onChange={() => this.props.onchange(this.value)}>
        <option value="red">Red</option>
        <option value=" blue">Blue</option>
        <option value="green">Green</option>
        <option value="yellow">Yellow</option>
        <option value="purple">Purple</option>
        <option value="black">Black</option>
        <option value="gray">Gray</option>
      </select>
    </div>);

  }
}
