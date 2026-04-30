const ProductsState = {
  page:         0,
  limit:        12,
  query:        '',
  order:        '',
  sellerFilter: false,
  editingId:    null,
  editingOwner: null,
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

  document.getElementById('btn-my-orders').classList.remove('hidden');

  if (ProductsState.sellerFilter) {
    document.getElementById('btn-my-products').classList.add('btn-ghost-active');
  }

  const roles = getUserRoles();
  const canAdd = roles.indexOf('ADMIN') !== -1 || roles.indexOf('SELLER') !== -1
              || roles.indexOf('ROLE_ADMIN') !== -1 || roles.indexOf('ROLE_SELLER') !== -1;
  const addBtn = document.getElementById('btn-add-product');
  const myProductsBtn = document.getElementById('btn-my-products');
  if (canAdd) {
    addBtn.classList.remove('hidden');
    myProductsBtn.classList.remove('hidden');
  } else {
    addBtn.classList.add('hidden');
    myProductsBtn.classList.add('hidden');
  }

  addBtn.onclick = function() {
    openProductModal(null);
  };

  document.getElementById('btn-my-products').onclick = function() {
    ProductsState.sellerFilter = !ProductsState.sellerFilter;
    ProductsState.page = 0;
    this.classList.toggle('btn-ghost-active', ProductsState.sellerFilter);
    loadProducts();
  };

  initProductModal();
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
  if (ProductsState.sellerFilter) {
    const uid = getUserId();
    if (uid) params.seller = uid;
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
    if (p.stock_quantity > 0) {
    stockBadge = `<span class="badge badge-stock">In stock: ${p.stock_quantity}</span>`;
    } else {
      stockBadge = `<span class="badge badge-out">Out of stock</span>`;
    }

    let categoryBadge;
    if (p.category) {
      categoryBadge = `<span class="badge badge-category">${escHtml(p.category)}</span>`;
    } else {
      categoryBadge = '';
    }

    const isOwner = p.prod_owner !== undefined && p.prod_owner !== null
                  && String(p.prod_owner) === String(getUserId());
    const actionsHtml = isOwner ? `
        <div class="card-actions">
          <button class="btn btn-ghost btn-card-action" data-action="edit" title="Modifica">✏️</button>
          <button class="btn btn-card-danger btn-card-action" data-action="delete" title="Elimina">🗑️</button>
        </div>` : '';

    card.innerHTML = `
      ${imgHtml}
      <div class="product-card-body">
        <div class="product-card-name">${escHtml(p.name)}</div>
        ${categoryBadge}
        <div class="product-card-footer">
          <span class="product-card-price">€${Number(p.price).toFixed(2)}</span>
          ${stockBadge}
        </div>
        ${actionsHtml}
      </div>
    `;

    grid.appendChild(card);

    if (isOwner) {
      card.querySelector('[data-action="edit"]').onclick = function(e) {
        e.stopPropagation();
        openProductModal(p);
      };
      card.querySelector('[data-action="delete"]').onclick = function(e) {
        e.stopPropagation();
        confirmDeleteProduct(p.id, p.name);
      };
    }
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

function openProductModal(product) {
  const errorEl = document.getElementById('modal-error');
  errorEl.textContent = '';
  if (product) {
    console.log("prod_owner", product.prod_owner);
    ProductsState.editingId    = product.id;
    ProductsState.editingOwner = product.prod_owner !== undefined ? product.prod_owner : null;
    
    document.getElementById('modal-title').textContent   = 'Modifica prodotto';
    document.getElementById('modal-submit').textContent  = 'Aggiorna';
    document.getElementById('modal-name').value          = product.name || '';
    document.getElementById('modal-price').value         = product.price !== undefined ? product.price : '';
    document.getElementById('modal-stock').value         = product.stock_quantity !== undefined ? product.stock_quantity : '';
    document.getElementById('modal-category').value      = product.category || '';
    document.getElementById('modal-imageurl').value      = product.image_url || '';
    document.getElementById('modal-description').value   = product.description || '';
  } else {
    ProductsState.editingId    = null;
    ProductsState.editingOwner = null;
    document.getElementById('modal-title').textContent   = 'Aggiungi prodotto';
    document.getElementById('modal-submit').textContent  = 'Salva';
    document.getElementById('product-form').reset();
  }
  document.getElementById('product-modal').classList.add('modal-open');
  console.log(ProductsState.editingOwner);
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('modal-open');
  ProductsState.editingId = null;
}

let _modalInitialized = false;
function initProductModal() {
  if (_modalInitialized) return;
  _modalInitialized = true;

  document.getElementById('modal-close').onclick  = closeProductModal;
  document.getElementById('modal-cancel').onclick = closeProductModal;

  document.getElementById('product-modal').onclick = function(e) {
    if (e.target === this) closeProductModal();
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeProductModal();
  });

  document.getElementById('product-form').onsubmit = handleProductFormSubmit;
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const errorEl   = document.getElementById('modal-error');
  const submitBtn = document.getElementById('modal-submit');
  errorEl.textContent = '';

  const name  = document.getElementById('modal-name').value.trim();
  const price = document.getElementById('modal-price').value.trim();

  if (!name || !price) {
    errorEl.textContent = 'Nome e prezzo sono obbligatori.';
    return;
  }

  const stockVal = document.getElementById('modal-stock').value;
  const data = {
    name:          name,
    price:         parseFloat(price),
    category:      document.getElementById('modal-category').value.trim() || undefined,
    description:   document.getElementById('modal-description').value.trim() || undefined,
    image_url:      document.getElementById('modal-imageurl').value.trim() || undefined,
    stock_quantity: stockVal !== '' ? parseInt(stockVal, 10) : undefined,
  };
  console.log("productState",ProductsState)
  if (ProductsState.editingId !== null) {
    if (ProductsState.editingOwner !== null) {
      data.prod_owner = ProductsState.editingOwner;
    }
  } else {
    data.prod_owner = getUserId();
  }

  submitBtn.disabled = true;
  const origText = submitBtn.textContent;
  submitBtn.textContent = 'Salvataggio…';

  try {
    if (ProductsState.editingId !== null) {
      await Api.updateProduct(ProductsState.editingId, data);
    } else {
      await Api.createProduct(data);
    }
    closeProductModal();
    ProductsState.page = 0;
    loadProducts();
  } catch (err) {
    errorEl.textContent = err.message || 'Errore durante il salvataggio.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = origText;
  }
}

async function confirmDeleteProduct(id, name) {
  if (!window.confirm('Eliminare "' + name + '"? L\'operazione non può essere annullata.')) return;
  try {
    await Api.deleteProduct(id);
    loadProducts();
  } catch (err) {
    alert('Errore durante l\'eliminazione: ' + (err.message || 'Errore sconosciuto'));
  }
}
