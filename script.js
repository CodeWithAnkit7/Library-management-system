// ==========================
// DATA STORAGE
// ==========================
let books = JSON.parse(localStorage.getItem("books")) || [];
let users = JSON.parse(localStorage.getItem("users")) || [];
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let editingBookId = null;
let editingUserId = null;

function saveData() {
  localStorage.setItem("books", JSON.stringify(books));
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateDashboard();
}

// ==========================
// TAB SWITCHING
// ==========================
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

// ==========================
// BOOKS CRUD
// ==========================
const bookForm = document.getElementById("bookForm");

bookForm.addEventListener("submit", e => {
  e.preventDefault();

  const title = bookTitle.value.trim();
  const author = bookAuthor.value.trim();
  const year = bookYear.value;
  const category = bookCategory.value.trim();
  const copies = parseInt(bookCopies.value);

  if (editingBookId) {
    let book = books.find(b => b.id === editingBookId);
    book.title = title;
    book.author = author;
    book.year = year;
    book.category = category;
    book.total = copies;
    editingBookId = null;
  } else {
    books.push({
      id: Date.now(),
      title,
      author,
      year,
      category,
      total: copies,
      available: copies
    });
  }

  bookForm.reset();
  renderBooks();
  saveData();
});

function renderBooks() {
  const tbody = document.querySelector("#booksTable tbody");
  tbody.innerHTML = "";

  if (books.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">No Books Found</td></tr>`;
    return;
  }

  books.forEach(book => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.year}</td>
      <td>${book.category}</td>
      <td>${book.available}/${book.total}</td>
      <td>
        <button class="btn success" onclick="openIssue(${book.id})" ${book.available===0?'disabled':''}>Issue</button>
        <button class="btn warn" onclick="editBook(${book.id})">Edit</button>
        <button class="btn danger" onclick="deleteBook(${book.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteBook(id) {
  books = books.filter(b => b.id !== id);
  transactions = transactions.filter(t => t.bookId !== id);
  renderBooks();
  renderTransactions();
  saveData();
}

function editBook(id) {
  const book = books.find(b => b.id === id);
  editingBookId = id;

  bookTitle.value = book.title;
  bookAuthor.value = book.author;
  bookYear.value = book.year;
  bookCategory.value = book.category;
  bookCopies.value = book.total;
}

// ==========================
// USERS CRUD
// ==========================
const userForm = document.getElementById("userForm");

userForm.addEventListener("submit", e => {
  e.preventDefault();

  const name = userName.value.trim();
  const email = userEmail.value.trim();
  const reg = userReg.value.trim();

  if (editingUserId) {
    let user = users.find(u => u.id === editingUserId);
    user.name = name;
    user.email = email;
    user.reg = reg;
    editingUserId = null;
  } else {
    users.push({
      id: Date.now(),
      name,
      email,
      reg
    });
  }

  userForm.reset();
  renderUsers();
  saveData();
});

function renderUsers() {
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="muted">No Users Found</td></tr>`;
    return;
  }

  users.forEach(user => {
    const borrowed = transactions.filter(t => t.userId === user.id && t.status === "active").length;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.reg}</td>
      <td>${borrowed}</td>
      <td>
        <button class="btn warn" onclick="editUser(${user.id})">Edit</button>
        <button class="btn danger" onclick="deleteUser(${user.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteUser(id) {
  users = users.filter(u => u.id !== id);
  transactions = transactions.filter(t => t.userId !== id);
  renderUsers();
  renderTransactions();
  saveData();
}

function editUser(id) {
  const user = users.find(u => u.id === id);
  editingUserId = id;

  userName.value = user.name;
  userEmail.value = user.email;
  userReg.value = user.reg;
}

// ==========================
// ISSUE BOOK
// ==========================
function openIssue(bookId) {
  issueBookId.value = bookId;
  issueUser.innerHTML = users.map(u =>
    `<option value="${u.id}">${u.name}</option>`
  ).join("");
  document.getElementById("issueModal").classList.add("show");
}

document.getElementById("issueForm").addEventListener("submit", e => {
  e.preventDefault();

  const bookId = parseInt(issueBookId.value);
  const userId = parseInt(issueUser.value);
  const due = issueDue.value;

  const book = books.find(b => b.id === bookId);
  book.available--;

  transactions.push({
    id: Date.now(),
    bookId,
    userId,
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: due,
    status: "active"
  });

  document.getElementById("issueModal").classList.remove("show");
  renderBooks();
  renderTransactions();
  saveData();
});

// ==========================
// TRANSACTIONS
// ==========================
function renderTransactions() {
  const tbody = document.querySelector("#txTable tbody");
  tbody.innerHTML = "";

  transactions.forEach(tx => {
    const book = books.find(b => b.id === tx.bookId);
    const user = users.find(u => u.id === tx.userId);

    let status = tx.status;
    if (status === "active" && new Date(tx.dueDate) < new Date()) {
      status = "overdue";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${book?.title || ""}</td>
      <td>${user?.name || ""}</td>
      <td>${tx.issueDate}</td>
      <td>${tx.dueDate}</td>
      <td><span class="badge ${status==="active"?"ok":status==="overdue"?"danger":"warn"}">${status}</span></td>
      <td>
        ${tx.status==="active" ?
          `<button class="btn success" onclick="returnBook(${tx.id})">Return</button>`
          : ""
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function returnBook(id) {
  const tx = transactions.find(t => t.id === id);
  tx.status = "returned";

  const book = books.find(b => b.id === tx.bookId);
  book.available++;

  renderBooks();
  renderTransactions();
  saveData();
}

// ==========================
// DASHBOARD
// ==========================
function updateDashboard() {
  statTotalBooks.textContent = books.length;
  statCopiesAvail.textContent = books.reduce((sum,b)=>sum+b.available,0);
  statActiveLoans.textContent = transactions.filter(t=>t.status==="active").length;
}

// ==========================
renderBooks();
renderUsers();
renderTransactions();
updateDashboard();