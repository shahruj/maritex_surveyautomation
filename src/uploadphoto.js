import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Typography, Box } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

const UploadPhotos = ({username,reportName,updateList}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploading, setUploading] = useState(false)

  const onDrop = (acceptedFiles) => {
    setSelectedFiles(acceptedFiles);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
    // Append each file with a unique key
    formData.append(`photo_${index}`, file);
    });

    // Append additional fields (username and reportName)
    formData.append('username', username);
    formData.append('reportname', reportName);

    const formDataObject = {}
    formData.forEach((value, key) => {
      formDataObject[key] = value;
    });
    console.log(formDataObject);
    setUploading(true)
    try {
      const response = await fetch('http://127.0.0.1:5000/upload_photos', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      } else {
        updateList();
      }
  
      const data = await response.json();
      setUploadedPhotos(data.uploaded_photos);
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
    setUploading(false)
  };
  
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()} style={dropzoneStyles}>
        <input {...getInputProps()} />
        <Typography variant="h6">Drag & drop photos here, or click to select files</Typography>
      </div>
      {selectedFiles.length > 0 && (
        <Box mt={2}>
          <Typography variant="body1">
            Selected {selectedFiles.length} photo(s): {selectedFiles.map((file) => file.name).join(', ')}
          </Typography>
        </Box>
      )}
      {selectedFiles.length > 0 && (
        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handleUpload}>
            Upload
          </Button>
          {uploading ? (
            <div>
                <p>Uploading</p>
                <CircularProgress/>
            </div>):(
            <div>

            </div>)}
        </Box>
      )}
      {uploadedPhotos.length > 0 && (
        <Box mt={2}>
          <Typography variant="body1">Photos uploaded</Typography>
        </Box>
      )}
    </div>
  );
};

const dropzoneStyles = {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    cursor: 'pointer',
    marginBottom: '20px',
  };

export default UploadPhotos;
