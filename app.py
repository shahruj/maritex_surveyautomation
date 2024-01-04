# from google.cloud import firestore
# import os

# # Set the path to your service account key file (credentials)
# credentials_path = "credentials.json"

# # Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path

# # Create a Firestore client
# db = firestore.Client()

# # Define the collection reference
# collection_ref = db.collection("maritexai")

# # Get all documents in the collection
# documents = collection_ref.get()

# # Print document data
# for document in documents:
#     print(f"Document ID: {document.id}")
#     print(f"Document Data: {document.to_dict()}")


from flask import Flask, request, jsonify
from flask_cors import CORS  # Import the CORS class
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from google.cloud import firestore
from google.cloud import storage
import os
import zipfile
from flask import send_file
from shutil import rmtree
import tempfile
import subprocess
import re

def slugify(text):
    # Replace spaces with underscores
    text = text.replace(" ", "_")
    
    # Remove special characters, leaving only alphanumeric, hyphens, and underscores
    text = re.sub(r"[^a-zA-Z0-9_-]", "", text)
    
    # Convert to lowercase
    text = text.lower()
    
    return text

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes in the app

# Set the path to your service account key file (credentials)
credentials_path = "credentials.json"

# Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path

# Create a Firestore client
db = firestore.Client()

# Define the collection reference
users_collection = db.collection("maritexai_users")

reports_collection = db.collection("maritexai_reports")


client = storage.Client()
bucket_name = 'maritexreports'
bucket = client.bucket(bucket_name)

# Define the endpoint for batch photo upload
@app.route('/upload_photos', methods=['POST'])
def upload_photos():
    if 'username' not in request.form or 'reportname' not in request.form:
        print("BROTHERS")
        return jsonify({'error': 'Incomplete data provided'}), 400
    username = slugify(request.form['username'])
    reportname = slugify(request.form['reportname'])
    print(username,reportname)
    uploaded_urls = []
    for key, photo in request.files.items():
        # Secure filename to prevent directory traversal
        filename = secure_filename(photo.filename)

        # Construct the storage path
        storage_path = f'{username}/{reportname}/{filename}'

        # Upload photo to Google Cloud Storage
        blob = bucket.blob(storage_path)
        blob.upload_from_file(photo)

        # Get the public URL of the uploaded photo
        photo_url = f'https://storage.googleapis.com/{bucket_name}/{storage_path}'
        uploaded_urls.append(photo_url)

    return jsonify({'uploaded_photos': uploaded_urls}), 200

@app.route('/download_zip', methods=['GET'])
def download_zip():
    if 'username' not in request.args or 'reportname' not in request.args:
        return jsonify({'error': 'Incomplete data provided'}), 400

    username = request.args['username']
    reportname = request.args['reportname']
    storage_path = f'{username}/{reportname}'
    blobs = bucket.list_blobs(prefix=storage_path)

    zip_filename = '{username}_{reportname}_photos.zip'

    # Create a Zip file
    with zipfile.ZipFile(zip_filename, 'w') as zip_file:
        # List files in the GCS bucket path
        blobs = bucket.list_blobs(prefix=storage_path)
        for blob in blobs:
            print(blob)
            temp_dir = tempfile.mkdtemp(prefix=f'{username}_{reportname}_{blob.name}', dir=tempfile.gettempdir())
            # Download each file and add it to the Zip file
            blob.download_to_filename(temp_dir)
            zip_file.write(temp_dir)
            os.remove(temp_dir)

    # Send the Zip file as a response
    return send_file(zip_filename, as_attachment=True)

