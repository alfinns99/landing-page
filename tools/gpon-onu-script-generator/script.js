/* ============================================
   GPON ONU SCRIPT GENERATOR - JAVASCRIPT
   Single + Batch Mode Support
   ============================================ */

let modemType = 'zte';
let currentMode = 'single'; // 'single' or 'batch'
let batchRowCounter = 0;

function v(id) {
    return document.getElementById(id).value.trim();
}

function iface() {
    return `${v('shelf') || '1'}/${v('slot') || '1'}/${v('port') || '1'}`;
}

function updatePreview() {
    document.getElementById('iface-hint').textContent = 'gpon-olt_' + iface();
}

// Attach live preview listeners
['shelf', 'slot', 'port'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
});

/* ============================================
   MODE SWITCHING
   ============================================ */
function switchMode(mode) {
    currentMode = mode;
    document.getElementById('tab-single').classList.toggle('active', mode === 'single');
    document.getElementById('tab-batch').classList.toggle('active', mode === 'batch');
    document.getElementById('single-mode').style.display = mode === 'single' ? '' : 'none';
    document.getElementById('batch-mode').style.display = mode === 'batch' ? '' : 'none';
    document.getElementById('single-onu-num').style.display = mode === 'single' ? '' : 'none';
    document.getElementById('single-svcport').style.display = mode === 'single' ? '' : 'none';

    // PPPoE section: show in single+zte, hide in batch (batch has inline pppoe)
    updatePppoeVisibility();

    // Generate button text
    const btn = document.getElementById('btn-main-generate');
    if (mode === 'batch') {
        btn.innerHTML = '<i class="bi bi-stack"></i> Generate Batch Script';
        // Initialize batch table if empty
        if (document.getElementById('batch-body').children.length === 0) {
            addBatchRow();
        }
    } else {
        btn.innerHTML = '<i class="bi bi-terminal"></i> Generate Script';
    }

    // Reset output
    document.getElementById('output-area').innerHTML = '<div class="output-empty"><i class="bi bi-terminal"></i>Isi parameter di atas lalu klik Generate Script</div>';
}

function updatePppoeVisibility() {
    const pppoeSection = document.getElementById('pppoe-section');
    // In single mode: show if ZTE; In batch mode: always hide (PPPoE is per-row)
    if (currentMode === 'batch') {
        pppoeSection.style.display = 'none';
    } else {
        pppoeSection.style.display = modemType === 'zte' ? '' : 'none';
    }

    // In batch mode, show/hide PPPoE columns
    if (currentMode === 'batch') {
        const show = modemType === 'zte';
        document.querySelectorAll('.th-pppoe').forEach(el => el.style.display = show ? '' : 'none');
        document.querySelectorAll('.td-pppoe').forEach(el => el.style.display = show ? '' : 'none');
    }
}

/* ============================================
   MODEM TYPE
   ============================================ */
function setType(t) {
    modemType = t;
    document.getElementById('type-zte').classList.toggle('active', t === 'zte');
    document.getElementById('type-nonzte').classList.toggle('active', t === 'nonzte');
    updatePppoeVisibility();
}

/* ============================================
   BATCH TABLE MANAGEMENT
   ============================================ */
function getNextOnuNum() {
    const rows = document.querySelectorAll('#batch-body tr');
    if (rows.length === 0) return 1;
    let max = 0;
    rows.forEach(row => {
        const val = parseInt(row.querySelector('.b-onu').value) || 0;
        if (val > max) max = val;
    });
    return max + 1;
}

function addBatchRow(onuNum, sn, name, pUser, pPass) {
    batchRowCounter++;
    const num = onuNum || getNextOnuNum();
    const tbody = document.getElementById('batch-body');
    const tr = document.createElement('tr');
    tr.dataset.id = batchRowCounter;
    const showPppoe = modemType === 'zte' ? '' : 'display:none;';

    tr.innerHTML = `
        <td class="td-num">${tbody.children.length + 1}</td>
        <td><input type="number" class="b-onu" value="${num}" min="1" max="128"></td>
        <td><input type="text" class="b-sn" value="${sn || ''}" placeholder="ZTEGXXXXXXXX" maxlength="16" style="text-transform:uppercase"></td>
        <td><input type="text" class="b-name" value="${name || ''}" placeholder="Nama pelanggan"></td>
        <td class="td-pppoe" style="${showPppoe}"><input type="text" class="b-puser" value="${pUser || ''}" placeholder="user@isp"></td>
        <td class="td-pppoe" style="${showPppoe}"><input type="text" class="b-ppass" value="${pPass || ''}" placeholder="password"></td>
        <td><button class="btn-remove-row" onclick="removeBatchRow(this)" title="Hapus baris"><i class="bi bi-x-lg"></i></button></td>
    `;
    tbody.appendChild(tr);
    updateBatchCount();
}

