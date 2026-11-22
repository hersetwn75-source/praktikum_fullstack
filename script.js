const BASE = "backend"; 

// Elemen Form & Tabel
const form = document.getElementById("formMahasiswa");
const namaInput = document.getElementById("nama");
const nimInput = document.getElementById("nim");
const editIdInput = document.getElementById("editId");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelEdit");
const tbody = document.querySelector("#tabelMahasiswa tbody");

// Elemen Sidebar
const menuToggle = document.querySelector(".menu-toggle");
const btnClose = document.querySelector(".btn-close");
const sidebar = document.getElementById("sidebar");

// Validasi NIM hanya angka
nimInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
});

// Sidebar Toggle
menuToggle.addEventListener("click", () => sidebar.classList.add("active"));
btnClose.addEventListener("click", () => sidebar.classList.remove("active"));
document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove("active");
    }
});

// Load Data Awal
document.addEventListener("DOMContentLoaded", () => loadData());

// Load Data dari Server
async function loadData() {
    try {
        const res = await fetch(`${BASE}/read.php`);
        const json = await res.json();
        if (json.success) renderTable(json.data);
        else showToast("Gagal memuat data", "error");
    } catch (err) {
        showToast("Koneksi gagal: " + err.message, "error");
    }
}

// Render Tabel
function renderTable(data) {
    tbody.innerHTML = "";
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--wuwa-text-dim); padding: 20px;">Belum ada data resonator.</td></tr>`;
        return;
    }
    
    data.forEach((mhs, idx) => {
        const tr = document.createElement("tr");
        tr.style.animation = `fadeInUp 0.4s ease forwards`;
        tr.style.animationDelay = `${idx * 0.05}s`;
        tr.style.opacity = "0";
        
        tr.innerHTML = `
            <td>${idx + 1}</td> 
            <td>${escapeHtml(mhs.nama)}</td> 
            <td>${escapeHtml(mhs.nim)}</td> 
            <td> 
                <button class="btn-edit" data-id="${mhs.id}"><i class="fas fa-edit"></i> Edit</button> 
                <button class="btn-delete" data-id="${mhs.id}"><i class="fas fa-trash"></i> Hapus</button> 
            </td>`;
        tbody.appendChild(tr);
    });

    document.querySelectorAll(".btn-edit").forEach(b => b.addEventListener("click", onEdit));
    document.querySelectorAll(".btn-delete").forEach(b => b.addEventListener("click", onDelete));
}

// Submit Form (Create / Update)
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = namaInput.value.trim();
    const nim = nimInput.value.trim();
    const id = editIdInput.value;

    if (!nama || !nim) {
        showToast("Nama & NIM wajib diisi!", "error");
        return;
    }

    const payload = { nama, nim };
    try {
        if (!id) {
            // CREATE
            const res = await fetch(`${BASE}/create.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const j = await res.json();
            if (j.success) {
                showToast("Data Resonator berhasil ditambahkan!", "success");
                form.reset();
                loadData();
            } else showToast(j.message || "Gagal menambah data", "error");
        } else {
            // UPDATE
            payload.id = id;
            const res = await fetch(`${BASE}/update.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const j = await res.json();
            if (j.success) {
                showToast("Data berhasil diperbarui!", "success");
                resetFormState();
                loadData();
            } else showToast(j.message || "Gagal update", "error");
        }
    } catch (err) {
        showToast("Request gagal: " + err.message, "error");
    }
});

// Edit Handler
async function onEdit(e) {
    const id = e.target.closest('button').dataset.id;
    try {
        const res = await fetch(`${BASE}/read.php`);
        const j = await res.json();
        if (j.success) {
            const item = j.data.find((x) => x.id == id);
            if (item) {
                namaInput.value = item.nama;
                nimInput.value = item.nim;
                editIdInput.value = item.id;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                cancelBtn.style.display = "inline-flex";
                window.scrollTo({ top: 0, behavior: "smooth" });
                showToast("Mode edit aktif. Silakan ubah data.", "success");
            }
        }
    } catch (err) {
        showToast("Gagal ambil data untuk edit", "error");
    }
}

// Cancel Edit
cancelBtn.addEventListener("click", resetFormState);

function resetFormState() {
    form.reset();
    editIdInput.value = "";
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Data';
    cancelBtn.style.display = "none";
}

// Delete Handler
async function onDelete(e) {
    if (!confirm("Yakin ingin menghapus data resonator ini?")) return;
    const id = e.target.closest('button').dataset.id;
    try {
        const res = await fetch(`${BASE}/delete.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        const j = await res.json();
        if (j.success) {
            showToast("Data berhasil dihapus!", "success");
            loadData();
        } else showToast(j.message || "Gagal menghapus", "error");
    } catch (err) {
        showToast("Request gagal: " + err.message, "error");
    }
}

// Custom Toast Notification (Pengganti Alert)
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Helper: Escape HTML (Anti XSS)
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}