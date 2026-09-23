/**
 * WebForum – Main application logic (ES2015+)
 * Uses Firebase Auth + Cloud Firestore
 */

(function () {
  'use strict';

  // ---------- State ----------
  let currentUser = null;
  let currentUserData = null; // { username, email, ... }
  let currentCategoryId = null;
  let currentForumId = null;
  let isRegisterMode = false;

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    btnLogin: $('#btnLogin'),
    btnRegister: $('#btnRegister'),
    btnLogout: $('#btnLogout'),
    userInfo: $('#userInfo'),
    authModal: $('#authModal'),
    modalClose: $('#modalClose'),
    authForm: $('#authForm'),
    authTitle: $('#authTitle'),
    authSubmit: $('#authSubmit'),
    authError: $('#authError'),
    switchText: $('#switchText'),
    switchMode: $('#switchMode'),
    username: $('#username'),
    email: $('#email'),
    password: $('#password'),
    breadcrumb: $('#breadcrumb'),
    viewCategories: $('#viewCategories'),
    viewForums: $('#viewForums'),
    viewPosts: $('#viewPosts'),
    viewPostDetail: $('#viewPostDetail'),
    categoriesList: $('#categoriesList'),
    forumsList: $('#forumsList'),
    forumsTitle: $('#forumsTitle'),
    postsTitle: $('#postsTitle'),
    postsList: $('#postsList'),
    btnNewPost: $('#btnNewPost'),
    newPostForm: $('#newPostForm'),
    postForm: $('#postForm'),
    postTitle: $('#postTitle'),
    postContent: $('#postContent'),
    postError: $('#postError'),
    btnCancelPost: $('#btnCancelPost'),
    postDetail: $('#postDetail')
  };

  // ---------- Auth UI ----------
  function updateAuthUI() {
    if (currentUser) {
      els.btnLogin.classList.add('hidden');
      els.btnRegister.classList.add('hidden');
      els.btnLogout.classList.remove('hidden');
      const name = (currentUserData && currentUserData.username) || currentUser.email;
      els.userInfo.textContent = 'Hi, ' + name;
      els.btnNewPost.classList.remove('hidden');
    } else {
      els.btnLogin.classList.remove('hidden');
      els.btnRegister.classList.remove('hidden');
      els.btnLogout.classList.add('hidden');
      els.userInfo.textContent = '';
      els.btnNewPost.classList.add('hidden');
      els.newPostForm.classList.add('hidden');
    }
  }

  function openAuthModal(register) {
    isRegisterMode = !!register;
    els.authTitle.textContent = isRegisterMode ? 'Register' : 'Login';
    els.authSubmit.textContent = isRegisterMode ? 'Create Account' : 'Login';
    els.switchText.textContent = isRegisterMode ? 'Already have an account?' : "Don't have an account?";
    els.switchMode.textContent = isRegisterMode ? 'Login' : 'Register';
    els.username.parentElement.style.display = isRegisterMode ? 'block' : 'none';
    els.authError.textContent = '';
    els.authForm.reset();
    els.authModal.classList.remove('hidden');
  }

  function closeAuthModal() {
    els.authModal.classList.add('hidden');
  }

  // ---------- Auth logic ----------
  function handleAuthSubmit(e) {
    e.preventDefault();
    const email = els.email.value.trim();
    const password = els.password.value;
    const username = els.username.value.trim();

    els.authError.textContent = '';
    els.authSubmit.disabled = true;

    if (isRegisterMode) {
      if (!username) {
        els.authError.textContent = 'Username is required';
        els.authSubmit.disabled = false;
        return;
      }
      auth.createUserWithEmailAndPassword(email, password)
        .then(function (cred) {
          // Store extra profile in Firestore
          return db.collection('users').doc(cred.user.uid).set({
            uid: cred.user.uid,
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .then(function () {
          closeAuthModal();
        })
        .catch(function (err) {
          els.authError.textContent = err.message;
        })
        .finally(function () {
          els.authSubmit.disabled = false;
        });
    } else {
      auth.signInWithEmailAndPassword(email, password)
        .then(function () {
          closeAuthModal();
        })
        .catch(function (err) {
          els.authError.textContent = err.message;
        })
        .finally(function () {
          els.authSubmit.disabled = false;
        });
    }
  }

  function handleLogout() {
    auth.signOut();
  }

  // Load user profile from Firestore when auth state changes
  function loadUserProfile(user) {
    if (!user) {
      currentUserData = null;
      updateAuthUI();
      return;
    }
    db.collection('users').doc(user.uid).get()
      .then(function (doc) {
        currentUserData = doc.exists ? doc.data() : { username: user.email };
        updateAuthUI();
      })
      .catch(function () {
        currentUserData = { username: user.email };
        updateAuthUI();
      });
  }

  // ---------- Navigation / Views ----------
  function showView(name) {
    els.viewCategories.classList.add('hidden');
    els.viewForums.classList.add('hidden');
    els.viewPosts.classList.add('hidden');
    els.viewPostDetail.classList.add('hidden');

    if (name === 'categories') els.viewCategories.classList.remove('hidden');
    if (name === 'forums') els.viewForums.classList.remove('hidden');
    if (name === 'posts') els.viewPosts.classList.remove('hidden');
    if (name === 'postDetail') els.viewPostDetail.classList.remove('hidden');
  }

  function setBreadcrumb(items) {
    // items: [{ label, onClick? }, ...]
    els.breadcrumb.innerHTML = items.map(function (item, i) {
      if (i === items.length - 1) {
        return '<span>' + escapeHtml(item.label) + '</span>';
      }
      return '<a href="#" data-idx="' + i + '">' + escapeHtml(item.label) + '</a><span>›</span>';
    }).join('');

    // attach click handlers
    $$('#breadcrumb a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        const idx = parseInt(a.getAttribute('data-idx'), 10);
        if (items[idx] && typeof items[idx].onClick === 'function') {
          items[idx].onClick();
        }
      });
    });
  }

  // ---------- Data loading ----------
  function loadCategories() {
    showView('categories');
    setBreadcrumb([{ label: 'Home', onClick: loadCategories }]);
    els.categoriesList.innerHTML = '<p class="empty">Loading categories…</p>';

    db.collection('categories').orderBy('name').get()
      .then(function (snap) {
        if (snap.empty) {
          els.categoriesList.innerHTML = '<p class="empty">No categories yet. Add some in the Firebase Console.</p>';
          return;
        }
        els.categoriesList.innerHTML = '';
        snap.forEach(function (doc) {
          const data = doc.data();
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML =
            '<h3><a href="#">' + escapeHtml(data.name) + '</a></h3>' +
            '<p>' + escapeHtml(data.description || '') + '</p>';
          card.querySelector('a').addEventListener('click', function (e) {
            e.preventDefault();
            currentCategoryId = doc.id;
            loadForums(doc.id, data.name);
          });
          els.categoriesList.appendChild(card);
        });
      })
      .catch(function (err) {
        els.categoriesList.innerHTML = '<p class="empty">Error loading categories: ' + escapeHtml(err.message) + '</p>';
      });
  }

  function loadForums(categoryId, categoryName) {
    showView('forums');
    els.forumsTitle.textContent = 'Forums in “' + categoryName + '”';
    setBreadcrumb([
      { label: 'Home', onClick: loadCategories },
      { label: categoryName }
    ]);
    els.forumsList.innerHTML = '<p class="empty">Loading forums…</p>';

    db.collection('forums')
      .where('categoryId', '==', categoryId)
      .orderBy('name')
      .get()
      .then(function (snap) {
        if (snap.empty) {
          els.forumsList.innerHTML = '<p class="empty">No forums in this category yet.</p>';
          return;
        }
        els.forumsList.innerHTML = '';
        snap.forEach(function (doc) {
          const data = doc.data();
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML =
            '<h3><a href="#">' + escapeHtml(data.name) + '</a></h3>' +
            '<p>' + escapeHtml(data.description || '') + '</p>';
          card.querySelector('a').addEventListener('click', function (e) {
            e.preventDefault();
            currentForumId = doc.id;
            loadPosts(doc.id, data.name, categoryName);
          });
          els.forumsList.appendChild(card);
        });
      })
      .catch(function (err) {
        // Fallback if composite index is missing
        els.forumsList.innerHTML = '<p class="empty">Error: ' + escapeHtml(err.message) +
          '<br><small>You may need to create a Firestore index for categoryId + name.</small></p>';
      });
  }

  function loadPosts(forumId, forumName, categoryName) {
    showView('posts');
    els.postsTitle.textContent = forumName;
    setBreadcrumb([
      { label: 'Home', onClick: loadCategories },
      { label: categoryName || 'Category', onClick: function () {
          if (currentCategoryId) loadForums(currentCategoryId, categoryName);
          else loadCategories();
        }
      },
      { label: forumName }
    ]);
    els.postsList.innerHTML = '<p class="empty">Loading posts…</p>';
    els.newPostForm.classList.add('hidden');

    db.collection('posts')
      .where('forumId', '==', forumId)
      .orderBy('createdAt', 'desc')
      .get()
      .then(function (snap) {
        if (snap.empty) {
          els.postsList.innerHTML = '<p class="empty">No posts yet. Be the first to post!</p>';
          return;
        }
        els.postsList.innerHTML = '';
        snap.forEach(function (doc) {
          const data = doc.data();
          const card = document.createElement('div');
          card.className = 'card post-item';
          const dateStr = data.createdAt && data.createdAt.toDate
            ? data.createdAt.toDate().toLocaleString()
            : '';
          card.innerHTML =
            '<h3><a href="#">' + escapeHtml(data.title) + '</a></h3>' +
            '<p class="meta">by ' + escapeHtml(data.authorName || 'Anonymous') +
            (dateStr ? ' · ' + dateStr : '') + '</p>';
          card.querySelector('a').addEventListener('click', function (e) {
            e.preventDefault();
            showPostDetail(doc.id, data, forumName, categoryName);
          });
          els.postsList.appendChild(card);
        });
      })
      .catch(function (err) {
        els.postsList.innerHTML = '<p class="empty">Error: ' + escapeHtml(err.message) +
          '<br><small>You may need a Firestore index for forumId + createdAt.</small></p>';
      });
  }

  function showPostDetail(postId, data, forumName, categoryName) {
    showView('postDetail');
    setBreadcrumb([
      { label: 'Home', onClick: loadCategories },
      { label: categoryName || 'Category', onClick: function () {
          if (currentCategoryId) loadForums(currentCategoryId, categoryName);
        }
      },
      { label: forumName || 'Forum', onClick: function () {
          if (currentForumId) loadPosts(currentForumId, forumName, categoryName);
        }
      },
      { label: data.title }
    ]);

    const dateStr = data.createdAt && data.createdAt.toDate
      ? data.createdAt.toDate().toLocaleString()
      : '';

    els.postDetail.innerHTML =
      '<h2>' + escapeHtml(data.title) + '</h2>' +
      '<p class="meta">by ' + escapeHtml(data.authorName || 'Anonymous') +
      (dateStr ? ' · ' + dateStr : '') + '</p>' +
      '<div class="content">' + escapeHtml(data.content) + '</div>';
  }

  // ---------- Create post ----------
  function openNewPostForm() {
    if (!currentUser) {
      openAuthModal(false);
      return;
    }
    els.newPostForm.classList.remove('hidden');
    els.postError.textContent = '';
    els.postForm.reset();
  }

  function handlePostSubmit(e) {
    e.preventDefault();
    if (!currentUser || !currentForumId) return;

    const title = els.postTitle.value.trim();
    const content = els.postContent.value.trim();

    if (!title || !content) {
      els.postError.textContent = 'Title and content are required';
      return;
    }

    els.postError.textContent = '';
    const submitBtn = els.postForm.querySelector('[type="submit"]');
    submitBtn.disabled = true;

    const authorName = (currentUserData && currentUserData.username) || currentUser.email;

    db.collection('posts').add({
      title: title,
      content: content,
      authorId: currentUser.uid,
      authorName: authorName,
      forumId: currentForumId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
      .then(function () {
        els.newPostForm.classList.add('hidden');
        // reload posts
        const forumName = els.postsTitle.textContent;
        loadPosts(currentForumId, forumName);
      })
      .catch(function (err) {
        els.postError.textContent = err.message;
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  }

  // ---------- Helpers ----------
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Event listeners ----------
  els.btnLogin.addEventListener('click', function () { openAuthModal(false); });
  els.btnRegister.addEventListener('click', function () { openAuthModal(true); });
  els.btnLogout.addEventListener('click', handleLogout);
  els.modalClose.addEventListener('click', closeAuthModal);
  els.authForm.addEventListener('submit', handleAuthSubmit);
  els.switchMode.addEventListener('click', function (e) {
    e.preventDefault();
    openAuthModal(!isRegisterMode);
  });
  els.btnNewPost.addEventListener('click', openNewPostForm);
  els.btnCancelPost.addEventListener('click', function () {
    els.newPostForm.classList.add('hidden');
  });
  els.postForm.addEventListener('submit', handlePostSubmit);

  // Close modal on backdrop click
  els.authModal.addEventListener('click', function (e) {
    if (e.target === els.authModal) closeAuthModal();
  });

  // ---------- Auth state observer ----------
  auth.onAuthStateChanged(function (user) {
    currentUser = user;
    loadUserProfile(user);
  });

  // ---------- Start ----------
  loadCategories();
})();