function addBatchRows() {
    for (let i = 0; i < 5; i++) {
        addBatchRow();
    }
}

function removeBatchRow(btn) {
    const tbody = document.getElementById('batch-body');
    if (tbody.children.length <= 1) {
        alert('Minimal 1 baris ONU harus ada');
        return;
    }
    btn.closest('tr').remove();
    // Re-number rows
    Array.from(tbody.children).forEach((tr, i) => {
        tr.querySelector('.td-num').textContent = i + 1;
    });
    updateBatchCount();
}

function updateBatchCount() {
    const count = document.getElementById('batch-body').children.length;
    document.getElementById('batch-count').textContent = `${count} ONU`;
}

/* ============================================
   COPY SCRIPT
   ============================================ */
function copyScript(id, btn) {
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text).then(() => {
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Tersalin';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = origHTML;
            btn.classList.remove('copied');
        }, 1500);
    });
}

function copyAll(btn) {
    const blocks = document.querySelectorAll('#output-area pre');
    let allText = '';
    blocks.forEach(pre => { allText += pre.textContent + '\n\n'; });
    navigator.clipboard.writeText(allText.trim()).then(() => {
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Semua Tersalin';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = origHTML;
            btn.classList.remove('copied');
        }, 1500);
    });
}

/* ============================================
   BUILD SINGLE ONU SCRIPT
   ============================================ */
function buildOnuScript(params) {
    const { ifStr, onuNum, sn, name, tcont, profile, gemport, cos, svcport, vport, userVlan, uplinkVlan, pUser, pPass, vlanProfile, hostIdx } = params;

    const oltIf = `gpon-olt_${ifStr}`;
    const onuIf = `gpon-onu_${ifStr}:${onuNum}`;
    const mngIf = `pon-onu-mng ${onuIf}`;

    const deleteScript =
`conf t
interface ${oltIf}
no onu ${onuNum}
exit`;

    let configScript = '';

    if (modemType === 'zte') {
        const vp = vlanProfile || `VLAN-${uplinkVlan}`;
        const hi = hostIdx || '1';
        configScript =
`conf t
interface ${oltIf}
onu ${onuNum} type ALL-ONT sn ${sn}
!
interface ${onuIf}
name ${name}
tcont ${tcont} name ${name} profile ${profile}
gemport ${gemport} name ${name} tcont ${tcont}
service-port ${svcport} vport ${vport} user-vlan ${userVlan} vlan ${uplinkVlan}
!
${mngIf}
service pppoe gemport ${gemport} cos ${cos} vlan ${uplinkVlan}
wan-ip 1 mode pppoe username ${pUser} password ${pPass} vlan-profile ${vp} host ${hi}
wan-ip 1 ping-response enable traceroute-response enable
security-mgmt 212 state enable mode forward protocol web
!
exit
wr
!`;
    } else {
        configScript =
`conf t
interface ${oltIf}
onu ${onuNum} type ALL-ONT sn ${sn}
!
interface ${onuIf}
name ${name}
sn-bind enable sn
tcont ${tcont} name ${name} profile ${profile}
gemport ${gemport} name ${name} tcont ${tcont}
service-port ${svcport} vport ${vport} user-vlan ${userVlan} vlan ${uplinkVlan}
!
${mngIf}
service pppoe gemport ${gemport} cos ${cos} vlan ${uplinkVlan}
vlan port veip_1 mode hybrid
exit
exit`;
    }

    return { deleteScript, configScript, oltIf, onuNum, sn };
}

/* ============================================
   GENERATE (main dispatch)
   ============================================ */
function generate() {
    if (currentMode === 'batch') {
        generateBatch();
    } else {
        generateSingle();
    }
}

/* ============================================
   GENERATE SINGLE
   ============================================ */
