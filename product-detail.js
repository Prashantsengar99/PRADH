// product-detail.js

// ============================================
// LOAD PRODUCT DETAIL
// ============================================
async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        console.log('No product ID found');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();
        
        if (data.success && data.products) {
            const product = data.products.find(p => p.id === productId);
            
            if (product) {
                document.getElementById('pTitle').textContent = product.name;
                document.getElementById('pDesc').textContent = product.description || 'Premium quality product';
                document.getElementById('pPrice').textContent = '₹' + product.price;
                
                const mainImg = document.getElementById('mainImg');
                mainImg.src = product.image || 'product1.jpeg';
                mainImg.alt = product.name;
                
                const thumbWrapper = document.getElementById('thumbWrapper');
                if (thumbWrapper) {
                    thumbWrapper.innerHTML = `
                        <img src="${product.image || 'product1.jpeg'}" class="thumb-img active" onclick="changeMainImage(this.src)">
                        <img src="product1.jpeg" class="thumb-img" onclick="changeMainImage(this.src)">
                        <img src="product2.jpeg" class="thumb-img" onclick="changeMainImage(this.src)">
                    `;
                }
                
                const originalPrice = product.price * 1.3;
                document.getElementById('pOriginalPrice').textContent = '₹' + originalPrice.toFixed(0);
                const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
                document.getElementById('pDiscountTag').textContent = discount + '% OFF';
                
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
                
                // Load reviews
                setTimeout(loadReviews, 500);
            } else {
                showFallbackProduct(productId);
            }
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showFallbackProduct(productId);
    }
}

// ============================================
// FALLBACK PRODUCT
// ============================================
function showFallbackProduct(productId) {
    const fallbackProducts = {
        'pdf-250g': {
            name: 'PRADH Desi Fuel (250g)',
            price: 349,
            description: 'Perfect trial size package.',
            image: 'product1.jpeg',
            category: 'Desi Fuel',
            stock: 50
        },
        'pdf-500g': {
            name: 'PRADH Desi Fuel (500g)',
            price: 599,
            description: 'Standard balanced nutritional pack.',
            image: 'product1.jpeg',
            category: 'Desi Fuel',
            stock: 30
        },
        'pdf-1kg': {
            name: 'PRADH Desi Fuel (1 KG)',
            price: 1099,
            description: 'Maximum value health pack.',
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
        
        setTimeout(loadReviews, 500);
    }
}

// ============================================
// CHANGE MAIN IMAGE
// ============================================
function changeMainImage(src) {
    document.getElementById('mainImg').src = src;
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
    if (modal) {
        modal.style.display = 'block';
        modalImg.src = src;
    }
}

// ============================================
// ADD TO CART
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
    
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
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
// ===== REVIEWS FUNCTIONALITY =====
// ============================================

let selectedRating = 0;

// Get product ID from URL
function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || '';
}

// Set rating
function setRating(rating) {
    selectedRating = rating;
    updateStars(rating);
    
    const ratings = {
        1: 'Poor - Needs improvement',
        2: 'Fair - Average',
        3: 'Good - Satisfactory',
        4: 'Great - Recommended',
        5: 'Excellent - Highly recommended!'
    };
    const ratingText = document.getElementById('ratingText');
    if (ratingText) {
        ratingText.textContent = ratings[rating] || 'Select a rating';
    }
}

// Hover star
function hoverStar(rating) {
    const stars = document.querySelectorAll('.star-rating-container .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.style.color = '#facc15';
        } else {
            star.textContent = '☆';
            star.style.color = '#334155';
        }
    });
}

// Reset stars after hover
function resetStars() {
    updateStars(selectedRating);
}

// Update stars display
function updateStars(rating) {
    const stars = document.querySelectorAll('.star-rating-container .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('active');
            star.style.color = '#facc15';
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
            star.style.color = '#334155';
        }
    });
}

