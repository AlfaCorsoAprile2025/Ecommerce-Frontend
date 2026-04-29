const ProductsState = {
  page:  0,
  limit: 12,
  query: '',
  order: '',
};

let _searchTimer = null;

function initProducts() {
  document.getElementById('products-search').value = ProductsState.query;
  document.getElementById('products-sort').value   = ProductsState.order;

  document.getElementById('products-search').oninput = onSearchInput;
  document.getElementById('products-sort').onchange  = onSortChange;

  document.getElementById('btn-prev').onclick = function() {
    changePage(ProductsState.page - 1);
  };
  document.getElementById('btn-next').onclick = function() {
    changePage(ProductsState.page + 1);
  };

  loadProducts();
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '<p class="state-msg">Loading…</p>';

  const params = {
    limit:  ProductsState.limit,
    offset: ProductsState.page * ProductsState.limit,
  };
  if (ProductsState.query) {
    params.name = ProductsState.query;
  }
  if (ProductsState.order) {
    params.order = ProductsState.order;
  }

  try {
    const response = await Api.getProducts(params);

    let products = [];
    let total = 0;

    if (response !== null && response !== undefined) {
      if (response.data !== null && response.data !== undefined) {
        if (Array.isArray(response.data.results)) {
          products = response.data.results;
        }
        if (response.data.total !== undefined && response.data.total !== null) {
          total = response.data.total;
        }
      }
    }

    renderGrid(products);
    renderPagination(total);
  } catch (err) {
    grid.innerHTML = '<p class="state-msg">Failed to load products: ' + (err.message || 'Unknown error') + '</p>';
  }
}

function renderGrid(products) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  if (!products || products.length === 0) {
    grid.innerHTML = '<p class="state-msg">No products found.</p>';
    return;
  }

  products.forEach(function(p) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = function() {
      location.hash = '#product/' + p.id;
    };

    let imgHtml;
    if (p.imageurl) {
      imgHtml = `<img src="${escHtml(p.imageurl)}" alt="${escHtml(p.name)}" class="product-card-img"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <div class="product-card-img-placeholder" style="display:none;">🛍️</div>`;
    } else {
      imgHtml = `<div class="product-card-img-placeholder">🛍️</div>`;
    }

    let stockBadge;
    if (p.stockquantity > 0) {
      stockBadge = `<span class="badge badge-stock">In stock: ${p.stockquantity}</span>`;
    } else {
      stockBadge = `<span class="badge badge-out">Out of stock</span>`;
    }

    let categoryBadge;
    if (p.category) {
      categoryBadge = `<span class="badge badge-category">${escHtml(p.category)}</span>`;
    } else {
      categoryBadge = '';
    }

    card.innerHTML = `
      ${imgHtml}
      <div class="product-card-body">
        <div class="product-card-name">${escHtml(p.name)}</div>
        ${categoryBadge}
        <div class="product-card-footer">
          <span class="product-card-price">€${Number(p.price).toFixed(2)}</span>
          ${stockBadge}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function renderPagination(count) {
  document.getElementById('btn-prev').disabled = ProductsState.page === 0;
  document.getElementById('btn-next').disabled = count < ProductsState.limit;
  document.getElementById('page-info').textContent = 'Page ' + (ProductsState.page + 1);
}

function changePage(newPage) {
  if (newPage < 0) return;
  ProductsState.page = newPage;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onSearchInput(e) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function() {
    ProductsState.query = e.target.value.trim();
    ProductsState.page  = 0;
    loadProducts();
  }, 350);
}

function onSortChange(e) {
  ProductsState.order = e.target.value;
  ProductsState.page  = 0;
  loadProducts();
}
