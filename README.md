---
title: Klasifikasi Cuaca
emoji: 🚀
colorFrom: blue
colorTo: pink
sdk: docker
pinned: false
---

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
- Satu `Dockerfile` di root project membangun frontend (Vite build) dan backend (FastAPI) sekaligus dalam satu image, cocok untuk Hugging Face Space (SDK: Docker).
- FastAPI menyajikan hasil build frontend sebagai static files, jadi membuka URL Space langsung menampilkan UI React (endpoint API tetap tersedia di `/health` dan `/predict`).
- Akses kamera di browser produksi wajib melalui HTTPS (Hugging Face Space sudah HTTPS secara default).
- Push ke `main` di GitHub otomatis ter-sync ke Hugging Face Space lewat GitHub Actions (`.github/workflows/sync-to-hf.yml`), memakai secret `HF_TOKEN`.
