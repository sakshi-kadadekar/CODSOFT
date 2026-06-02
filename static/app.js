const camera = document.querySelector("#camera");
const startButton = document.querySelector("#startCamera");
const captureButton = document.querySelector("#captureFrame");
const canvas = document.querySelector("#snapshot");
const resultImage = document.querySelector("#resultImage");
const resultText = document.querySelector("#resultText");
const emptyState = document.querySelector("#emptyState");
const faceList = document.querySelector("#faceList");
const detSlider = document.querySelector("#detSlider");
const recSlider = document.querySelector("#recSlider");
const detOut = document.querySelector("#detOut");
const recOut = document.querySelector("#recOut");
const detector = document.querySelector("#detector");

let stream = null;

function bindSlider(slider, output) {
  if (!slider || !output) {
    return;
  }
  slider.addEventListener("input", () => {
    output.textContent = slider.value;
  });
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  camera.srcObject = stream;
}

async function captureFrame() {
  if (!stream) {
    await startCamera();
  }

  canvas.width = camera.videoWidth || 640;
  canvas.height = camera.videoHeight || 480;
  const context = canvas.getContext("2d");
  context.drawImage(camera, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    const form = new FormData();
    form.append("image", blob, "camera.jpg");
    form.append("mode", "recognize");
    form.append("detector", detector ? detector.value : "insightface");
    form.append("detection_threshold", detSlider ? detSlider.value : "0.5");
    form.append("recognition_threshold", recSlider ? recSlider.value : "0.45");

    resultText.textContent = "Processing camera frame...";
    const response = await fetch("/api/process", { method: "POST", body: form });
    const payload = await response.json();

    if (!response.ok) {
      resultText.textContent = payload.error || "Could not process camera frame.";
      return;
    }

    resultImage.src = payload.imageUrl;
    resultImage.classList.remove("hidden");
    if (emptyState) {
      emptyState.classList.add("hidden");
    }
    resultText.textContent = `Faces found: ${payload.faceCount}`;
    renderFaces(payload.faces || []);
  }, "image/jpeg", 0.92);
}

function renderFaces(faces) {
  if (!faceList) {
    return;
  }
  faceList.innerHTML = "";
  faces.forEach((face) => {
    const row = document.createElement("article");
    row.className = "face-row";

    const name = document.createElement("strong");
    name.textContent = face.identity;
    row.appendChild(name);

    const det = document.createElement("span");
    det.textContent = `Detection ${face.detection_score}`;
    row.appendChild(det);

    if (face.similarity !== null && face.similarity !== undefined) {
      const sim = document.createElement("span");
      sim.textContent = `Similarity ${face.similarity}`;
      row.appendChild(sim);

      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("i");
      fill.style.width = `${Math.max(0, Math.min(100, face.similarity * 100))}%`;
      bar.appendChild(fill);
      row.appendChild(bar);
    }

    faceList.appendChild(row);
  });
}

if (startButton && captureButton) {
  startButton.addEventListener("click", () => {
    startCamera().catch((error) => {
      resultText.textContent = error.message;
    });
  });

  captureButton.addEventListener("click", () => {
    captureFrame().catch((error) => {
      resultText.textContent = error.message;
    });
  });
}

bindSlider(detSlider, detOut);
bindSlider(recSlider, recOut);
