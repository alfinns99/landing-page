/* ============================================
   KALKULATOR RASIO FO - JAVASCRIPT
   Fiber Optic Ratio Calculator Logic
   ============================================ */

// --- TABEL LOSS RASIO ---
const tableLoss = {
    "1": 20.0, "2": 16.99, "3": 15.23, "4": 13.98, "5": 13.01,
    "6": 12.22, "7": 11.55, "8": 10.97, "9": 10.46, "10": 10.0,
    "11": 9.59, "12": 9.21, "13": 8.86, "14": 8.54, "15": 8.24,
    "16": 7.96, "17": 7.7, "18": 7.45, "19": 7.21, "20": 6.99,
    "21": 6.78, "22": 6.58, "23": 6.38, "24": 6.2, "25": 6.02,
    "26": 5.85, "27": 5.69, "28": 5.53, "29": 5.38, "30": 5.23,
    "31": 5.09, "32": 4.95, "33": 4.81, "34": 4.69, "35": 4.56,
    "36": 4.44, "37": 4.32, "38": 4.2, "39": 4.09, "40": 3.98,
    "41": 3.87, "42": 3.77, "43": 3.67, "44": 3.57, "45": 3.47,
    "46": 3.37, "47": 3.28, "48": 3.19, "49": 3.1, "50": 3.01
};

// --- SETUP AWAL ---
let globalSisa = 0;

// Populate Ratio Select Options
function populateRatioOptions() {
    const selectRatio = document.getElementById('ratioPersen');
    for (let i = 1; i <= 50; i++) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = i + " : " + (100 - i);
        selectRatio.appendChild(opt);
    }
}

// Populate PLC Splitter Options
function populatePLCOptions() {
    const plcOptions = `
        <option value="0">Tanpa PLC</option>
        <option value="3.5">1:2</option>
        <option value="7.2">1:4</option>
        <option value="10.5">1:8</option>
        <option value="13.8">1:16</option>
    `;
    document.querySelectorAll('.plc-opt').forEach(sel => {
        if (sel.id !== 't1') {
            sel.innerHTML = plcOptions;
        } else {
            sel.innerHTML = `<option value="0">Pilih Splitter...</option>` + plcOptions.replace('<option value="0">Tanpa PLC</option>', '');
        }
    });
}

// --- TOGGLE MODE ---
function toggleMode() {
    const mode = document.getElementById('calcMode').value;
    document.getElementById('ilustrasiContainer').style.display = 'none';

    if (mode === 'standar') {
        document.getElementById('groupStandar').style.display = 'block';
        document.getElementById('groupBercabang').style.display = 'none';
        document.getElementById('resultStandar').style.display = 'block';
        document.getElementById('resultBercabang').style.display = 'none';
        document.getElementById('rowSisa').style.display = 'none';
    } else {
        document.getElementById('groupStandar').style.display = 'none';
        document.getElementById('groupBercabang').style.display = 'block';
        document.getElementById('resultStandar').style.display = 'none';
        document.getElementById('resultBercabang').style.display = 'block';
    }
}

// --- UTILITAS ---
function getSplitterInfo(val) {
    if (val === 3.5) return { name: "1:2" };
    if (val === 7.2) return { name: "1:4" };
    if (val === 10.5) return { name: "1:8" };
    if (val === 13.8) return { name: "1:16" };
    return { name: "Unknown" };
}

function getStatusClass(val) {
    if (val > -10.00) return 'color-terlalubagus';
    if (val >= -22.00 && val <= -10.00) return 'color-bagus';
    if (val >= -25.00 && val < -22.00) return 'color-lumayan';
    return 'color-kritis';
}

function getBorderColor(val) {
    if (val > -10.00) return '#5b8def';
    if (val >= -22.00 && val <= -10.00) return '#2ecc71';
    if (val >= -25.00 && val < -22.00) return '#f1c40f';
    return '#e74c3c';
}

function formatPowerList(power, isRaw = false) {
    if (isRaw) return power.toFixed(2);
    return (power > 0 ? "+" : "") + power.toFixed(2) + " dBm";
}

