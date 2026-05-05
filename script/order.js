function renderOrderDetail(order, bodyEl) {
  if (!order) {
    bodyEl.innerHTML = '<p class="state-msg" style="padding:1rem;">Dettaglio non disponibile.</p>';
    return;
  }

  const addr = order.shipping_address;
  let addrHtml = '';
  if (addr) {
    const lines = [];
    if (addr.fullName) lines.push(escHtml(addr.fullName));
    lines.push(escHtml(addr.street));

    const cityParts = [addr.city];
    if (addr.zipCode)  cityParts.push(addr.zipCode);
    if (addr.province) cityParts.push('(' + addr.province + ')');
    lines.push(escHtml(cityParts.join(', ')));

    addrHtml =
      '<div class="order-detail-section">' +
        '<h4 class="order-detail-title">Indirizzo di spedizione</h4>' +
        '<address class="order-address">' +
          lines.map(function(l) { return '<span>' + l + '</span>'; }).join('') +
        '</address>' +
      '</div>';
  }

  const items = order.items || [];
  let itemsHtml;

  if (items.length > 0) {
    const rowsHtml = items.map(function(item) {
      const subtotal = (item.quantity || 0) * (item.price_unit || 0);
      return (
        '<div class="order-item-row">' +
          '<span class="order-item-name">' + escHtml(item.name || item.productId) + '</span>' +
          '<span class="order-item-qty">'  + item.quantity + '</span>' +
          '<span class="order-item-price">€' + Number(item.price_unit).toFixed(2) + '</span>' +
          '<span class="order-item-subtotal">€' + Number(subtotal).toFixed(2) + '</span>' +
        '</div>'
      );
    }).join('');

    itemsHtml =
      '<div class="order-detail-section">' +
        '<h4 class="order-detail-title">Articoli</h4>' +
        '<div class="order-items">' +
          '<div class="order-items-header">' +
            '<span>Prodotto</span>' +
            '<span>Qtà</span>' +
            '<span>Prezzo unit.</span>' +
            '<span>Subtotale</span>' +
          '</div>' +
          rowsHtml +
        '</div>' +
      '</div>';
  } else {
    itemsHtml = '<p class="order-empty-items">Nessun articolo.</p>';
  }

  bodyEl.innerHTML = '<div class="order-detail">' + addrHtml + itemsHtml + '</div>';
}
