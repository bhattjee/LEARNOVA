from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.dependencies import require_roles
from app.models.user_model import UserRole
from app.services.upload_service import upload_file

router = APIRouter()

# Restricted to admin and instructor
AdminOrInstructor = Annotated[
    None, Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))
]


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_file_route(
    current_user: AdminOrInstructor,
    file: UploadFile = File(...),
    file_type: str = Form("any"),  # image | document | any
) -> dict:
    """
    Uploads a file and returns its public URL and metadata.
    """
    return await upload_file(file, file_type, settings.max_upload_size_mb)


@router.get("/{filename}")
async def get_file_route(filename: str) -> FileResponse:
    """
    Serves a file from the local upload directory.
    """
    file_path = Path(settings.upload_dir) / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(
        path=file_path,
        media_type="application/octet-stream", # Let browser handle it
        filename=filename
    )
