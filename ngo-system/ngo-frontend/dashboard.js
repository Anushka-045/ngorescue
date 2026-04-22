
// FILTER
function filterCards(type) {
  let cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    card.style.display =
      type === 'all' || card.dataset.type === type
        ? 'block'
        : 'none';
  });

  document.querySelectorAll('.filters button')
    .forEach(btn => btn.classList.remove('active'));

  event.target.classList.add('active');
}

// SEARCH
document.getElementById('searchInput').addEventListener('keyup', function() {
  let value = this.value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(value)
      ? 'block'
      : 'none';
  });
});

// TOP SEARCH
document.getElementById('topSearch').addEventListener('keyup', function() {
  let value = this.value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(value)
      ? 'block'
      : 'none';
  });
});

// COUNTS
function updateCounts() {
  let cards = document.querySelectorAll('.card');

  let urgent = 0, high = 0, medium = 0;

  cards.forEach(card => {
    if (card.dataset.type === 'urgent') urgent++;
    if (card.dataset.type === 'high') high++;
    if (card.dataset.type === 'medium') medium++;
  });

  document.getElementById('urgentCount').innerText = urgent;
  document.getElementById('highCount').innerText = high;
  document.getElementById('mediumCount').innerText = medium;
  document.getElementById('totalCount').innerText = cards.length;
}

updateCounts();
