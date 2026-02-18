import './style.css';
import { callGemini, generateImage } from './api.js';
import { buildGeneratePrompt, buildRefinePrompt, buildImagePrompt } from './prompt.js';

// ============= State =============
let currentScope = 'section';
let allVariations = [];
let currentInput = '';
let refiningIndex = -1;

// ============= DOM =============
const form = document.getElementById('generator-form');
const inputText = document.getElementById('input-text');
const scopeBtns = document.querySelectorAll('.scope-btn');
const generateBtn = document.getElementById('generate-btn');
const resultsSection = document.getElementById('results');
const previewsGrid = document.getElementById('previews');
const generateMoreBtn = document.getElementById('generate-more');
const loadingEl = document.getElementById('loading');
const loadingText = document.querySelector('.loading-text');
const refinePanel = document.getElementById('refine-panel');
const refineInput = document.getElementById('refine-input');
const refineSubmit = document.getElementById('refine-submit');
const refineCancel = document.getElementById('refine-cancel');
const refinePreview = document.getElementById('refine-preview');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
const fullscreenModal = document.getElementById('fullscreen-modal');
const fullscreenTitle = document.getElementById('fullscreen-title');
let fullscreenFrame = document.getElementById('fullscreen-frame');
const fullscreenClose = document.getElementById('fullscreen-close');
const fullscreenBack = document.getElementById('fullscreen-back');

// ============= Events =============
scopeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        scopeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentScope = btn.dataset.scope;
    });
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputText.value.trim();
    if (!text) return;
    currentInput = text;
    allVariations = [];
    await generateDesigns(text);
});

generateMoreBtn.addEventListener('click', () => {
    if (currentInput) generateDesigns(currentInput, true);
});

refineSubmit.addEventListener('click', async () => {
    const instructions = refineInput.value.trim();
    if (!instructions || refiningIndex < 0) return;

    const originalHtml = allVariations[refiningIndex].html;
    showLoading('Refinando design...');

    try {
        const prompt = buildRefinePrompt(originalHtml, instructions);
        const result = await callGemini(prompt);
        allVariations[refiningIndex] = result;
        renderPreviews();
        hideRefine();
        showToast('Design refinado com sucesso!');
    } catch (error) {
        showToast(`Erro: ${error.message}`, true);
    } finally {
        hideLoading();
    }
});

refineCancel.addEventListener('click', hideRefine);

fullscreenClose.addEventListener('click', closeFullscreen);
fullscreenBack.addEventListener('click', closeFullscreen);
fullscreenModal.addEventListener('click', (e) => {
    if (e.target === fullscreenModal) closeFullscreen();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFullscreen();
});

// ============= Core =============
async function generateDesigns(text, append = false) {
    showLoading('Gerando 3 variações de design...');
    generateBtn.disabled = true;

    try {
        const prompt = buildGeneratePrompt(text, currentScope);
        const result = await callGemini(prompt);

        if (result.variations && Array.isArray(result.variations)) {
            allVariations = append
                ? [...allVariations, ...result.variations]
                : result.variations;
            renderPreviews();
            resultsSection.classList.remove('hidden');
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            throw new Error('Formato de resposta inválido');
        }
    } catch (error) {
        showToast(`Erro: ${error.message}`, true);
    } finally {
        hideLoading();
        generateBtn.disabled = false;
    }
}

function renderPreviews() {
    previewsGrid.innerHTML = '';

    allVariations.forEach((v, i) => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.style.animationDelay = `${i * 150}ms`;

        card.innerHTML = `
      <div class="preview-header">
        <span class="preview-number">Opção ${i + 1}</span>
        <h3 class="preview-title">${esc(v.title || `Variação ${i + 1}`)}</h3>
        <p class="preview-desc">${esc(v.description || '')}</p>
      </div>
      <div class="preview-frame-container">
        <iframe class="preview-frame" sandbox="allow-scripts"></iframe>
        <div class="preview-overlay">
          <span>Clique para expandir</span>
        </div>
      </div>
      <div class="preview-actions">
        <button class="btn-action btn-copy" title="Copiar código">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copiar
        </button>
        <button class="btn-action btn-download" title="Baixar HTML">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Baixar
        </button>
        <button class="btn-action btn-refine" title="Refinar design">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Refinar
        </button>
        <button class="btn-action btn-gen-img" title="Gerar imagem com IA">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          Gerar Imagem
        </button>
      </div>
      <div class="preview-images"></div>
    `;

        // Set iframe srcdoc via JS to avoid escaping issues
        const iframe = card.querySelector('.preview-frame');
        iframe.srcdoc = v.html;

        // Event listeners
        card.querySelector('.preview-overlay').addEventListener('click', () => openFullscreen(i));
        card.querySelector('.btn-copy').addEventListener('click', () => copyCode(i));
        card.querySelector('.btn-download').addEventListener('click', () => downloadCode(i));
        card.querySelector('.btn-refine').addEventListener('click', () => showRefine(i));
        card.querySelector('.btn-gen-img').addEventListener('click', (e) => genImage(i, e.currentTarget, card));

        previewsGrid.appendChild(card);
    });
}

