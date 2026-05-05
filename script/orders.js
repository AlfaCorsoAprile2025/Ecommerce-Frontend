const OrdersState = {
  page:   0,
  limit:  10,
  query:  '',
  status: '',
  order:  '',
};

let _ordersSearchTimer = null;

function initOrders() {
  document.getElementById('orders-search').value = OrdersState.query;
  document.getElementById('orders-sort').value   = OrdersState.order;
  document.getElementById('orders-status').value = OrdersState.status;

  document.getElementById('orders-search').oninput = function(e) {
    clearTimeout(_ordersSearchTimer);
    _ordersSearchTimer = setTimeout(function() {
      OrdersState.query = e.target.value.trim();
      OrdersState.page  = 0;
      loadOrders();
    }, 350);
  };

  document.getElementById('orders-sort').onchange = function(e) {
    OrdersState.order = e.target.value;
    OrdersState.page  = 0;
    loadOrders();
  };

  document.getElementById('orders-status').onchange = function(e) {
    OrdersState.status = e.target.value;
    OrdersState.page   = 0;
    loadOrders();
  };

  document.getElementById('orders-btn-prev').onclick = function() {
    if (OrdersState.page > 0) {
      OrdersState.page--;
      loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  document.getElementById('orders-btn-next').onclick = function() {
    OrdersState.page++;
    loadOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  loadOrders();
}

async function loadOrders() {
  const grid = document.getElementById('orders-grid');
  grid.innerHTML = '<p class="state-msg">Loading…</p>';

  const params = {
    limit:  OrdersState.limit,
    offset: OrdersState.page * OrdersState.limit,
  };
  if (OrdersState.query)  params.name   = OrdersState.query;
  if (OrdersState.status) params.status = OrdersState.status;
  if (OrdersState.order)  params.order  = OrdersState.order;

  const roles   = getUserRoles();
  const isAdmin = roles.indexOf('ADMIN') !== -1 || roles.indexOf('ROLE_ADMIN') !== -1;
  if (!isAdmin) {
    const uid = getUserId();
    if (uid) params.user = uid;
  }

  try {
    const response = await Api.getOrders(params);

    let orders = [];

    if (response && response.data) {
      if (Array.isArray(response.data.results)) {
        orders = response.data.results;
      } else if (Array.isArray(response.data)) {
        orders = response.data;
      }
    } else if (Array.isArray(response)) {
      orders = response;
    }

    renderOrders(orders);
    renderOrdersPagination(orders.length);
  } catch (err) {
    grid.innerHTML = '<p class="state-msg">Errore nel caricamento ordini: ' + (err.message || 'Errore sconosciuto') + '</p>';
  }
}

const STATUS_LABELS = {
  PENDING:        'Pending',
  PAYMENT_FAILED: 'Payment Failed',
  CONFIRMED:      'Confirmed',
  PROCESSING:     'Processing',
  SHIPPED:        'Shipped',
  DELIVERED:      'Delivered',
  CANCELLED:      'Cancelled',
  REFUNDED:       'Refunded',
};

function renderStatusBadge(status) {
  const label = STATUS_LABELS[status] || escHtml(status);
  return '<span class="badge badge-status badge-status-' + escHtml(status.toLowerCase()) + '">' + label + '</span>';
}

function renderOrders(orders) {
  const grid = document.getElementById('orders-grid');
  grid.innerHTML = '';

  if (!orders || orders.length === 0) {
    grid.innerHTML = '<p class="state-msg">Nessun ordine trovato.</p>';
    return;
  }

  orders.forEach(function(o) {
    const row = document.createElement('div');
    row.className = 'order-accordion';

    const date = o.date ? new Date(o.date).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }) : '—';

    row.innerHTML =
      '<div class="order-header">' +
        '<span class="order-col order-col-name">' + escHtml(o.name) + '</span>' +
        '<span class="order-col order-col-date">' + date + '</span>' +
        '<span class="order-col order-col-total">€' + Number(o.total).toFixed(2) + '</span>' +
        '<span class="order-col order-col-status">' + renderStatusBadge(o.status) + '</span>' +
        '<span class="accordion-chevron">&#8250;</span>' +
      '</div>' +
      '<div class="order-body"></div>';

    const header = row.querySelector('.order-header');
    const body   = row.querySelector('.order-body');

    header.onclick = function() {
      const isOpen = row.classList.contains('open');
      document.querySelectorAll('.order-accordion.open').forEach(function(el) {
        el.classList.remove('open');
        el.querySelector('.order-body').innerHTML = '';
      });
      if (!isOpen) {
        row.classList.add('open');
        loadOrderDetail(o.id, body);
      }
    };

    grid.appendChild(row);
  });
}

async function loadOrderDetail(id, bodyEl) {
  bodyEl.innerHTML = '<p class="state-msg" style="padding:1rem;">Loading…</p>';
  try {
    const response = await Api.getOrder(id);
    const order = (response && response.data) ? response.data : response;
    renderOrderDetail(order, bodyEl);
  } catch (err) {
    bodyEl.innerHTML = '<p class="state-msg" style="padding:1rem;">Errore: ' + (err.message || 'Errore sconosciuto') + '</p>';
  }
}

function renderOrdersPagination(count) {
  document.getElementById('orders-btn-prev').disabled = OrdersState.page === 0;
  document.getElementById('orders-btn-next').disabled = count < OrdersState.limit;
  document.getElementById('orders-page-info').textContent = 'Page ' + (OrdersState.page + 1);
}
