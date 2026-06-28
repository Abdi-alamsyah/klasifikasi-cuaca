import io
import json
from functools import lru_cache
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image


# backend/app/inference.py
# BASE_DIR akan mengarah ke folder backend/
BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "sky_classifier_best.keras"
CLASS_NAMES_PATH = BASE_DIR / "models" / "class_names.json"

IMG_SIZE = (224, 224)


def load_class_names():
    if not CLASS_NAMES_PATH.exists():
        raise FileNotFoundError(
            f"File class_names.json tidak ditemukan: {CLASS_NAMES_PATH}"
        )

    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


CLASS_NAMES = load_class_names()


@lru_cache(maxsize=1)
def get_model():
    """
    Model dimuat satu kali per instance Vercel Function.
    lru_cache membantu menghindari loading ulang pada request berikutnya
    selama instance function masih aktif.
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model tidak ditemukan: {MODEL_PATH}"
        )

    model = tf.keras.models.load_model(
        MODEL_PATH,
        compile=False,
    )

    return model


def preprocess_image(image_bytes: bytes):
    """
    Menyamakan preprocessing deployment dengan training:
    - RGB
    - Resize 224 x 224
    - Rentang piksel tetap 0 sampai 255
    """

    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("RGB")
    image = image.resize(IMG_SIZE)

    image_array = np.asarray(
        image,
        dtype=np.float32,
    )

    image_array = np.expand_dims(
        image_array,
        axis=0,
    )

    return image_array


def predict_image(image_bytes: bytes):
    """
    Menerima bytes gambar dan mengembalikan hasil prediksi.
    """

    model = get_model()

    image_array = preprocess_image(image_bytes)

    probabilities = model.predict(
        image_array,
        verbose=0,
    )[0]

    predicted_index = int(np.argmax(probabilities))

    scores = {
        class_name: round(
            float(score) * 100,
            2,
        )
        for class_name, score in zip(
            CLASS_NAMES,
            probabilities,
        )
    }

    return {
        "predicted_class": CLASS_NAMES[predicted_index],
        "confidence": round(
            float(probabilities[predicted_index]) * 100,
            2,
        ),
        "scores": scores,
    }