from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import os

SCOPES = ['https://www.googleapis.com/auth/drive']
DRIVE_FOLDER_ID = '1sprKbXBzCkS8lRQaPpKsetcqEFicMmjq'

try:
    creds = service_account.Credentials.from_service_account_file('credentials.json', scopes=SCOPES)
    service = build('drive', 'v3', credentials=creds)
    print('Auth OK!')

    # Check if any uploaded photos exist
    uploads_dir = 'storage/uploads'
    if os.path.exists(uploads_dir):
        files = os.listdir(uploads_dir)
        print(f'Local uploads: {len(files)} files')
        if files:
            test_file = os.path.join(uploads_dir, files[0])
            print(f'Test uploading: {files[0]}')
            
            file_metadata = {'name': files[0], 'parents': [DRIVE_FOLDER_ID]}
            media = MediaFileUpload(test_file, mimetype='image/jpeg', resumable=True)
            
            result = service.files().create(
                body=file_metadata, media_body=media, 
                fields='id, webContentLink, webViewLink',
                supportsAllDrives=True
            ).execute()
            file_id = result.get('id')
            print(f'Upload SUCCESS! File ID: {file_id}')
            
            service.permissions().create(
                fileId=file_id, 
                body={'type': 'anyone', 'role': 'reader'},
                supportsAllDrives=True
            ).execute()
            link = result.get('webContentLink') or result.get('webViewLink')
            print(f'Public link: {link}')
        else:
            print('No files to test upload with')
    else:
        print('No uploads directory found')
except Exception as e:
    print(f'ERROR: {type(e).__name__}: {e}')
