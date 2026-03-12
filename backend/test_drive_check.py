from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/drive']
DRIVE_FOLDER_ID = '1sprKbXBzCkS8lRQaPpKsetcqEFicMmjq'

try:
    creds = service_account.Credentials.from_service_account_file('credentials.json', scopes=SCOPES)
    service = build('drive', 'v3', credentials=creds)
    
    # Check folder metadata
    folder = service.files().get(
        fileId=DRIVE_FOLDER_ID, 
        fields='id, name, driveId, teamDriveId, mimeType',
        supportsAllDrives=True
    ).execute()
    print(f"Folder info: {folder}")
    
    if folder.get('driveId') or folder.get('teamDriveId'):
        print("This IS inside a Shared Drive")
    else:
        print("This is a REGULAR Drive folder (NOT a Shared Drive)")
        print("Service accounts CANNOT upload here due to Google's storage quota policy.")
        
except Exception as e:
    print(f'ERROR: {type(e).__name__}: {e}')
