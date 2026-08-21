// ============================================
// PRODUCT DETAIL - MAIN JAVASCRIPT
// ============================================

// ============================================
// STATE
// ============================================
let currentProduct = null;
let selectedRating = 0;
let quantity = 1;
let currentTab = 'specs';

// ============================================
// DOM ELEMENTS
// ============================================
const mainImg = document.getElementById('mainImg');
const thumbWrapper = document.getElementById('thumbWrapper');
const pTitle = document.getElementById('pTitle');
const pPrice = document.getElementById('pPrice');
const pOriginalPrice = document.getElementById('pOriginalPrice');
const pDiscountTag = document.getElementById('pDiscountTag');
const pDesc = document.getElementById('pDesc');
const stockText = document.getElementById('stockText');
const stockStatus = document.getElementById('stockStatus');
const addToCartBtn = document.getElementById('addToCartBtn');
const quantityDisplay = document.getElementById('quantityDisplay');
const specsBody = document.getElementById('specsBody');
const faqContainer = document.getElementById('faqContainer');
const breadcrumbProduct = document.getElementById('breadcrumbProduct');
const starDisplay = document.getElementById('starDisplay');
const ratingCount = document.getElementById('ratingCount');

// ============================================
// GET PRODUCT ID
// ============================================
function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ============================================
// LOAD PRODUCT DETAIL
// ============================================
async function loadProductDetail() {
    const productId = getProductId();
    if (!productId) {
        showError('Product ID not found');
        return;
    }

    try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();

        if (data.success && data.products) {
            const product = data.products.find(p => p.id === productId);
            if (product) {
                currentProduct = product;
                renderProduct(product);
                loadReviews();
                loadRelatedProducts(product);
                return;
            }
        }

        // Fallback products
        const fallback = getFallbackProduct(productId);
        if (fallback) {
            currentProduct = fallback;
            renderProduct(fallback);
            loadReviews();
            loadRelatedProducts(fallback);
        } else {
            showError('Product not found');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        const fallback = getFallbackProduct(productId);
        if (fallback) {
            currentProduct = fallback;
            renderProduct(fallback);
            loadReviews();
            loadRelatedProducts(fallback);
        } else {
            showError('Error loading product');
        }
    }
}

// ============================================
// FALLBACK PRODUCTS
// ============================================
function getFallbackProduct(id) {
    const fallbacks = {
        'pdf-250g': {
            id: 'pdf-250g',
            name: 'PRADH Desi Fuel (250g)',
            price: 349,
            originalPrice: 499,
            description: 'Perfect trial size package. Made with premium roasted grains, nuts, and Ayurvedic herbs for daily energy.',
            image: 'product1.jpeg',
            images: ['product1.jpeg', 'product2.jpeg'],
            category: 'Classic',
            stock: 50,
            rating: 4.6,
            reviews: 89,
            sku: 'PDF-250G',
            ingredients: 'Roasted Chana, Almonds, Cashews, Ashwagandha, Shatavari',
            benefits: 'Energy Boost, Muscle Recovery, Immunity Support',
            usage: '2 tbsp with 250ml warm milk'
        },
        'pdf-500g': {
            id: 'pdf-500g',
            name: 'PRADH Desi Fuel (500g)',
            price: 599,
            originalPrice: 799,
            description: 'Standard balanced nutritional pack. Perfect for daily consumption with maximum benefits.',
            image: 'product1.jpeg',
            images: ['product1.jpeg', 'product2.jpeg'],
            category: 'Premium',
            stock: 30,
            rating: 4.8,
            reviews: 127,
            sku: 'PDF-500G',
            ingredients: 'Roasted Chana, Almonds, Cashews, Ashwagandha, Shatavari',
            benefits: 'Energy Boost, Muscle Recovery, Immunity Support',
            usage: '2 tbsp with 250ml warm milk'
        },
        'pdf-1kg': {
            id: 'pdf-1kg',
            name: 'PRADH Desi Fuel (1 KG)',
            price: 1099,
            originalPrice: 1499,
            description: 'Maximum value health pack. Best for families and fitness enthusiasts.',
            image: 'product1.jpeg',
            images: ['product1.jpeg', 'product2.jpeg'],
            category: 'Premium',
            stock: 75,
            rating: 4.9,
            reviews: 203,
            sku: 'PDF-1KG',
            ingredients: 'Roasted Chana, Almonds, Cashews, Ashwagandha, Shatavari',
            benefits: 'Energy Boost, Muscle Recovery, Immunity Support',
            usage: '2 tbsp with 250ml warm milk'
        }
    };
    return fallbacks[id] || null;
}

