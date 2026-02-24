// content.js - Scrapes product info

function scrapeProduct() {
    const getMeta = (name) => document.querySelector(`meta[property="${name}"]`)?.content || document.querySelector(`meta[name="${name}"]`)?.content;

    const product = {
        title: getMeta('og:title') || document.title,
        image: getMeta('og:image'),
        description: getMeta('og:description'),
        url: window.location.href,
        price: getMeta('product:price:amount') || document.querySelector('.price')?.innerText || null,
        currency: getMeta('product:price:currency') || 'USD'
    };

    // Basic check to see if it looks like a product (has price or is on a known store)
    // For demo, we return everything.
    return product;
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scan") {
        const data = scrapeProduct();
        sendResponse(data);
    }
});