// --- STRUKTUR DATA POHON DINAMIS ---
function buildDataTree(inputPower, lossExtra, t1, t2_1, t2_2, t2_3, t3_1, t3_2, t3_3, t4_1, t4_2, t4_3) {
    let losesStage = lossExtra / 4;
    let root = { name: "Input", pOut: inputPower, children: [], isTraced: true };
    let pFiber = inputPower - losesStage;
    let fiberNode = { name: "Fiber", pOut: pFiber, children: [], isTraced: true };
    root.children.push(fiberNode);

    if (t1 > 0) {
        let info1 = getSplitterInfo(t1);
        let p1 = pFiber - t1 - losesStage;
        let t1Node = { name: `ODC 1 (${info1.name})`, pOut: p1, children: [], isTraced: true };
        fiberNode.children.push(t1Node);

        // TAHAP 2
        if (t2_1 > 0) {
            let info2 = getSplitterInfo(t2_1);
            let p2 = p1 - t2_1 - losesStage;
            let t2_1Node = { name: `ODC 2.1 (${info2.name})`, pOut: p2, children: [], isTraced: true };
            t1Node.children.push(t2_1Node);

            // TAHAP 3
            if (t3_1 > 0) {
                let info3 = getSplitterInfo(t3_1);
                let p3 = p2 - t3_1 - losesStage;
                let t3_1Node = { name: `ODC 3.1 (${info3.name})`, pOut: p3, children: [], isTraced: true };
                t2_1Node.children.push(t3_1Node);

                // TAHAP 4
                if (t4_1 > 0) t3_1Node.children.push({ name: `ODC 4.1 (${getSplitterInfo(t4_1).name})`, pOut: p3 - t4_1 - losesStage, children: [], isTraced: true });
                if (t4_2 > 0) t3_1Node.children.push({ name: `ODC 4.2 (${getSplitterInfo(t4_2).name})`, pOut: p3 - t4_2 - losesStage, children: [], isTraced: false });
                if (t4_3 > 0) t3_1Node.children.push({ name: `ODC 4.3 (${getSplitterInfo(t4_3).name})`, pOut: p3 - t4_3 - losesStage, children: [], isTraced: false });
            }

            if (t3_2 > 0) t2_1Node.children.push({ name: `ODC 3.2 (${getSplitterInfo(t3_2).name})`, pOut: p2 - t3_2 - losesStage, children: [], isTraced: false });
            if (t3_3 > 0) t2_1Node.children.push({ name: `ODC 3.3 (${getSplitterInfo(t3_3).name})`, pOut: p2 - t3_3 - losesStage, children: [], isTraced: false });
        }

        if (t2_2 > 0) t1Node.children.push({ name: `ODC 2.2 (${getSplitterInfo(t2_2).name})`, pOut: p1 - t2_2 - losesStage, children: [], isTraced: false });
        if (t2_3 > 0) t1Node.children.push({ name: `ODC 2.3 (${getSplitterInfo(t2_3).name})`, pOut: p1 - t2_3 - losesStage, children: [], isTraced: false });
    }
    return root;
}

// --- HTML RENDERER ---
function buildNodeHTML(label, power, isTraced) {
    let textClass = getStatusClass(power);
    let borderCol = getBorderColor(power);
    let boxStyle = isTraced
        ? `background: #e8f0fe; border: 2px solid ${borderCol}; box-shadow: 0 2px 8px rgba(59,130,246,0.15); border-left: 6px solid ${borderCol};`
        : `border: 2px solid transparent; border-left: 5px solid ${borderCol};`;

    return `<div class="tree-node" style="${boxStyle}">
        <span class="tree-label" style="${isTraced ? 'color:#1e293b; font-weight:800;' : ''}">${label}</span>
        <span class="tree-val ${textClass}">${formatPowerList(power)}</span>
    </div>`;
}

function generateHTMLFromTree(node, isRoot = true) {
    if (isRoot) {
        let t1Node = node.children[0]?.children[0];
        if (!t1Node) return `<div style="text-align:center; color:#5c5c72; font-size:12px; padding: 20px;">Pilih Splitter Utama (ODC 1) terlebih dahulu.</div>`;
        return generateHTMLFromTree(t1Node, false);
    }
    let html = buildNodeHTML(node.name, node.pOut, node.isTraced);
    if (node.children && node.children.length > 0) {
        let branchHtml = "";
        for (let child of node.children) branchHtml += generateHTMLFromTree(child, false);
        html += `<div class="tree-branch">${branchHtml}</div>`;
    }
    return html;
}

// --- SVG RENDERER ---
let currentSvgY = 20;
let svgBoxes = "";
let svgLines = "";
let maxSvgX = 0;

