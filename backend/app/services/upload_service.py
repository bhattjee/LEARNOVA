"""
upload_service.py — Handles file uploads to local storage.
Files are saved with UUID-based names to prevent path traversal attacks.
"""

import os
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'document': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
    'any': ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.txt'],
}

ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain',
}

async def upload_file(file: UploadFile, allowed_type: str, max_size_mb: int = 50) -> dict:
    """
    Validates and saves a file to the local UPLOAD_DIR.
    Returns: { "url": str, "filename": str, "size_bytes": int, "content_type": str }
    """
    # 1. Validate File Size
    # Spooling to disk if it exceeds 1MB, so we check size
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)

    if size > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size allowed is {max_size_mb}MB."
        )

    # 2. Validate Extension
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if allowed_type not in ALLOWED_EXTENSIONS or ext not in ALLOWED_EXTENSIONS[allowed_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension {ext} for type {allowed_type}."
        )

    # 3. Validate MIME Type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported media type: {file.content_type}."
        )

    # 4. Generate New Filename
    new_filename = f"{uuid.uuid4()}{ext}"
    upload_path = Path(settings.upload_dir) / new_filename
    
    # Ensure directory exists
    upload_path.parent.mkdir(parents=True, exist_ok=True)

    # 5. Save File
    try:
        content = await file.read()
        with open(upload_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )

    return {
        "url": f"/api/v1/uploads/{new_filename}",
        "filename": new_filename,
        "size_bytes": size,
        "content_type": file.content_type
    }
