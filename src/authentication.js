import React, { useState, useContext } from 'react';
import AuthPage from './login';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import { Button } from '@mui/material';
import AccountComponent from './accountcomponent';

const AuthComponent = ({username,setUsername}) => {


  const handleSignup = async (data) => {
    // Make a POST request to your signup endpoint with the provided data
    try {
      const response = await fetch('http://127.0.0.1:5000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }else{
        setUsername(data.username)
        localStorage.setItem('username', data.username);
      }

      // Handle successful signup, e.g., redirect to login page
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const handleLogin = async (data) => {
    // Make a POST request to your login endpoint with the provided data
    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log(response)

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }else{
        console.log(data)
        setUsername(data.username)
        localStorage.setItem('username', data.username);
      }

      // Handle successful login, e.g., redirect to dashboard
      
    } catch (error) {
      throw new Error(error.message);
    }
  };

  return (
    <div>
      {(username==='') ?(
        <div>
            <br></br>
            <br></br>
            <AuthPage action={"signup"} onSubmit={handleSignup}/>
            <AuthPage action={"login"} onSubmit={handleLogin}/>
        </div>
      ):(
        <div>
            <AccountComponent username={username} setUsername={setUsername}/>
        </div>
      )}
    </div>
  );
};

export default AuthComponent;