// Load product reviews
async function loadReviews() {
    const productId = getProductId();
    if (!productId) return;
    
    try {
        // Load review stats
        const statsResponse = await fetch(`/api/reviews/stats/${productId}`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            updateReviewSummary(statsData.stats);
        }
        
        // Load reviews
        const reviewsResponse = await fetch(`/api/reviews/product/${productId}`);
        const reviewsData = await reviewsResponse.json();
        
        if (reviewsData.success) {
            displayReviews(reviewsData.reviews);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            reviewsList.innerHTML = `
                <div class="review-error">
                    <i class="fas fa-exclamation-circle"></i>
                    Error loading reviews. Please refresh the page.
                </div>
            `;
        }
    }
}

// Update review summary
function updateReviewSummary(stats) {
    const total = stats.total || 0;
    const avg = stats.averageRating || 0;
    
    const avgRatingEl = document.getElementById('avgRating');
    const totalReviewsEl = document.getElementById('totalReviews');
    const starDisplayEl = document.getElementById('starDisplay');
    
    if (avgRatingEl) avgRatingEl.textContent = avg;
    if (totalReviewsEl) totalReviewsEl.textContent = total;
    
    if (starDisplayEl) {
        const fullStars = Math.floor(avg);
        starDisplayEl.textContent = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    }
    
    if (total > 0) {
        const distribution = stats.ratingDistribution || {};
        for (let i = 1; i <= 5; i++) {
            const count = distribution[i] || 0;
            const percentage = (count / total) * 100;
            const bar = document.getElementById(`bar${i}`);
            const countEl = document.getElementById(`count${i}`);
            if (bar) bar.style.width = percentage + '%';
            if (countEl) countEl.textContent = count;
        }
    }
}

// Display reviews
function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="no-reviews">
                <i class="fas fa-comment"></i>
                No reviews yet. Be the first to review this product!
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div class="review-card-dark">
            <div class="review-header">
                <div>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    <div class="review-user">${review.userName || 'Anonymous'}</div>
                </div>
                <div class="review-date">
                    <i class="far fa-calendar-alt"></i> ${new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            </div>
            <div class="review-comment">${review.comment}</div>
            <div class="review-verified">
                <i class="fas fa-check-circle"></i> Verified Purchase
            </div>
        </div>
    `).join('');
}

// Submit review
async function submitReview() {
    const productId = getProductId();
    if (!productId) {
        alert('Product ID not found');
        return;
    }
    
    if (selectedRating === 0) {
        document.getElementById('reviewMessage').innerHTML = '<span style="color: #ef4444;">❌ Please select a rating</span>';
        return;
    }
    
    const comment = document.getElementById('reviewComment').value.trim();
    if (!comment) {
        document.getElementById('reviewMessage').innerHTML = '<span style="color: #ef4444;">❌ Please write a review</span>';
        return;
    }
    
    const userName = document.getElementById('reviewerName').value.trim() || 'Anonymous';
    const productName = document.getElementById('pTitle')?.textContent || 'Product';
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: productId,
                productName: productName,
                rating: selectedRating,
                comment: comment,
                userName: userName,
                userEmail: localStorage.getItem('userEmail') || ''
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('reviewMessage').innerHTML = `
                <span style="color: #22c55e;">✅ ${data.message}</span>
            `;
            // Clear form
            document.getElementById('reviewComment').value = '';
            document.getElementById('reviewerName').value = '';
            selectedRating = 0;
            document.querySelectorAll('.star-rating-container .star').forEach(star => {
                star.textContent = '☆';
                star.classList.remove('active');
                star.style.color = '#334155';
            });
            document.getElementById('ratingText').textContent = 'Select a rating';
            
            // Reload reviews after 2 seconds
            setTimeout(() => {
                loadReviews();
            }, 2000);
        } else {
            document.getElementById('reviewMessage').innerHTML = `
                <span style="color: #ef4444;">❌ ${data.error}</span>
            `;
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        document.getElementById('reviewMessage').innerHTML = `
            <span style="color: #ef4444;">❌ Error submitting review: ${error.message}</span>
        `;
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadProductDetail();
    
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
window.setRating = setRating;
window.hoverStar = hoverStar;
window.resetStars = resetStars;
window.submitReview = submitReview;
window.loadReviews = loadReviews;