function addBox(x, y, title, value, color, isTraced) {
    let strokeColor = isTraced ? "#fff" : "rgba(255,255,255,0.2)";
    let strokeWidth = isTraced ? "3" : "1.5";
    let titleColor = isTraced ? "#fff" : "#9a9ab0";

    return `
        <g transform="translate(${x}, ${y})">
            <text x="40" y="-8" text-anchor="middle" font-size="11" font-family="'Inter', 'Segoe UI', Arial" font-weight="bold" fill="${titleColor}">${title}</text>
            <rect x="0" y="0" width="80" height="32" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="6"/>
            <text x="40" y="21" text-anchor="middle" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#fff">${value}</text>
        </g>
    `;
}

function connectCoords(x1, y1, x2, y2, isTraced) {
    let strokeColor = isTraced ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.15)";
    let strokeWidth = isTraced ? "2.5" : "1.5";
    let dash = isTraced ? "" : `stroke-dasharray="4"`;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dash}/>`;
}

function generateSVGFromTree(node, x) {
    if (x > maxSvgX) maxSvgX = x;

    if (!node.children || node.children.length === 0) {
        let y = currentSvgY;
        let isRaw = node.name === "Input" || node.name === "Fiber";
        svgBoxes += addBox(x, y, node.name, formatPowerList(node.pOut, isRaw), getBorderColor(node.pOut), node.isTraced);
        currentSvgY += 60;
        return y;
    }

    let childrenY = [];
    for (let child of node.children) {
        let cy = generateSVGFromTree(child, x + 140);
        childrenY.push({ y: cy, isTraced: child.isTraced });
    }

    let myY = (childrenY[0].y + childrenY[childrenY.length - 1].y) / 2;
    let isRaw = node.name === "Input" || node.name === "Fiber";
    let color = isRaw ? '#5b8def' : getBorderColor(node.pOut);

    svgBoxes += addBox(x, myY, node.name, formatPowerList(node.pOut, isRaw), color, node.isTraced);

    for (let child of childrenY) {
        svgLines += connectCoords(x + 80, myY + 16, x + 140, child.y + 16, child.isTraced);
    }

    return myY;
}

// --- ZOOM & PAN SVG ---
let currentScale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;

function applyZoom() {
    const group = document.getElementById('zoomGroup');
    if (group) group.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${currentScale})`);
}

function zoomSvg(delta) {
    currentScale += delta;
    if (currentScale < 0.3) currentScale = 0.3;
    if (currentScale > 3.0) currentScale = 3.0;
    applyZoom();
}

function resetZoom() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    applyZoom();
}

function setupZoomPan() {
    const wrapper = document.getElementById('svgWrapper');

    // Desktop Mouse Events
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        let delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoomSvg(delta);
    });

    wrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyZoom();
    });

    wrapper.addEventListener('mouseup', () => { isDragging = false; });
    wrapper.addEventListener('mouseleave', () => { isDragging = false; });

    // Mobile Touch Events
    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
    }, { passive: false });

    wrapper.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        if (e.touches.length === 1) {
            e.preventDefault();
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            applyZoom();
        }
    }, { passive: false });

    wrapper.addEventListener('touchend', () => { isDragging = false; });
    wrapper.addEventListener('touchcancel', () => { isDragging = false; });
}

// --- UPDATE STATUS ---
function updateStatus(val) {
    const resODP = document.getElementById('resODP');
    const statusODP = document.getElementById('statusODP');

    if (val > -10.00) {
        resODP.className = "dbm-val color-terlalubagus";
        statusODP.innerText = "Terlalu Bagus";
        statusODP.className = "status-text color-terlalubagus";
    } else if (val >= -22.00 && val <= -10.00) {
        resODP.className = "dbm-val color-bagus";
        statusODP.innerText = "Redaman Bagus";
        statusODP.className = "status-text color-bagus";
    } else if (val >= -25.00 && val < -22.00) {
        resODP.className = "dbm-val color-lumayan";
        statusODP.innerText = "Redaman Lumayan";
        statusODP.className = "status-text color-lumayan";
    } else {
        resODP.className = "dbm-val color-kritis";
        statusODP.innerText = "Redaman Kritis";
        statusODP.className = "status-text color-kritis";
    }
}