function generateSingle() {
    const ifStr = iface();
    const onuNum = v('onu-num');
    const sn = v('sn').toUpperCase();
    const name = v('onu-name').toUpperCase();
    const tcont = v('tcont') || '1';
    const profile = v('profile') || 'server';
    const gemport = v('gemport') || '1';
    const cos = v('cos') || '0';
    const svcport = v('svcport') || '1';
    const vport = v('vport') || '1';
    const userVlan = v('user-vlan') || '577';
    const uplinkVlan = v('uplink-vlan') || '577';

    if (!onuNum) { alert('Nomor ONU wajib diisi'); return; }
    if (!sn) { alert('Serial Number (SN) wajib diisi'); return; }
    if (!name) { alert('Nama ONU/Pelanggan wajib diisi'); return; }

    let pUser = '', pPass = '', vlanProfile = '', hostIdx = '1';
    if (modemType === 'zte') {
        pUser = v('pppoe-user');
        pPass = v('pppoe-pass');
        if (!pUser || !pPass) { alert('Username dan Password PPPoE wajib diisi untuk modem ZTE'); return; }
        vlanProfile = v('vlan-profile');
        hostIdx = v('host-idx') || '1';
    }

    const result = buildOnuScript({ ifStr, onuNum, sn, name, tcont, profile, gemport, cos, svcport, vport, userVlan, uplinkVlan, pUser, pPass, vlanProfile, hostIdx });

    const chips = [
        result.oltIf,
        `ONU #${onuNum}`,
        `SN: ${sn}`,
        `T-CONT ${tcont}`,
        `GEM ${gemport}`,
        `SvcPort ${svcport}`,
        `VPort ${vport}`,
        `VLAN ${userVlan}→${uplinkVlan}`,
        modemType === 'zte' ? 'ZTE PPPoE' : 'Non-ZTE Bridge'
    ].map(c => `<span class="meta-chip">${c}</span>`).join('');

    document.getElementById('output-area').innerHTML = `
<div class="meta-bar">${chips}</div>

<div class="out-block">
  <div class="out-header">
    <div class="out-title">
      <i class="bi bi-trash3"></i>
      Hapus ONU (jika sudah terdaftar)
      <span class="tag tag-del">DELETE</span>
    </div>
    <button class="copy-btn" onclick="copyScript('del-script',this)"><i class="bi bi-clipboard"></i> Salin</button>
  </div>
  <pre id="del-script">${result.deleteScript}</pre>
</div>

<div class="out-block">
  <div class="out-header">
    <div class="out-title">
      <i class="bi bi-gear"></i>
      Konfigurasi ONU — ${modemType === 'zte' ? 'ZTE / PPPoE' : 'Non-ZTE / Bridge'}
      <span class="tag tag-cfg">CONFIG</span>
    </div>
    <button class="copy-btn" onclick="copyScript('cfg-script',this)"><i class="bi bi-clipboard"></i> Salin</button>
  </div>
  <pre id="cfg-script">${result.configScript}</pre>
</div>`;
}

/* ============================================
   GENERATE BATCH
   ============================================ */
