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

// --- Dynamic Cart Counter Tracker ---
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
        let totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

// --- Universal Add-To-Cart Processing Logic ---
function addToCart(id, name, price, variant) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    
    // Explicit compound identifier check targeting item variants uniquely
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
    
    // UI Notification Response
    alert(`${name} (${variant}) has been successfully added to your cart.`);
}
