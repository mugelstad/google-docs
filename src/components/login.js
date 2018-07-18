
import React from 'react';

export default class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      typedUsername: "",
      typedPassword: ""
    }
  }

  componentDidMount() {
    // localStorage.removeItem('user');
    const user = JSON.parse(localStorage.getItem('user'));
    console.log("USER IS: ", user);
    if (user) {
      this.props.toDoc();
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
    fetch('http://localhost:8080/login', {
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
        console.log('Successfully logged in');
        console.log(responseJson)
        var user = JSON.stringify({
          username: this.state.typedUsername,
          password: this.state.typedPassword,
          id: responseJson.user._id,
        })
        localStorage.setItem('user', user);
        this.props.toDoc();
      } else {
        console.log('No username!');
      }
    })
    .catch((err) => {
      console.log('Error: ', err);
    });

  }

  render() {
    return (
      <div>
        <h1>Login</h1>
        <form onSubmit={(e) => this.handleSubmit(e)}>
          <input type="text" onChange={(e) => this.handleUsername(e)} value={this.state.typedUsername}></input>
          <input type="text" onChange={(e) => this.handlePassword(e)} value={this.state.typedPassword}></input>
          <input type="submit" value="Login"/>
        </form>
        <button onClick={() => this.props.toggle()}>Go to Signup</button>
      </div>
    )
  }
}
