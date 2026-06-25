// main.js - Complete working version with better cart handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('PRADH Website loaded');
    initCart();
    initMobileMenu();
    initSearch();
    updateCartBadge();
    
    // Debug: Log current cart
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('Current cart items:', cart);
});

// Initialize cart functionality
function initCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartBadge();
}

// Update cart badge count
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    
    console.log('Updating badge. Total items:', totalItems);
    
    // Update all cart count elements
    const cartCounts = document.querySelectorAll('#cart-count, #cart-badge, .cart-count');
    cartCounts.forEach(element => {
        if (element) {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
}

// Search functionality
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

// Enhanced Add to Cart function - Supports both formats
function addToCart(productId, productName, price, variant) {
    console.log('addToCart called with:', { productId, productName, price, variant });
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Handle different parameter formats
    let id, name, priceValue, variantValue;
    
    if (typeof productId === 'object' && productId !== null) {
        // If first parameter is an object (product object)
        const product = productId;
        id = product.id || product.productId || Date.now().toString();
        name = product.name || product.title || 'Product';
        priceValue = parseFloat(product.price) || 0;
        variantValue = product.variant || product.size || 'Standard';
    } else {
        // Regular parameters
        id = productId || Date.now().toString();
        name = productName || 'Product';
        priceValue = parseFloat(price) || 0;
        variantValue = variant || 'Standard';
    }
    
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        item.id === id || 
        (item.name === name && item.variant === variantValue)
    );
    
    if (existingItemIndex > -1) {
        // Product exists, increase quantity
        cart[existingItemIndex].quantity = (parseInt(cart[existingItemIndex].quantity) || 1) + 1;
        console.log('Updated existing item:', cart[existingItemIndex]);
    } else {
        // New product, add to cart
        const newItem = {
            id: id,
            name: name,
            price: priceValue,
            variant: variantValue || 'Standard',
            quantity: 1,
            image: 'product.jpeg'
        };
        cart.push(newItem);
        console.log('Added new item:', newItem);
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart saved:', cart);
    
    // Update badge
    updateCartBadge();
    
    // Show notification
    showNotification(`${name} added to cart! 🛒`);
    
    // Return cart for debugging
    return cart;
}

// Alternative function for product.html if it uses different parameters
function addToCartSimple(product) {
    return addToCart(product.id, product.name, product.price, product.variant);
}

// Remove from cart
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showNotification('Product removed from cart');
}

// Clear cart
function clearCart() {
    localStorage.removeItem('cart');
    updateCartBadge();
    showNotification('Cart cleared');
}

// Get cart items
function getCartItems() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Show notification
function showNotification(message) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: #28a745;
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
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

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .notification-toast {
        animation: slideIn 0.3s ease;
    }
    #menuToggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    #menuToggle.active span:nth-child(2) {
        opacity: 0;
    }
    #menuToggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
    }
`;
document.head.appendChild(style);

// Export functions for use in other files
window.addToCart = addToCart;
window.addToCartSimple = addToCartSimple;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.getCartItems = getCartItems;
window.updateCartBadge = updateCartBadge;

console.log('✅ main.js loaded successfully');
