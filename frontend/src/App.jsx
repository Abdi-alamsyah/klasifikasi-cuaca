import { useEffect, useRef, useState } from "react";
import { predictImage } from "./api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatLabel(label) {
  return label
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopCamera();
    };
  }, [previewUrl]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  function setImage(file) {
    setError("");
    setResult(null);

    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Gunakan gambar JPEG, PNG, atau WEBP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleFileChange(event) {
    stopCamera();
    setImage(event.target.files?.[0]);
  }

  async function openCamera() {
    setError("");
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Browser ini tidak mendukung akses kamera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOpen(true);
    } catch (cameraException) {
      setCameraError(
        "Kamera tidak dapat diakses. Berikan izin kamera dan gunakan HTTPS saat aplikasi sudah di-deploy."
      );
    }
  }

  function captureFromCamera() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError("Kamera belum siap. Coba beberapa saat lagi.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Gagal mengambil foto dari kamera.");
          return;
        }
        const cameraFile = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });
        stopCamera();
        setImage(cameraFile);
      },
      "image/jpeg",
      0.92
    );
  }

  async function classifyImage() {
    if (!selectedFile) {
      setError("Pilih atau ambil gambar terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const prediction = await predictImage(selectedFile);
      setResult(prediction);
    } catch (predictionError) {
      setError(predictionError.message);
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setSelectedFile(null);
    setResult(null);
    setError("");
    setCameraError("");
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Computer Vision</p>
        <h1>Klasifikasi Kondisi Langit</h1>
        <p className="hero-copy">
          Uji gambar langit melalui unggahan berkas atau ambil foto langsung dari kamera.
        </p>
      </section>

      <section className="workspace" aria-label="Form pengujian gambar">
        <div className="panel input-panel">
          <h2>1. Masukkan gambar</h2>

          <label className="upload-zone" htmlFor="image-upload">
            <span className="upload-icon" aria-hidden="true">↑</span>
            <strong>Unggah gambar</strong>
            <span>JPEG, PNG, atau WEBP, maksimal 5 MB</span>
          </label>
          <input
            id="image-upload"
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileChange}
          />

          <div className="divider"><span>atau</span></div>

          {!cameraOpen ? (
            <button className="secondary-button" type="button" onClick={openCamera}>
              Buka kamera
            </button>
          ) : (
            <div className="camera-controls">
              <button className="secondary-button" type="button" onClick={captureFromCamera}>
                Ambil foto
              </button>
              <button className="text-button" type="button" onClick={stopCamera}>
                Tutup kamera
              </button>
            </div>
          )}

          {cameraError && <p className="notice error-notice">{cameraError}</p>}
          {error && <p className="notice error-notice">{error}</p>}

          <video
            ref={videoRef}
            className={cameraOpen ? "camera-preview" : "camera-preview hidden"}
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="panel preview-panel">
          <h2>2. Pratinjau dan hasil</h2>

          {previewUrl ? (
            <img className="image-preview" src={previewUrl} alt="Gambar yang akan diuji" />
          ) : (
            <div className="empty-preview">
              <span aria-hidden="true">◌</span>
              <p>Pratinjau gambar akan muncul di sini.</p>
            </div>
          )}

          <div className="action-row">
            <button
              className="primary-button"
              type="button"
              onClick={classifyImage}
              disabled={!selectedFile || loading}
            >
              {loading ? "Menganalisis..." : "Klasifikasikan gambar"}
            </button>
            {selectedFile && (
              <button className="text-button" type="button" onClick={resetAll}>
                Reset
              </button>
            )}
          </div>

          {result && (
            <article className="result-card" aria-live="polite">
              <p className="result-label">Prediksi utama</p>
              <h3>{formatLabel(result.predicted_class)}</h3>
              <p className="confidence">{result.confidence.toFixed(2)}% keyakinan</p>

              <div className="score-list">
                {Object.entries(result.scores)
                  .sort(([, firstScore], [, secondScore]) => secondScore - firstScore)
                  .map(([label, score]) => (
                    <div className="score-row" key={label}>
                      <div className="score-heading">
                        <span>{formatLabel(label)}</span>
                        <span>{score.toFixed(2)}%</span>
                      </div>
                      <div className="score-bar" aria-label={`${label}: ${score}%`}>
                        <span style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
