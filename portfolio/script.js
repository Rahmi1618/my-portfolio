/* ==========================================================================
   Rehemet.dev — Interactive Portfolio, PharmaCare POS & Student System
   ========================================================================== */

// 1. Toast Notification Helper
function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// 2. Theme Management & Mobile Menu
const themeToggle = document.getElementById('themeToggle');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rehemet_dev_theme', theme);
    if (theme === 'dark') {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
}

const initialTheme = localStorage.getItem('rehemet_dev_theme') || 'light';
applyTheme(initialTheme);

themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
});

document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('navMenu').classList.toggle('open');
});

// 3. Hero Typewriter Animation
const roles = [
    'JavaScript Developer',
    'Front-End Developer',
    'Software Engineer'
];
let roleIdx = 0;
let charIdx = roles[0].length;
let isDeleting = true;
const typeEl = document.getElementById('typewriterText');

function runTypewriter() {
    const currentWord = roles[roleIdx];
    if (isDeleting) {
        charIdx--;
        typeEl.textContent = currentWord.substring(0, charIdx);
        if (charIdx === 0) {
            isDeleting = false;
            roleIdx = (roleIdx + 1) % roles.length;
            setTimeout(runTypewriter, 350);
            return;
        }
    } else {
        charIdx++;
        typeEl.textContent = currentWord.substring(0, charIdx);
        if (charIdx === currentWord.length) {
            isDeleting = true;
            setTimeout(runTypewriter, 1800);
            return;
        }
    }
    setTimeout(runTypewriter, isDeleting ? 45 : 85);
}
setTimeout(runTypewriter, 1500);

// 4. Sandbox Application Switcher Tabs
document.querySelectorAll('.switch-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.switch-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.app-workspace').forEach(w => w.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
    });
});

// ==========================================================================
// 5. PHARMACARE — PHARMACY INVENTORY & BILLING POS
// ==========================================================================
let inventory = JSON.parse(localStorage.getItem('rehemet_pharma_inv')) || [
    { id: 1, name: 'Amoxicillin 500mg', category: 'Antibiotic', qty: 42, price: 12.50, expiry: '2027-08-15' },
    { id: 2, name: 'Paracetamol 650mg', category: 'Analgesic', qty: 7, price: 4.25, expiry: '2027-03-10' },
    { id: 3, name: 'Atorvastatin 20mg', category: 'Cardiovascular', qty: 28, price: 18.00, expiry: '2026-12-20' },
    { id: 4, name: 'Vitamin D3 2000IU', category: 'Supplement', qty: 55, price: 9.50, expiry: '2028-01-30' }
];
let salesCount = parseInt(localStorage.getItem('rehemet_pharma_sales') || '14', 10);
let posCart = [];

function renderPharma() {
    const search = document.getElementById('pharmaSearch').value.toLowerCase();
    const catFilter = document.getElementById('pharmaCategoryFilter').value;
    const tbody = document.getElementById('pharmaTableBody');
    tbody.innerHTML = '';

    let totalValue = 0;
    let lowCount = 0;

    inventory.forEach(item => {
        totalValue += item.qty * item.price;
        if (item.qty < 10) lowCount++;
    });

    document.getElementById('pharmaTotalItems').textContent = inventory.length;
    document.getElementById('pharmaTotalValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('pharmaLowStock').textContent = lowCount;
    document.getElementById('pharmaSalesCount').textContent = salesCount;

    const filtered = inventory.filter(item => {
        const matchesText = item.name.toLowerCase().includes(search) || item.category.toLowerCase().includes(search);
        const matchesCat = catFilter === 'ALL' || item.category === catFilter;
        return matchesText && matchesCat;
    });

    filtered.forEach(item => {
        const stockBadge = item.qty < 10
            ? `<span class="badge badge-low">${item.qty} (Low)</span>`
            : `<span class="badge badge-ok">${item.qty} units</span>`;

        tbody.innerHTML += `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td>${stockBadge}</td>
                <td>${item.expiry}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <button class="action-btn btn-bill" onclick="addToCart(${item.id})">+ Bill</button>
                    <button class="action-btn btn-del" onclick="deleteMed(${item.id})">Del</button>
                </td>
            </tr>
        `;
    });

    localStorage.setItem('rehemet_pharma_inv', JSON.stringify(inventory));
}

document.getElementById('addMedicineForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('medName').value.trim();
    const category = document.getElementById('medCategory').value;
    const qty = parseInt(document.getElementById('medQty').value, 10);
    const price = parseFloat(document.getElementById('medPrice').value);
    const expiry = document.getElementById('medExpiry').value;

    const existing = inventory.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        existing.qty += qty;
        existing.price = price;
        showToast(`Restocked ${name} (+${qty} units)`);
    } else {
        inventory.push({ id: Date.now(), name, category, qty, price, expiry });
        showToast(`Added ${name} to PharmaCare inventory`);
    }

    e.target.reset();
    renderPharma();
});