// ============================================
// RENDER PRODUCT
// ============================================
function renderProduct(product) {
    // Title & Breadcrumb
    pTitle.textContent = product.name;
    breadcrumbProduct.textContent = product.name;

    // Price
    pPrice.textContent = '₹' + product.price;
    if (product.originalPrice) {
        pOriginalPrice.textContent = '₹' + product.originalPrice;
        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        pDiscountTag.textContent = discount + '% OFF';
    } else {
        pOriginalPrice.style.display = 'none';
        pDiscountTag.style.display = 'none';
    }

    // Description
    pDesc.textContent = product.description || 'Premium Desi Fuel blend for health and wellness.';

    // Stock Status
    if (product.stock > 0) {
        stockText.textContent = 'In Stock';
        stockText.className = 'in-stock';
        stockStatus.querySelector('.dot').className = 'dot in-stock';
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
    } else {
        stockText.textContent = 'Out of Stock';
        stockText.className = 'out-of-stock';
        stockStatus.querySelector('.dot').className = 'dot out-of-stock';
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = '<i class="fas fa-times-circle"></i> Out of Stock';
    }

    // Rating Display
    const rating = product.rating || 0;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? '★' : '';
    const emptyStars = '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));
    starDisplay.textContent = '★'.repeat(fullStars) + halfStar + emptyStars;
    ratingCount.textContent = (product.reviews || 0) + ' reviews';

    // Main Image
    mainImg.src = product.image || 'product1.jpeg';
    mainImg.alt = product.name;

    // Thumbnails
    const images = product.images || [product.image || 'product1.jpeg', 'product2.jpeg'];
    thumbWrapper.innerHTML = images.map((img, index) => `
        <img src="${img}" alt="Product view ${index + 1}" 
             class="thumb-img ${index === 0 ? 'active' : ''}" 
             onclick="changeMainImage('${img}', this)">
    `).join('');

    // Specifications
    const specs = [
        ['Product Name', product.name],
        ['Category', product.category || 'Desi Fuel'],
        ['Price', '₹' + product.price],
        ['Stock', product.stock > 0 ? 'In Stock' : 'Out of Stock'],
        ['SKU', product.sku || 'N/A'],
        ['Ingredients', product.ingredients || 'Pure Roasted Chana, Almonds, Cashews, Ashwagandha, Shatavari'],
        ['Benefits', product.benefits || 'Energy Boost, Muscle Recovery, Immunity Support'],
        ['Usage', product.usage || '2 tbsp with 250ml warm milk']
    ];
    specsBody.innerHTML = specs.map(([key, value]) => `
        <tr><td>${key}</td><td>${value}</td></tr>
    `).join('');

    // FAQs
    const faqs = [
        {
            q: 'Kya DESI FUEL me refined sugar hai?',
            a: 'Bilkul nahi! Hum zero refined sugar use karte hain. Isme mithaas ke liye sirf premium Artisanal Thread Mishri (Dhaga Mishri) crystals ka use kiya gaya hai.'
        },
        {
            q: 'Ise kaun kaun consume kar sakta hai?',
            a: 'Yeh 100% natural roasted grains aur nuts ka blend hai. 2 saal se bade bacchon se lekar ghar ke buzurgon tak sabhi ise pee sakte hain.'
        },
        {
            q: 'Ashwagandha aur Shatavari ka kya role hai?',
            a: 'Ashwagandha body me energy, stamina aur stress management improve karta hai, jabki Shatavari overall strength aur immunity badhati hai.'
        },
        {
            q: 'Delivery me kitna samay lagta hai?',
            a: 'Uttar Pradesh aur Delhi-NCR me 2-3 din, baaki India me 3-5 working days mein order aapke ghar pahunch jayega.'
        }
    ];
    faqContainer.innerHTML = faqs.map((faq, index) => `
        <div class="faq-item">
            <button class="faq-question" onclick="toggleFaq(this)">
                <span>${faq.q}</span>
                <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer"><p>${faq.a}</p></div>
        </div>
    `).join('');

    // Reset quantity
    quantity = 1;
    quantityDisplay.textContent = quantity;
}

// ============================================
// CHANGE MAIN IMAGE
// ============================================
function changeMainImage(src, thumb) {
    mainImg.src = src;
    document.querySelectorAll('.thumb-img').forEach(img => {
        img.classList.remove('active');
    });
    if (thumb) thumb.classList.add('active');
}

// ============================================
// QUANTITY CONTROLS
// ============================================
function incrementQuantity() {
    if (currentProduct && quantity < (currentProduct.stock || 99)) {
        quantity++;
        quantityDisplay.textContent = quantity;
    }
}

