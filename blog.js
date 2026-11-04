(function () {
  const config = window.FEEDBACK_CONFIG || {};
  const statusElement = document.getElementById('blog-status');
  const adminStatusElement = document.getElementById('admin-status');
  const postsElement = document.getElementById('blog-posts');
  const editorElement = document.getElementById('blog-editor');
  const postForm = document.getElementById('blog-post-form');
  const loginForm = document.getElementById('admin-login-form');
  const adminSession = document.getElementById('admin-session');
  const adminModal = document.getElementById('admin-modal');
  const adminActiveStatus = document.getElementById('admin-active-status');
  const bucketName = 'blog-photos';
  const maxPhotoSize = 5 * 1024 * 1024;
  const maxPhotoCount = 5;
  const allowedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const photoExtensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };
  const isConfigured = config.supabaseUrl && config.supabaseAnonKey &&
    !config.supabaseUrl.includes('PASTE_YOUR') && !config.supabaseAnonKey.includes('PASTE_YOUR');

  function setStatus(message) {
    statusElement.textContent = message;
  }

  function setAdminStatus(message) {
    adminStatusElement.textContent = message;
  }

  function openAdminModal() {
    if (!adminModal.open) {
      adminModal.showModal();
    }
  }

  function setBusy(form, busy) {
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = busy;
    submitButton.textContent = busy ? 'Se procesează...' :
      (form === postForm ? 'Publică articolul' : 'Autentificare');
  }

  document.getElementById('admin-trigger').addEventListener('click', openAdminModal);
  document.getElementById('admin-modal-close').addEventListener('click', function () {
    adminModal.close();
  });
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      openAdminModal();
    }
  });

  if (!isConfigured || !window.supabase) {
    setStatus(!isConfigured
      ? 'Articolele vor apărea aici în curând.'
      : 'Biblioteca Supabase nu s-a încărcat. Verifică conexiunea la internet și reîncarcă pagina.');
    postForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setStatus('Articolele nu pot fi publicate până când conexiunea Supabase nu este configurată.');
    });
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setAdminStatus('Autentificarea nu este disponibilă până când conexiunea Supabase nu este configurată.');
    });
    return;
  }

  const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storage: window.sessionStorage,
      persistSession: true,
      autoRefreshToken: true
    }
  });
  let isAdmin = false;

  async function loadPosts() {
    setStatus('Se încarcă articolele...');
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, description, image_paths, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      const message = /blog_posts.*schema cache|schema cache.*blog_posts|relation .*blog_posts.*does not exist/i.test(error.message)
        ? 'Articolele vor apărea aici în curând.'
        : `Articolele nu au putut fi încărcate: ${error.message}`;
      setStatus(message);
      return;
    }

    postsElement.replaceChildren();
    if (data.length === 0) {
      setStatus('Nu există încă articole. Revino în curând pentru povești și fotografii de la festival.');
      return;
    }

    setStatus('');
    data.forEach(function (entry) {
      const article = document.createElement('article');
      article.className = 'blog-post';

      const content = document.createElement('div');
      content.className = 'blog-post-content';

      const title = document.createElement('h2');
      title.textContent = entry.title;
      content.appendChild(title);

      const date = document.createElement('p');
      date.className = 'blog-post-date';
      date.textContent = new Intl.DateTimeFormat('ro-RO', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(entry.created_at));
      content.appendChild(date);

      const description = document.createElement('p');
      description.className = 'blog-post-description';
      description.textContent = entry.description;
      content.appendChild(description);

      const imagePaths = Array.isArray(entry.image_paths) ? entry.image_paths : [];
      if (imagePaths.length > 0) {
        const gallery = document.createElement('div');
        gallery.className = 'blog-gallery';
        imagePaths.forEach(function (imagePath, index) {
          const imageUrl = supabase.storage.from(bucketName).getPublicUrl(imagePath).data.publicUrl;
          const imageLink = document.createElement('a');
          imageLink.href = imageUrl;
          imageLink.target = '_blank';
          imageLink.rel = 'noopener noreferrer';

          const image = document.createElement('img');
          image.className = 'blog-gallery-photo';
          image.src = imageUrl;
          image.alt = `Fotografia ${index + 1} pentru ${entry.title}`;
          image.loading = 'lazy';
          imageLink.appendChild(image);
          gallery.appendChild(imageLink);
        });
        content.appendChild(gallery);
      }

      if (isAdmin) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'feedback-delete blog-post-delete';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Șterge articolul';
        deleteButton.addEventListener('click', function () {
          deletePost(entry);
        });
        content.appendChild(deleteButton);
      }

      article.appendChild(content);
      postsElement.appendChild(article);
    });
  }

  async function refreshAdminState() {
    isAdmin = false;
    editorElement.hidden = true;
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      loginForm.hidden = false;
      adminSession.hidden = true;
      adminActiveStatus.hidden = true;
      setAdminStatus(`Nu s-a putut verifica sesiunea: ${sessionError.message}`);
      await loadPosts();
      return;
    }

    if (!session) {
      loginForm.hidden = false;
      adminSession.hidden = true;
      adminActiveStatus.hidden = true;
      await loadPosts();
      return;
    }

    const { data, error } = await supabase.rpc('is_feedback_admin');
    if (error) {
      loginForm.hidden = false;
      adminSession.hidden = true;
      adminActiveStatus.hidden = true;
      const message = /feedback_admins|is_feedback_admin|does not exist|function .* not exist/i.test(error.message)
        ? 'Configurarea administratorului nu este finalizată. Rulează scriptul SQL din supabase-setup.sql și adaugă UUID-ul contului în public.feedback_admins.'
        : `Nu s-a putut verifica accesul de administrator: ${error.message}`;
      setAdminStatus(message);
      await loadPosts();
      return;
    }

    isAdmin = data === true;
    loginForm.hidden = isAdmin;
    adminSession.hidden = !isAdmin;
    adminActiveStatus.hidden = !isAdmin;
    editorElement.hidden = !isAdmin;
    setAdminStatus(isAdmin ? 'Acces de administrator activ.' : 'Acest cont nu are drepturi de administrator.');
    await loadPosts();
  }

  async function removeUploadedPhotos(paths) {
    if (paths.length === 0) {
      return '';
    }
    const { error } = await supabase.storage.from(bucketName).remove(paths);
    return error ? ` Fotografiile temporare nu au putut fi șterse: ${error.message}` : '';
  }

  async function deletePost(entry) {
    if (!window.confirm('Sigur vrei să ștergi acest articol?')) {
      return;
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', entry.id)
      .select('id');

    if (error) {
      setStatus(`Articolul nu a putut fi șters: ${error.message}`);
      return;
    }
    if (data.length === 0) {
      setStatus('Articolul nu a fost șters. Verifică dacă ești autentificat ca administrator.');
      return;
    }

    const cleanupError = await removeUploadedPhotos(Array.isArray(entry.image_paths) ? entry.image_paths : []);
    await loadPosts();
    setStatus(cleanupError
      ? `Articolul a fost șters.${cleanupError}`
      : 'Articolul a fost șters.');
  }

  postForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    setBusy(postForm, true);

    const uploadedPaths = [];
    try {
      const formData = new FormData(postForm);
      const photos = Array.from(formData.getAll('photos')).filter(function (photo) {
        return photo.size > 0;
      });

      if (photos.length > maxPhotoCount) {
        throw new Error(`Poți adăuga maximum ${maxPhotoCount} fotografii la un articol.`);
      }

      for (const photo of photos) {
        if (!allowedPhotoTypes.includes(photo.type)) {
          throw new Error('Alege fotografii PNG, JPEG sau WebP.');
        }
        if (photo.size > maxPhotoSize) {
          throw new Error('Fiecare fotografie trebuie să aibă maximum 5 MB.');
        }

        const path = `${crypto.randomUUID()}.${photoExtensions[photo.type]}`;
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(path, photo, { contentType: photo.type, upsert: false });
        if (error) {
          throw new Error(`O fotografie nu a putut fi încărcată: ${error.message}`);
        }
        uploadedPaths.push(path);
      }

      const { error } = await supabase.from('blog_posts').insert({
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        image_paths: uploadedPaths
      });
      if (error) {
        throw new Error(`Articolul nu a putut fi publicat: ${error.message}`);
      }

      uploadedPaths.length = 0;
      postForm.reset();
      await loadPosts();
      setStatus('Articolul a fost publicat.');
    } catch (error) {
      const cleanupError = await removeUploadedPhotos(uploadedPaths);
      setStatus(`${error.message}${cleanupError}`);
    } finally {
      setBusy(postForm, false);
    }
  });

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    setBusy(loginForm, true);
    setAdminStatus('');

    try {
      const formData = new FormData(loginForm);
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.get('email'),
        password: formData.get('password')
      });
      if (error) {
        setAdminStatus(`Autentificarea a eșuat: ${error.message}`);
      } else {
        loginForm.reset();
        await refreshAdminState();
      }
    } catch (error) {
      setAdminStatus(`Autentificarea a eșuat: ${error.message}`);
    } finally {
      setBusy(loginForm, false);
    }
  });

  document.getElementById('admin-logout').addEventListener('click', async function () {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAdminStatus(`Deconectarea a eșuat: ${error.message}`);
        return;
      }
      isAdmin = false;
      setAdminStatus('Te-ai deconectat.');
      await refreshAdminState();
    } catch (error) {
      setAdminStatus(`Deconectarea a eșuat: ${error.message}`);
    }
  });

  supabase.auth.onAuthStateChange(function () {
    window.setTimeout(function () {
      refreshAdminState().catch(function (error) {
        setAdminStatus(`Nu s-a putut actualiza sesiunea: ${error.message}`);
      });
    }, 0);
  });

  refreshAdminState().catch(function (error) {
    setStatus(`Nu s-a putut inițializa blogul: ${error.message}`);
  });
})();
