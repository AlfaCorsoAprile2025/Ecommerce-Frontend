function createApi() {
  const BASE = window.APP_CONFIG.API_BASE;

  function _getToken() {
    return localStorage.getItem('authToken');
  }

  function _buildHeaders(includeAuth) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = _getToken();
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
    }
    return headers;
  }

  async function request(method, path, body, includeAuth) {
    const opts = {
      method: method,
      headers: _buildHeaders(includeAuth),
    };
    if (body !== null && body !== undefined) {
      opts.body = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(BASE + path, opts);
    } catch (fetchError) {
      throw { status: 0, message: 'Network error. Check your connection.' };
    }

    if (res.status === 401) {
      publicApi.clearToken();
      location.hash = '#login';
      return;
    }

    if (!res.ok) {
      let errMsg = 'Error ' + res.status;
      try {
        const errBody = await res.json();
        if (errBody.message) {
          errMsg = errBody.message;
        }
      } catch (parseError) {}
      throw { status: res.status, message: errMsg };
    }

    try {
      return await res.json();
    } catch (parseError) {
      return null;
    }
  }

  const publicApi = {
    login: function(email, password) {
      return request('POST', '/auth/login', { email: email, password: password }, false);
    },
    register: function(firstName, lastName, email, password) {
      return request('POST', '/auth/register', { firstName: firstName, lastName: lastName, email: email, password: password }, false);
    },
    getProducts: function(params) {
      const qs = new URLSearchParams(params).toString();
      return request('GET', '/catalog/products' + (qs ? '?' + qs : ''), null, true);
    },
    getProduct: function(id) {
      return request('GET', '/catalog/products/' + id, null, true);
    },
    setToken: function(token) {
      localStorage.setItem('authToken', token);
    },
    clearToken: function() {
      localStorage.removeItem('authToken');
    },
    hasToken: function() {
      const token = _getToken();
      if (token) {
        return true;
      }
      return false;
    },
  };

  return publicApi;
}

const Api = createApi();

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
