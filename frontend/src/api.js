const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function predictImage(file) {
  if (!file) {
    throw new Error("Pilih atau ambil gambar terlebih dahulu.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Ukuran gambar terlalu besar. Maksimal ukuran file adalah 4 MB.",
    );
  }

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData.detail || "Terjadi kesalahan saat melakukan prediksi.",
    );
  }

  return responseData;
}
