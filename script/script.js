const ROUTES = {
  '#login':       { view: 'view-login',       init: initLogin,       auth: false },
  '#register':    { view: 'view-register',    init: initRegister,    auth: false },
  '#verify-otp':  { view: 'view-verify-otp',  init: initVerifyOtp,   auth: false },
  '#products':    { view: 'view-products',    init: initProducts,    auth: true  },
  '#orders':      { view: 'view-orders',      init: initOrders,      auth: true  },
  '#404':         { view: 'view-404',         init: function() {},   auth: false },
};

function showView(viewId) {
  document.querySelectorAll('.view').forEach(function(v) {
    v.classList.remove('active');
  });
  document.getElementById(viewId).classList.add('active');
}

function navigate() {
  const hash = location.hash || '#login';
  const nav  = document.getElementById('main-nav');

  // Product detail: #product/<id>
  if (hash.startsWith('#product/')) {
    const productId = hash.split('/')[1];
    if (!productId) {
      location.hash = '#404';
      return;
    }
    if (!Api.hasToken()) {
      location.hash = '#login';
      return;
    }
    showView('view-product');
    nav.classList.remove('hidden');
    initProduct(productId);
    return;
  }

  let route = ROUTES[hash];
  if (route === undefined || route === null) {
    route = ROUTES['#404'];
  }

  // Guard: protected route without a token
  if (route.auth && !Api.hasToken()) {
    location.hash = '#login';
    return;
  }

  // Guard: already authenticated, no need to see login/register
  if (!route.auth && Api.hasToken() && (hash === '#login' || hash === '#register')) {
    location.hash = '#products';
    return;
  }

  showView(route.view);

  if (Api.hasToken()) {
    nav.classList.remove('hidden');
  } else {
    nav.classList.add('hidden');
  }

  route.init();
}

window.addEventListener('hashchange', navigate);
document.addEventListener('DOMContentLoaded', navigate);

document.getElementById('btn-logout').addEventListener('click', function() {
  Api.clearToken();
  location.hash = '#login';
});
