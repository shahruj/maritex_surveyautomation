// AuthPage.js
import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const AuthPage = ({ action, onSubmit,  }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      username,
      password,
      email,
    };

    try {
      await onSubmit(data);
      setSnackbarMessage('successful');
      setSnackbarSeverity('success');
    //   setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMessage(error.message || 'Error occurred');
      setSnackbarSeverity('error');
    //   setOpenSnackbar(true);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <div>
        <Typography variant="h5">{action === 'login' ? 'Login' : 'Sign Up'}</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {action === 'signup' && (
            <TextField
              margin="normal"
              required
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            {action === 'login' ? 'Login' : 'Sign Up'}
          </Button>
        </form>
        <Typography>
            {snackbarMessage}    
        </Typography>
      </div>
    </Container>
  );
};

export default AuthPage;
