import os
import csv
import uuid
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/uploads"))
MAX_FILE_SIZE = 1 * 1024 * 1024  # 1 MB
CSV_LOG = UPLOAD_DIR / "uploads.csv"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="File Upload Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # Read file content and enforce size limit
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File exceeds the 1 MB limit."
        )

    receipt = str(uuid.uuid4())
    original_filename = file.filename or "unnamed"

    # Save file
    dest = UPLOAD_DIR / f"{receipt}_{original_filename}"
    dest.write_bytes(content)

    # Append to CSV log
    write_header = not CSV_LOG.exists()
    with CSV_LOG.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(["receipt", "filename", "size_bytes", "timestamp"])
        writer.writerow([receipt, original_filename, len(content), datetime.utcnow().isoformat()])

    return {"receipt": receipt}
