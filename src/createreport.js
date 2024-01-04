import React, { useState, useEffect} from 'react';
import {TextField, Container} from '@mui/material';
import { Card, CardContent, Typography, Grid, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

import UploadPhotos from './uploadphoto';
const CreateReportComponent = ({username}) => {
  const [reports, setReports] = useState([]);
  const [formData, setFormData] = useState({
    username: username,
    vesselname: '',
    reporttitle: '',
    reporttype: '',
  });
  const [trigger, setTrigger] = useState(0)
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const handleOpenDialog = (report) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleDownload = (report) => {
    setDownloading(true)
    // Replace 'your_server_url' with the actual URL of your Flask server
    const url = `http://127.0.0.1:5000/download_photos?username=${username}&reportname=${report.vesselname}_${report.reporttitle}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        setDownloading(false)
        return response.blob();
      })
      .then((blob) => {
        // Create a temporary link element to trigger the download
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${username}_${report.vesselname}_${report.reporttitle}_photos.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error('Error downloading photos:', error.message);
      });
  };

  
  const handleCloseDialog = () => {
    setSelectedReport(null);
    setDialogOpen(false);
  };

  const updateList = () => {
    setTrigger(trigger+1)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading state to true when starting the fetch

        const response = await fetch('http://127.0.0.1:5000/listreport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching reports');
        }

        const { reports } = await response.json();
        setReports(reports);
      } catch (error) {
        console.error('Error fetching reports:', error.message);
        // Handle error as needed
      } finally {
        setLoading(false); // Set loading state to false whether the fetch is successful or not
      }
    };

    fetchData();
  }, [username, trigger]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData)
    try {
      // Make a POST request to the createreport endpoint using fetch
      const response = await fetch('http://127.0.0.1:5000/createreport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating report');
      }else{
        setTrigger(trigger+1);
      }

      // Clear the form after successful submission
      setFormData({
        username: username,
        vesselname: '',
        reporttitle: '',
        reporttype: '',
      });

      alert('Report created successfully!');
    } catch (error) {
      console.error('Error creating report:', error.message);
      alert('Error creating report. Please try again.');
    }
  };

  return (
    <Container>
      <Grid container spacing={2}>
        {/* <Grid item xs={0}>
        
        </Grid> */}

        <Grid item xs={4}>
          <br></br>
          <br></br>
          <Typography align="center">
            Create new report
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Username"
                  name="username"
                  value={username}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Vessel Name"
                  name="vesselname"
                  value={formData.vesselname}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Report Title"
                  name="reporttitle"
                  value={formData.reporttitle}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Report Type"
                  name="reporttype"
                  value={formData.reporttype}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  Create Report
                </Button>
              </Grid>
            </Grid>
          </form>
        </Grid>

        <Grid item xs={8}>
            <br></br>
            <br></br>
            <br></br>
            {loading ? (
              <div>
                <p>Loading reports</p>
                <CircularProgress />
              </div>
              
            ) : (
            <div>
              {reports.map((report, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Grid container>
                        <Grid item xs={3}>
                            <Typography component="div">
                              Title: {report.reporttitle}
                            </Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography color="text.secondary">
                              Type: {report.reporttype}
                            </Typography>
                            <Typography color="text.secondary">
                              Vessel: {report.vesselname}
                            </Typography>
                            <Typography color="text.secondary">
                              Completeted: {report.completed.toString()}
                            </Typography>
                            <Typography color="text.secondary">
                               {report.photos.toString()} photos uploaded
                            </Typography>
                        </Grid> 
                        <Grid item xs={3}>
                        <Button variant="contained" color="primary" onClick={() => handleOpenDialog(report)}>
                            Upload Photos
                          </Button>
                        </Grid>  
                        <Grid item xs={3}>
                          <Button variant="contained" color="primary" onClick={() => handleDownload(report)}>
                            Download Photos
                          </Button>
                          {downloading ?(<CircularProgress/>):(<div></div>)}
                        </Grid>   
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </div>)}
        </Grid>

        {/* <Grid item xs={0}>
        </Grid> */}

      </Grid>
      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Upload Photos</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <UploadPhotos
              username={username}
              reportName={`${selectedReport.vesselname}_${selectedReport.reporttitle}`}
              onClose={handleCloseDialog} // Pass a callback to close the dialog from the child component
              updateList = {updateList}
            />
          )}
        </DialogContent>
      </Dialog>

    </Container>
  );
};

export default CreateReportComponent;
