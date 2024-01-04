import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import { Button } from '@mui/material';
import AuthComponent from './authentication';
import CreateReportComponent from './createreport';

const App = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Load the username from localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []); // Empty dependency array ensures this effect runs once when the component mounts

  return (
    <Router>
      <div>
        <AppBar position="static">
          <Toolbar variant="dense">
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            {(username !== "") && (
              <Button variant="h6" color="inherit" component={Link} to="/create-report">
                Create Report
              </Button>
            )}
            <Button variant="h6" color="inherit" component={Link} to="/account">
              Account
            </Button>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/create-report" element={<CreateReportComponent username={username} />} />
          <Route path="/account" element={<AuthComponent username={username} setUsername={setUsername} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
