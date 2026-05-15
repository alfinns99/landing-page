/* ============================================
   KALKULATOR BURST LIMIT - JAVASCRIPT
   MikroTik Burst Limit Script Generator
   ============================================ */

// --- Toggle Target IP field ---
function toggleTargetIp() {
    const type = document.getElementById('serviceType').value;
    const targetIpGroup = document.getElementById('targetIpGroup');
    if (type === 'static') {
        targetIpGroup.style.display = 'flex';
    } else {
        targetIpGroup.style.display = 'none';
    }
}

// --- Helper: Parse Bandwidth (e.g., 2M, 512k) to numeric bits ---
function parseBandwidth(val) {
    if (!val) return 0;
    val = val.toString().toLowerCase().trim();
    let multiplier = 1;
    if (val.endsWith('m')) {
        multiplier = 1000000;
        val = val.slice(0, -1);
    } else if (val.endsWith('k')) {
        multiplier = 1000;
        val = val.slice(0, -1);
    }
    return (parseFloat(val) || 0) * multiplier;
}

// --- Helper: Format numeric bits back to MikroTik units ---
function formatBandwidth(bits) {
    if (bits >= 1000000 && bits % 1000000 === 0) {
        return (bits / 1000000) + 'M';
    } else if (bits >= 1000) {
        return (bits / 1000) + 'k';
    }
    return Math.round(bits).toString();
}

// --- Generate MikroTik Script ---
function generateScript() {
    const type = document.getElementById('serviceType').value;

    // Get values, fallback to placeholder examples
    const name = document.getElementById('profileName').value || 'Paket-Super';
    const targetIp = document.getElementById('targetIp').value || '192.168.10.50';

    // Upload values
    const uMaxRaw = document.getElementById('upMax').value || '2M';
    const uBurst = document.getElementById('upBurst').value || '4M';
    const uThresh = document.getElementById('upThresh').value || '1500k';
    const uTime = document.getElementById('upTime').value || '16';
    
    // Download values
    const dMaxRaw = document.getElementById('downMax').value || '10M';
    const dBurst = document.getElementById('downBurst').value || '20M';
    const dThresh = document.getElementById('downThresh').value || '8M';
    const dTime = document.getElementById('downTime').value || '16';

    const prio = document.getElementById('priority').value || '8';

    // Calculate Limit-At (1:4 Ratio / 25%)
    const uLimitAt = formatBandwidth(parseBandwidth(uMaxRaw) * 0.25);
    const dLimitAt = formatBandwidth(parseBandwidth(dMaxRaw) * 0.25);

    let script = '';

    if (type === 'pppoe') {
        const rateLimitString = `${uMaxRaw}/${dMaxRaw} ${uBurst}/${dBurst} ${uThresh}/${dThresh} ${uTime}/${dTime} ${prio} ${uLimitAt}/${dLimitAt}`;
        script = `/ppp profile add name=${name} rate-limit="${rateLimitString}"`;
    }
    else if (type === 'hotspot') {
        const rateLimitString = `${uMaxRaw}/${dMaxRaw} ${uBurst}/${dBurst} ${uThresh}/${dThresh} ${uTime}/${dTime} ${prio} ${uLimitAt}/${dLimitAt}`;
        script = `/ip hotspot user profile add name=${name} rate-limit="${rateLimitString}"`;
    }
    else if (type === 'static') {
        script = `/queue simple add name=${name} target=${targetIp}/32 max-limit=${uMaxRaw}/${dMaxRaw} burst-limit=${uBurst}/${dBurst} burst-threshold=${uThresh}/${dThresh} burst-time=${uTime}/${dTime} priority=${prio}/${prio} limit-at=${uLimitAt}/${dLimitAt}`;
    }

    document.getElementById('outputScript').value = script;

    // Auto-resize textarea
    const textarea = document.getElementById('outputScript');
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// --- Copy to Clipboard ---
function copyScript() {
    const textarea = document.getElementById('outputScript');
    const btn = document.getElementById('btnCopy');

    if (!textarea.value || textarea.value === '') {
        return;
    }

    navigator.clipboard.writeText(textarea.value).then(() => {
        btn.classList.add('copied');
        btn.innerHTML = '<i class="bi bi-check2"></i> Tersalin!';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<i class="bi bi-clipboard"></i> Salin Script';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        textarea.select();
        document.execCommand('copy');
        btn.classList.add('copied');
        btn.innerHTML = '<i class="bi bi-check2"></i> Tersalin!';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<i class="bi bi-clipboard"></i> Salin Script';
        }, 2000);
    });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    toggleTargetIp();
});
