// 1. Saare Products ka details data (Naye Prices aur Real Specifications ke sath)
const productsData = {
    "pdf-250g": {
        name: "PRADH Desi Fuel (250g Pack)",
        price: 349,
        originalPrice: 499,
        desc: "PRADH DESI FUEL is a traditional, preservative-free nutritional cereal mix. Formulated with a wholesome base of roasted grains like Chana, Malted Ragi, and Moong Dal, it is enriched with selected nuts and seeds. It contains 0% refined white sugar and is naturally sweetened with Dhaga Mishri. Infused with traditional botanicals like Ashwagandha and Shatavari, it offers a delicious chocolate flavor derived from original Dutch Cocoa and Natural Vanilla.",
        images: ["product1.jpeg", "product2.jpeg"],
        specs: {
            "Brand": "PRADH FOODS",
            "Product Name": "DESI FUEL (Roasted Grains, Nuts & Seeds Mix)",
            "Weight": "250 Grams",
            "Food Type": "🌿 100% Vegetarian",
            "Product Form": "Ready-to-Mix Fine Powder",
            "Container Type": "Food-Grade Stand-Up Zipper Pouch",
            "Maximum Shelf Life": "4 Months from batch preparation",
            "Proprietary Grain Base": "Whole Chickpeas, Malted Finger Millet (Ragi), Rolled Oats, Polished Yellow Moong Dal",
            "Premium Nut & Seed Blend": "California Almonds, High-Grade Cashews, Raw Walnuts, Pumpkin Seeds, Watermelon Seeds, Sunflower Seeds, Sun-Dried Fox Nuts (Makhana)",
            "Flavor & Sweetener Core": "Artisanal Thread Mishri Crystals, Premium Dutch-Processed Cocoa Powder, Natural Vanilla Bean Extract Powder, Green Cardamom",
            "Wellness Enrichment": "Fennel Seeds, Pure Ashwagandha Root, Shatavari Extract, Ginger Root Powder (Sonth), Mineral-Rich Pink Rock Salt",
            "Added Preservatives": "Zero Percent (Free from Artificial Preservatives and Synthetic Colors)",
            "Allergen Information": "Contains Tree Nuts (Almonds, Cashews, Walnuts)",
            "Country of Origin": "India 🇮🇳"
        }
    },
    "pdf-500g": {
        name: "PRADH Desi Fuel (500g Pack) - Most Popular",
        price: 599,
        originalPrice: 799,
        desc: "PRADH DESI FUEL is a traditional, preservative-free nutritional cereal mix. Formulated with a wholesome base of roasted grains like Chana, Malted Ragi, and Moong Dal, it is enriched with selected nuts and seeds. It contains 0% refined white sugar and is naturally sweetened with Dhaga Mishri. Infused with traditional botanicals like Ashwagandha and Shatavari, it offers a delicious chocolate flavor derived from original Dutch Cocoa and Natural Vanilla.",
        images: ["product1.jpeg", "product2.jpeg"],
        specs: {
            "Brand": "PRADH FOODS",
            "Product Name": "DESI FUEL (Roasted Grains, Nuts & Seeds Mix)",
            "Weight": "500 Grams",
            "Food Type": "🌿 100% Vegetarian",
            "Product Form": "Ready-to-Mix Fine Powder",
            "Container Type": "Food-Grade Stand-Up Zipper Pouch",
            "Maximum Shelf Life": "4 Months from batch preparation",
            "Proprietary Grain Base": "Whole Chickpeas, Malted Finger Millet (Ragi), Rolled Oats, Polished Yellow Moong Dal",
            "Premium Nut & Seed Blend": "California Almonds, High-Grade Cashews, Raw Walnuts, Pumpkin Seeds, Watermelon Seeds, Sunflower Seeds, Sun-Dried Fox Nuts (Makhana)",
            "Flavor & Sweetener Core": "Artisanal Thread Mishri Crystals, Premium Dutch-Processed Cocoa Powder, Natural Vanilla Bean Extract Powder, Green Cardamom",
            "Wellness Enrichment": "Fennel Seeds, Pure Ashwagandha Root, Shatavari Extract, Ginger Root Powder (Sonth), Mineral-Rich Pink Rock Salt",
            "Added Preservatives": "Zero Percent (Free from Artificial Preservatives and Synthetic Colors)",
            "Allergen Information": "Contains Tree Nuts (Almonds, Cashews, Walnuts)",
            "Country of Origin": "India 🇮🇳"
        }
    },
    "pdf-1kg": {
        name: "PRADH Desi Fuel (1 KG Mega Pack)",
        price: 1099,
        originalPrice: 1499,
        desc: "Maximum value health pack configuration. PRADH DESI FUEL is a traditional, preservative-free nutritional cereal mix. Formulated with a wholesome base of roasted grains like Chana, Malted Ragi, and Moong Dal, it is enriched with selected nuts and seeds. It contains 0% refined white sugar and is naturally sweetened with Dhaga Mishri. Infused with traditional botanicals like Ashwagandha and Shatavari, it offers a delicious chocolate flavor derived from original Dutch Cocoa and Natural Vanilla.",
        images: ["product1.jpeg", "product2.jpeg"],
        specs: {
            "Brand": "PRADH FOODS",
            "Product Name": "DESI FUEL (Roasted Grains, Nuts & Seeds Mix)",
            "Weight": "1 KG",
            "Food Type": "🌿 100% Vegetarian",
            "Product Form": "Ready-to-Mix Fine Powder",
            "Container Type": "Food-Grade Stand-Up Zipper Pouch",
            "Maximum Shelf Life": "4 Months from batch preparation",
            "Proprietary Grain Base": "Whole Chickpeas, Malted Finger Millet (Ragi), Rolled Oats, Polished Yellow Moong Dal",
            "Premium Nut & Seed Blend": "California Almonds, High-Grade Cashews, Raw Walnuts, Pumpkin Seeds, Watermelon Seeds, Sunflower Seeds, Sun-Dried Fox Nuts (Makhana)",
            "Flavor & Sweetener Core": "Artisanal Thread Mishri Crystals, Premium Dutch-Processed Cocoa Powder, Natural Vanilla Bean Extract Powder, Green Cardamom",
            "Wellness Enrichment": "Fennel Seeds, Pure Ashwagandha Root, Shatavari Extract, Ginger Root Powder (Sonth), Mineral-Rich Pink Rock Salt",
            "Added Preservatives": "Zero Percent (Free from Artificial Preservatives and Synthetic Colors)",
            "Allergen Information": "Contains Tree Nuts (Almonds, Cashews, Walnuts)",
            "Country of Origin": "India 🇮🇳"
        }
    }
};

