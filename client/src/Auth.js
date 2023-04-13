// client/src/Auth.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const Auth = ({ onAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isSignup
      ? `${process.env.REACT_APP_URL}/signup`
      : `${process.env.REACT_APP_URL}/login`;
    const userData = isSignup ? { email, password, username } : { email, password };

    try {
      const response = await axios.post(url, userData);
      const authData = {
        token: response.data.token,
        username: response.data.username,
      };

      // Store authentication and user data in localStorage
      localStorage.setItem("isAuthenticated", true);
      localStorage.setItem("token", authData.token);
      localStorage.setItem("username", authData.username);

      onAuthenticated(authData);
    } catch (error) {
      console.error("Error during authentication:", error.response.data.message);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      const authStatus = localStorage.getItem("isAuthenticated");
      if (authStatus) {
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
  
        onAuthenticated({ token, username });
      }
    };
  
    checkAuthentication();
  }, [onAuthenticated]);
  

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
