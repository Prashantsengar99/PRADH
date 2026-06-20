// --- Universal Helper: Element Exist Check ---
const getEl = (id) => document.getElementById(id);

// --- Navigation Menu (Mobile) ---
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = getEl('menuToggle');
    const navMenu = getEl('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
    updateCartCount();
});

// --- Cart Counter ---
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    let totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const cartCountElement = getEl('cart-count');
    if (cartCountElement) cartCountElement.textContent = totalItems;

    const mobileBadge = getEl('mobile-cart-badge');
    if (mobileBadge) {
        mobileBadge.textContent = totalItems;
        mobileBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// --- Add To Cart ---
function addToCart(id, name, price, variant) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    const index = cart.findIndex(item => item.id === id && item.variant === variant);

    if (index > -1) {
        cart[index].quantity += 1;
    } else {
        cart.push({ id, name, price: parseInt(price), variant, quantity: 1 });
    }

    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    updateCartCount();
    alert(`${name} (${variant}) added to cart.`);
}

// --- Announcement Bar Rotation ---
document.addEventListener('DOMContentLoaded', () => {
    const announcementEl = getEl('announcement-text');
    if (!announcementEl) return;

    const offers = [
        '🔥 Use Code: <span class="coupon-highlight">DESIFUEL10</span> for extra 10% OFF!',
        '⚡ FREE Express Shipping on orders above ₹499! ⚡',
        '💪 100% Pure Organic & Sand-Roasted Desi Nutrition! 💪'
    ];

    let i = 0;
    setInterval(() => {
        announcementEl.style.opacity = 0;
        setTimeout(() => {
            i = (i + 1) % offers.length;
            announcementEl.innerHTML = offers[i];
            announcementEl.style.opacity = 1;
        }, 300);
    }, 3000);
});

// --- Nutrition Calculator ---
function calculateFuel(event) {
    if (event) event.preventDefault();
    const weight = parseFloat(getEl('calc-weight')?.value);
    const goal = getEl('calc-goal')?.value;
    
    if (!weight || weight <= 0) return;

    const factors = { sedentary: 1.0, active: 1.4, muscle: 1.8 };
    const protein = Math.round(weight * (factors[goal] || 1.0));

    const target = getEl('protein-target');
    if (target) target.textContent = protein;
    
    const resBox = getEl('calc-result-box');
    if (resBox) {
        resBox.style.display = 'block';
        resBox.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- Countdown Timer ---
document.addEventListener('DOMContentLoaded', () => {
    const display = getEl('countdown');
    if (!display) return;

    let timer = 43200; 
    const interval = setInterval(() => {
        let h = Math.floor(timer / 3600);
        let m = Math.floor((timer % 3600) / 60);
        let s = timer % 60;

        display.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

        if (--timer < 0) {
            clearInterval(interval);
            const box = getEl('timer-box');
            if (box) box.innerHTML = '🔥 Use Code: <span class="coupon-highlight">DESIFUEL10</span> for extra 10% OFF!';
        }
    }, 1000);
});