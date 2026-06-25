// product-detail.js - Handles loading product details from server

// ============================================
// LOAD PRODUCT DETAIL FROM SERVER
// ============================================
async function loadProductDetail() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        console.log('No product ID found in URL');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();
        
        if (data.success && data.products) {
            // Find the product by ID
            const product = data.products.find(p => p.id === productId);
            
            if (product) {
                // Update page with product data
                document.getElementById('pTitle').textContent = product.name;
                document.getElementById('pDesc').textContent = product.description || 'Premium quality product';
                document.getElementById('pPrice').textContent = '₹' + product.price;
                
                // Update main image
                const mainImg = document.getElementById('mainImg');
                mainImg.src = product.image || 'product1.jpeg';
                mainImg.alt = product.name;
                
                // Update thumbnails if needed
                const thumbWrapper = document.getElementById('thumbWrapper');
                if (thumbWrapper) {
                    thumbWrapper.innerHTML = `
                        <img src="${product.image || 'product1.jpeg'}" class="thumb-img active" onclick="changeMainImage(this.src)">
                        <img src="product1.jpeg" class="thumb-img" onclick="changeMainImage(this.src)">
                        <img src="product2.jpeg" class="thumb-img" onclick="changeMainImage(this.src)">
                    `;
                }
                
                // Update original price and discount
                const originalPrice = product.price * 1.3;
                document.getElementById('pOriginalPrice').textContent = '₹' + originalPrice.toFixed(0);
                const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
                document.getElementById('pDiscountTag').textContent = discount + '% OFF';
                
                // Update specifications
                const specsBody = document.getElementById('specsBody');
                if (specsBody) {
                    specsBody.innerHTML = `
                        <tr><td>Product Name</td><td>${product.name}</td></tr>
                        <tr><td>Category</td><td>${product.category || 'Desi Fuel'}</td></tr>
                        <tr><td>Price</td><td>₹${product.price}</td></tr>
                        <tr><td>Stock</td><td>${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</td></tr>
                        <tr><td>SKU</td><td>${product.sku || 'N/A'}</td></tr>
                        <tr><td>Ingredients</td><td>Pure Roasted Chana, Almonds, Cashews, Ashwagandha, Shatavari</td></tr>
                        <tr><td>Benefits</td><td>Energy Boost, Muscle Recovery, Immunity Support</td></tr>
                        <tr><td>Usage</td><td>2 tbsp with 250ml warm milk</td></tr>
                    `;
                }
                
                // Update Add to Cart button
                const addToCartBtn = document.getElementById('addToCartBtn');
                if (addToCartBtn) {
                    addToCartBtn.onclick = function() {
                        addToCart(product.id, product.name, product.price, product.category || 'Standard');
                    };
                    if (product.stock <= 0) {
                        addToCartBtn.disabled = true;
                        addToCartBtn.textContent = 'Out of Stock';
                        addToCartBtn.style.backgroundColor = '#878787';
                    }
                }
                
                console.log('✅ Product loaded:', product.name);
            } else {
                console.log('Product not found:', productId);
                // Show fallback product details
                showFallbackProduct(productId);
            }
        }
    } catch (error) {
        console.error('Error loading product detail:', error);
        showFallbackProduct(productId);
    }
}

// ============================================
// FALLBACK PRODUCT (if product not found in server)
// ============================================
function showFallbackProduct(productId) {
    // Fallback data for hardcoded products
    const fallbackProducts = {
        'pdf-250g': {
            name: 'PRADH Desi Fuel (250g)',
            price: 349,
            description: 'Perfect trial size package. High-protein roasted mix crafted clean for swift energetic lifestyle recoveries.',
            image: 'product1.jpeg',
            category: 'Desi Fuel',
            stock: 50
        },
        'pdf-500g': {
            name: 'PRADH Desi Fuel (500g)',
            price: 599,
            description: 'Standard balanced nutritional pack configuration. Ideal option for consistent fitness enthusiasts.',
            image: 'product1.jpeg',
            category: 'Desi Fuel',
            stock: 30
        },
        'pdf-1kg': {
            name: 'PRADH Desi Fuel (1 KG)',
            price: 1099,
            description: 'Maximum value health pack configuration. Freshly roasted traditional formula optimized for bulk performance.',
            image: 'product1.jpeg',
            category: 'Desi Fuel',
            stock: 75
        }
    };
    
    const product = fallbackProducts[productId];
    
    if (product) {
        document.getElementById('pTitle').textContent = product.name;
        document.getElementById('pDesc').textContent = product.description;
        document.getElementById('pPrice').textContent = '₹' + product.price;
        document.getElementById('mainImg').src = product.image;
        
        const originalPrice = product.price * 1.3;
        document.getElementById('pOriginalPrice').textContent = '₹' + originalPrice.toFixed(0);
        const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
        document.getElementById('pDiscountTag').textContent = discount + '% OFF';
    }
}

// ============================================
// CHANGE MAIN IMAGE
// ============================================
function changeMainImage(src) {
    document.getElementById('mainImg').src = src;
    // Update active thumbnail
    document.querySelectorAll('.thumb-img').forEach(img => {
        img.classList.remove('active');
        if (img.src === src) {
            img.classList.add('active');
        }
    });
}

// ============================================
// TOGGLE SPECIFICATIONS
// ============================================
function toggleSpecifications() {
    const container = document.getElementById('specsContainer');
    const btn = document.getElementById('toggleSpecsBtn');
    
    if (container.classList.contains('specs-collapsed')) {
        container.classList.remove('specs-collapsed');
        container.classList.add('specs-expanded');
        btn.textContent = 'Read Less ↑';
    } else {
        container.classList.remove('specs-expanded');
        container.classList.add('specs-collapsed');
        btn.textContent = 'Read More ↓';
    }
}

// ============================================
// TOGGLE FAQ
// ============================================
function toggleFaq(element) {
    const faqItem = element.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const icon = faqItem.querySelector('.faq-icon');
    
    if (faqItem.classList.contains('active')) {
        faqItem.classList.remove('active');
        answer.style.maxHeight = '0';
        icon.textContent = '+';
    } else {
        // Close other FAQs
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            item.querySelector('.faq-answer').style.maxHeight = '0';
            item.querySelector('.faq-icon').textContent = '+';
        });
        
        faqItem.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.textContent = '✕';
    }
}

// ============================================
// OPEN REVIEW MODAL
// ============================================
function openReviewModal(src) {
    const modal = document.getElementById('reviewImageModal');
    const modalImg = document.getElementById('imgModalTarget');
    modal.style.display = 'block';
    modalImg.src = src;
}

// ============================================
// ADD TO CART FROM DETAIL PAGE
// ============================================
function addToCart(productId, productName, price, variant) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => 
        item.id === productId || 
        (item.name === productName && item.variant === variant)
    );
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: parseFloat(price),
            variant: variant || 'Standard',
            quantity: 1,
            image: 'product1.jpeg'
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart badge
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Show notification
    showNotification(`${productName} added to cart! 🛒`);
}

// ============================================
// SHOW NOTIFICATION
// ============================================
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
        background: #22c55e;
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

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Load product details
    loadProductDetail();
    
    // Update cart badge
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
});

// Make functions globally available
window.changeMainImage = changeMainImage;
window.toggleSpecifications = toggleSpecifications;
window.toggleFaq = toggleFaq;
window.openReviewModal = openReviewModal;
window.addToCart = addToCart;
