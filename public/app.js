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
      pitch: "A passive logo placement elevates Xenpachi's premium, scarcity-driven streetwear by establishing subtle, high-end brand recall among half a million dedicated otaku consumers without requiring aggressive content generation.",
      outreach: "Premium Curator. Reaching discerning, high-intent collectors who possess disposable income for premium acquisitions. Avoids grueling Instagram content mill through passive placement.",
      contacts: [
        { label: "Email", value: "care@xenpachi.in" },
        { label: "Email Alt", value: "care@xenpachi.com" },
        { label: "Instagram", value: "@xenpachi.india" },
        { label: "Founder Email", value: "vinodmittal@hotmail.com" },
        { label: "Founder Details", value: "Nitin Sajwan, Vinod Mittal (Designated Partners)" },
        { label: "Note", value: "Founder active on @xenpachi.uncensored (BTS account)" }
      ],
      tag: "14K IG · logo on wall, colour-matched bg · zero verbal risk"
    },
    {
      name: "Harsido",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Self-described 'leading anime merch brand in India.' Active drops, Cash on Delivery available, India-wide shipping. Actively growing Instagram presence.",
      pitch: "Integrating Harsido's culturally relevant apparel directly into high-retention anime content drives immediate, high-trust conversion among trend-conscious viewers seeking everyday fandom wear.",
      outreach: "Niche Apparel. Direct audience match for Animachar. Reaching trend-conscious viewers seeking everyday wear and responsive to YouTube integrations.",
      contacts: [
        { label: "Instagram", value: "@harsido" },
        { label: "Website", value: "harsido.com" },
        { label: "Note", value: "DM the Instagram directly - founder runs it personally (9.2K followers)" }
      ],
      tag: "9.2K IG · direct audience match · pilot-friendly budget"
    },
    {
      name: "Anime Devta",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "India's first 'Indian Anime' merch brand blending Bharat culture with anime art. Jaipur based, co-founded by engineering and design students at UPES and incubated under the Runway program. Raised pre-incubation funding.",
      pitch: "Aligning with a prominent Indian anime channel amplifies Anime Devta's youthful, 'phodu' brand narrative to a highly engaged demographic actively seeking affordable, localized merchandise.",
      outreach: "Community-Driven Startup. Merges local culture and anime art. targets Tier-2/Tier-3 cities with affordable pricing, free shipping prepaid, and low COD fees.",
      contacts: [
        { label: "Email", value: "support@animedevta.com" },
        { label: "Instagram", value: "@anime_devta" },
        { label: "Founder", value: "Dev Taneja, Himangshu Goswami" },
        { label: "Founder LinkedIn", value: "LinkedIn: Dev Taneja" },
        { label: "Note", value: "Shark Tank India S3/S5 finalist. Co-founders are ex-anime YouTubers themselves." }
      ],
      tag: "22K IG · Shark Tank S3 finalist · ex-anime YouTuber founder"
    },
    {
      name: "Weeboholic",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Anime streetwear startup based in Zirakpur, Punjab. Focuses on specialized silhouettes including oversized anime jerseys and Hawaiian shirts.",
      pitch: "Showcasing Weeboholic's signature oversized and Hawaiian anime shirts through passive placement captures the exact streetwear preferences and styling habits of the modern Indian anime fanbase.",
      outreach: "Community-Driven Startup. Focuses on premium oversized jerseys and Hawaiian cuts, addressing the modern streetwear preferences of the anime community.",
      contacts: [
        { label: "Email", value: "info.weeboholic@gmail.com" },
        { label: "Instagram", value: "@weeboholicofficial" },
        { label: "Website", value: "weeboholic.com" },
        { label: "Note", value: "DM Instagram - very small team, founder likely responds directly." }
      ],
      tag: "1.6K IG · hungry for visibility · mutual proof-of-concept"
    },
    {
      name: "AnimeOryx",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Bootstrapped anime apparel brand operating under 'Otaku's Trend' from Guna, Madhya Pradesh. Known for custom prints and material quality.",
      pitch: "Promoting AnimeOryx's 250 GSM French terry apparel emphasizes premium product quality and highlights underrated fandoms to a discerning viewership that values material longevity.",
      outreach: "Premium Materials. Uses 250 GSM French Terry Cotton. Targets underrated anime fandoms alongside mainstream titles to reach dedicated collectors.",
      contacts: [
        { label: "Email", value: "animeoryx.tee@gmail.com" },
        { label: "Website", value: "animeoryx.in" },
        { label: "Instagram", value: "Search @animeoryx on IG" },
        { label: "Note", value: "Contact via website form (animeoryx.in) or direct email." }
      ],
      tag: "Premium 250GSM product · community-first brand · Rs 2K pilot fit"
    },
    {
      name: "NerdyOtaku",
      category: "apparel",
      priority: "warm",
      status: "Inactive (As D2C Merch)",
      desc: "Originally ran nerdyotaku.in. Technical traces indicate the storefront is dormant/inactive. Active entity is a YouTube channel (28.7K subscribers) focusing on manga reader app tutorials (e.g. Mihon app).",
      pitch: "N/A (Brand functions primarily as a digital content channel rather than a physical D2C merchandise brand).",
      outreach: "Embroidery Niche. Incompatible with B2B merchandise sponsorships. Functions as a creator channel and software tutorial hub.",
      contacts: [
        { label: "Instagram", value: "@nerdyotaku.india" },
        { label: "Note", value: "YouTube channel: Nerdy Otaku (28.7K subscribers) - tutorial hub." }
      ],
      tag: "Embroidery = visual wall art angle · 1.5K IG · niche premium"
    },
    {
      name: "Bonkers Corner",
      category: "apparel",
      priority: "try",
      status: "Active",
      desc: "streetwear giant operating from Ulhasnagar, Maharashtra. Bootstrapped in 2020 by Shubham Gupta and Saniya Shaikh to a Rs 300 Crore valuation. Moat is fully vertically integrated in-house manufacturing, allowing fast collections drops.",
      pitch: "Partnering with a channel boasting 500K subscribers reinforces Bonkers Corner's mainstream market dominance and cultural footprint within the competitive Gen-Z streetwear sector.",
      outreach: "Mainstream Streetwear Giant. Maintaining absolute cultural dominance and top-of-mind recall among Gen-Z consumers. Relies on fast drops and massive scaling.",
      contacts: [
        { label: "Email", value: "info@bonkerscorner.com" },
        { label: "Instagram", value: "@bonkerscorner" },
        { label: "Founder", value: "Shubham Gupta (Founder and CEO)" },
        { label: "Founder LinkedIn", value: "LinkedIn: Shubham Gupta" },
        { label: "Note", value: "Appeared on Shark Tank India S5; secured Series A funding ($10.7M) from India SME Investments." }
      ],
      tag: "Rs 195 Cr revenue · Gen Z streetwear · aspirational pitch candidate"
    },
    {
      name: "Displate",
      category: "art",
      priority: "hot",
      status: "Active",
      desc: "Seattle, WA based global brand specializing in magnet-mounted metal art posters. One of the top sponsors of anime content creators globally.",
      pitch: "Promoting Displate's high-quality metal posters taps directly into the high-intent, premium collector mindset of a dedicated regional viewership, driving measurable performance marketing returns.",
      outreach: "Performance Affiliate Engine. structured creator and affiliate programs (up to 25% commission) with dedicated creator support teams.",
      contacts: [
        { label: "Email", value: "support@displate-us.com" },
        { label: "Website", value: "displate.com/creators" },
        { label: "CEO", value: "Nicholas Holdcraft (CEO), Justin Vincent" },
        { label: "Note", value: "Submit channel statistics through their creator application portal." }
      ],
      tag: "Top anime YT sponsor globally · creator portal direct apply"
    },
    {
      name: "Indian Art Print Sellers",
      category: "art",
      priority: "hot",
      status: "Unknown",
      desc: "Independent artists selling anime art prints on Etsy or Instagram. Mostly solo founders selling prints for room decor.",
      pitch: "N/A (Specific data for active accounts matching the exact criteria of 1K to 20K followers is not found publicly).",
      outreach: "Visual Art. Easiest targets for low budget pilots. Fits naturally as background wall display items in creator studio videos.",
      contacts: [
        { label: "Instagram Search", value: 'Search "anime art prints India" on IG' },
        { label: "Etsy Search", value: 'Search "anime wall art India" on Etsy' }
      ],
      tag: "Easiest yes · Rs 2K pilot sweet spot · 10+ candidates available",
      replacement: {
        title: "Replacement Suggestion",
        desc: "Major pop-culture licensed retailers like The Souled Store or Bewakoof, offering established affiliate structures and marketing budgets."
      }
    },
    {
      name: "Posters.in / Posters Wala",
      category: "art",
      priority: "warm",
      status: "Unknown",
      desc: "Bootstrapped Indian print shops selling anime poster packages on Amazon India and social media.",
      pitch: "Promoting high-quality anime posters directly appeals to viewers looking to decorate their spaces, leveraging the high visual presence of studio wall backdrops in creator videos.",
      outreach: "Visual Wall Decor. Native to the format. Placing their printed products physically in the video background is a direct visual showcase.",
      contacts: [
        { label: "Instagram Search", value: 'Search "anime poster India brand" on IG' },
        { label: "Amazon Search", value: 'Search "anime poster" on Amazon India to find seller profiles' }
      ],
      tag: "Passive wall art = native to the format · high visual synergy"
    },
    {
      name: "Weebshop India",
      category: "art",
      priority: "try",
      status: "Active",
      desc: "Merchandise aggregator store based in Chennai. Offers wide catalog including figures, cosplay accessories, and prints. Founded by SP Praveen Raj.",
      pitch: "A passive integration leverages Weebshop's grassroots 'by the weebs, for the weebs' ethos, building authentic trust and driving sales within an organically grown anime community.",
      outreach: "Grassroots Merchandiser. Authentic community ties. Co-founder SP Praveen Raj also ran 'Anime Nadu', the first physical anime newspaper in India.",
      contacts: [
        { label: "Email", value: "support@weebshop.in" },
        { label: "Website", value: "weebshop.in" },
        { label: "Instagram", value: "@weebshopindia" },
        { label: "Founder", value: "SP Praveen Raj (pvnstarlet), Yokesh Ananthakrishnan" }
      ],
      tag: "Multi-category · figures + prints = visual placement potential"
    },
    {
      name: "Aitai Kuji",
      category: "sub",
      priority: "hot",
      status: "Active",
      desc: "Tokyo, Japan based e-commerce platform specializing in exclusive Japanese lottery goods (kuji), café items, and proxy orders. Founded by Audrey Lamsam.",
      pitch: "Showcasing Aitai Kuji's exclusive Japanese lottery goods introduces a massive Indian audience to authentic, hard-to-find collector merchandise, acting as a trusted bridge for cross-border commerce.",
      outreach: "Cross-Border Platform. Creator endorsement bridges trust and reassures local Indian buyers about international shipping times, custom duties, and logistics.",
      contacts: [
        { label: "Email", value: "contact@aitaikuji.com" },
        { label: "Website", value: "aitaikuji.com" },
        { label: "Founder", value: "Audrey Lamsam (Aitaikimochi)" },
        { label: "Note", value: "Apply via creator partnerships form on website." }
      ],
      tag: "Built to sponsor anime YT creators · recurring budget model"
    },
    {
      name: "Indian Manga Sub Box",
      category: "sub",
      priority: "warm",
      status: "Unknown",
      desc: "Recurring monthly manga box delivery model in India. Currently unverified or operating outside public digital footprints as of June 2026.",
      pitch: "N/A (A verified, active Indian manga subscription box operating under this specific recurring model is not found publicly).",
      outreach: "Subscription Box Niche. Recurring budget model has high value but requires direct replacements due to lack of local active operators.",
      contacts: [
        { label: "Instagram Search", value: 'Search "manga subscription India" on IG' }
      ],
      tag: "Monthly budget model · recurring deal potential · growing vertical",
      replacement: {
        title: "Replacement Suggestion",
        desc: "MangaStore.in, an active e-commerce storefront that specializes in shipping high-value manga sets (e.g., One Piece, Demon Slayer box sets)."
      }
    },
    {
      name: "Right Stuf Anime",
      category: "sub",
      priority: "warm",
      status: "Inactive (Shut Down)",
      desc: "Historical retail giant co-founded by Shawne Kleckner. standalone brand shut down and fully migrated into Crunchyroll Store in October 2023.",
      pitch: "N/A (Operations successfully folded into the Crunchyroll Store, resulting in the dissolution of the standalone brand identity).",
      outreach: "Defunct Retail Giant. Standalone identity is dissolved. Replaced by active local or global alternatives.",
      contacts: [
        { label: "Former Founders", value: "Shawne Kleckner, Robert Todd Ferson" }
      ],
      tag: "Established creator program · ships India · worth applying",
      replacement: {
        title: "Replacement Suggestion",
        desc: "ComicSense / DatteHameHa (comicsense.store, contact: care@comicsense.xyz, Sagar Agarwal), which operates at a high-volume mainstream level in India."
      }
    },
    {
      name: "Crunchyroll India",
      category: "sub",
      priority: "try",
      status: "Active",
      desc: "Sony Pictures Entertainment subsidiary driving subscription growth in India. running large celebrity campaigns (Rashmika Mandanna, Shubman Gill) and partnerships.",
      pitch: "Strategic logo placement on a top-tier regional channel drives premium subscription conversions, lowers CAC, and solidifies Crunchyroll's market dominance in the rapidly expanding Indian sector.",
      outreach: "Corporate Vanguard. Strategic partnership to acquire subscribers, reduce character acquisition costs, and normalize anime viewing locally.",
      contacts: [
        { label: "Partnerships", value: "Vikas Boni (Senior Director and India Lead for Global Distribution)" },
        { label: "Marketing VP", value: "Akshat Sahu (VP GTM & Partnerships Marketing, APAC & MENA)" },
        { label: "Note", value: "Reach out via professional LinkedIn networks to Boni and Sahu directly." }
      ],
      tag: "Reach out · passive format removes conflict-of-interest concern"
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
  const sponsorsGrid = document.getElementById('sponsors-grid');
  const sponsorSearch = document.getElementById('sponsor-search');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let currentCategory = 'all';

  function renderSponsors() {
    if (!sponsorsGrid) return;
    sponsorsGrid.innerHTML = '';

    const query = sponsorSearch ? sponsorSearch.value.trim().toLowerCase() : '';

    const filtered = SPONSORS_DATA.filter(item => {
      const matchesCat = (currentCategory === 'all' || item.category === currentCategory);
      
      let matchesSearch = true;
      if (query) {
        const nameMatch = item.name.toLowerCase().includes(query);
        const descMatch = item.desc.toLowerCase().includes(query);
        const outreachMatch = item.outreach.toLowerCase().includes(query);
        const pitchMatch = item.pitch.toLowerCase().includes(query);
        
        let contactsMatch = false;
        for (const c of item.contacts) {
          if (c.value.toLowerCase().includes(query) || c.label.toLowerCase().includes(query)) {
            contactsMatch = true;
            break;
          }
        }
        matchesSearch = nameMatch || descMatch || outreachMatch || pitchMatch || contactsMatch;
      }

      return matchesCat && matchesSearch;
    });

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'sponsor-card';

      // Top Row (Name, Category)
      const topRow = document.createElement('div');
      topRow.className = 'sponsor-card-top';

      const titleEl = document.createElement('h3');
      titleEl.className = 'sponsor-card-title';
      titleEl.innerHTML = `<span class="priority-indicator priority-${item.priority}"></span>${item.name}`;

      const catBadge = document.createElement('span');
      catBadge.className = `category-badge cat-${item.category}`;
      catBadge.textContent = item.category === 'art' ? 'Art & Prints' : (item.category === 'sub' ? 'Subscription' : 'Apparel');

      topRow.appendChild(titleEl);
      topRow.appendChild(catBadge);
      card.appendChild(topRow);

      // Description
      const descEl = document.createElement('p');
      descEl.className = 'sponsor-card-desc';
      descEl.textContent = item.desc;
      card.appendChild(descEl);

      // Status
      const statusEl = document.createElement('div');
      statusEl.style.fontSize = '12px';
      statusEl.style.color = 'var(--color-text-muted)';
      const isAct = item.status.includes('Active');
      statusEl.innerHTML = `Status: <span style="font-weight:600; color:${isAct ? 'var(--color-royal-green)' : 'var(--color-primary-red)'}">${item.status}</span>`;
      card.appendChild(statusEl);

      // Strategic Outreach Rationale
      const outreachSection = document.createElement('div');
      outreachSection.className = 'sponsor-outreach-section';
      
      const outreachHeader = document.createElement('div');
      outreachHeader.className = 'outreach-header';
      outreachHeader.textContent = 'Why Reach Out';
      
      const outreachReason = document.createElement('div');
      outreachReason.className = 'outreach-reason';
      outreachReason.textContent = item.outreach;

      outreachSection.appendChild(outreachHeader);
      outreachSection.appendChild(outreachReason);
      card.appendChild(outreachSection);

      // Pitch Section with Copy Button
      if (item.pitch && item.pitch !== 'N/A') {
        const pitchSection = document.createElement('div');
        pitchSection.className = 'sponsor-outreach-section';
        pitchSection.style.borderLeftColor = '#EF9F27';

        const pitchHeader = document.createElement('div');
        pitchHeader.className = 'pitch-header';
        pitchHeader.innerHTML = `<span>Suggested Pitch Angle</span>`;

        const copyPitchBtn = document.createElement('button');
        copyPitchBtn.className = 'copy-btn';
        copyPitchBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
          </svg>
        `;
        copyPitchBtn.addEventListener('click', () => {
          copyText(item.pitch, copyPitchBtn);
        });
        pitchHeader.appendChild(copyPitchBtn);

        const pitchContent = document.createElement('div');
        pitchContent.className = 'pitch-content';
        pitchContent.textContent = item.pitch;

        pitchSection.appendChild(pitchHeader);
        pitchSection.appendChild(pitchContent);
        card.appendChild(pitchSection);
      }

      // Replacement details if any
      if (item.replacement) {
        const replacementNotice = document.createElement('div');
        replacementNotice.className = 'replacement-notice';
        
        const replacementTitle = document.createElement('div');
        replacementTitle.className = 'replacement-title';
        replacementTitle.textContent = item.replacement.title;

        const replacementDesc = document.createElement('div');
        replacementDesc.textContent = item.replacement.desc;

        replacementNotice.appendChild(replacementTitle);
        replacementNotice.appendChild(replacementDesc);
        card.appendChild(replacementNotice);
      }

      // Contact list with individual copy buttons
      const contactList = document.createElement('div');
      contactList.className = 'sponsor-contact-list';

      const contactLabel = document.createElement('div');
      contactLabel.className = 'contact-label';
      contactLabel.textContent = 'Contacts';
      contactList.appendChild(contactLabel);

      item.contacts.forEach(c => {
        const row = document.createElement('div');
        row.className = 'contact-item-row';

        const detail = document.createElement('div');
        detail.className = 'contact-item-detail';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'contact-item-label';
        labelSpan.textContent = c.label;

        const valSpan = document.createElement('span');
        valSpan.className = 'contact-item-value';
        valSpan.textContent = c.value;

        detail.appendChild(labelSpan);
        detail.appendChild(valSpan);
        row.appendChild(detail);

        // Copy button if not a placeholder
        const cleanVal = c.value.toLowerCase();
        if (cleanVal !== 'not found publicly' && !cleanVal.includes('search') && !cleanVal.includes('contact via')) {
          const btn = document.createElement('button');
          btn.className = 'copy-btn';
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
          `;
          btn.addEventListener('click', () => {
            copyText(c.value, btn);
          });
          row.appendChild(btn);
        }

        contactList.appendChild(row);
      });

      card.appendChild(contactList);
      sponsorsGrid.appendChild(card);
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