function deleteMed(id) {
    inventory = inventory.filter(m => m.id !== id);
    posCart = posCart.filter(c => c.id !== id);
    renderPharma();
    renderCart();
    showToast('Medicine removed from inventory');
}

function addToCart(id) {
    const med = inventory.find(m => m.id === id);
    if (!med || med.qty <= 0) {
        showToast('Item is out of stock!');
        return;
    }
    const inCart = posCart.find(c => c.id === id);
    if (inCart) {
        if (inCart.qty >= med.qty) {
            showToast('Maximum available stock reached in cart');
            return;
        }
        inCart.qty++;
    } else {
        posCart.push({ id: med.id, name: med.name, price: med.price, qty: 1 });
    }
    renderCart();
}

function renderCart() {
    const list = document.getElementById('posCartList');
    if (posCart.length === 0) {
        list.innerHTML = '<p class="empty-msg">Click "+ Bill" on any medicine to add to prescription.</p>';
        document.getElementById('posSubtotal').textContent = '$0.00';
        document.getElementById('posTax').textContent = '$0.00';
        document.getElementById('posTotal').textContent = '$0.00';
        return;
    }

    let sub = 0;
    list.innerHTML = '';
    posCart.forEach(item => {
        const lineTotal = item.price * item.qty;
        sub += lineTotal;
        list.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${item.qty} x $${item.price.toFixed(2)}</small>
                </div>
                <div>
                    <strong>$${lineTotal.toFixed(2)}</strong>
                </div>
            </div>
        `;
    });

    const tax = sub * 0.05;
    document.getElementById('posSubtotal').textContent = `$${sub.toFixed(2)}`;
    document.getElementById('posTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('posTotal').textContent = `$${(sub + tax).toFixed(2)}`;
}

document.getElementById('clearCartBtn').addEventListener('click', () => {
    posCart = [];
    renderCart();
});

document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (posCart.length === 0) {
        showToast('Add medicines to the prescription cart first');
        return;
    }
    posCart.forEach(c => {
        const med = inventory.find(m => m.id === c.id);
        if (med) med.qty = Math.max(0, med.qty - c.qty);
    });
    const patient = document.getElementById('patientName').value.trim() || 'Walk-in Patient';
    salesCount++;
    localStorage.setItem('rehemet_pharma_sales', salesCount.toString());
    posCart = [];
    renderPharma();
    renderCart();
    showToast(`Receipt generated for ${patient}! Stock updated.`);
});

document.getElementById('pharmaSearch').addEventListener('input', renderPharma);
document.getElementById('pharmaCategoryFilter').addEventListener('change', renderPharma);

// ==========================================================================
// 6. STUDENT MANAGEMENT SYSTEM
// ==========================================================================
let students = JSON.parse(localStorage.getItem('rehemet_students_db')) || [
    { id: 'SE-2026-01', name: 'Rehemet Muhamed', dept: 'Software Engineering', year: 'Year 4', gpa: 3.94 },
    { id: 'CS-2026-12', name: 'Amina Yusuf', dept: 'Computer Science', year: 'Year 3', gpa: 3.68 },
    { id: 'IS-2026-07', name: 'Dawit Tadesse', dept: 'Information Systems', year: 'Year 2', gpa: 3.25 },
    { id: 'DS-2026-19', name: 'Hanna Bekele', dept: 'Data Science', year: 'Year 4', gpa: 3.81 }
];

function renderStudents() {
    const query = document.getElementById('stuSearch').value.toLowerCase();
    const deptFilter = document.getElementById('stuDeptFilter').value;
    const tbody = document.getElementById('stuTableBody');
    tbody.innerHTML = '';

    let gpaSum = 0;
    let deansCount = 0;
    const deptSet = new Set();

    students.forEach(s => {
        gpaSum += s.gpa;
        if (s.gpa >= 3.5) deansCount++;
        deptSet.add(s.dept);
    });

    const avgGpa = students.length ? (gpaSum / students.length).toFixed(2) : '0.00';
    document.getElementById('stuTotalCount').textContent = students.length;
    document.getElementById('stuAvgGpa').textContent = avgGpa;
    document.getElementById('stuDeansCount').textContent = deansCount;
    document.getElementById('stuDeptCount').textContent = deptSet.size;

    const filtered = students.filter(s => {
        const matchText = s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query);
        const matchDept = deptFilter === 'ALL' || s.dept === deptFilter;
        return matchText && matchDept;
    });

    filtered.forEach(stu => {
        const realIdx = students.indexOf(stu);
        const standing = stu.gpa >= 3.5
            ? `<span class="badge badge-ok">Dean's List</span>`
            : stu.gpa >= 2.5
                ? `<span class="badge badge-warn">Good Standing</span>`
                : `<span class="badge badge-low">Academic Probation</span>`;

        tbody.innerHTML += `
            <tr>
                <td><strong>${stu.id}</strong></td>
                <td>${stu.name}</td>
                <td>${stu.dept}</td>
                <td>${stu.year}</td>
                <td><strong>${stu.gpa.toFixed(2)}</strong></td>
                <td>${standing}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="editStudent(${realIdx})">Edit</button>
                    <button class="action-btn btn-del" onclick="deleteStudent(${realIdx})">Delete</button>
                </td>
            </tr>
        `;
    });

    localStorage.setItem('rehemet_students_db', JSON.stringify(students));
}