function generateBatch() {
    const ifStr = iface();
    const tcont = v('tcont') || '1';
    const profile = v('profile') || 'server';
    const gemport = v('gemport') || '1';
    const cos = v('cos') || '0';
    const vport = v('vport') || '1';
    const userVlan = v('user-vlan') || '577';
    const uplinkVlan = v('uplink-vlan') || '577';
    const vlanProfile = modemType === 'zte' ? (v('vlan-profile') || '') : '';
    const hostIdx = modemType === 'zte' ? (v('host-idx') || '1') : '1';

    const rows = document.querySelectorAll('#batch-body tr');
    if (rows.length === 0) { alert('Tambahkan minimal 1 ONU'); return; }

    // Validate all rows
    const entries = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const onuNum = row.querySelector('.b-onu').value.trim();
        const sn = row.querySelector('.b-sn').value.trim().toUpperCase();
        const name = row.querySelector('.b-name').value.trim().toUpperCase();

        if (!onuNum) { alert(`Baris ${i + 1}: Nomor ONU wajib diisi`); return; }
        if (!sn) { alert(`Baris ${i + 1}: Serial Number wajib diisi`); return; }
        if (!name) { alert(`Baris ${i + 1}: Nama pelanggan wajib diisi`); return; }

        let pUser = '', pPass = '';
        if (modemType === 'zte') {
            pUser = row.querySelector('.b-puser').value.trim();
            pPass = row.querySelector('.b-ppass').value.trim();
            if (!pUser || !pPass) { alert(`Baris ${i + 1}: Username dan Password PPPoE wajib diisi`); return; }
        }

        entries.push({ onuNum, sn, name, pUser, pPass, svcport: onuNum });
    }

    // Build all scripts
    let allDelete = `conf t\ninterface gpon-olt_${ifStr}`;
    entries.forEach(e => {
        allDelete += `\nno onu ${e.onuNum}`;
    });
    allDelete += `\nexit`;

    let allConfig = '';
    entries.forEach((e, idx) => {
        const result = buildOnuScript({
            ifStr, onuNum: e.onuNum, sn: e.sn, name: e.name,
            tcont, profile, gemport, cos,
            svcport: e.svcport, vport, userVlan, uplinkVlan,
            pUser: e.pUser, pPass: e.pPass,
            vlanProfile, hostIdx
        });
        allConfig += result.configScript;
        if (idx < entries.length - 1) allConfig += '\n\n';
    });

    // Summary chips
    const chips = [
        `gpon-olt_${ifStr}`,
        `${entries.length} ONU`,
        `VLAN ${userVlan}→${uplinkVlan}`,
        modemType === 'zte' ? 'ZTE PPPoE' : 'Non-ZTE Bridge',
        'BATCH MODE'
    ].map(c => `<span class="meta-chip">${c}</span>`).join('');

    // ONU list summary
    const onuList = entries.map(e =>
        `<span class="meta-chip">ONU #${e.onuNum} — ${e.sn}</span>`
    ).join('');

    document.getElementById('output-area').innerHTML = `
<div class="meta-bar">${chips}</div>
<div class="meta-bar" style="margin-bottom:16px">${onuList}</div>

<div class="batch-copy-all">
    <button class="btn-generate" style="margin:0;padding:12px 20px;font-size:12px;letter-spacing:1px;" onclick="copyAll(this)">
        <i class="bi bi-clipboard2-check"></i> Salin Semua Script
    </button>
</div>

<div class="out-block">
  <div class="out-header">
    <div class="out-title">
      <i class="bi bi-trash3"></i>
      Hapus Semua ONU (${entries.length} unit)
      <span class="tag tag-del">DELETE</span>
    </div>
    <button class="copy-btn" onclick="copyScript('batch-del',this)"><i class="bi bi-clipboard"></i> Salin</button>
  </div>
  <pre id="batch-del">${allDelete}</pre>
</div>

<div class="out-block">
  <div class="out-header">
    <div class="out-title">
      <i class="bi bi-gear"></i>
      Konfigurasi Batch (${entries.length} ONU) — ${modemType === 'zte' ? 'ZTE / PPPoE' : 'Non-ZTE / Bridge'}
      <span class="tag tag-cfg">CONFIG</span>
    </div>
    <button class="copy-btn" onclick="copyScript('batch-cfg',this)"><i class="bi bi-clipboard"></i> Salin</button>
  </div>
  <pre id="batch-cfg">${allConfig}</pre>
</div>`;
}

/* ============================================
   CLEAR / RESET
   ============================================ */
function clearForm() {
    document.getElementById('shelf').value = '1';
    document.getElementById('slot').value = '1';
    document.getElementById('port').value = '9';
    document.getElementById('onu-num').value = '1';
    document.getElementById('sn').value = '';
    document.getElementById('onu-name').value = '';
    document.getElementById('tcont').value = '1';
    document.getElementById('profile').value = 'server';
    document.getElementById('gemport').value = '1';
    document.getElementById('cos').value = '0';
    document.getElementById('svcport').value = '1';
    document.getElementById('vport').value = '1';
    document.getElementById('user-vlan').value = '577';
    document.getElementById('uplink-vlan').value = '577';
    document.getElementById('pppoe-user').value = '';
    document.getElementById('pppoe-pass').value = '';
    document.getElementById('vlan-profile').value = '';
    document.getElementById('host-idx').value = '1';
    setType('zte');
    updatePreview();

    // Reset batch table
    batchRowCounter = 0;
    document.getElementById('batch-body').innerHTML = '';
    if (currentMode === 'batch') {
        addBatchRow();
    }

    document.getElementById('output-area').innerHTML = '<div class="output-empty"><i class="bi bi-terminal"></i>Isi parameter di atas lalu klik Generate Script</div>';
}