// --- TEMPEL KE INPUT ---
function tempelInput() {
    document.getElementById('inputLaser').value = globalSisa.toFixed(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- KALKULASI UTAMA ---
function hitung() {
    const inputVal = document.getElementById('inputLaser').value;
    if (inputVal === "") {
        alert("Harap masukkan nilai Input Laser!");
        return;
    }

    const input = parseFloat(inputVal);
    const lossExtra = parseFloat(document.getElementById('extraLoss').value) || 0;
    const mode = document.getElementById('calcMode').value;
    resetZoom();

    if (mode === 'standar') {
        const ratioKey = document.getElementById('ratioPersen').value;
        const lossPasif = parseFloat(document.getElementById('pasifSplitter').value);
        const resODP = document.getElementById('resODP');
        const rowSisa = document.getElementById('rowSisa');

        let lossKecil = (ratioKey === "0") ? 0 : tableLoss[ratioKey];
        let totalODP = input - lossKecil - lossPasif - lossExtra;
        resODP.innerText = formatPowerList(totalODP);
        updateStatus(totalODP);

        if (ratioKey === "0") {
            rowSisa.style.display = "none";
        } else {
            rowSisa.style.display = "flex";
            const ratioBesarPercent = 100 - parseInt(ratioKey);
            const lossBesarInternal = -10 * Math.log10(ratioBesarPercent / 100);
            globalSisa = input - lossBesarInternal - lossExtra;
            document.getElementById('resSisa').innerText = globalSisa.toFixed(2);
        }

        // SVG Manual Standar
        currentSvgY = 25; svgBoxes = ""; svgLines = ""; maxSvgX = 0;
        let root = { name: "Input", pOut: input, children: [], isTraced: true };
        let fOut = input - lossExtra;
        let fiber = { name: "Fiber", pOut: fOut, children: [], isTraced: true };
        root.children.push(fiber);
        let cur = fiber;

        if (lossKecil > 0) {
            let rOut = fOut - lossKecil;
            let ratioLabel = `${ratioKey}:${100 - parseInt(ratioKey)}`;
            let ratioNode = { name: `FBT ${ratioLabel}`, pOut: rOut, children: [], isTraced: true };
            cur.children.push(ratioNode);
            cur = ratioNode;
        }
        if (lossPasif > 0 || (lossPasif === 0 && lossKecil === 0)) {
            let pasifName = lossPasif > 0 ? `ODP ${getSplitterInfo(lossPasif).name}` : "ODP";
            let odpNode = { name: pasifName, pOut: cur.pOut - lossPasif, children: [], isTraced: true };
            cur.children.push(odpNode);
        }

        generateSVGFromTree(root, 20);
        let canvas = document.getElementById('svgCanvas');
        canvas.innerHTML = `<g id="zoomGroup" transform="translate(0,0) scale(1)">${svgLines}${svgBoxes}</g>`;
        document.getElementById('ilustrasiContainer').style.display = 'block';

    } else if (mode === 'bercabang') {
        let t1 = parseFloat(document.getElementById('t1').value);
        let t2_1 = parseFloat(document.getElementById('t2_1').value), t2_2 = parseFloat(document.getElementById('t2_2').value), t2_3 = parseFloat(document.getElementById('t2_3').value);
        let t3_1 = parseFloat(document.getElementById('t3_1').value), t3_2 = parseFloat(document.getElementById('t3_2').value), t3_3 = parseFloat(document.getElementById('t3_3').value);
        let t4_1 = parseFloat(document.getElementById('t4_1').value), t4_2 = parseFloat(document.getElementById('t4_2').value), t4_3 = parseFloat(document.getElementById('t4_3').value);

        // Buat Struktur Data Dinamis
        let treeData = buildDataTree(input, lossExtra, t1, t2_1, t2_2, t2_3, t3_1, t3_2, t3_3, t4_1, t4_2, t4_3);

        // Generate HTML Teks
        let htmlOutput = generateHTMLFromTree(treeData);
        document.getElementById('multiStageResult').innerHTML = htmlOutput;

        // Generate SVG Interaktif
        currentSvgY = 30; svgBoxes = ""; svgLines = ""; maxSvgX = 0;
        if (t1 > 0) {
            generateSVGFromTree(treeData, 20);
            let canvas = document.getElementById('svgCanvas');
            canvas.innerHTML = `<g id="zoomGroup" transform="translate(0,0) scale(1)">${svgLines}${svgBoxes}</g>`;
            document.getElementById('ilustrasiContainer').style.display = 'block';
        } else {
            document.getElementById('ilustrasiContainer').style.display = 'none';
        }
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    populateRatioOptions();
    populatePLCOptions();
    setupZoomPan();
    toggleMode();
});