// ============= Actions =============
function copyCode(index) {
    const html = allVariations[index]?.html;
    if (!html) return;

    navigator.clipboard.writeText(html)
        .then(() => showToast('Código copiado!'))
        .catch(() => {
            const ta = document.createElement('textarea');
            ta.value = html;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Código copiado!');
        });
}

function downloadCode(index) {
    const v = allVariations[index];
    if (!v) return;

    const blob = new Blob([v.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(v.title || `design-${index + 1}`).replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download iniciado!');
}

async function genImage(index, btn, card) {
    const v = allVariations[index];
    if (!v) return;

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner-sm"></span> Gerando...`;

    try {
        const prompt = buildImagePrompt(v.title, v.description, currentInput);
        const result = await generateImage(prompt);

        const imagesContainer = card.querySelector('.preview-images');
        imagesContainer.innerHTML = '';

        result.images.forEach((img, imgIdx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'generated-image-wrapper';
            wrapper.innerHTML = `
                <img src="data:${img.mimeType};base64,${img.data}" alt="Imagem gerada" class="generated-image" />
                <div class="generated-image-actions">
                    <button class="btn-action btn-download-img" title="Baixar imagem">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Baixar Imagem
                    </button>
                </div>
            `;

            wrapper.querySelector('.btn-download-img').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = `data:${img.mimeType};base64,${img.data}`;
                a.download = `${(v.title || `design-${index + 1}`).replace(/\s+/g, '-').toLowerCase()}-img-${imgIdx + 1}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast('Download da imagem iniciado!');
            });

            imagesContainer.appendChild(wrapper);
        });

        showToast('Imagem gerada com sucesso!');
    } catch (error) {
        console.error('[NanoBanana] genImage Error:', error);
        showToast(`Erro ao gerar imagem: ${error.message}`, true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function showRefine(index) {
    refiningIndex = index;
    const v = allVariations[index];
    const iframe = document.createElement('iframe');
    iframe.className = 'refine-frame';
    iframe.sandbox = 'allow-scripts';
    iframe.srcdoc = v.html;
    refinePreview.innerHTML = '';
    refinePreview.appendChild(iframe);
    refineInput.value = '';
    refinePanel.classList.remove('hidden');
    setTimeout(() => {
        refinePanel.scrollIntoView({ behavior: 'smooth' });
        refineInput.focus();
    }, 100);
}

function hideRefine() {
    refinePanel.classList.add('hidden');
    refiningIndex = -1;
    refineInput.value = '';
}

let closeTimer = null;

function openFullscreen(index) {
    const v = allVariations[index];
    if (!v) return;

    // Cancel any pending close timeout
    if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
    }

    fullscreenTitle.textContent = v.title || `Variação ${index + 1}`;

    // Create a fresh iframe to avoid browser caching issues
    const container = fullscreenFrame.parentElement;
    const oldFrame = fullscreenFrame;
    const newFrame = document.createElement('iframe');
    newFrame.id = 'fullscreen-frame';
    newFrame.className = 'fullscreen-frame';
    newFrame.sandbox = 'allow-scripts';
    container.replaceChild(newFrame, oldFrame);

    // Update the reference
    fullscreenFrame = newFrame;

    // Set content and show
    fullscreenModal.classList.remove('hidden');
    // Small delay to ensure DOM is ready before setting srcdoc
    requestAnimationFrame(() => {
        newFrame.srcdoc = v.html;
        fullscreenModal.classList.add('visible');
    });
}

function closeFullscreen() {
    fullscreenModal.classList.remove('visible');
    closeTimer = setTimeout(() => {
        fullscreenModal.classList.add('hidden');
        fullscreenFrame.srcdoc = '';
        closeTimer = null;
    }, 300);
}

// ============= Helpers =============
function showLoading(msg) {
    loadingText.textContent = msg;
    loadingEl.classList.remove('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

let toastTimer;
function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    toastMsg.textContent = message;
    toastEl.classList.remove('hidden', 'error', 'visible');
    if (isError) toastEl.classList.add('error');
    requestAnimationFrame(() => toastEl.classList.add('visible'));
    toastTimer = setTimeout(() => {
        toastEl.classList.remove('visible');
        setTimeout(() => toastEl.classList.add('hidden'), 300);
    }, 3000);
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