// 2. Page load hote hi URL se ID nikal kar data load karna
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const product = productsData[productId];

    if (!product) {
        document.body.innerHTML = "<h2 style='text-align:center; margin-top:5rem; color:red;'>Product Not Found! ❌ <br><br><a href='product.html' style='font-size:1.2rem; color:green;'>Vapis Products Wale Page Par Jaane Ke liye click karein</a></h2>";
        return;
    }

    updateHeaderCartCount();

    // HTML Elements me data set karna
    document.getElementById('pTitle').innerText = product.name;
    document.getElementById('pPrice').innerText = "₹" + product.price;
    document.getElementById('pDesc').innerText = product.desc;
    
    // Flipkart Style Original Price and Dynamic Savings Display
    const originalPriceEl = document.getElementById('pOriginalPrice');
    const discountTagEl = document.getElementById('pDiscountTag');
    
    if (originalPriceEl && product.originalPrice) {
        originalPriceEl.innerText = "₹" + product.originalPrice;
        originalPriceEl.style.display = "inline";
        
        // Savings Calculation
        const savings = product.originalPrice - product.price;
        if(discountTagEl) {
            discountTagEl.innerText = `Aap bacha rahe hain ₹${savings}! 🔥`;
        }
    } else {
        if(originalPriceEl) originalPriceEl.style.display = "none";
        if(discountTagEl) discountTagEl.innerText = "";
    }
    
    // Main image default set karna
    const mainImg = document.getElementById('mainImg');
    if(product.images && product.images.length > 0) {
        mainImg.src = product.images[0];
    }

    // Thumbnails generation
    const thumbWrapper = document.getElementById('thumbWrapper');
    if(thumbWrapper) {
        thumbWrapper.innerHTML = "";
        if(product.images && product.images.length > 0) {
            product.images.forEach((imgUrl, index) => {
                const img = document.createElement('img');
                img.src = imgUrl;
                img.classList.add('thumb-img');
                if(index === 0) img.classList.add('active');

                img.addEventListener('click', () => {
                    mainImg.src = imgUrl;
                    document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
                    img.classList.add('active');
                });
                thumbWrapper.appendChild(img);
            });
        }
    }

    // Specifications dynamic parsing
    const specsBody = document.getElementById('specsBody');
    if(specsBody) {
        let specsHTML = "";
        for (let key in product.specs) {
            specsHTML += `
                <tr>
                    <td style="padding: 12px 8px; color: #777; font-weight: 500; width: 30%; vertical-align: top;">${key}</td>
                    <td style="padding: 12px 8px; color: #444; vertical-align: top;"><strong>${product.specs[key]}</strong></td>
                </tr>
            `;
        }
        specsBody.innerHTML = specsHTML;
    }

    // ADD TO CART BUTTON Logic
    const addToCartBtn = document.getElementById('addToCartBtn');
    if(addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
            let variantName = product.specs["Weight"] || "Standard";
            let existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name: "PRADH Desi Fuel",
                    price: product.price,
                    variant: variantName,
                    quantity: 1
                });
            }
            
            localStorage.setItem('pradh_cart', JSON.stringify(cart));
            alert(`🎉 ${product.name} Cart me add ho gaya hai bhai!`);
            updateHeaderCartCount();
        });
    }
});

function updateHeaderCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
        let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.innerText = totalItems;
    }
}

function openReviewModal(imgSrc) {
    const modal = document.getElementById("reviewImageModal");
    const modalImg = document.getElementById("imgModalTarget");
    if(modal && modalImg) {
        modal.style.display = "block";
        modalImg.src = imgSrc;
    }
}

function toggleSpecifications() {
    const container = document.getElementById("specsContainer");
    const btn = document.getElementById("toggleSpecsBtn");

    if (container && btn) {
        if (container.classList.contains("specs-collapsed")) {
            container.classList.remove("specs-collapsed");
            container.classList.add("specs-expanded");
            btn.innerHTML = "Read Less ↑";
        } else {
            container.classList.remove("specs-expanded");
            container.classList.add("specs-collapsed");
            btn.innerHTML = "Read More ↓";
        }
    }
}

function toggleFaq(button) {
    const faqItem = button.parentElement;
    const answer = button.nextElementSibling;
    
    if (faqItem.classList.contains("active")) {
        faqItem.classList.remove("active");
        if(answer) answer.style.maxHeight = null;
    } else {
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            const ans = item.querySelector('.faq-answer');
            if(ans) ans.style.maxHeight = null;
        });
        
        faqItem.classList.add("active");
        if(answer) answer.style.maxHeight = answer.scrollHeight + "px";
    }
}