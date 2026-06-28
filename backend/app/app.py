import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.inference import predict_image


app = FastAPI(
    title="Sky Classifier API",
    description="API klasifikasi kondisi langit menggunakan CNN EfficientNetB0",
    version="1.0.0",
)


# Pada Vercel, nilai ini akan diisi dari Environment Variable.
# Contoh:
# ALLOWED_ORIGINS=https://sky-classifier-web.vercel.app
allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173",
)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in allowed_origins_env.split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Batas upload dibuat 4 MB.
# Batas Vercel Function untuk request body adalah 4,5 MB.
MAX_FILE_SIZE = 4 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


@app.get("/")
def root():
    return {
        "message": "Sky Classifier API aktif",
        "endpoint": "/predict",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Backend Sky Classifier siap digunakan",
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                "Format file tidak didukung. "
                "Gunakan JPEG, PNG, atau WEBP."
            ),
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="File gambar kosong.",
        )

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=(
                "Ukuran gambar terlalu besar. "
                "Maksimal ukuran file adalah 4 MB."
            ),
        )

    try:
        result = predict_image(image_bytes)
        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal melakukan prediksi: {str(error)}",
        )