function decrementQuantity() {
    if (quantity > 1) {
        quantity--;
        quantityDisplay.textContent = quantity;
    }
}

// ============================================
// ADD TO CART
// ============================================
function addToCart() {
    if (!currentProduct) return;
    if (currentProduct.stock <= 0) {
        showNotification('Product is out of stock!', 'error');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item.id === currentProduct.id);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            quantity: quantity,
            image: currentProduct.image || 'product1.jpeg',
            variant: currentProduct.category || 'Standard'
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showNotification(`${currentProduct.name} added to cart! 🛒`);
    quantity = 1;
    quantityDisplay.textContent = quantity;
}

// ============================================
// UPDATE CART BADGE
// ============================================
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = total;
        if (total > 0) {
            badge.classList.add('visible');
            badge.classList.remove('pulse');
            void badge.offsetWidth;
            badge.classList.add('pulse');
        } else {
            badge.classList.remove('visible');
        }
    }
}

// ============================================
// NOTIFICATION
// ============================================
function showNotification(message, type = 'success') {
    document.querySelectorAll('.notification-toast').forEach(el => el.remove());

    const bg = type === 'error' ? '#ef4444' : '#22c55e';
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.textContent = message;
    toast.style.background = bg;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ============================================
// TABS
// ============================================
document.querySelectorAll('.p-tabs-nav button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.p-tabs-nav button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const tab = this.dataset.tab;
        document.querySelectorAll('.p-tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
        currentTab = tab;
    });
});

// ============================================
// TOGGLE FAQ
// ============================================
function toggleFaq(element) {
    const item = element.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');

    if (item.classList.contains('active')) {
        item.classList.remove('active');
        answer.style.maxHeight = '0';
        icon.textContent = '+';
    } else {
        document.querySelectorAll('.faq-item').forEach(el => {
            el.classList.remove('active');
            el.querySelector('.faq-answer').style.maxHeight = '0';
            el.querySelector('.faq-icon').textContent = '+';
        });
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.textContent = '✕';
    }
}

// ============================================
// ===== REVIEWS SYSTEM =====
// ============================================

function setRating(rating) {
    selectedRating = rating;
    const stars = document.querySelectorAll('.star-rating-container .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('active');
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
        }
    });
    const texts = {
        1: 'Poor - Needs improvement',
        2: 'Fair - Average',
        3: 'Good - Satisfactory',
        4: 'Great - Recommended',
        5: 'Excellent - Highly recommended!'
    };
    document.getElementById('ratingText').textContent = texts[rating] || 'Select a rating';
}

function hoverStar(rating) {
    const stars = document.querySelectorAll('.star-rating-container .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
        } else {
            star.textContent = '☆';
        }
    });
}

function resetStars() {
    setRating(selectedRating);
}

async function loadReviews() {
    const productId = getProductId();
    if (!productId) return;

    try {
        const response = await fetch(`/api/reviews/product/${productId}`);
        const data = await response.json();

        if (data.success) {
            const reviews = data.reviews || [];
            displayReviews(reviews);
            updateReviewSummary(reviews);
        }
    } catch (error) {
        console.warn('Error loading reviews, using sample data');
        loadSampleReviews();
    }
}

