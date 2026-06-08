document.addEventListener('DOMContentLoaded', () => {
  const passwordPage = document.getElementById('password-page');
  const dashboardPage = document.getElementById('dashboard-page');
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password-input');
  const errorMessage = document.getElementById('error-message');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const eyeIcon = document.getElementById('eye-icon');

  if (togglePasswordBtn && passwordInput && eyeIcon) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      if (type === 'password') {
        eyeIcon.innerHTML = `
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `;
      } else {
        eyeIcon.innerHTML = `
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
          <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
          <line x1="2" x2="22" y1="2" y2="22"></line>
        `;
      }
    });
  }

  const loadingState = document.getElementById('loading-state');
  const loadError = document.getElementById('load-error');
  const emptyState = document.getElementById('empty-state');
  const dashboardData = document.getElementById('dashboard-data');

  const statTotal = document.getElementById('stat-total');
  const statDue = document.getElementById('stat-due');
  const statReceived = document.getElementById('stat-received');

  const tableBody = document.getElementById('table-body');
  const cardsContainer = document.getElementById('cards-container');

  // Determine API base dynamically to support local cross-origin testing (e.g. via Live Server)
  const API_BASE = (window.location.protocol === 'file:' || 
                    (window.location.hostname === 'localhost' && window.location.port && window.location.port !== '8080') || 
                    (window.location.hostname === '127.0.0.1' && window.location.port && window.location.port !== '8080'))
    ? 'http://localhost:8080'
    : '';

  // Check sessionStorage for active login session
  const storedPassword = sessionStorage.getItem('ACCESS_PASSWORD');
  if (storedPassword) {
    showDashboard(storedPassword);
  } else {
    showLogin();
  }

  // Handle Login form submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value;
    errorMessage.classList.add('hidden');

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        sessionStorage.setItem('ACCESS_PASSWORD', password);
        showDashboard(password);
      } else {
        showLoginError(data.error || 'Wrong password. Try again.');
      }
    } catch (err) {
      showLoginError('Network error. Please try again.');
    }
  });

  function showLogin() {
    passwordPage.classList.remove('hidden');
    dashboardPage.classList.add('hidden');
  }

  function showLoginError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  }

  function showDashboard(password) {
    passwordPage.classList.add('hidden');
    dashboardPage.classList.remove('hidden');
    fetchProjects(password);
  }

  // Fetch project tracker data from backend API
  async function fetchProjects(password) {
    loadingState.classList.remove('hidden');
    dashboardData.classList.add('hidden');
    loadError.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        headers: {
          'x-password': password
        }
      });

      if (response.status === 401) {
        // Session expired or bad password stored
        sessionStorage.removeItem('ACCESS_PASSWORD');
        showLogin();
        showLoginError('Session expired. Please enter password again.');
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        loadingState.classList.add('hidden');
        renderDashboard(data.projects);
      } else {
        throw new Error(data.error || 'Fetch failed');
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      loadingState.classList.add('hidden');
      loadError.classList.remove('hidden');
    }
  }

  // Render the dashboard data, statistics, and tables/cards
  function renderDashboard(projects) {
    if (!projects || projects.length === 0) {
      emptyState.classList.remove('hidden');
      dashboardData.classList.add('hidden');
      return;
    }

    dashboardData.classList.remove('hidden');

    // Calculate Stats
    const totalProjects = projects.length;
    let amountDue = 0;
    let amountReceived = 0;

    projects.forEach(p => {
      // Parse numerical price safely
      const priceVal = parseFloat((p.price || '').toString().replace(/[^\d.]/g, '')) || 0;
      const status = (p.paymentStatus || '').trim().toLowerCase();
      if (status === 'paid') {
        amountReceived += priceVal;
      } else {
        amountDue += priceVal;
      }
    });

    // Populate Stats Cards
    statTotal.textContent = totalProjects;
    statDue.textContent = `₹${amountDue}`;
    statReceived.textContent = `₹${amountReceived}`;

    // Render Table (Desktop) and Cards (Mobile)
    renderDesktopTable(projects);
    renderMobileCards(projects);
  }

  // Render desktop table view
  function renderDesktopTable(projects) {
    tableBody.innerHTML = '';

    projects.forEach((proj, idx) => {
      // Create main row
      const trMain = document.createElement('tr');
      trMain.className = 'main-row';
      
      // Col 1: Auto row number from index starting at 1
      const tdIndex = document.createElement('td');
      tdIndex.textContent = idx + 1;
      trMain.appendChild(tdIndex);

      // Col 2: Project name bold
      const tdName = document.createElement('td');
      tdName.className = 'project-name-cell';
      tdName.textContent = proj.name || 'Untitled Project';
      trMain.appendChild(tdName);

      // Col 3: Type pill badge
      const tdType = document.createElement('td');
      const typeBadge = document.createElement('span');
      const isShort = (proj.videoType || '').trim().toLowerCase() === 'short';
      typeBadge.className = 'badge ' + (isShort ? 'badge-short' : 'badge-long');
      typeBadge.textContent = proj.videoType || (isShort ? 'Short' : 'Long-form');
      tdType.appendChild(typeBadge);
      trMain.appendChild(tdType);

      // Col 4: Date
      const tdDate = document.createElement('td');
      tdDate.textContent = proj.date || '-';
      trMain.appendChild(tdDate);

      // Col 5: Price
      const tdPrice = document.createElement('td');
      tdPrice.className = 'price-highlight';
      const cleanPrice = (proj.price || '').toString().replace(/[^\d.]/g, '');
      tdPrice.textContent = cleanPrice ? `₹${cleanPrice}` : '₹0';
      trMain.appendChild(tdPrice);

      // Col 6: Drive icon button
      const tdDrive = document.createElement('td');
      tdDrive.style.textAlign = 'center';
      const rawDriveLink = (proj.driveLink || '').trim();
      const isSecureDriveLink = rawDriveLink.startsWith('http://') || rawDriveLink.startsWith('https://');
      if (isSecureDriveLink) {
        const driveLink = document.createElement('a');
        driveLink.className = 'drive-icon-btn';
        driveLink.href = rawDriveLink;
        driveLink.target = '_blank';
        driveLink.rel = 'noopener noreferrer';
        driveLink.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        `;
        tdDrive.appendChild(driveLink);
      } else {
        const noLink = document.createElement('span');
        noLink.className = 'text-muted';
        noLink.textContent = '-';
        tdDrive.appendChild(noLink);
      }
      trMain.appendChild(tdDrive);

      // Col 7: Delivery Status badge
      const tdDelivery = document.createElement('td');
      const isDelivered = (proj.deliveryStatus || '').trim().toLowerCase() === 'delivered';
      const deliveryBadge = document.createElement('span');
      deliveryBadge.className = 'badge ' + (isDelivered ? 'badge-delivered' : 'badge-progress');
      deliveryBadge.textContent = isDelivered ? 'Delivered' : 'In Progress';
      tdDelivery.appendChild(deliveryBadge);
      trMain.appendChild(tdDelivery);

      // Col 8: Payment Status badge
      const tdPayment = document.createElement('td');
      const isPaid = (proj.paymentStatus || '').trim().toLowerCase() === 'paid';
      const paymentBadge = document.createElement('span');
      paymentBadge.className = 'badge ' + (isPaid ? 'badge-paid' : 'badge-pending');
      paymentBadge.textContent = isPaid ? 'Paid' : 'Pending';
      tdPayment.appendChild(paymentBadge);
      trMain.appendChild(tdPayment);

      // Col 9: Notes text truncated
      const tdNotes = document.createElement('td');
      tdNotes.className = 'notes-cell';
      tdNotes.textContent = proj.notes || '-';
      trMain.appendChild(tdNotes);

      tableBody.appendChild(trMain);

      // Create expandable notes detail row
      const trDetail = document.createElement('tr');
      trDetail.className = 'notes-detail-row hidden';
      
      const tdDetail = document.createElement('td');
      tdDetail.colSpan = 9;
      
      const detailContainer = document.createElement('div');
      detailContainer.className = 'notes-expanded-content';
      detailContainer.textContent = proj.notes ? `Notes: ${proj.notes}` : 'No notes available.';
      
      tdDetail.appendChild(detailContainer);
      trDetail.appendChild(tdDetail);
      tableBody.appendChild(trDetail);

      // Event listener to toggle notes on main row click
      trMain.addEventListener('click', (e) => {
        // If clicked drive link, let default href handle it
        if (e.target.closest('.drive-icon-btn')) {
          return;
        }
        trDetail.classList.toggle('hidden');
      });
    });
  }

  // Render mobile card view
  function renderMobileCards(projects) {
    cardsContainer.innerHTML = '';

    projects.forEach((proj) => {
      const card = document.createElement('article');
      card.className = 'project-card';

      // Row 1: Project name bold left + Payment badge right-aligned
      const row1 = document.createElement('div');
      row1.className = 'card-row';
      
      const cardName = document.createElement('div');
      cardName.className = 'card-project-name';
      cardName.textContent = proj.name || 'Untitled Project';
      row1.appendChild(cardName);

      const isPaid = (proj.paymentStatus || '').trim().toLowerCase() === 'paid';
      const paymentBadge = document.createElement('span');
      paymentBadge.className = 'badge ' + (isPaid ? 'badge-paid' : 'badge-pending');
      paymentBadge.textContent = isPaid ? 'Paid' : 'Pending';
      row1.appendChild(paymentBadge);
      card.appendChild(row1);

      // Row 2: Type pill left + Date muted right-aligned
      const row2 = document.createElement('div');
      row2.className = 'card-row';

      const isShort = (proj.videoType || '').trim().toLowerCase() === 'short';
      const typeBadge = document.createElement('span');
      typeBadge.className = 'badge ' + (isShort ? 'badge-short' : 'badge-long');
      typeBadge.textContent = proj.videoType || (isShort ? 'Short' : 'Long-form');
      row2.appendChild(typeBadge);

      const cardDate = document.createElement('div');
      cardDate.className = 'card-date';
      cardDate.textContent = proj.date || '-';
      row2.appendChild(cardDate);
      card.appendChild(row2);

      // Row 3: Price in bold red left + Delivery status badge right-aligned
      const row3 = document.createElement('div');
      row3.className = 'card-row';

      const cardPrice = document.createElement('div');
      cardPrice.className = 'card-price';
      const cleanPrice = (proj.price || '').toString().replace(/[^\d.]/g, '');
      cardPrice.textContent = cleanPrice ? `₹${cleanPrice}` : '₹0';
      row3.appendChild(cardPrice);

      const isDelivered = (proj.deliveryStatus || '').trim().toLowerCase() === 'delivered';
      const deliveryBadge = document.createElement('span');
      deliveryBadge.className = 'badge ' + (isDelivered ? 'badge-delivered' : 'badge-progress');
      deliveryBadge.textContent = isDelivered ? 'Delivered' : 'In Progress';
      row3.appendChild(deliveryBadge);
      card.appendChild(row3);

      // Row 4: Full-width button if secure Drive Link exists
      const rawDriveLink = (proj.driveLink || '').trim();
      const isSecureDriveLink = rawDriveLink.startsWith('http://') || rawDriveLink.startsWith('https://');
      if (isSecureDriveLink) {
        const driveLinkBtn = document.createElement('a');
        driveLinkBtn.className = 'card-drive-btn';
        driveLinkBtn.href = rawDriveLink;
        driveLinkBtn.target = '_blank';
        driveLinkBtn.rel = 'noopener noreferrer';
        driveLinkBtn.textContent = 'Open Delivery Folder';
        card.appendChild(driveLinkBtn);
      }

      // Row 5: Notes if not empty
      if (proj.notes && proj.notes.trim()) {
        const row5 = document.createElement('div');
        row5.className = 'card-notes-wrapper';

        const cardNotes = document.createElement('div');
        cardNotes.className = 'card-notes clamp';
        cardNotes.textContent = proj.notes;
        
        row5.appendChild(cardNotes);
        card.appendChild(row5);

        // Tap notes to expand/collapse if longer than 2 lines
        cardNotes.addEventListener('click', () => {
      cardNotes.classList.toggle('clamp');
        });
      }

      cardsContainer.appendChild(card);
    });
  }

  // ==========================================================================
  // SPONSOR DIRECTORY DATASET & LOGIC
  // ==========================================================================

  const SPONSORS_DATA = [
    {
      name: "Xenpachi",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Japanese streetwear aesthetics, bootstrapped from Jaipur. Anime-first identity, premium build quality, cult following. Already spending on ads. Perfect fit for passive wall placement on an anime channel.",
      outreach: "Premium Curator. Reaching discerning, high-intent collectors who possess disposable income for premium acquisitions. Avoids grueling Instagram content mill through passive placement.",
      contacts: [
        { label: "Email", value: "care@xenpachi.in" },
        { label: "Email Alt", value: "care@xenpachi.com" },
        { label: "Instagram", value: "@xenpachi.india" },
        { label: "Website", value: "xenpachi.com" },
        { label: "Founder Details", value: "Nitin Sajwan, Vinod Mittal (Designated Partners). vinodmittal@hotmail.com" },
        { label: "Note", value: "Founder active on @xenpachi.uncensored (BTS account)" }
      ]
    },
    {
      name: "Harsido",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Self-described 'leading anime merch brand in India.' Active drops, Cash on Delivery available, India-wide shipping. Actively growing Instagram presence.",
      outreach: "Niche Apparel. Direct audience match for Animachar. Reaching trend-conscious viewers seeking everyday wear and responsive to YouTube integrations.",
      contacts: [
        { label: "Instagram", value: "@harsido" },
        { label: "Website", value: "harsido.com" },
        { label: "Note", value: "DM the Instagram directly - founder runs it personally (9.2K followers)" }
      ]
    },
    {
      name: "Anime Devta",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "India's first 'Indian Anime' merch brand blending Bharat culture with anime art. Jaipur based, co-founded by engineering and design students at UPES and incubated under the Runway program. Raised pre-incubation funding.",
      outreach: "Community-Driven Startup. Merges local culture and anime art. targets Tier-2/Tier-3 cities with affordable pricing, free shipping prepaid, and low COD fees.",
      contacts: [
        { label: "Email", value: "support@animedevta.com" },
        { label: "Instagram", value: "@anime_devta" },
        { label: "Website", value: "animedevta.com" },
        { label: "Founder", value: "Dev Taneja, Himangshu Goswami" },
        { label: "Note", value: "Shark Tank India S3/S5 finalist. Co-founders are ex-anime YouTubers themselves. LinkedIn: Dev Taneja" }
      ]
    },
    {
      name: "Weeboholic",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Anime streetwear startup based in Zirakpur, Punjab. Focuses on specialized silhouettes including oversized anime jerseys and Hawaiian shirts.",
      outreach: "Community-Driven Startup. Focuses on premium oversized jerseys and Hawaiian cuts, addressing the modern streetwear preferences of the anime community.",
      contacts: [
        { label: "Email", value: "info.weeboholic@gmail.com" },
        { label: "Instagram", value: "@weeboholicofficial" },
        { label: "Website", value: "weeboholic.com" },
        { label: "Note", value: "Zirakpur, Punjab D2C startup." }
      ]
    },
    {
      name: "AnimeOryx",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Bootstrapped anime apparel brand operating under 'Otaku's Trend' from Guna, Madhya Pradesh. Known for custom prints and material quality.",
      outreach: "Premium Materials. Uses 250 GSM French Terry Cotton. Targets underrated anime fandoms alongside mainstream titles to reach dedicated collectors.",
      contacts: [
        { label: "Email", value: "animeoryx.tee@gmail.com" },
        { label: "Instagram", value: "@animeoryx" },
        { label: "Website", value: "animeoryx.in" },
        { label: "Note", value: "Otaku's Trend, Guna, Madhya Pradesh." }
      ]
    },
    {
      name: "Bonkers Corner",
      category: "apparel",
      priority: "try",
      status: "Active",
      desc: "streetwear giant operating from Ulhasnagar, Maharashtra. Bootstrapped in 2020 by Shubham Gupta and Saniya Shaikh to a Rs 300 Crore valuation. Moat is fully vertically integrated in-house manufacturing, allowing fast collections drops.",
      outreach: "Mainstream Streetwear Giant. Maintaining absolute cultural dominance and top-of-mind recall among Gen-Z consumers. Relies on fast drops and massive scaling.",
      contacts: [
        { label: "Email", value: "info@bonkerscorner.com" },
        { label: "Instagram", value: "@bonkerscorner" },
        { label: "Website", value: "bonkerscorner.com" },
        { label: "Founder", value: "Shubham Gupta (Founder and CEO). LinkedIn: Shubham Gupta" },
        { label: "Note", value: "Appeared on Shark Tank India S5; secured Series A funding ($10.7M) from India SME Investments." }
      ]
    },
    {
      name: "ComicSense",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "A massive pop-culture and anime merchandise retailer in India. Offers extensive inventory from college fests to global e-commerce. Foundational brand from which Xenpachi evolved.",
      outreach: "Mainstream Streetwear. Sagar Agarwal (Co-founder / Marketing and Sales Head) LinkedIn active. Scaled brand with deep roots in creator community.",
      contacts: [
        { label: "Email", value: "care@comicsense.xyz" },
        { label: "Instagram", value: "@comicsense.store" },
        { label: "Website", value: "comicsense.store" },
        { label: "Founder", value: "Sagar Agarwal" }
      ]
    },
    {
      name: "Weebshop India",
      category: "art",
      priority: "try",
      status: "Active",
      desc: "Merchandise aggregator store based in Chennai. Offers wide catalog including figures, cosplay accessories, and prints. Founded by SP Praveen Raj.",
      outreach: "Grassroots Merchandiser. Authentic community ties. Co-founder SP Praveen Raj also ran 'Anime Nadu', the first physical anime newspaper in India.",
      contacts: [
        { label: "Email", value: "support@weebshop.in" },
        { label: "Instagram", value: "@weebshopindia" },
        { label: "Website", value: "weebshop.in" },
        { label: "Founder", value: "SP Praveen Raj (pvnstarlet), Yokesh Ananthakrishnan" }
      ]
    },
    {
      name: "Crunchyroll India",
      category: "sub",
      priority: "try",
      status: "Active",
      desc: "Sony Pictures Entertainment subsidiary driving subscription growth in India. running large celebrity campaigns (Rashmika Mandanna, Shubman Gill) and partnerships.",
      outreach: "Corporate Vanguard. Strategic partnership to acquire subscribers, reduce character acquisition costs, and normalize anime viewing locally.",
      contacts: [
        { label: "Email", value: "india@crunchyroll.com" },
        { label: "Website", value: "crunchyroll.com" },
        { label: "Founder", value: "Akshat Sahu (VP GTM & Partnerships Marketing, APAC & MENA), Vikas Boni (Senior Director and India Lead)" }
      ]
    }
  ];

  // Tab switching logic
  const btnProjects = document.getElementById('btn-projects');
  const btnSponsors = document.getElementById('btn-sponsors');
  const tabProjects = document.getElementById('tab-content-projects');
  const tabSponsors = document.getElementById('tab-content-sponsors');

  if (btnProjects && btnSponsors && tabProjects && tabSponsors) {
    btnProjects.addEventListener('click', () => {
      btnProjects.classList.add('active');
      btnSponsors.classList.remove('active');
      tabProjects.classList.remove('hidden');
      tabSponsors.classList.add('hidden');
    });

    btnSponsors.addEventListener('click', () => {
      btnSponsors.classList.add('active');
      btnProjects.classList.remove('active');
      tabSponsors.classList.remove('hidden');
      tabProjects.classList.add('hidden');
      renderSponsors();
    });
  }

  // Render function
  const sponsorTableBody = document.getElementById('sponsor-table-body');
  const sponsorsDetailsList = document.getElementById('sponsors-details-list');
  const sponsorSearch = document.getElementById('sponsor-search');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let currentCategory = 'all';

  function renderSponsors() {
    if (!sponsorTableBody || !sponsorsDetailsList) return;
    sponsorTableBody.innerHTML = '';
    sponsorsDetailsList.innerHTML = '';

    const query = sponsorSearch ? sponsorSearch.value.trim().toLowerCase() : '';

    const filtered = SPONSORS_DATA.filter(item => {
      const matchesCat = (currentCategory === 'all' || item.category === currentCategory);
      
      let matchesSearch = true;
      if (query) {
        const nameMatch = item.name.toLowerCase().includes(query);
        const descMatch = item.desc.toLowerCase().includes(query);
        const outreachMatch = item.outreach.toLowerCase().includes(query);
        
        let contactsMatch = false;
        for (const c of item.contacts) {
          if (c.value.toLowerCase().includes(query) || c.label.toLowerCase().includes(query)) {
            contactsMatch = true;
            break;
          }
        }
        matchesSearch = nameMatch || descMatch || outreachMatch || contactsMatch;
      }

      return matchesCat && matchesSearch;
    });

    filtered.forEach(item => {
      // 1. Render Table Row
      const tr = document.createElement('tr');

      // Brand Name td
      const tdName = document.createElement('td');
      tdName.innerHTML = `<div class="table-brand-name"><span class="priority-indicator priority-${item.priority}"></span>${item.name}</div>`;
      tr.appendChild(tdName);

      // Category td
      const tdCat = document.createElement('td');
      const catBadge = document.createElement('span');
      catBadge.className = `category-badge cat-${item.category}`;
      catBadge.textContent = item.category === 'art' ? 'Art & Prints' : (item.category === 'sub' ? 'Subscription' : 'Apparel');
      tdCat.appendChild(catBadge);
      tr.appendChild(tdCat);

      // Helper to make copyable td cell
      function createCopyableCell(value) {
        const td = document.createElement('td');
        if (value && value !== 'Not found publicly' && !value.includes('Search') && !value.includes('Contact via')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-contact-cell';
          
          const textSpan = document.createElement('span');
          textSpan.className = 'table-contact-text';
          textSpan.textContent = value;
          
          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-btn';
          copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
          `;
          copyBtn.addEventListener('click', () => {
            copyText(value, copyBtn);
          });
          
          wrapper.appendChild(textSpan);
          wrapper.appendChild(copyBtn);
          td.appendChild(wrapper);
        } else {
          td.style.color = 'var(--color-text-muted)';
          td.textContent = value || '-';
        }
        return td;
      }

      // Find contacts
      const emailObj = item.contacts.find(c => c.label.toLowerCase().includes('email') && !c.label.toLowerCase().includes('founder') && !c.label.toLowerCase().includes('alt'));
      const emailVal = emailObj ? emailObj.value : 'Not found publicly';

      const instagramObj = item.contacts.find(c => c.label.toLowerCase().includes('instagram'));
      const instagramVal = instagramObj ? instagramObj.value : 'Not found publicly';

      const websiteObj = item.contacts.find(c => c.label.toLowerCase().includes('website'));
      const websiteVal = websiteObj ? websiteObj.value : 'Not found publicly';

      const foundersObj = item.contacts.filter(c => c.label.toLowerCase().includes('founder') || c.label.toLowerCase().includes('ceo') || c.label.toLowerCase().includes('partners') || c.label.toLowerCase().includes('details'));
      const foundersVal = foundersObj.map(f => f.value).join(', ') || '-';

      tr.appendChild(createCopyableCell(emailVal));
      tr.appendChild(createCopyableCell(instagramVal));
      tr.appendChild(createCopyableCell(websiteVal));

      const tdFounders = document.createElement('td');
      tdFounders.style.maxWidth = '200px';
      tdFounders.style.overflow = 'hidden';
      tdFounders.style.textOverflow = 'ellipsis';
      tdFounders.style.whiteSpace = 'nowrap';
      tdFounders.textContent = foundersVal;
      tr.appendChild(tdFounders);

      sponsorTableBody.appendChild(tr);

      // 2. Render Detail Blocks (H1 / H3 structure)
      const detailBlock = document.createElement('div');
      detailBlock.className = 'sponsor-detail-block';

      // Brand Name H1
      const h1Name = document.createElement('h1');
      h1Name.className = 'sponsor-detail-name';
      h1Name.innerHTML = `<span class="priority-indicator priority-${item.priority}"></span>${item.name}`;
      detailBlock.appendChild(h1Name);

      // Subheading H3
      const h3Sub = document.createElement('h3');
      h3Sub.className = 'sponsor-detail-sub';
      const cleanCat = item.category === 'art' ? 'Art & Prints' : (item.category === 'sub' ? 'Subscription' : 'Apparel');
      h3Sub.innerHTML = `<span>Category: ${cleanCat}</span> · <span>Priority: ${item.priority.toUpperCase()}</span> · <span>Status: ${item.status}</span>`;
      detailBlock.appendChild(h3Sub);

      // Tell About Brand
      const aboutEl = document.createElement('p');
      aboutEl.className = 'sponsor-detail-about';
      aboutEl.textContent = item.desc;
      detailBlock.appendChild(aboutEl);

      // Why Should We Choose Them Section
      const whyEl = document.createElement('div');
      whyEl.className = 'sponsor-detail-why';
      
      const whyTitle = document.createElement('div');
      whyTitle.className = 'why-title';
      whyTitle.textContent = 'Why Choose This Brand';

      const whyText = document.createElement('div');
      whyText.className = 'why-text';
      whyText.textContent = item.outreach;

      whyEl.appendChild(whyTitle);
      whyEl.appendChild(whyText);
      detailBlock.appendChild(whyEl);

      // Website Link Attachment
      if (websiteVal && websiteVal !== 'Not found publicly' && !websiteVal.includes('Search')) {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'sponsor-detail-link-container';

        const link = document.createElement('a');
        link.className = 'sponsor-detail-link';
        const secureUrl = websiteVal.startsWith('http') ? websiteVal : `https://${websiteVal}`;
        link.href = secureUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = `
          <span>Visit Website</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6"></path>
            <path d="M10 14 21 3"></path>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          </svg>
        `;
        linkContainer.appendChild(link);
        detailBlock.appendChild(linkContainer);
      }

      sponsorsDetailsList.appendChild(detailBlock);
    });
  }

  // Copy Clipboard Helper
  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied');
      setTimeout(() => {
        btn.classList.remove('copied');
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  // Search input listeners
  if (sponsorSearch) {
    sponsorSearch.addEventListener('input', renderSponsors);
  }

  // Filter button listeners
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter');
      renderSponsors();
    });
  });

  // Disable right-click context menu to prevent inspecting
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Disable developer tool keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
      (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
    ) {
      e.preventDefault();
    }
  });
});
