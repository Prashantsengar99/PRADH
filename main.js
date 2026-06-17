// --- Navigation Menu Toggle (Mobile Viewports) ---
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    updateCartCount();
});

// --- Dynamic Cart Counter Tracker (Laptop + Mobile Badge) ---
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    let totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    // 1. Desktop view ka counter update
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }

    // 2. Mobile view ka 3-lines badge control
    const mobileBadge = document.getElementById('mobile-cart-badge');
    if (mobileBadge) {
        if (totalItems > 0) {
            mobileBadge.textContent = totalItems;
            mobileBadge.style.display = 'flex';
        } else {
            mobileBadge.style.display = 'none';
        }
    }
}

// --- Universal Add-To-Cart Processing Logic ---
function addToCart(id, name, price, variant) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    const existingItemIndex = cart.findIndex(item => item.id === id && item.variant === variant);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: parseInt(price),
            variant: variant,
            quantity: 1
        });
    }

    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    updateCartCount();
    
    alert(`${name} (${variant}) has been successfully added to your cart.`);
}
// --- Announcement Bar Text Rotation Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const announcementEl = document.getElementById('announcement-text');
    if (!announcementEl) return;

    // Jo jo offers tumhein chalane hain, unhe is array mein daal do
    const offers = [
        '🔥 Use Code: <span class="coupon-highlight">DESIFUEL10</span> for extra 10% OFF on your first order!',
        '⚡ FREE Express Shipping across India on orders above ₹499! ⚡',
        '💪 100% Pure Organic & Sand-Roasted Desi Nutrition Fuel! 💪'
    ];

    let currentIndex = 0;

    setInterval(() => {
        // Smooth fade-out effect
        announcementEl.style.opacity = 0;
        announcementEl.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            currentIndex = (currentIndex + 1) % offers.length;
            announcementEl.innerHTML = offers[currentIndex];
            
            // Smooth fade-in effect
            announcementEl.style.opacity = 1;
            announcementEl.style.transform = 'translateY(0)';
        }, 300); // 300ms transition delay
    }, 3000); // Har 3 second mein change hoga
});
// --- Interactive Nutrition & Protein Calculator Logic ---
function calculateFuel(event) {
    event.preventDefault(); // Page reload hone se rokne ke liye

    const weight = parseFloat(document.getElementById('calc-weight').value);
    const goal = document.getElementById('calc-goal').value;
    
    if (!weight || weight <= 0) return;

    let proteinPerKg = 1.0; // Default factor

    // Goal ke mutabik multiplier factor set karna
    if (goal === 'sedentary') {
        proteinPerKg = 1.0; // Normal lifestyle ke liye 1g per kg
    } else if (goal === 'active') {
        proteinPerKg = 1.4; // Active lifestyle ke liye 1.4g per kg
    } else if (goal === 'muscle') {
        proteinPerKg = 1.8; // Bodybuilding/Heavy weight training ke liye 1.8g per kg
    }

    // Calculation total target
    const totalProteinNeeded = Math.round(weight * proteinPerKg);

    // Dynamic result updates to layout DOM
    document.getElementById('protein-target').textContent = totalProteinNeeded;
    
    // Result box ko design ke sath smooth display karwana
    const resultBox = document.getElementById('calc-result-box');
    resultBox.style.display = 'block';
    
    // Auto scroll down to view results cleanly on smartphones
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}