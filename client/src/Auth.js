// client/src/Auth.js
import React, { useState } from "react";
import axios from "axios";
import './authStyles.css';

const Auth = ({onAuthenticated}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignup, setIsSignup] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isSignup ? "signup" : "login";
    try {
      const response = await axios.post(`http://localhost:5001/${endpoint}`, {
        email,
        password,
        username,
      });
      console.log(response.data);
      // Call the onAuthenticated function here and pass the response data
      onAuthenticated(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  

  return (
    <div className="auth-container">
      <h1>{isSignup ? "Sign Up" : "Log In"}</h1>
      <form 
      className="auth-form"
      onSubmit={handleSubmit}>
        {isSignup && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
          className="auth-form button"
          type="submit">{isSignup ? "Sign Up" : "Log In"}</button>
        </form>
        <button onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
        </button>
      </div>
    );
  };
  
  export default Auth;
