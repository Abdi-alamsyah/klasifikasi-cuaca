# Sky Classifier: Training, FastAPI, dan React

## 1. Training
1. Buka `training/sky_classifier_transfer_learning.ipynb` di Google Colab.
2. Mount Google Drive, lalu ubah `DATASET_PATH` pada CELL 1.
3. Jalankan CELL 1 sampai CELL 12 berurutan.
4. Salin hasil `sky_classifier_best.keras` dan `class_names.json` dari folder `export_model` ke `backend/models/`.

## 2. Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
# Salin .env.example menjadi .env, lalu sesuaikan nilai variabelnya
uvicorn app.main:app --reload --port 8000
```

Buka `http://localhost:8000/docs` untuk mencoba endpoint.

## 3. Frontend
```bash
cd frontend
npm install
# salin .env.example menjadi .env
npm run dev
```

Buka URL Vite yang muncul, biasanya `http://localhost:5173`.

## 4. Deployment
- Frontend: deploy hasil `npm run build` ke static hosting HTTPS.
- Backend: containerize memakai `backend/Dockerfile`, deploy sebagai satu service FastAPI.
- Tetapkan `ALLOWED_ORIGINS` pada backend ke URL frontend produksi, misalnya `https://domain-anda.com`.
- Akses kamera di browser produksi wajib melalui HTTPS.
