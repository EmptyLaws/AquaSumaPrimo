const DRIVE_EMBED_BASE = "https://drive.google.com/file/d";

const els = {
  frame: document.getElementById("pdf-frame"),
  frameWrap: document.getElementById("frame-wrap"),
  title: document.getElementById("pdf-title"),
  counter: document.getElementById("pdf-counter"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),
  emptyState: document.getElementById("empty-state"),
  loadingState: document.getElementById("loading-state"),
};

let documents = [];
let currentIndex = 0;
let loadingTimer = null;

function driveEmbedUrl(fileId) {
  return `${DRIVE_EMBED_BASE}/${fileId}/preview`;
}

function updateNavButtons() {
  const hasDocs = documents.length > 0;
  els.btnPrev.disabled = !hasDocs || currentIndex === 0;
  els.btnNext.disabled = !hasDocs || currentIndex === documents.length - 1;
}

function updateCounter() {
  if (documents.length === 0) {
    els.counter.textContent = "";
    return;
  }
  els.counter.textContent = `${currentIndex + 1} of ${documents.length}`;
}

function showLoading() {
  els.loadingState.classList.remove("is-hidden");
  els.emptyState.classList.add("is-hidden");
}

function hideLoading() {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  els.loadingState.classList.add("is-hidden");
}

function scheduleHideLoading() {
  if (loadingTimer) clearTimeout(loadingTimer);
  loadingTimer = setTimeout(hideLoading, 1200);
}

function showEmpty() {
  els.emptyState.classList.remove("is-hidden");
  els.loadingState.classList.add("is-hidden");
  els.title.textContent = "";
  hideLoading();
  updateNavButtons();
  updateCounter();
}

function displayDocument(index) {
  if (documents.length === 0) {
    showEmpty();
    return;
  }

  currentIndex = Math.max(0, Math.min(index, documents.length - 1));
  const doc = documents[currentIndex];

  showLoading();
  els.emptyState.classList.add("is-hidden");
  els.title.textContent = doc.title;
  els.frame.src = driveEmbedUrl(doc.id);
  scheduleHideLoading();

  updateNavButtons();
  updateCounter();
}

function goPrev() {
  if (currentIndex > 0) displayDocument(currentIndex - 1);
}

function goNext() {
  if (currentIndex < documents.length - 1) displayDocument(currentIndex + 1);
}

async function loadDocuments() {
  try {
    const response = await fetch("data/pdfs.json");
    if (!response.ok) throw new Error(`Failed to load PDF list (${response.status})`);

    const data = await response.json();
    documents = Array.isArray(data.documents) ? data.documents : [];

    documents = documents.filter(
      (doc) => doc && typeof doc.id === "string" && doc.id.trim() !== ""
    );

    if (documents.length === 0) {
      showEmpty();
      return;
    }

    displayDocument(0);
  } catch (error) {
    console.error(error);
    els.emptyState.querySelector("p").textContent =
      "Could not load the document list.";
    els.emptyState.querySelector(".viewer__empty-hint").textContent =
      "Check that data/pdfs.json exists and is valid JSON.";
    showEmpty();
  }
}

els.frame.addEventListener("load", hideLoading);
els.btnPrev.addEventListener("click", goPrev);
els.btnNext.addEventListener("click", goNext);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") goPrev();
  if (event.key === "ArrowRight") goNext();
});

loadDocuments();
