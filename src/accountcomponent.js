import React from 'react';
import { Grid, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const AccountComponent = ({ username, setUsername }) => {
  const handleChangePassword = () => {
    // Implement your logic for changing the password
    console.log('Changing password...');
  };

  const handleChangeSubscription = () => {
    // Implement your logic for changing the subscription
    console.log('Changing subscription...');
  };

  const handleLogOut = () => {
    setUsername("");
    localStorage.setItem('username', "");
  };

  return (
    <Grid container spacing={2} justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
      <Grid item xs={12} md={6} lg={4}>
        <div>
          <Typography variant="h5" gutterBottom>
            Account Information
          </Typography>
          <Typography>
            Username: {username}
          </Typography>
        </div>
        <div style={{ marginTop: '20px' }}>
          <Button variant="outlined" fullWidth>
            <Link to="/create-report">Create Report</Link>
          </Button>
          <Button variant="outlined" fullWidth onClick={handleChangePassword}>
            Change Password
          </Button>
          <Button variant="outlined" style={{ marginTop: '10px' }} fullWidth onClick={handleChangeSubscription}>
            Change Subscription
          </Button>
          <Button variant="outlined" style={{ marginTop: '10px' }} fullWidth onClick={handleLogOut}>
            Log Out
          </Button>

          {/* Add more buttons for other actions as needed */}
        </div>
      </Grid>
    </Grid>
  );
};

export default AccountComponent;
