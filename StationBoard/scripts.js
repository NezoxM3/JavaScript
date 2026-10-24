var POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

var statusEl = document.getElementById('status');
var table = document.getElementById('table');
var tbody = document.getElementById('tbody');

async function loadPosts() {
  try {
    var response = await fetch(POSTS_URL);

    if (!response.ok) {
      throw new Error('Сервер відповів помилкою, код ' + response.status);
    }

    var posts = await response.json();

    posts.forEach(function (post) {
      var row = tbody.insertRow();
      row.insertCell().textContent = post.userId;
      row.insertCell().textContent = post.id;
      row.insertCell().textContent = post.title;
      row.insertCell().textContent = post.body;
    });

    statusEl.hidden = true;
    table.hidden = false;
  } catch (err) {
    statusEl.className = 'error';
    statusEl.textContent = 'Не вдалося завантажити дані: ' + err.message;
  }
}

loadPosts();