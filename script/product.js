async function initProduct(id) {
  const content = document.getElementById('product-detail-content');
  content.innerHTML = '<p class="state-msg">Loading…</p>';

  try {
    const product = await Api.getProduct(id);
    renderProductDetail(product);
  } catch (err) {
    if (err && err.status === 404) {
      location.hash = '#404';
    } else {
      content.innerHTML = '<p class="state-msg">Failed to load product: ' + (err.message || 'Unknown error') + '</p>';
    }
  }
}

function renderProductDetail(p) {
  const content = document.getElementById('product-detail-content');

  if (!p) {
    location.hash = '#404';
    return;
  }

  let stockBadge;
  if (p.stock_quantity > 0) {
    stockBadge = `<span class="badge badge-stock" style="font-size:0.875rem;padding:0.3rem 0.75rem;">In stock: ${p.stock_quantity}</span>`;
  } else {
    stockBadge = `<span class="badge badge-out" style="font-size:0.875rem;padding:0.3rem 0.75rem;">Out of stock</span>`;
  }

  let imgHtml;
  if (p.imageurl) {
    imgHtml = `<img src="${escHtml(p.imageurl)}" alt="${escHtml(p.name)}" class="product-detail-img">`;
  } else {
    imgHtml = `<div class="product-detail-img-placeholder">🛍️</div>`;
  }

  let categoryBadge;
  if (p.category) {
    categoryBadge = `<span class="badge badge-category" style="align-self:flex-start;">${escHtml(p.category)}</span>`;
  } else {
    categoryBadge = '';
  }

  let descriptionHtml;
  if (p.description) {
    descriptionHtml = `<p class="product-detail-description">${escHtml(p.description)}</p>`;
  } else {
    descriptionHtml = '';
  }

  content.innerHTML = `
    <div class="product-detail-card">
      ${imgHtml}
      <div class="product-detail-body">
        ${categoryBadge}
        <h1 class="product-detail-name">${escHtml(p.name)}</h1>
        <div class="product-detail-price">€${Number(p.price).toFixed(2)}</div>
        ${stockBadge}
        ${descriptionHtml}
      </div>
    </div>
  `;
}
