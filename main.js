// ============================================
// MAIN.JS - COMPLETE WORKING VERSION WITH POPUP
// ============================================

console.log('✅ main.js loaded successfully');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - PRADH Website');
    
    // Initialize all components
    initCart();
    initMobileMenu();
    initSearch();
    updateCartBadge();
});

// ============================================
// CART FUNCTIONS
// ============================================

function initCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartBadge();
    console.log('Cart initialized with', cart.length, 'items');
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    
    console.log('Updating badge. Total items:', totalItems);
    
    // Update all cart count elements
    const cartCounts = document.querySelectorAll('#cart-count, #cart-badge, .cart-count, #mobile-cart-badge');
    cartCounts.forEach(element => {
        if (element) {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    });
}

// ============================================
// ADD TO CART WITH POPUP - FIXED
// ============================================

window.addToCart = function(productId, productName, price, variant) {
    console.log('🛒 addToCart called:', { productId, productName, price, variant });
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already exists
    const existingItem = cart.find(item => 
        item.id === productId || 
        (item.name === productName && item.variant === variant)
    );
    
    if (existingItem) {
        existingItem.quantity = (parseInt(existingItem.quantity) || 1) + 1;
        console.log('✅ Updated existing item:', existingItem);
    } else {
        const newItem = {
            id: productId || Date.now().toString(),
            name: productName,
            price: parseFloat(price),
            variant: variant || 'Standard',
            quantity: 1,
            image: 'product1.jpeg'
        };
        cart.push(newItem);
        console.log('✅ Added new item:', newItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('📦 Cart saved:', cart);
    
    updateCartBadge();
    
    // Show popup with View Cart button - FIXED
    showCartPopup(productName);
    
    return cart;
};

// ============================================
// CART POPUP WITH VIEW CART BUTTON - FIXED
// ============================================

function showCartPopup(productName) {
    console.log('📢 Showing popup for:', productName);
    
    // Remove existing popup
    const existing = document.querySelector('.cart-popup');
    if (existing) {
        existing.remove();
        console.log('🗑️ Removed existing popup');
    }
    
    // Get cart count
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    console.log('📊 Cart has', totalItems, 'items');
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'cart-popup';
    popup.id = 'cartPopup';
    popup.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">✅</span>
                    <span style="font-size: 15px; font-weight: 600; color: #ffffff;">
                        ${productName} added to cart!
                    </span>
                </div>
                <button onclick="closeCartPopup()" 
                        style="background: transparent; color: #94a3b8; border: none; cursor: pointer; font-size: 22px; padding: 0 5px;">
                    ✕
                </button>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #334155; padding-top: 12px;">
                <button onclick="goToCartPage()" 
                        style="background: #facc15; color: #0f172a; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-shopping-cart"></i> View Cart (${totalItems})
                </button>
                <button onclick="closeCartPopup()" 
                        style="background: transparent; color: #94a3b8; border: 1px solid #334155; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 15px;">
                    Continue Shopping
                </button>
            </div>
        </div>
    `;
    
    // Style the popup
    popup.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 18px 22px;
        background: #1e293b;
        color: #e2e8f0;
        border: 2px solid #facc15;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        z-index: 9999;
        min-width: 320px;
        max-width: 420px;
        animation: slideIn 0.3s ease;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(popup);
    console.log('✅ Popup added to DOM');
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        const popupElement = document.getElementById('cartPopup');
        if (popupElement) {
            popupElement.style.opacity = '0';
            popupElement.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (popupElement.parentElement) {
                    popupElement.remove();
                    console.log('⏰ Popup auto-removed');
                }
            }, 500);
        }
    }, 10000);
}

// ============================================
// POPUP HELPER FUNCTIONS
// ============================================

function closeCartPopup() {
    const popup = document.getElementById('cartPopup');
    if (popup) {
        popup.style.opacity = '0';
        popup.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            if (popup.parentElement) {
                popup.remove();
                console.log('❌ Popup closed');
            }
        }, 300);
    }
}

function goToCartPage() {
    console.log('🛒 Navigating to cart page...');
    window.location.href = 'cart.html';
}

// ============================================
// MOBILE MENU TOGGLE
// ============================================

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        // Remove existing listeners by cloning
        const newToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newToggle, menuToggle);
        
        newToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
            console.log('Menu toggled:', navMenu.classList.contains('active'));
        });
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.getElementById('menuToggle');
    
    if (navMenu && navMenu.classList.contains('active')) {
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            navMenu.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        }
    }
});

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
        window.location.href = `product.html?search=${encodeURIComponent(query)}`;
    }
}

// ============================================
// OTHER CART FUNCTIONS
// ============================================

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showSimpleNotification('Product removed from cart');
}

function clearCart() {
    if (confirm('Clear your entire cart?')) {
        localStorage.removeItem('cart');
        updateCartBadge();
        showSimpleNotification('Cart cleared');
    }
}

function getCartItems() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function showSimpleNotification(message) {
    const existing = document.querySelector('.simple-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'simple-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: #22c55e;
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9998;
        font-weight: 500;
        animation: slideIn 0.3s ease;
        max-width: 350px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// ============================================
// ADD ANIMATION STYLES
// ============================================

(function addStyles() {
    if (!document.getElementById('popup-styles')) {
        const style = document.createElement('style');
        style.id = 'popup-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            .cart-popup {
                animation: slideIn 0.3s ease;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Animation styles added');
    }
})();

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.getCartItems = getCartItems;
window.updateCartBadge = updateCartBadge;
window.initMobileMenu = initMobileMenu;
window.closeCartPopup = closeCartPopup;
window.goToCartPage = goToCartPage;

console.log('✅ All functions loaded and ready');
console.log('📌 Tip: Click "Add to Cart" to see popup with "View Cart" button');