@app.route('/download_folder', methods=['GET'])
def download_folder():
    bucket_name = 'maritexreports'
    username = request.args['username']
    reportname = request.args['reportname']

    folder_path = f'{username}/{reportname}'
    # destination_path = 'downloaded_folder'
    destination_path = tempfile.mkdtemp(prefix=f'{username}_{reportname}', dir=tempfile.gettempdir())
    # Create the destination directory if it doesn't exist
    os.makedirs(destination_path, exist_ok=True)

    # Use gsutil command to copy the folder from GCS to the local directory
    gsutil_command = f'gsutil -m cp -r "gs://{bucket_name}/{folder_path}" {destination_path}'
    subprocess.run(gsutil_command, shell=True, check=True)

    # Create a Zip file from the downloaded folder
    zip_filename = 'downloaded_folder.zip'
    with subprocess.Popen(['zip', '-r', zip_filename, 'downloaded_folder'], stdout=subprocess.PIPE, stderr=subprocess.PIPE) as process:
        process.communicate()

    # Remove the downloaded folder after creating the Zip file
    subprocess.run(['rm', '-rf', 'downloaded_folder'])

    # Send the Zip file as a response
    return send_file(zip_filename, as_attachment=True)

@app.route('/download_photos', methods=['GET'])
def download_photos():
    if 'username' not in request.args or 'reportname' not in request.args:
        return jsonify({'error': 'Incomplete data provided'}), 400

    username = slugify(request.args['username'])
    reportname = slugify(request.args['reportname'])

    storage_path = f'{username}/{reportname}'
    blobs = bucket.list_blobs(prefix=storage_path)
    # Count the number of photos
    # Create a temporary directory to store the downloaded photos
    # temp_dir = f'/tmp/{username}_{reportname}'
    # os.makedirs(temp_dir, exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix=f'{username}_{reportname}', dir=tempfile.gettempdir())

    try:
        print(request.files.items())
        # Download photos from Google Cloud Storage to the temporary directory
        for blob in blobs:
            bucket_name = blob.bucket.name
            object_path = blob.name
            unique_identifier = blob.generation
            print(blob.name)
            filename = secure_filename(blob.name)
            # Download the photo to the temporary directory
            temp_filepath = os.path.join(temp_dir, filename)
            print("downloading")
            print(temp_filepath)
            blob.download_to_filename(temp_filepath)

        # Create a zip file containing the downloaded photos
        zip_filename = f'{username}_{reportname}_photos.zip'
        print(zip_filename)
        zip_filepath = os.path.join(tempfile.mkdtemp(prefix=f'', dir=tempfile.gettempdir()), zip_filename)
        print(zip_filepath)
        with zipfile.ZipFile(zip_filepath, 'w') as zip_file:
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, temp_dir)
                    zip_file.write(file_path, arcname=arcname)

        # Send the zip file as a response
        return send_file(zip_filepath, as_attachment=True)

    except Exception as e:
        # Handle exceptions, log, or return an error response as needed
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Error processing request'}), 500

    finally:
        # Remove the temporary directory after sending the file
        rmtree(temp_dir, ignore_errors=True)
        # os.remove(zip_filepath)

# @app.route('/download_photos', methods=['GET'])
# def download_photos():
#     if 'username' not in request.args or 'reportname' not in request.args:
#         return jsonify({'error': 'Incomplete data provided'}), 400

#     username = request.args['username']
#     reportname = request.args['reportname']

#     # Create a temporary directory to store the downloaded photos
#     # temp_dir = f'/tmp/{username}_{reportname}'
#     # print(temp_dir)
#     # os.makedirs(temp_dir, exist_ok=True)
#     temp_dir = tempfile.mkdtemp(prefix=f'{username}_{reportname}_', dir=tempfile.gettempdir())

#     print("made it")
#     try:
#         # Download photos from Google Cloud Storage to the temporary directory
#         for key, _ in request.files.items():
#             filename = secure_filename(key)
#             storage_path = f'{username}/{reportname}/{filename}'
#             blob = bucket.get_blob(storage_path)

#             # Download the photo to the temporary directory using the storage client
#             temp_filepath = os.path.join(temp_dir, filename)
#             blob.download_to_filename(temp_filepath)

#         # Create a zip file containing the downloaded photos
#         zip_filename = f'{username}_{reportname}_photos.zip'
#         zip_filepath = os.path.join(temp_dir, zip_filename)
#         with zipfile.ZipFile(zip_filepath, 'w') as zip_file:
#             for root, _, files in os.walk(temp_dir):
#                 for file in files:
#                     file_path = os.path.join(root, file)
#                     arcname = os.path.relpath(file_path, temp_dir)
#                     zip_file.write(file_path, arcname=arcname)