function loadSampleReviews() {
    const reviews = [
        {
            rating: 5,
            userName: 'Vikram Singh',
            comment: 'Best organic supplement I\'ve ever used! Energy levels solid all day.',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            rating: 5,
            userName: 'Dr. Rohan Mehta',
            comment: 'The best part is no refined sugar. Clean, pure, authentic taste.',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
            rating: 4,
            userName: 'Priya Sharma',
            comment: 'Great product! My husband loves it. Will order again.',
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
        }
    ];
    displayReviews(reviews);
    updateReviewSummary(reviews);
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (!reviews || reviews.length === 0) {
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
                    <i class="far fa-calendar-alt"></i> 
                    ${new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            </div>
            <div class="review-comment">${review.comment}</div>
            <div class="review-verified"><i class="fas fa-check-circle"></i> Verified Purchase</div>
        </div>
    `).join('');
}

function updateReviewSummary(reviews) {
    if (!reviews || reviews.length === 0) {
        document.getElementById('avgRating').textContent = '0';
        document.getElementById('totalReviews').textContent = '0';
        document.getElementById('reviewStarDisplay').textContent = '☆☆☆☆☆';
        return;
    }

    const total = reviews.length;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = (sum / total).toFixed(1);

    document.getElementById('avgRating').textContent = avg;
    document.getElementById('totalReviews').textContent = total;

    const fullStars = Math.floor(avg);
    document.getElementById('reviewStarDisplay').textContent = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

    // Distribution
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });

    for (let i = 1; i <= 5; i++) {
        const count = dist[i] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const bar = document.getElementById(`bar${i}`);
        const countEl = document.getElementById(`count${i}`);
        if (bar) bar.style.width = pct + '%';
        if (countEl) countEl.textContent = count;
    }
}

async function submitReview() {
    const productId = getProductId();
    if (!productId) {
        document.getElementById('reviewMessage').innerHTML = '<span style="color:#ef4444;">❌ Product ID not found</span>';
        return;
    }

    if (selectedRating === 0) {
        document.getElementById('reviewMessage').innerHTML = '<span style="color:#ef4444;">❌ Please select a rating</span>';
        return;
    }

    const comment = document.getElementById('reviewComment').value.trim();
    if (!comment) {
        document.getElementById('reviewMessage').innerHTML = '<span style="color:#ef4444;">❌ Please write a review</span>';
        return;
    }

    const userName = document.getElementById('reviewerName').value.trim() || 'Anonymous';

    const reviewData = {
        productId: productId,
        productName: currentProduct?.name || 'Product',
        rating: selectedRating,
        comment: comment,
        userName: userName,
        userEmail: localStorage.getItem('userEmail') || ''
    };

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('reviewMessage').innerHTML = `
                <span style="color:#22c55e;">✅ ${data.message || 'Review submitted successfully!'}</span>
            `;
            document.getElementById('reviewComment').value = '';
            document.getElementById('reviewerName').value = '';
            selectedRating = 0;
            document.querySelectorAll('.star-rating-container .star').forEach(star => {
                star.textContent = '☆';
                star.classList.remove('active');
            });
            document.getElementById('ratingText').textContent = 'Select a rating';
            setTimeout(loadReviews, 1500);
        } else {
            document.getElementById('reviewMessage').innerHTML = `<span style="color:#ef4444;">❌ ${data.error || 'Error submitting review'}</span>`;
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        document.getElementById('reviewMessage').innerHTML = `
            <span style="color:#ef4444;">❌ Error: ${error.message}</span>
        `;
    }
}

// ============================================
// RELATED PRODUCTS
// ============================================
async function loadRelatedProducts(product) {
    try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();

        let related = [];
        if (data.success && data.products) {
            related = data.products
                .filter(p => p.id !== product.id)
                .slice(0, 4);
        }

        if (related.length === 0) {
            related = getFallbackRelated(product);
        }

        const container = document.getElementById('relatedGrid');
        const section = document.getElementById('relatedSection');

        if (related.length > 0) {
            section.style.display = 'block';
            container.innerHTML = related.map(p => `
                <a href="product-detail.html?id=${p.id}" class="related-card">
                    <img src="${p.image || 'product1.jpeg'}" alt="${p.name}" loading="lazy">
                    <div class="info">
                        <h4>${p.name}</h4>
                        <div class="price">₹${p.price}</div>
                    </div>
                </a>
            `).join('');
        }
    } catch (error) {
        console.warn('Error loading related products');
    }
}

function getFallbackRelated(product) {
    const all = [
        { id: 'pdf-250g', name: 'PRADH Desi Fuel (250g)', price: 349, image: 'product1.jpeg' },
        { id: 'pdf-500g', name: 'PRADH Desi Fuel (500g)', price: 599, image: 'product1.jpeg' },
        { id: 'pdf-1kg', name: 'PRADH Desi Fuel (1 KG)', price: 1099, image: 'product1.jpeg' }
    ];
    return all.filter(p => p.id !== product.id).slice(0, 3);
}

// ============================================
// ERROR HANDLER
// ============================================
function showError(message) {
    document.getElementById('pTitle').textContent = 'Product Not Found';
    document.getElementById('pDesc').textContent = message;
    document.getElementById('addToCartBtn').disabled = true;
    document.getElementById('addToCartBtn').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Not Available';
}

// ============================================
// NAVBAR - MOBILE MENU
// ============================================
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

menuToggle?.addEventListener('click', function() {
    this.classList.toggle('active');
    navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-links-new a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle?.classList.remove('active');
        navLinks?.classList.remove('open');
    });
});

// ============================================
// NAVBAR - SCROLL EFFECT
// ============================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', function() {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
});

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadProductDetail();
    updateCartBadge();

    // Add to cart button
    addToCartBtn?.addEventListener('click', addToCart);

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) updateCartBadge();
    });
});

// Make functions globally available
window.changeMainImage = changeMainImage;
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;
window.addToCart = addToCart;
window.toggleFaq = toggleFaq;
window.setRating = setRating;
window.hoverStar = hoverStar;
window.resetStars = resetStars;
window.submitReview = submitReview;
window.loadReviews = loadReviews;