document.getElementById('studentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const editIdx = parseInt(document.getElementById('editStudentIndex').value, 10);
    const id = document.getElementById('stuId').value.trim();
    const name = document.getElementById('stuName').value.trim();
    const dept = document.getElementById('stuDept').value;
    const year = document.getElementById('stuYear').value;
    const gpa = parseFloat(document.getElementById('stuGpa').value);

    if (editIdx >= 0) {
        students[editIdx] = { id, name, dept, year, gpa };
        document.getElementById('editStudentIndex').value = '-1';
        document.getElementById('stuSubmitBtn').textContent = '+ Enroll Student';
        showToast(`Updated record for ${name}`);
    } else {
        students.push({ id, name, dept, year, gpa });
        showToast(`Enrolled ${name} (${id})`);
    }

    e.target.reset();
    renderStudents();
});

function editStudent(index) {
    const s = students[index];
    document.getElementById('editStudentIndex').value = index;
    document.getElementById('stuId').value = s.id;
    document.getElementById('stuName').value = s.name;
    document.getElementById('stuDept').value = s.dept;
    document.getElementById('stuYear').value = s.year;
    document.getElementById('stuGpa').value = s.gpa;
    document.getElementById('stuSubmitBtn').textContent = 'Save Changes';
}

function deleteStudent(index) {
    const removed = students.splice(index, 1)[0];
    renderStudents();
    showToast(`Removed ${removed.name}`);
}

document.getElementById('stuSearch').addEventListener('input', renderStudents);
document.getElementById('stuDeptFilter').addEventListener('change', renderStudents);

// ==========================================================================
// 7. CONTACT FORM VALIDATION
// ==========================================================================
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const msg = document.getElementById('contactMessage').value.trim();

    document.getElementById('nameError').textContent = '';
    document.getElementById('emailError').textContent = '';
    document.getElementById('msgError').textContent = '';

    let valid = true;
    if (name.length < 2) {
        document.getElementById('nameError').textContent = 'Please enter your full name.';
        valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address.';
        valid = false;
    }
    if (msg.length < 10) {
        document.getElementById('msgError').textContent = 'Message must be at least 10 characters.';
        valid = false;
    }

    if (valid) {
        e.target.reset();
        showToast('Thank you! Your message has been sent to Rehemet Muhamed.');
    }
});

// Initialize Everything on Load
renderPharma();
renderCart();
renderStudents();