#         # Send the zip file as a response
#         return send_file(zip_filepath, as_attachment=True)

#     finally:
#         # Remove the temporary directory after sending the file
#         rmtree(temp_dir)

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    # Check if required fields are present in the request
    if 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password are required'}), 400

    username = slugify(data['username'])
    password = data['password']
    email = data['email']
    status = 'Basic'
    # Check if the username is already taken
    if users_collection.document(username).get().exists:
        return jsonify({'error': 'Username already taken'}), 400

    # Hash the password before storing
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')


    # Store user data in Firestore
    users_collection.document(username).set({
        'username': username,
        'password': hashed_password,
        'email': email,
        'status':status
    })

    return jsonify({'message': 'Signup successful'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # Check if required fields are present in the request
    if 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password are required'}), 400

    username = slugify(data['username'])
    password = data['password']

    user_doc = users_collection.document(username).get()

    # Check if the user exists
    if not user_doc.exists:
        return jsonify({'error': 'Invalid username or password'}), 401

    # Check if the password is correct
    if not check_password_hash(user_doc.to_dict()['password'], password):
        return jsonify({'error': 'Invalid username or password'}), 401

    return jsonify({'message': 'Login successful'}), 200

@app.route('/change_password', methods=['POST'])
def change_password():
    data = request.get_json()
    print(data)
    # Check if required fields are present in the request
    if 'username' not in data or 'old_password' not in data or 'new_password' not in data:
        return jsonify({'error': 'Username, old password, and new password are required'}), 400

    username = data['username']
    old_password = data['old_password']
    new_password = data['new_password']

    user_doc = users_collection.document(username).get()

    # Check if the user exists
    if not user_doc.exists:
        return jsonify({'error': 'User not found'}), 404

    # Check if the old password is correct
    if not check_password_hash(user_doc.to_dict()['password'], old_password):
        return jsonify({'error': 'Invalid old password'}), 401

    # Hash the new password before updating
    hashed_new_password = generate_password_hash(new_password, method='sha256')

    # Update the password in Firestore
    users_collection.document(username).update({
        'password': hashed_new_password
    })

    return jsonify({'message': 'Password changed successfully'}), 200

def count_photos_in_path(storage_path):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=storage_path)

    # Count the number of photos
    photo_count = sum(1 for _ in blobs)

    return photo_count

@app.route('/listreport', methods=['POST'])
def list_reports():
    data = request.get_json()

    # Check if required fields are present in the request
    if 'username' not in data:
        return jsonify({'error': 'Username is required in the request body'}), 400

    username = data['username']

    # Check if the user exists
    user_doc = users_collection.document(username).get()
    if not user_doc.exists:
        return jsonify({'error': 'User not found'}), 404

    # Retrieve reports for the specified username
    reports = reports_collection.where('username', '==', username).stream()

    report_list = []
    for report in reports:
        report_data = report.to_dict()
        n = count_photos_in_path(f"{username}/{report_data['vesselname']}_{report_data['reporttitle']}")
        report_list.append({
            'vesselname': report_data['vesselname'],
            'reporttitle': report_data['reporttitle'],
            'reporttype': report_data['reporttype'],
            'completed': report_data['completed'],
            'photos': n
        })

    return jsonify({'reports': report_list}), 200


@app.route('/createreport', methods=['POST'])
def create_report():
    data = request.get_json()

    # Check if required fields are present in the request
    required_fields = ['username', 'vesselname', 'reporttitle', 'reporttype']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    username = slugify(data['username'])
    vesselname = slugify(data['vesselname'])
    reporttitle = slugify(data['reporttitle'])
    reporttype = slugify(data['reporttype'])
    completed = False  # Default value for the completed field

    # Check if the user exists
    user_doc = users_collection.document(username).get()
    if not user_doc.exists:
        return jsonify({'error': 'User not found'}), 404

    # Create a new entry in the maritexai_reports collection
    reports_collection.add({
        'username': username,
        'vesselname': vesselname,
        'reporttitle': reporttitle,
        'reporttype': reporttype,
        'completed': completed
    })

    return jsonify({'message': 'Report created successfully'}), 201


if __name__ == '__main__':
    app.run(debug=True)
