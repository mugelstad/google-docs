import React from 'react';

export default class FontSizeSelect extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<div style={{ display: 'inline' }}>
      <select onChange={() => this.props.onchange(this.value)}>
        <option value={8}>8</option>
        <option value={9}>9</option>
        <option value={10}>10</option>
        <option value={12}>12</option>
        <option value={14}>14</option>
        <option value={16}>18</option>
        <option value={20}>20</option>
        <option value={24}>24</option>
        <option value={28}>28</option>
        <option value={32}>32</option>
        <option value={36}>36</option>
        <option value={40}>40</option>
        <option value={48}>48</option>
        <option value={60}>60</option>
      </select>
    </div>);
  }
}
