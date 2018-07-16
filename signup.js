
import React from 'react';

export default class Signup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      typedUsername: "",
      typedPassword: "",
      toLogin: false
    }
  }

  handleUsername(e) {
    this.setState({
      typedUsername: e.target.value,
    })
  }

  handlePassword(e) {
    this.setState({
      typedPassword: e.target.value,
    })
  }

  handleSubmit(e) {
    e.preventDefault();
    fetch('/signup', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: this.state.typedUsername,
        password: this.state.typedPassword
      })
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.success) {
        console.log("Successfully signed up");
        this.props.toggle();
      }
    })
    .catch((err) => {
      console.log("Error: ", err);
    });

  }

  render() {
    return (
      <div>
        <h1>Signup</h1>
        <form onSubmit={(e) => this.handleSubmit(e)}>
          <input type="text" onChange={(e) => this.handleUsername(e)} value={this.state.typedUsername}></input>
          <input type="text" onChange={(e) => this.handlePassword(e)} value={this.state.typedPassword}></input>
          <input type="submit" value="Register"/>
        </form>
        <button onClick={() => this.props.toggle()}>Go to Login</button>
      </div>
    )
  }
}
