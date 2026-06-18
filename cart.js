document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartWrapper = document.getElementById('cart-wrapper');
    if (!cartWrapper) return;

    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];

    if (cart.length === 0) {
        cartWrapper.innerHTML = `
            <div class="empty-message">
                <p>Your shopping cart is currently empty.</p>
                <a href="product.html" class="btn btn-primary" style="margin-top: 1.5rem;">Explore Products</a>
            </div>`;
        return;
    }

    let cartHTML = `<div class="cart-container">`;
    let dynamicTotal = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        dynamicTotal += itemTotal;

        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Variant Size: ${item.variant}</p>
                </div>
                <div><strong>₹${item.price}</strong></div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="adjustQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="adjustQuantity(${index}, 1)">+</button>
                </div>
                <div><strong>₹${itemTotal}</strong></div>
                <div>
                    <button class="remove-btn" onclick="removeCartItem(${index})">Remove</button>
                </div>
            </div>
        `;
    });

    cartHTML += `
        <div class="cart-summary">
            <h3>Grand Total: <span>₹${dynamicTotal}</span></h3>
            <button class="btn btn-primary" onclick="openDetailsModal()" style="background-color: var(--accent-green); color: white;">
                ORDER NOW
            </button>
        </div>
    </div>`;

    cartWrapper.innerHTML = cartHTML;
}

function adjustQuantity(index, shift) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    cart[index].quantity += shift;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

// --- MODAL FUNCTIONS ---
function openDetailsModal() {
    document.getElementById('detailsModal').style.display = 'flex';
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

 async function handleFormSubmit(event) {
    event.preventDefault();

    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    if (cart.length === 0) {
        alert("Bhai cart khali hai!");
        return;
    }

    // 1. Form se customer details nikalna
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const pincode = document.getElementById('custPincode').value.trim();
    const payment = document.getElementById('paymentMethod').value;

    let dynamicTotal = 0;
    cart.forEach(item => {
        dynamicTotal += item.price * item.quantity;
    });

    // 2. BACKEND ME DATA SAVE KARNA
    // Hum customer details aur poora cart ek saath backend ko bhej rahe hain
    const orderData = {
        name,
        phone,
        address,
        pincode,
        payment,
        cart: cart, // Saare ordered items
        totalAmount: dynamicTotal
    };

    try {
     const response = await
     console.log("Data jo bhej rahe hain:", JSON.stringify(orderData));
      fetch("https://pradh-backend.onrender.com/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        // Agar backend me data sahi se save ho gaya, tabhi aage badhenge
        // Agar backend me data sahi se save ho gaya, tabhi aage badhenge
      if (response.ok) {
            // 1. Premium English Alert
            alert("🎉 Order Placed Successfully!\n\nYour order has been recorded in our system. Clicking 'OK' will now redirect you to WhatsApp to instantly connect with our executive and finalize your shipping details. Thank you for choosing Pradh Desi Fuel! 🔥");

            // 2. WhatsApp Message Template (Jo tumhara pehle se tha)
            let textMessage = `⚡ *NEW ORDER - PRADH DESI FUEL* ⚡\n\n`;
            textMessage += `👤 *CUSTOMER DETAILS:*\n`;
            textMessage += `• *Name:* ${name}\n`;
            textMessage += `• *Phone:* ${phone}\n`;
            textMessage += `• *Address:* ${address}\n`;
            textMessage += `• *Pincode:* ${pincode}\n`;
            textMessage += `• *Payment Mode:* ${payment}\n\n`;
            
            textMessage += `📦 *ORDERED ITEMS:*\n`;
            textMessage += `-----------------------------------\n`;

            cart.forEach((item) => {
                let sub = item.price * item.quantity;
                textMessage += `• ${item.name} (${item.variant}) x ${item.quantity} = *₹${sub}*\n`;
            });

            textMessage += `-----------------------------------\n`;
            textMessage += `💰 *Grand Total Amount:* ₹${dynamicTotal}\n\n`;
            textMessage += `Please confirm my order and share shipping updates!`;

            const encodedText = encodeURIComponent(textMessage);
            const targetWhatsAppNumber = "918979993655"; 
            const finalWhatsAppUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodedText}`;

            // 3. Cart saaf karo aur modal band karo
            localStorage.removeItem('pradh_cart');
            closeDetailsModal();

            // 4. 🔥 Sabsbe zaroori change - window.open HATA DIYA HAI yahan se
            // Yeh line browser ko bina block kiye usi tab me WhatsApp par bhej degi
            window.location.assign(finalWhatsAppUrl);
        
        }
         else {
            alert("Server Error: " + result.message);
        }
    } catch (error) {
        console.error(error);
        alert("Backend server band hai bhai! Terminal me 'node server.js' chalao tabhi order save hoga.");
    }
}
async function fetchMyOrders() {
    const phoneInput = document.getElementById('searchOrderPhone').value.trim();
    const ordersWrapper = document.getElementById('my-orders-wrapper');
    
    if (!phoneInput || phoneInput.length !== 10) {
        alert("Bhai, apna sahi 10-digit WhatsApp number daalo!");
        return;
    }

    ordersWrapper.innerHTML = "<p style='text-align:center;'>Tracking your orders... 🔄</p>";

    try {
       const response = await fetch("https://pradh-backend.onrender.com/api/orders");
        if (!response.ok) throw new Error("Failed to fetch data");

        const allOrders = await response.json();
        const myOrders = allOrders.filter(order => order.phone === phoneInput);

        if (myOrders.length === 0) {
            ordersWrapper.innerHTML = `
                <div style="text-align: center; padding: 2rem; border: 1px solid #eee; background: #f9f9f9; border-radius: 8px;">
                    <p style="color: red; font-weight: bold;">No orders found for this number! ❌</p>
                </div>`;
            return;
        }

        let ordersHTML = "";
        
        myOrders.reverse().forEach(order => {
            // 📝 STATUS CHECK: Agar backend me status nahi hai, toh default "Placed" maanenge
            const currentStatus = order.status || "Placed"; 
            
            // Timeline line ki width set karne ke liye logic (Flipkart style progress)
            let progressWidth = "0%";
            let placedClass = "active", shippedClass = "", deliveredClass = "";

            if (currentStatus === "Shipped") {
                progressWidth = "50%";
                shippedClass = "active";
            } else if (currentStatus === "Delivered") {
                progressWidth = "100%";
                shippedClass = "active";
                deliveredClass = "active";
            }

            let itemsListHTML = "";
            if (order.cart && order.cart.length > 0) {
                order.cart.forEach(item => {
                    itemsListHTML += `<li style="margin-bottom: 5px;">• ${item.name} (${item.variant}) x ${item.quantity} - <strong>₹${item.price * item.quantity}</strong></li>`;
                });
            } else {
                itemsListHTML = "<li>No item details available</li>";
            }

            ordersHTML += `
                <div style="border: 1px solid #ddd; padding: 1.5rem; margin-bottom: 2rem; border-radius: 8px; background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1rem;">
                        <span style="font-size: 0.85rem; color: #777;">🗓️ Date: ${order.date || 'N/A'}</span>
                        <span style="background: #e8f5e9; color: #2e7d32; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">Status: ${currentStatus}</span>
                    </div>

                    <h4 style="margin-bottom: 1rem; color: #333;">Order ID: #${order.id}</h4>

                    <div class="timeline-container">
                        <div class="timeline-line"></div>
                        <div class="timeline-line-progress" style="width: ${progressWidth};"></div>
                        
                        <div class="timeline-step ${placedClass}">
                            <div class="step-circle">📝</div>
                            <div class="step-label">Ordered</div>
                        </div>
                        <div class="timeline-step ${shippedClass}">
                            <div class="step-circle">🚚</div>
                            <div class="step-label">Shipped</div>
                        </div>
                        <div class="timeline-step ${deliveredClass}">
                            <div class="step-circle">✅</div>
                            <div class="step-label">Delivered</div>
                        </div>
                    </div>
                    <p style="margin: 3px 0; font-size: 0.9rem; margin-top: 1.5rem;"><strong>Deliver To:</strong> ${order.name}</p>
                    <p style="margin: 3px 0; font-size: 0.9rem;"><strong>Address:</strong> ${order.address}, ${order.pincode}</p>
                    
                    <div style="background: #fdfaf6; border: 1px solid #f5ebd6; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                        <h5 style="margin-top: 0; margin-bottom: 0.5rem; color: #d87a00;">📦 Items Ordered:</h5>
                        <ul style="list-style: none; padding-left: 0; margin: 0; font-size: 0.9rem;">
                            ${itemsListHTML}
                        </ul>
                    </div>
                    <div style="margin-top: 1rem; text-align: right; font-size: 1.1rem;">
                        <strong>Grand Total: <span style="color: #2e7d32;">₹${order.totalAmount || 0}</span></strong>
                    </div>
                </div>
            `;
        });

        ordersWrapper.innerHTML = `<div style="max-width: 600px; margin: 0 auto;">${ordersHTML}</div>`;

    } catch (error) {
        console.error(error);
        ordersWrapper.innerHTML = "<p style='text-align:center; color: red;'>Server disconnected! Make sure backend is running.</p>";
    }
}