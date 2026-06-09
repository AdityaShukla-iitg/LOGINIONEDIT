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

  const SHORTS_DATA = [
    {
      id: "short-1",
      title: "The Final Bankai (Bleach TYBW: The Calamity)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Final Bankai (Bleach TYBW: The Calamity)
DURATION: 2 Minutes (120 Seconds)
PACING: Relentless, cinematic, and heavy on the lore hype. We are treating this like a major theatrical event breakdown.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Start with Yhwach's terrifying smile, flash to a black screen with the word "BANKAI" in bold red typography, then slam into Ichigo holding his true Zangetsu.

AUDIO: Dead silence for one second. The iconic, eerie Bleach spiritual pressure sound effect kicks in, followed by a heavy bass drop.

NARRATION (Hinglish): Bhai, the Big Three is officially reclaiming the throne this month. Bleach Thousand-Year Blood War Part 4 - "The Calamity" - is here, aur ye anime history ka sabse bada course correction hone wala hai.

THE EVENT (Setting the Stakes for June)

VISUAL: Show screenshots of the official Fandango theatrical release announcements for June 25th-29th, transitioning into high-octane clips of the Royal Guard.

AUDIO: Fast-paced, heavy rock instrumental (similar to classic Bleach OSTs like "Number One" but darker).

NARRATION (Hinglish): Is June, Bleach is literally hitting the theaters. The first three episodes of the final cour are getting a massive cinematic release before dropping on streaming in July. Studio Pierrot is treating this like a blockbuster movie, kyunki is cour mein jo fights hone wali hain, wo tumhari TV screens par contain nahi ho sakti.

THE FIXING THE MANGA (The Creator Meta)

VISUAL: Split screen. On the left, rough, rushed manga panels from the final chapters. On the right, Tite Kubo's new anime-original storyboards and fully animated sequences.

AUDIO: The music shifts to a more analytical, intense beat.

NARRATION (Hinglish): Manga readers, dhyan se suno. Hum sabko pata hai ki manga ka ending kitna rush kiya gaya tha. Tite Kubo ki health issues ke wajah se the final fights were cut short. Lekin anime mein? Tite Kubo is directly involved, aur wo us ending ko completely rewrite aur expand kar rahe hain. "The Calamity" only has to adapt around 12 chapters... which means baki pura runtime naye, original lore aur expanded fights se bhara hoga.

THE ROYAL GUARD VS. YHWACH (The Core Conflict)

VISUAL: A fast, aggressive montage showing Squad Zero (Senjumaru, Ichibei) unleashing their true power, contrasted with Yhwach's Almighty eyes opening.

AUDIO: A grand orchestral choir builds up, mixing with the heavy rock beat.

NARRATION (Hinglish): Pichle season mein humne Squad Zero ka real terror dekha tha jab Senjumaru ne apna Bankai use kiya. But Yhwach? Wo ab ek alag hi dimension mein exist karta hai. "The Almighty" power is officially awakened. Imagine fighting an enemy jo sirf future dekh nahi sakta... wo future ko change kar sakta hai. Yhwach is literally a broken cheat code right now.

THE ICHIGO'S TRUE SHIKAI/BANKAI (The Hype Core)

VISUAL: Slow-motion pan up Ichigo's new dual-blade stance. Focus on the intense, glowing Reiatsu leaking from his swords. Add subtle screen shakes.

AUDIO: The choir peaks, followed by the sharp sound of a blade drawing.

NARRATION (Hinglish): Aur is absolute despair ke beech mein aayega apna main character. Ichigo Kurosaki finally apne true Shikai aur Bankai ke saath Yhwach ko face karne wala hai. Jo log bolte the "Ichigo sirf Getsuga Tenshou spam karta hai," unka pura perception change hone wala hai. The animation budget for this final clash is going to make the internet crash.

THE WARNING (Managing Expectations)

VISUAL: Dark, moody shots of the destroyed Soul Society, fading into heavy film grain and a red tint to emphasize the "Calamity."

AUDIO: The beat fades into a low, tense, ominous drone.

NARRATION (Hinglish): Ek warning de raha hoon. Title "The Calamity" aise hi nahi rakha hai. Ye arc ek bloodbath hai. Aise characters marenge ya permanently change ho jayenge jinki tumne ummeed bhi nahi ki hogi. No plot armor, just pure survival.

THE CALL TO ACTION (Engagement Bait)

VISUAL: A clean graphic showing Ichigo on the left and Yhwach on the right. Text overlay: "CAN ICHIGO SURVIVE THE ALMIGHTY?"

AUDIO: Music swells, ending on an abrupt bass hit and a sword slash sound effect.

NARRATION (Hinglish): Toh comment section mein mujhe honestly batao - kya tum log theater jaa rahe ho is epic premiere ke liye? Aur tum sabse zyada kis character ka true Bankai dekhna chahte ho? Manga readers, anime-onlies ko hype karo but NO spoilers. Channel ko subscribe karo kyunki Bleach lore breakdowns are coming!`
    },
    {
      id: "short-2",
      title: "The Most Terrifying Arc in Anime History (Chainsaw Man Season 2)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Most Terrifying Arc in Anime History (Chainsaw Man Season 2)
DURATION: 2 Minutes (120 Seconds)
PACING: Unsettling, chaotic, and heavily focused on cosmic/psychological horror.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Start with Denji smiling, snap to a bloody chainsaw, then cut to the infamous manga panel of the severed astronauts praying in the dark.

AUDIO: Dead silence for one second. The jarring sound of a chainsaw revving, abruptly cut off by a heavy, distorted sub-bass drop.

NARRATION (Hinglish): Bhai, agar tumhe lagta hai Chainsaw Man Season 1 dark tha, ya Makima terrifying hai... toh tum International Assassins Arc ke liye genuinely ready nahi ho.

THE CONTEXT (Setting the Stakes)

VISUAL: Fast-paced montage of a global map with red targets locking onto Tokyo. Show quick flash frames of the new assassins (Quanxi, Santa Claus).

AUDIO: Introduce an emotionally restrained, rubato tempo solo violin. Keep it incredibly tense and melancholic, contrasting with the violence.

NARRATION (Hinglish): Reze movie ke baad, ab poori duniya ko pata chal chuka hai ki Chainsaw ki heart Denji ke paas hai. Aur ab? Duniya ke sabse khatarnak, ruthless assassins Tokyo aarahe hain usko maarne. Ye arc koi normal hero vs villain story nahi hai. It is a literal battle royale of the most twisted minds in the Chainsaw Man universe.

THE ASSASSINS (Flexing the Roster)

VISUAL: Split screen. On the left, Quanxi instantly decapitating a room full of people. On the right, Santa Claus turning humans into mindless, grotesque dolls. Post-Production Note: Use DaVinci Resolve Fusion nodes to add a subtle, unnatural twitch/glitch effect to the dolls' movements.

AUDIO: The solo violin speeds up, accompanied by the visceral, wet sound of slashing blades and bone-crunching Foley.

NARRATION (Hinglish): Sabse pehle aati hai Quanxi - the First Devil Hunter. Ye bandi itni fast hai ki frames literally skip hote hain jab wo attack karti hai. Phir aati hai Santa Claus. Ek aisi villain jo pure horror movie material hai. Wo normal insaano ko apne mindless, twisted dolls mein convert kar deti hai. The paranoia in this arc is insane kyunki koi bhi, kahin bhi enemy ho sakta hai.

THE PRIMAL FEAR (The Deep Lore)

VISUAL: The screen goes completely pitch black. Slowly, a pair of horrifying, abstract hands reach out from the darkness. Add a heavy film grain and chromatic aberration to make the viewer feel claustrophobic.

AUDIO: The violin drops out completely. A low, terrifying choral chant begins - very Lovecraftian and eerie.

NARRATION (Hinglish): But is arc ka actual climax anime history ko hila dega. Manga readers jaante hain main kiski baat kar raha hoon - The Primal Fears. Wo devils jinhone aaj tak ek bar bhi death experience nahi ki hai. Jab 'Darkness Devil' finally screen par appear hoga, the whole genre of Chainsaw Man is going to shift from action to pure, incomprehensible cosmic horror.

THE MAPPA'S NIGHTMARE (Technical Challenge)

VISUAL: A dynamic sequence of the characters falling through the sky into Hell, surrounded by doors in the sky. Use smooth planar tracking to float the text "WELCOME TO HELL" in the background.

AUDIO: A heavy, modern drill beat kicks in, mixing with the creepy choral chants.

NARRATION (Hinglish): MAPPA ke animators ke liye ye literally ek nightmare hone wala hai. Hell ka jo dimension Tuki Fujimoto ne draw kiya hai, usko screen par translate karna almost impossible lagta hai. The astronaut scene alone is going to break the internet. It is a visual masterpiece of absolute despair.

THE WARNING (Managing Expectations)

VISUAL: A montage of fan-favorite characters looking completely broken, bleeding, and terrified. Fade the edges to black.

AUDIO: The beat fades into a low, tense, singular heartbeat sound.

NARRATION (Hinglish): Ek warning de raha hoon. Is arc mein no one is safe. Aise characters jinko tum bohot pasand karte ho, wo sabse brutal, merciless ways mein maare jayenge. Plot armor completely destroy ho chuka hai. It is a pure, unadulterated bloodbath.

THE CALL TO ACTION (Engagement Bait)

VISUAL: A clean graphic showing Quanxi, Santa Claus, and the Darkness Devil's silhouette. Text overlay: "WHO ARE YOU WAITING FOR?"

AUDIO: Music swells, ending on an abrupt, terrifying screech sound effect.

NARRATION (Hinglish): Toh comment section mein mujhe honestly batao - tum log is arc mein sabse zyada kiske anime debut ka wait kar rahe ho? Manga readers, bina spoil kiye anime-onlies ko thoda hype karo! Aur deep lore breakdowns ke liye channel ko subscribe karna mat bhoolna.`
    },
    {
      id: "short-3",
      title: "The Trauma Returns (Re:Zero Season 4 is Busted)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Trauma Returns (Re:Zero Season 4 is Busted)
DURATION: 2 Minutes (120 Seconds)
PACING: Unsettling, psychological, and intense.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Subaru smiling, completely normal -> A sudden, violent splash of blood -> Subaru waking up screaming in absolute terror, clutching his head.

AUDIO: Dead silence for one second. A high-pitched tinnitus ringing sound kicks in, abruptly cut off by a heavy, distorted bass drop.

NARRATION (Hinglish): Tum logon ko lagta hai tum trauma ke liye ready ho? Re:Zero Season 4 just dropped, aur Arc 6 officially prove kar raha hai ki Tappei Nagatsuki actually hates his main character.

THE SETUP (Setting the Current Season Stakes)

VISUAL: Fast-paced montage of the Pleiades Watchtower environment - a desolate, terrifying landscape. Introduce the new character Shaula with dynamic text overlay.

AUDIO: Introduce a slow, detuned piano melody. Very eerie and atmospheric.

NARRATION (Hinglish): Season 3 ka "Counterattack Arc" toh sirf ek warmup tha. Abhi Season 4 chal raha hai, aur Subaru Natsuki is entering the Pleiades Watchtower. Manga and Light Novel readers pehle se jante hain... Arc 6 ko Re:Zero ki history ka sabse brutal, dark, aur mind-bending arc mana jata hai. Aur anime finally wahan pahunch gaya hai.

THE PSYCHOLOGICAL HORROR (The Core Conflict)

VISUAL: Split screen. On one side, physical monsters (like the Great Rabbit). On the other side, a distorted, glitching silhouette of Subaru himself.

AUDIO: The detuned piano gets faster, accompanied by the faint sound of panicked breathing.

NARRATION (Hinglish): Is baar villain koi Witch Cultist ya monster nahi hai. Is baar sabse bada dushman hai Subaru ka khud ka dimaag. Imagine having the power to "Return by Death," but every time you die, you lose pieces of your own memory. You forget your friends. You forget your goals. You forget who you are.

THE "RETURN BY DEATH" EVOLUTION (Technical Flex)

VISUAL: A sequence showing Subaru attacking Ram (from the recent Episode 3), showcasing the pure desperation and paranoia in his eyes.

AUDIO: A sharp, jarring string screech (like a horror movie jump scare).

NARRATION (Hinglish): White Fox studio animation mein pura budget flex kar raha hai. Episode 3 ne completely internet break kar diya jab Subaru ne literally Ram par attack kiya. The paranoia is so real. Tumhe as a viewer samajh nahi aayega ki kya real hai aur kya Subaru ke dimaag ka hallucination. Ye anime literally tumhare saath psychological games khel raha hai.

THE SAGE MYSTERY (Lore Building)

VISUAL: A slow, majestic pan up the Pleiades Watchtower, zooming into Shaula waiting at the top. Use subtle glitch effects on her face to signify mystery.

AUDIO: The music shifts from horror to a grand, but ominous orchestral swell.

NARRATION (Hinglish): Aur lore? Lore is off the charts. Hum finally The Sage ke close aa rahe hain. Shaula ka introduction ho chuka hai, aur 400 saal purane mysteries finally unbox ho rahe hain. Agar tumhe lagta tha ki Echidna ka lore crazy था, toh ye Watchtower tumhe completely mind-blown kar dega.

THE WARNING (Managing Expectations)

VISUAL: A montage of Subaru dying in increasingly horrific, unexplained ways, fading to black and white with heavy film grain.

AUDIO: The music drops out. Just a single, slow heartbeat sound.

NARRATION (Hinglish): Ek warning de raha hoon pehle hi. Ye arc light-hearted nahi hai. Ye pura psychological horror aur despair ke baare mein hai. Subaru is going to be pushed to absolute breaking point, aur kuch deaths itni disturbing hone wali hain ki tumhe seriously screen se nazrein hatani padengi.

THE CALL TO ACTION (Engagement Bait)

VISUAL: A clean graphic showing Subaru looking terrified. Text overlay: "IS ARC 6 THE PEAK?"

AUDIO: The eerie piano returns for a final, unresolved chord.

NARRATION (Hinglish): Toh comment section mein mujhe batao - kya tum Season 4 ke latest episodes ke saath caught up ho? Light novel readers, anime-onlies ko bina spoil kiye batao ki aage kitna bura hone wala hai! Aur channel ko subscribe karo for more anime deep dives.`
    },
    {
      id: "short-4",
      title: "The Future of Solo Leveling (Ragnarok & Season 3)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Future of Solo Leveling (Ragnarok & Season 3)
DURATION: 2 Minutes (120 Seconds)
PACING: Epic and cinematic. We want this to feel like a high-budget trailer for the future of the franchise.

THE HOOK (Direct & Disruptive)

VISUAL: Start with an iconic shot of Sung Jin-woo's Shadow Army from the end of Season 2, then instantly glitch into a completely new character (Suho) surrounded by shadows.

AUDIO: A heavy, resonant bell toll, followed by a sharp, modern bass drop.

NARRATION (Hinglish): Solo Leveling Season 2 just finished in March, aur tum sab Season 3 ka wait kar rahe ho. But anime fans, you have zero idea about the real monster that is coming next. The story doesn't end with Sung Jin-woo.

THE SEASON 3 HYPE (Current News)

VISUAL: Quick motion graphics showing a "Season 3 In Production" headline, then cut to high-octane battle sequences.

AUDIO: Fast-paced, driving electronic orchestra.

NARRATION (Hinglish): First of all, the Crunchyroll CEO just confirmed Season 3 is actively in development, and we are probably getting a huge update at Anime Expo this July. Season 3 is going to push the power scaling so high that A-1 Pictures will need a movie budget just to animate the Monarch battles. But that's just the beginning.

ENTER RAGNAROK (The Big Reveal)

VISUAL: The screen goes black. Text appears: "SOLO LEVELING: RAGNAROK." Transition to a dark, high-fidelity concept art style visual of a teenage boy (Suho) wielding a shadow sword, with a spectral, older Jin-woo watching over him.

AUDIO: The music shifts. A slow, heavy, Nordic-style chant begins underneath a trap beat.

NARRATION (Hinglish): Welcome to Solo Leveling: Ragnarok. This is the official sequel to the main story. Ye koi generic spin-off nahi hai. It follows Sung Jin-woo's son, Sung Suho. Imagine being the son of a literal God, but your powers are sealed, the Gates reopen, and you have to level up all over again to save the world while your dad is fighting a cosmic war somewhere else.

THE LORE EXPANSION (Deep Dive)

VISUAL: Showcase rapid transitions of different environments: shattered cities, massive new gates, and glimpses of alien-looking cosmic entities (The Itarim).

AUDIO: The beat intensifies, layering in sharp, metallic weapon clash sound effects.

NARRATION (Hinglish): Ragnarok isn't just about fighting magic beasts. Ye universe ko completely expand karta hai. Naye Outer Gods jinko 'Itarim' bolte hain, wo earth ko invade kar rahe hain kyunki Jin-woo universe ke dusre side par busy hai. Suho ko apne baap ka legacy inherit karna padega. The abilities, the shadows... sab kuch upgrade ho chuka hai.

THE REAL WORLD IMPACT (Industry Context)

VISUAL: Show a sleek graphic of the webtoon chapters scrolling rapidly, highlighting the "Over 1 Million Views" milestone and the upcoming English print release in June 2026.

AUDIO: Music builds to a final crescendo.

NARRATION (Hinglish): The web novel is already massive, and the manhwa just wrapped up its second season before going on hiatus. Ye sequel itna bada hit hai ki it is basically guaranteed to get its own anime adaptation once the main series finishes. The Shadow Army is never dying.

THE CALL TO ACTION (Engagement Bait)

VISUAL: Split screen: Sung Jin-woo on the left, Sung Suho on the right. Text overlay: "LIKE FATHER LIKE SON?"

AUDIO: Outro music fading in slowly.

NARRATION (Hinglish): Toh comment section mein mujhe batao - are you hyped for Season 3, or are you more excited to see Suho take over in Ragnarok? Aur agar tum manga reader ho, toh anime-onlies ko hype karo spoiler free. Subscribe for more deep lore updates!`
    },
    {
      id: "short-5",
      title: "Blue Lock Season 3 is HERE! (Isagi vs. Kaiser)",
      meta: "Target: 3s Hook · Language: Hinglish",
      scriptOutline: `TITLE: Blue Lock Season 3 is HERE! (Isagi vs. Kaiser)
HOOK RATE TARGET: 3 seconds (No intro, drop straight into the conflict).

THE HOOK (Visually aggressive)

VISUAL: Rapid glitch cuts of Isagi Yoichi looking furious, immediately transitioning to Michael Kaiser's arrogant smile.

AUDIO: Heavy, distorted bass drop cutting into complete silence for the first word.

NARRATION (Hinglish): Bhai, the wait is officially over. Blue Lock Season 3 ka teaser just dropped, and it's absolute peak.

THE SETUP (Building the hype fast)

VISUAL: Fast-paced montage of the "Neo Egoist League" visuals. Use zoom-ins on the character designs (focusing on the Bastard München uniforms).

AUDIO: High-tempo electronic/phonk beat kicks in.

NARRATION (Hinglish): Welcome to the Neo Egoist League. Agar tumhe lagta tha Isagi ka vision broken hai, wait until you see Michael Kaiser. Ye banda Isagi ko uski aukaat dikhane wala hai. The Isagi vs. Kaiser rivalry is going to break the internet.

THE CONTEXT (Explaining the stakes for anime-onlies)

VISUAL: Show a split screen. On the left, Isagi's "Meta Vision" puzzle pieces forming. On the right, Kaiser executing the 'Kaiser Impact' kick (use manga panels with slight animation if anime footage isn't available yet).

AUDIO: The music builds up, tension rising.

NARRATION (Hinglish): For the anime-only fans, samajh lo... Kaiser is quite literally an upgraded version of Isagi. Uske paas Meta Vision bhi hai, and the fastest right-leg swing in the world - The Kaiser Impact. He is here to destroy Isagi's ego completely.

THE CLIMAX (The core conflict)

VISUAL: Isagi surrounded by puzzle pieces, his eyes glowing with that signature green aura, looking utterly desperate but determined.

AUDIO: Music drops out for a second, then hits harder.

NARRATION (Hinglish): Par hum sabko pata hai Isagi Yoichi kaun hai. Jab tak wo completely corner nahi hota, wo evolve nahi karta. Isagi ko Kaiser ko harana hi padega if he wants to survive Bastard München.

THE CALL TO ACTION (Engagement bait)

VISUAL: A dynamic versus graphic: ISAGI vs. KAISER. Text overlay: "Who are you supporting?"

AUDIO: Outro music fading in.

NARRATION (Hinglish): Toh batao comments mein - are you team Isagi or team Kaiser? Aur agar tum manga reader ho, toh anime-onlies ko thoda hype karo spoiler free. And subscribe for more anime breakdowns!`
    },
    {
      id: "short-6",
      title: "The Only Web Novel That Rivals LOTM (Shadow Slave)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Only Web Novel That Rivals LOTM (Shadow Slave)
DURATION: 2 Minutes (120 Seconds)
PACING: Dark, mysterious, and deeply atmospheric. We are leaning heavily into the high-fantasy/dark-magic lore that your Lord of the Mysteries audience already loves.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Start with a glowing tarot card from LOTM, instantly burn it away into black ash, and reveal a hyper-realistic, shadowy figure standing in the ruins of a dead city, eyes glowing white.

AUDIO: Dead silence for one second. The sound of crumbling ash, interrupted by a heavy, echoing bell toll and a dark synth bass drop.

NARRATION (Hinglish): Bhai, agar tum Lord of the Mysteries ke hardcore fan ho, aur tumhe lagta hai ki usse deep lore aur dark world-building exist nahi karti... toh let me introduce you to the only story that actually rivals it. Welcome to Shadow Slave.

THE CONTEXT (Setting the Stakes)

VISUAL: Fast-paced motion graphics showing a modern city glitching and transforming into a dark, medieval, apocalyptic nightmare. Post-Production Note: Use DaVinci Resolve's planar tracker to seamlessly transition the modern buildings into crumbling, cursed castles.

AUDIO: A slow, ticking clock mixed with an eerie, emotionally restrained felt piano.

NARRATION (Hinglish): Imagine karo earth par ek aisi supernatural disease fail jaye jise 'The Nightmare Spell' bolte hain. Ye logo ko force karti hai ek doosri, magical dimension mein sleepwalk karne ke liye. Wahan unhe brutal, terrifying monsters se survive karna padta. Agar tum us nightmare dimension mein mar gaye, toh tum real world mein bhi mar jaoge. Aur jo zinda wapas aate hain, wo superhuman 'Awakened' ban jate hain.

THE POWER SYSTEM: FLAWS (The Lore Flex)

VISUAL: Focus on the main character, Sunny. Show his shadow physically detaching from his body, acting on its own, and looking back at him with glowing eyes.

AUDIO: The piano speeds up, adding sharp, whispering sound effects panning from left to right.

NARRATION (Hinglish): Iska power system pure genius hai. Jab tum Awaken hote ho, tumhe ek power - 'Aspect' - milti hai. But uske saath ek 'Flaw' bhi milta hai. Ek aisi fatal weakness jo tumhari life narak bana sakti hai. Humara main character, Sunless (Sunny), ek Divine-tier aspect unlock karta hai jisse wo shadows ko control kar sakta hai. But uska Flaw? Wo apni life mein kabhi bhi jhooth (lie) nahi bol sakta. Ek dark, manipulative world mein jahan secrets sab kuch hain, wo literal sach bolne ko majboor hai.

THE TRUE HORROR (The Divine Tier Curse)

VISUAL: The screen darkens heavily. Show a cinematic, high-fidelity CGI visual of an ancient, dead god in space, bound by literal threads of fate.

AUDIO: The beat drops out completely. A low, terrifying choral hum takes over, very Lovecraftian.

NARRATION (Hinglish): But Sunny ka sabse bada curse uski power ka naam hai: 'Shadow Slave'. Agar kisi bhi insaan ko Sunny ka "True Name" pata chal gaya, toh Sunny biologically aur magically us insaan ka literal ghulam (slave) ban jayega. Wo unke orders ko disobey kar hi nahi sakta. Pura plot is ek tension par based hai - Sunny ko apni shadows se god-tier monsters ko marna hai, while making sure koi uska True Name discover na kar le.

THE DUO (Sunny vs Nephis)

VISUAL: Split screen. On the left, Sunny submerged in total darkness, a calculated survivor. On the right, Nephis, a girl radiating blinding, angelic fire, looking like a literal goddess of destruction.

AUDIO: A heavy, modern drill beat suddenly kicks in.

NARRATION (Hinglish): Aur uski dynamic Nephis ke saath? Nephis ek aisi character hai jo literally apne dushmano ko aag se jala kar raakh kar deti hai. Sunny aur Nephis ka bond survive karne ke liye banta hai, but inke beech itna extreme lack of trust aur power-struggle hai ki tum literally edge of the seat par rahoge. It's one of the most toxic, beautifully written rivalries in modern fiction.

THE WARNING (Managing Expectations)

VISUAL: A rapid sequence of massive, dark fantasy landscapes - the Forgotten Shore, the Crimson Terror. Add heavy film grain and high contrast.

AUDIO: The beat fades into an ominous, echoing ambient noise.

NARRATION (Hinglish): Ek warning de raha hoon. Ye story Solo Leveling jaisi power-fantasy nahi hai. Ye pure suffering, insane plot twists, aur mind-bending lore ke baare mein hai. Yahan Gods bhi mar chuke hain, aur demons earth ko rule kar rahe hain.

THE CALL TO ACTION (Engagement Bait)

VISUAL: A sleek, shadowy graphic showing Klein's Monocle on one side, and Sunny's Shadow on the other. Text overlay: "LOTM OR SHADOW SLAVE?"

AUDIO: Music swells to a chaotic end, finishing with the sound of a heavy chain snapping.

NARRATION (Hinglish): Toh comment section mein batao - kya tum logo ne Shadow Slave padhna start kiya hai? Aur agar tumne dono padhe hain, toh kiska lore aur world-building better hai - LOTM ya Shadow Slave? Subscribe karo kyunki iska deep lore breakdown bohot jald aayega!`
    },
    {
      id: "short-7",
      title: "The Ultimate Test of \"I Have No Enemies\" (Vinland Saga Season 3)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Ultimate Test of "I Have No Enemies" (Vinland Saga Season 3)
DURATION: 2 Minutes (120 Seconds)
PACING: Philosophical, emotionally heavy, but building to intense, fast-paced action.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Start with Thorfinn's peaceful face from Season 2 saying "I have no enemies." Instantly smash to a hyper-violent, blood-soaked Viking battlefield, then cut back to Thorfinn looking absolutely horrified.

AUDIO: Dead silence for one second. A peaceful acoustic guitar chord, brutally interrupted by the deafening sound of a sword clash and a heavy, cinematic bass drop.

NARRATION (Hinglish): Bhai, Vinland Saga Season 2 ne anime internet ko completely change kar diya tha with the "I have no enemies" trend. But MAPPA is dropping Season 3, aur Thorfinn ka pacifism anime history ke sabse brutal test se guzarne wala hai. Welcome to the Baltic Sea War.

THE CONTEXT (Setting the Stakes)

VISUAL: Fast-paced montage of Thorfinn, Einar, and Gudrid sailing on their ship. The tone is hopeful, until the water turns red and massive Jomsviking warships surround them.

AUDIO: A slow, haunting Nordic vocal chant begins, layered over a slow trap beat.

NARRATION (Hinglish): Season 2 ek farming simulator tha jahan Thorfinn ne apni humanity wapas paayi. Ab wo Greece ja raha hai taaki Vinland ke liye funds ikattha kar sake. But problem kya hai? Duniya abhi bhi vikings se bhari hui hai. Aur Thorfinn violently ek aisi war ke beech mein drag hone wala hai jahan literally hazaaron log ek dusre ko kaat rahe hain. The Jomsvikings are at war, and they want Thorfinn to lead them.

THE PHILOSOPHICAL CONFLICT (The Core Tension)

VISUAL: Split screen. On the left, Thorfinn's blood-soaked past as a child assassin under Askeladd. On the right, his current self, getting repeatedly punched but refusing to fight back.

AUDIO: The beat drops out completely. Just the visceral sound of heavy punches and heavy breathing.

NARRATION (Hinglish): Is arc ka main focus action nahi, ideology hai. As a viewer, tumhare dimaag mein ek hi question aayega - kya tum ek aisi duniya mein pacifist ban ke reh sakte ho jo pure violence par chalti hai? Jab tumhare doston ki jaan khatre mein ho, tab bhi kya tum apni sword draw nahi karoge? Thorfinn ki internal struggle tumhe literally goosebumps degi. It is pure psychological mastery by Makoto Yukimura.

THE NEW FIGHTING STYLE (Technical Action Flex)

VISUAL: High-speed motion sequence. Thorfinn surrounded by armed Vikings. Instead of killing them, he uses fluid, Aikido-like movements to dodge, disarm, and break bones without taking a single life. Add dynamic camera panning.

AUDIO: The heavy trap beat returns, much faster. Add sharp, swooshing Foley sounds for his dodges.

NARRATION (Hinglish): But agar tumhe lagta hai ki Season 3 mein action nahi hoga, toh tum bilkul galat ho. Thorfinn wapas fight karega. Lekin is baar, uski fighting style completely evolve ho chuki hai. Wo kill nahi karta. Wo apne dushmano ko disarm karta hai, unki speed ke against unka hi momentum use karta hai. He is so incredibly fast aur precise ki wo pure battlefields ko akele dismantle kar deta hai without dropping a single drop of blood. It's the ultimate flex of true strength.

THE VILLAIN: GARM (The Chaos Element)

VISUAL: Total color shift to violent red. Enter Garm, a psychotic, spear-wielding warrior with a wild smile, moving at blinding speeds.

AUDIO: A frantic, chaotic string section joins the beat.

NARRATION (Hinglish): Aur is warzorne mein entry hoti hai is arc ke main antagonist ki - Garm. Ye banda literal chaos hai. Wo Thorfinn ki exact opposite ideology hold karta hai. Uske liye war ek game hai, aur wo Thorfinn ki "I have no enemies" mentality ko todna chahta hai. Thorfinn vs Garm ki jo fight animate hone wali hai, wo easily MAPPA ka next viral masterpiece banegi. The choreography is unmatched.

THE WARNING (Managing Expectations)

VISUAL: A sequence of Thorfinn looking down at his own hands, trembling. Flashbacks of the people he killed in Season 1 flashing rapidly. Heavy film grain.

AUDIO: The music fades into a slow, melancholic cello solo.

NARRATION (Hinglish): Ek warning de raha hoon. Ye arc prove karega ki "I have no enemies" bolna aasan hai, but usko reality mein jeena almost impossible. Tum Thorfinn ko toot-te (break) hue dekhoge, aur uski journey tumhe cry karne par majboor kar degi. The character development here is officially peak fiction.

THE CALL TO ACTION (Engagement Bait)

VISUAL: A clean graphic showing Thorfinn dodging a massive spear strike from Garm. Text overlay: "CAN HE KEEP HIS VOW?"

AUDIO: Music swells, ending on an abrupt, echoing sound of a sword hitting the dirt.

NARRATION (Hinglish): Toh comment section mein mujhe honestly batao - kya tum logo ke hisaab se Thorfinn anime history ka best protagonist hai? Manga readers, anime-onlies ko hype karo but completely spoiler-free! Aur channel ko subscribe karna mat bhoolna for more peak anime lore breakdowns!`
    },
    {
      id: "short-8",
      title: "The Greatest Comeback in Shonen History (Boruto: Two Blue Vortex)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Greatest Comeback in Shonen History (Boruto: Two Blue Vortex)
DURATION: 2 Minutes (120 Seconds)
PACING: Cold, edgy, and heavily focused on "Aura" and redemption. We are treating this as the ultimate revenge story.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Start with an old clip of kid Boruto crying, instantly smash it like glass, and reveal the hyper-cold manga panel of Timeskip Boruto stepping directly on Code's face.

AUDIO: Dead silence for one second. The iconic, high-pitched chirp of a Chidori, abruptly cut off by a heavy, slow trap bass drop.

NARRATION (Hinglish): Bhai, pichle 6 saal se poore internet ne Boruto ko "trash" bol kar troll kiya hai. But jab se Two Blue Vortex start hua hai, haters literally completely shant ho gaye hain. Boruto is officially the coldest MC in modern shonen right now.

THE CONTEXT (Setting the Stakes)

VISUAL: Fast-paced montage of Eida's 'Omnipotence' activating. Show the world's memories rewriting, turning Boruto from the Hokage's son into a rogue ninja hunted by his own village.

AUDIO: A dark, moody hip-hop beat kicks in (think modern phonk but slower, heavy on the bass).

NARRATION (Hinglish): Part 1 ka ending anime history ke sabse dark plot twists mein se ek tha. Eida ki god-level reality-warping power ne Boruto ki puri life Kawaki ke saath swap kar di. Boruto ab apne hi parents ke murder ka suspect hai, uski khud ki behen usko marna chahti hai, aur pura Hidden Leaf village uske piche pada hai. He lost literally everything.

THE AURA FLEX (Power Scaling)

VISUAL: Slow-motion sequence of Boruto appearing out of nowhere using Flying Raijin (Minato's jutsu), followed by him activating the Rasengan Uzuhiko. Add visual effects of the entire planet's rotation swirling around his hand.

AUDIO: The beat gets faster. Sharp, ringing sound effects for the Uzuhiko, making it sound overwhelming and dizzying.

NARRATION (Hinglish): Aur is absolute despair mein, usne 3 saal Sasuke Uchiha ke under train kiya. Boruto jab wapas aata hai, uski 'Aura' off the charts hai. Wo Naruto ka spamming style use nahi karta. Usne apne dada (Minato) ka Flying Raijin seekh liya hai. Aur uska naya attack? Rasengan Uzuhiko. Ye jutsu directly earth ki planetary rotation use karta hai. Ek hit, aur dushman ka dimaag literally ghoomta rahega jackpot lagne par bhi jab tak earth spin kar rahi hai. It is completely broken.

THE VILLAINS: THE SHINJU (Deep Lore)

VISUAL: The screen darkens. Show Sasuke trapped inside a massive tree, transitioning to the terrifying, humanoid Divine Trees (The Shinju) - specifically Jura and Hidari.

AUDIO: The phonk beat drops out. A low, terrifying alien-like drone takes over.

NARRATION (Hinglish): But story ka asli terror naye villains hain - The Shinju. Ye Ten-Tails ke evolved, self-aware clones hain. Aur inme sabse terrifying part kya hai? Ye un shinobi ki copies hain jinko Divine Tree ne consume kar liya hai. Boruto ko actual mein apne master, Sasuke Uchiha, ki god-tier clone - Hidari - se fight karni pad rahi hai. Inka power level Otsutsuki se bhi zyada dangerous feel ho raha hai.

THE FRAUD KAWAKI (Character Contrast)

VISUAL: Split screen. On the left, Kawaki looking desperate, sweating, and struggling in battle. On the right, Boruto looking absolutely calm, eyes half-closed, dodging attacks effortlessly.

AUDIO: The heavy trap beat slams back in.

NARRATION (Hinglish): Aur Kawaki? Jisne Naruto ki life churai thi? Manga usko literally ek fraud ke tarah treat kar rahi hai. Kawaki ne pichle 3 saal mein apni training completely neglect kar di kyunki usko laga uska Karma kaafi hai. Boruto base form mein Kawaki ko completely embarrass kar raha hai. The contrast between Boruto's hard work and Kawaki's arrogance is pure cinema.

THE WARNING (Managing Expectations)

VISUAL: A montage of Boruto's stoic, emotionless face, contrasting with the dark, ruined future of Konoha shown in episode 1. Add a heavy film grain.

AUDIO: The beat fades into a tense, isolated wind sound.

NARRATION (Hinglish): Ek warning de raha hoon. Agar tum expect kar rahe ho ki Boruto wapas purana, happy-go-lucky bacha ban jayega, toh bhool jao. Masashi Kishimoto actually ab kitchen mein wapas aa chuke hain, aur wo is story ko ek proper dark, Seinen-level tragedy mein convert kar rahe hain.

THE CALL TO ACTION (Engagement Bait)

VISUAL: A sleek, dark graphic showing Timeskip Boruto drawing his sword. Text overlay: "IS BORUTO FINALLY PEAK?"

AUDIO: Music swells, ending on an abrupt, metallic sword-clash sound effect.

NARRATION (Hinglish): Toh comment section mein mujhe honestly batao - kya Two Blue Vortex ne finally Boruto ka redemption kar diya hai? Tumhara favorite new jutsu kaunsa hai? Manga readers, anime-onlies ko bina spoil kiye hype karo! Aur deep anime lore ke liye channel ko turant subscribe karo.`
    },
    {
      id: "short-9",
      title: "The Arc We Waited 25 Years For (One Piece: Elbaph)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Arc We Waited 25 Years For (One Piece: Elbaph)
DURATION: 2 Minutes (120 Seconds)
PACING: Grand, mythical, and deeply lore-heavy. We are treating this as the most important event in manga history.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Start with a nostalgic, old-school clip of Usopp and Luffy at Little Garden (from 25 years ago), instantly flash-forward to Egghead Island's destruction, then a massive, cinematic wide shot of the giant World Tree of Elbaph.

AUDIO: Dead silence for one second. The deep, echoing sound of a giant's war horn blowing, followed by an epic, Viking-style heavy drum beat.

NARRATION (Hinglish): Bhai, One Piece fans ne is specific moment ke liye literally 25 saal wait kiya hai. Egghead Island ka chaos officially over ho chuka hai, aur Straw Hats finally wahan pahunch gaye hain jahan unhe hamesha se jana tha. Welcome to Elbaph.

THE CONTEXT (Setting the Final Saga Stakes)

VISUAL: Fast-paced montage of the Giants - Dorry and Brogy laughing, transitioning to a massive, detailed manga panel of Elbaph's landscape. Post-Production Note: Use DaVinci Resolve's color space transform to give Elbaph a warm, mythical, golden-hour look.

AUDIO: The Viking drums get faster, mixing with a grand orchestral swell.

NARRATION (Hinglish): Ye sirf ek normal island visit nahi hai. Eiichiro Oda ne officially declare kar diya hai ki hum "The Final Saga" ke peak par hain. Elbaph, the land of giants, pure One Piece universe ka sabse strong nation hai. Aur yahan World Government bhi directly attack karne se darti hai. Ye arc pura lore, ancient history, aur Nika ke origin ke baare mein hone wala hai.

THE DEEP LORE (The Void Century & Joyboy)

VISUAL: The screen darkens. Show a glowing, fiery silhouette of Sun God Nika, transitioning to the giant iron robot, and finally the shadowy figure of Joyboy.

AUDIO: The beat drops out completely. A mysterious, ethereal choral chant begins.

NARRATION (Hinglish): Is arc ka lore itna deep hone wala hai ki tumhara dimaag ghoom jayega. Vegapunk ke broadcast ke baad, puri duniya ko pata chal chuka hai ki duniya doobne (sink) wali hai. Elbaph mein hume finally Poneglyphs, The Void Century, aur sabse important - Joyboy ka actual past pata chalega. Giants ke liye Nika ek God hai, aur Luffy exactly usi ka awakening hai. The lore drops are going to break the internet every single week.

THE BATTLE OF THE YONKOS (Power Scaling Peak)

VISUAL: Split screen into four quadrants. Luffy in Gear 5, Shanks with his Conqueror's Haki red lightning, Blackbeard enveloped in darkness, and Buggy (Cross Guild) looking terrifyingly lucky.

AUDIO: A heavy, modern drill beat suddenly kicks in over the tribal drums.

NARRATION (Hinglish): Aur power scaling? Ab hum top-tier territory mein hain. Ye race ab sirf Poneglyphs ke liye nahi hai. Shanks ne officially apna move make kar diya hai, aur Blackbeard piche nahi rehne wala. Elbaph wo battlefield banne wala hai jahan duniya ke sabse strongest Conqueror's Haki users aapas mein clash karenge. The clash between Shanks and Luffy is inevitable, aur ye anime history ki sabse greatest reunion hogi.

THE USOPP'S REDEMPTION (The Emotional Core)

VISUAL: Slow zoom in on Usopp. Flashbacks of all the times he lied about having 8,000 men and being a brave warrior of the sea, juxtaposed with him standing tall in front of the Giants.

AUDIO: The drill beat fades into an emotional, uplifting string section.

NARRATION (Hinglish): But is arc ka sabse bada emotional core Luffy ya Zoro nahi hain. Ye Usopp ka arc hai. Day 1 se usne bola tha ki wo ek "Brave Warrior of the Sea" banna chahta hai aur Elbaph visit karna chahta hai. Ye wo moment hai jahan uske saare jhooth (lies) finally reality banenge. Usopp ka character development yahan apne absolute peak par hoga, aur trust me, it will make you cry.

THE WARNING (The End is Near)

VISUAL: A rapid sequence of Imu's silhouette, the Mother Flame weapon, and the Five Elders looking furious. Add heavy film grain and a red warning tint.

AUDIO: The music builds into a chaotic, overwhelming crescendo.

NARRATION (Hinglish): Ek warning de raha hoon. One Piece ab pehle jaisa light-hearted adventure nahi raha. The World Government desperate ho chuki hai. Stakes abhi literal world destruction ke hain. Har chapter ek endgame movie jaisa feel hoga.

THE ENGAGEMENT (The Outro)

VISUAL: A clean, sleek graphic showing Luffy facing the World Tree. Text overlay: "ARE WE FINALLY AT THE END?"

AUDIO: Music swells, ending on an abrupt, echoing sound of Luffy laughing in Gear 5.

NARRATION (Hinglish): Toh comment section mein mujhe batao - kya tum log Elbaph ke liye hyped ho? Tumhe kya lagta hai, kya hume finally Joyboy ka face reveal milega is arc mein? Manga readers, anime-onlies ko hype karo but no spoilers! Aur One Piece ke deep lore breakdowns ke liye channel ko subscribe karna mat bhoolna.`
    },
    {
      id: "short-10",
      title: "The Most Complex Arc in Shonen History (Hunter x Hunter: Succession War)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Most Complex Arc in Shonen History (Hunter x Hunter: Succession War)
DURATION: 2 Minutes (120 Seconds)
PACING: Claustrophobic, highly intellectual, and deeply psychological. We are treating this like a high-stakes mafia thriller breakdown.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Start with Gon and Killua smiling, instantly snap to a bloody, hyper-detailed manga panel of a grotesque Nen Beast, then slam into Kurapika's glowing, enraged Scarlet Eyes.

AUDIO: Dead silence for one second. The sharp, unsettling sound of a ship's heavy horn blowing, cutting into a very emotionally restrained, rubato tempo felt piano.

NARRATION (Hinglish): Bhai, agar tumhe lagta hai ki Jujutsu Kaisen ka power system ya LOTM ka lore complex hai... toh tumne abhi tak Yoshihiro Togashi ka actual masterclass nahi dekha. Hunter x Hunter is back, aur hum finally Shonen history ke sabse insane arc mein enter kar rahe hain.

THE SETUP (Setting the Stakes)

VISUAL: A cinematic, slow-motion pan over a massive, luxurious cruise ship (The Black Whale) sailing on a dark ocean. Post-Production Note: Use DaVinci Resolve Fusion nodes to add a subtle, oppressive atmospheric fog and color grade it with cold, isolating blues.

AUDIO: The felt piano continues, layering in a slow, tense heartbeat and the ambient sound of ocean waves.

NARRATION (Hinglish): Ye arc Dark Continent ke raste mein ek massive ship, 'The Black Whale', par set hai. Is baar Gon aur Killua main characters nahi hain. Pura focus Kurapika par hai. Kakin Empire ke 14 Princes ek dusre ko brutally murder kar rahe hain for the throne. Ye ek 14-way battle royale hai jahan escape karna impossible hai.

THE POWER SCALING: NEN BEASTS (Lore Flex)

VISUAL: Fast-paced montage of the different Princes, with horrific, abstract monsters materializing behind them. Add subtle chromatic aberration to the monsters to make them feel otherworldly.

AUDIO: The piano drops out. A low, terrifying frequency takes over, mixed with gross, wet Foley sounds.

NARRATION (Hinglish): Is arc mein power scaling completely alag level par hai due to "Guardian Nen Beasts." Har prince ko ek parasitic monster assign kiya gaya hai jo unke subconscious mind se banta hai. Ye beasts itne horrifying aur grotesque hain ki ye actually Berserk ki yaad dilate hain. Sabse crazy baat? Princes actually apne khud ke Nen Beasts ko dekh ya control nahi kar sakte. Ye pure psychological warfare hai.

THE PHANTOM TROUPE VS HISOKA (The Chaos Element)

VISUAL: Split screen. On the left, Chrollo Lucilfer walking calmly through the lower decks. On the right, Hisoka's terrifying, bloodthirsty smile lurking in the shadows.

AUDIO: A heavy, modern drill beat suddenly kicks in, raising the tension exponentially.

NARRATION (Hinglish): Aur agar 14 Princes aur unki private armies kafi nahi thin... The Phantom Troupe bhi is same ship par hai. Wo Kakin Empire ka treasure chori karna chahte hain. Lekin unka ek aur target hai - Hisoka. Hisoka literally spiders ko ek-ek karke hunt kar raha hai. 200,000 civilians ek band ship mein hain, aur duniya ke sabse dangerous assassins ek deadly game of cat-and-mouse khel rahe hain.

THE GREATEST VILLAIN: TSERRIEDNICH (The Hype Core)

VISUAL: Total color shift to deep crimson. Slow zoom into the 4th Prince, Tserriednich. Show the jars containing the Kurta Clan's Scarlet Eyes behind him.

AUDIO: The beat drops. Just a single, ominous violin note stretching out.

NARRATION (Hinglish): But sabse bada terror hai 4th Prince - Tserriednich. Ye banda pure evil hai. Kurapika ke clan ki baaki bachi hui aakhein (eyes) iske paas hain. Aur iska Nen potential? Gon aur Killua se hazaron guna zyada. Usne literally kuch dino mein ek aisi Nen ability develop kar li hai jo King Crimson se bhi zyada broken hai. Tserriednich easily anime history ke top-tier villains mein apni jagah banane wala hai.

THE WARNING (Managing Expectations)

VISUAL: A rapid sequence of massive, text-heavy manga panels glitching across the screen, highlighting the sheer amount of dialogue and strategy involved.

AUDIO: The music builds into a chaotic, overwhelming crescendo.

NARRATION (Hinglish): Ek warning de raha hoon. Agar tumhe sirf mindless action pasand hai, toh ye arc tumhare liye nahi hai. Ye arc 90% mind games, politics, aur 5D chess ke baare mein hai. Isme itni detailed lore aur strategy hai ki tumhe literally notes banane padenge samajhne ke liye.

THE CALL TO ACTION (Engagement Bait)

VISUAL: A clean, sleek graphic showing Kurapika staring down Tserriednich. Text overlay: "CAN KURAPIKA SURVIVE THE BOAT?"

AUDIO: Music swells, ending on an abrupt, echoing gunshot sound effect.

NARRATION (Hinglish): Toh comment section mein mujhe batao - kya tum logo ne Succession War manga padhi hai? Hisoka vs Phantom Troupe mein kaun zinda bachega? Anime-onlies ko hype karo, aur deepest anime lore ke liye channel ko subscribe karna mat bhoolna!`
    },
    {
      id: "short-11",
      title: "The Only Story That Can Destroy Solo Leveling (Omniscient Reader's Viewpoint)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Only Story That Can Destroy Solo Leveling (Omniscient Reader's Viewpoint)
DURATION: 2 Minutes (120 Seconds)
PACING: Mind-bending, meta-fictional, and cosmic in scale. We are leaning heavily into the deep lore that your web novel audience loves.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame glitch. Start with a normal guy reading on a subway train. Suddenly, the train windows shatter, blood splatters the glass, and a massive, terrifying goblin creature appears outside.

AUDIO: Dead silence for one second. The mundane sound of a train rattling, completely shattered by a deafening monster roar and an epic, heavy orchestral drop.

NARRATION (Hinglish): Bhai, Solo Leveling ne webtoon to anime adaptations ka rasta khol diya. But ab ek aisi story aa rahi hai jo genuinely, literally har scale par usko surpass kar degi. Welcome to Omniscient Reader's Viewpoint.

THE CONTEXT (Setting the Stakes)

VISUAL: Fast-paced montage of the ORV webtoon covers, highlighting its massive global readership, transitioning into high-quality anime key visuals.

AUDIO: A ticking clock beat mixed with a tense, modern electronic synth track.

NARRATION (Hinglish): ORV ki web novel aur manhwa already legendary status par hain. Aur ab jab iska anime adaptation aayega, internet par iske alawa kuch aur discuss nahi hoga. Kyun? Kyunki ye koi normal system-leveling story nahi hai. Ye ek story hai stories ke baare mein.

THE PREMISE (The Meta-Fiction Masterpiece)

VISUAL: Show Kim Dokja looking at his glowing smartphone screen. The text on the screen physically jumps out, wrapping around him as the real world around him collapses into apocalyptic ruins.

AUDIO: The synth track speeds up. Add digital glitch and typing sound effects.

NARRATION (Hinglish): Imagine karo tum ek obscure web novel padh rahe ho pichle 10 saal se, jiska tumhare alawa koi aur reader nahi hai. Aur achanak ek din... wo novel end ho jati hai. Aur next second, the actual real world turns into that exact apocalyptic novel. Humara main character, Kim Dokja, is the only person in the entire universe who knows exactly how this apocalypse will end.

THE CONSTELLATIONS (The Deep Lore Flex)

VISUAL: The screen darkens. Massive, cosmic eyes open in a star-filled sky, looking down. Floating translucent screens (messages) pop up around the characters.

AUDIO: The beat drops into a deep, echoing choral chant. It should feel divine and terrifying.

NARRATION (Hinglish): Iska lore aur power system absolute peak hai. Yahan "The Star Stream" exist karta hai. Gods, demons, aur historical figures - jinhe Constellations bolte hain - wo aasman se insaano ko ek deadly survival game khelte hue dekh rahe hain, exactly like Twitch streamers! Wo logo ko sponsor karte hain, powers dete hain, aur entertainment ke liye humans ko marte hue dekhte hain.

THE DUO (Yoo Joonghyuk vs Kim Dokja)

VISUAL: Split screen. On the left, Yoo Joonghyuk - the original protagonist of the novel, jo hazaron baar mar chuka hai aur time mein regress (rewind) kar chuka hai, jiski wajah se uski humanity almost khatam ho chuki hai. Aur kaafi door dusri taraf hai Kim Dokja - the Reader. In dono ka toxic, mind-bending alliance aur rivalry anime history ki sabse greatest duos mein se ek banne wali hai.

THE WARNING (Emotional Damage)

VISUAL: A montage of characters looking absolutely broken, desperate, and crying. The screen fragments like shattered glass.

AUDIO: The music fades into a single, melancholic piano note that hangs in the air.

NARRATION (Hinglish): Ek warning de raha hoon pehnle hi. Yahan action to milega, but tum actually iske philosophical themes aur emotional trauma se toot jaoge. Is story ka meta-narrative itna deep aur complex hai ki ye tumhara dimag hila kar rakh dega.

THE CALL TO ACTION (Engagement Bait)

VISUAL: A sleek graphic showing Kim Dokja reading his phone, surrounded by glowing Constellation messages. Text overlay: "THE GREATEST MANHWA EVER?"

AUDIO: Music swells to a abrupt end with the sound of a book snapping shut.

NARRATION (Hinglish): Toh comment section mein mujhe batao - kya tum log ORV ki manhwa padhte ho? Tumhara favorite Constellation kaunsa hai? Anime-onlies ko bina spoil kiye thoda hype karo! Aur deep lore breakdowns ke liye channel ko turant subscribe karo.`
    },
    {
      id: "short-12",
      title: "The Meme That Became a Masterpiece (Kagurabachi Anime Hype)",
      meta: "Target: 5s Hook · Language: Hinglish",
      scriptOutline: `TITLE: The Meme That Became a Masterpiece (Kagurabachi Anime Hype)
DURATION: 2 Minutes (120 Seconds)
PACING: Edgy, dark, and highly cinematic. We are treating this like a premium action movie breakdown.

THE HOOK (Direct & Disruptive)

VISUAL: Quick 3-frame cut. Start with the old "Enough time has passed" meme of Chihiro, instantly snap to a hyper-detailed manga panel of his blood-stained face, then cut to a sleek, dark logo animation: KAGURABACHI.

AUDIO: Absolute silence for one second. The sharp, metallic shing of a katana being unsheathed, cutting into a heavy, modern bass drop.

NARRATION (Hinglish): Bhai, if you thought Kagurabachi was just an internet meme... tum sab bohot badi galti kar rahe ho. The anime adaptation is going to prove why this is officially the new King of Shonen Jump.

THE CONTEXT (Setting the June 2026 Stakes)

VISUAL: Fast-paced montage of the manga volumes selling out, followed by dynamic, motion-tracked panels of the Yakuza underworld.

AUDIO: Introduce a very modern, emotionally restrained rubato tempo solo violin. Keep it classy, dark, and slightly melancholic, contrasting with the heavy action on screen.

NARRATION (Hinglish): Is time par JJK aur My Hero Academia apne final phases mein hain, aur Shonen Jump ko ek naye flagship killer ki zaroorat thi. Enter Takeru Hokazono. Kagurabachi ne purely apni insane art style aur John Wick-level action pacing se poore manga community ko dominate kar liya hai. Aur ab iska anime is about to break the internet.

THE LORE (The Enchanted Blades)

VISUAL: A deep dive into the power system. Show Chihiro holding the Enten blade. Post-Production Note: Use DaVinci Resolve Fusion nodes to create fluid, glowing particle simulations for the three spirit goldfish swimming around the blade.

AUDIO: The solo violin speeds up, accompanied by the deep, hollow sound of water splashing and spiritual energy humming.

NARRATION (Hinglish): Iska lore aur power system kitna cold hai? Pura plot 6 Enchanted Blades ke around ghumta hai jinko Chihiro ke father ne forge kiya tha. Ye koi normal swords nahi hain. They are weapons of mass destruction. Aur Chihiro ke paas 7th blade hai - Enten. Jab wo is sword ko use karta hai, uski dark spiritual energy literal glowing goldfish ka form le leti hai. Visually, ye anime history ke sabse beautiful concepts mein se ek hai.

THE ACTION CHOREOGRAPHY (Technical Flex)

VISUAL: Rapid-fire cuts of Chihiro slicing through Yakuza members. Add motion blur and dynamic zooms to emphasize the speed and brutality.

AUDIO: The rubato tempo drops into a heavy, aggressive drill beat. Sharp sword clashes sync perfectly with the bass kicks.

NARRATION (Hinglish): Fights ki baat karein? Yahan koi 10-minute ki speeches nahi hain mid-battle. Kagurabachi ka action is pure, ruthless execution. Chihiro dushmano ko blink of an eye mein kaat deta hai. The choreography feels like a mix of Sekiro and an ultra-violent Yakuza movie. Jab studio is fluid motion aur swordplay ko animate karega, the action anime standards are going to skyrocket.

THE VILLAINS (Building the Hype)

VISUAL: Total color shift. Everything goes dark red and black. A slow, terrifying pan up the silhouettes of the Hishaku (the sorcerer group).

AUDIO: Drop the beat completely. Just the solo felt piano playing a minor, sinister chord progression.

NARRATION (Hinglish): But ek achha action shonen apne villains ke bina kuch nahi hai. Aur Kagurabachi ke villains - especially the Hishaku sorcerers aur Sojo - are genuinely terrifying. Sojo ek aisa antagonist hai jo power scaling ke sath-sath psychological warfare mein bhi expert hai. His dynamic with Chihiro is going to give you major Gojo vs Toji vibes, but even darker.

THE WARNING (Managing Expectations)

VISUAL: A montage of Chihiro looking completely broken and exhausted, bleeding heavily. Add a subtle vintage film grain overlay to emphasize the gritty tone.

AUDIO: The felt piano fades into a low, tense hum.

NARRATION (Hinglish): Ek warning de raha hoon pehle hi. Ye naruto ya one piece jaisa uplifting journey nahi hai. Ye pura revenge aur trauma ke baare mein hai. It's bloody, it's mature, aur isme plot armor barely exist karta hai.

THE CALL TO ACTION (Engagement Driver)

VISUAL: A clean split screen of Chihiro holding Enten. Text overlay: "IS KAGURABACHI PEAK?"

AUDIO: The music swells to an epic, cinematic halt with a final sword slash SFX.

NARRATION (Hinglish): Toh comment section mein mujhe honestly batao - kya tum log Kagurabachi ke anime debut ke liye hyped ho? Manga readers, anime-onlies ko batao ki manga currently kitni insane chal rahi hai! Aur channel ko subscribe karo kyunki Kagurabachi ke lore breakdowns bohot jald aane wale hain.`
    },
    {
      id: "short-13",
      title: "3 Retaining Secrets for YouTube Shorts",
      meta: "Target: 2s Hook · Language: Hinglish / English",
      scriptOutline: `TITLE: 3 Retaining Secrets for YouTube Shorts
HOOK RATE TARGET: 2 seconds (Visual hook + text headline).

THE HOOK

VISUAL: Show a drop in a YouTube analytics retention graph, pointing to it, then transitioning to a high-energy transition.

AUDIO: Quick swish transition sound effect.

NARRATION: Stop losing viewers in the first 2 seconds of your Shorts. If your retention graph looks like this, do these 3 things immediately.

SECRET 1 - THE HEAVY TEXT HOOK

VISUAL: Close-up of phone screen showing a Short with a bold yellow headline pinned to the top.

AUDIO: Typewriter sound effect.

NARRATION: First, the text hook. Pin a high-contrast title card at the top of the video and keep it there. It gives viewers a reason to stay even if they are on mute.

SECRET 2 - ANGLE CUTS

VISUAL: Show the editor screen slicing a clip, zooming in and out every 1.5 seconds.

AUDIO: Clock ticking sound effect, pacing up.

NARRATION: Second, change your visual angle or crop every 1.5 to 2 seconds. A static talking head video is the easiest way to get swiped away.

SECRET 3 - THE INFINITE LOOP

VISUAL: End of the video seamlessly transitions back to the beginning card.

AUDIO: Smooth transition beat that connects end to start.

NARRATION: Third, script your ending to seamlessly flow back into the hook. If they do not realize the video restarted, they will watch it twice - double watch time!

CALL TO ACTION

VISUAL: Quick follow animation overlay.

NARRATION: Try these in your next video and watch your average view duration soar. Follow for daily editing tips!`
    }
  ];

  // Helper to format script text into structured, premium HTML blocks
  function formatScriptOutline(text) {
    const lines = text.split('\n');
    let html = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        return; // Skip empty lines to avoid layout spacing issues when elements are hidden
      }

      if (trimmed.startsWith('TITLE:')) {
        html += `<div class="script-header-title">&nbsp;${trimmed.replace('TITLE:', '').trim()}</div>`;
      } else if (trimmed.startsWith('DURATION:')) {
        html += `<div class="script-header-meta"><strong>Duration:</strong> ${trimmed.replace('DURATION:', '').trim()}</div>`;
      } else if (trimmed.startsWith('PACING:')) {
        html += `<div class="script-header-meta"><strong>Pacing:</strong> ${trimmed.replace('PACING:', '').trim()}</div>`;
      } else if (trimmed.startsWith('HOOK RATE TARGET:')) {
        html += `<div class="script-header-meta"><strong>Hook Rate Target:</strong> ${trimmed.replace('HOOK RATE TARGET:', '').trim()}</div>`;
      } else if (trimmed.startsWith('VISUAL:')) {
        html += `<div class="script-line script-visual"><span class="prefix">VISUAL:</span> <span class="visual-text">${trimmed.replace('VISUAL:', '').trim()}</span></div>`;
      } else if (trimmed.startsWith('AUDIO:')) {
        html += `<div class="script-line script-audio"><span class="prefix">AUDIO:</span> <span class="audio-text">${trimmed.replace('AUDIO:', '').trim()}</span></div>`;
      } else if (trimmed.startsWith('NARRATION (Hinglish):')) {
        html += `<div class="script-line script-narration"><span class="prefix">NARRATION (Hinglish):</span> <span class="narration-text">${trimmed.replace('NARRATION (Hinglish):', '').trim()}</span></div>`;
      } else if (trimmed.startsWith('NARRATION:')) {
        html += `<div class="script-line script-narration"><span class="prefix">NARRATION:</span> <span class="narration-text">${trimmed.replace('NARRATION:', '').trim()}</span></div>`;
      } else if (trimmed.startsWith('Post-Production Note:')) {
        html += `<div class="script-line script-post-note"><span class="prefix">Post-Production Note:</span> ${trimmed.replace('Post-Production Note:', '').trim()}</div>`;
      } else {
        // Dynamic check for section header: uppercase words with optional parenthetical annotations
        const cleanLine = trimmed.replace(/\([^)]*\)/g, '').replace(/[^a-zA-Z\s]/g, '').trim();
        if (cleanLine.length > 0 && cleanLine === cleanLine.toUpperCase() && /[A-Z]/.test(cleanLine)) {
          html += `<div class="script-section-header">${trimmed}</div>`;
        } else {
          html += `<div class="script-line-plain">${trimmed}</div>`;
        }
      }
    });

    return html;
  }

  // Helper to extract and join only the narration lines from the script text
  function extractNarration(text) {
    const lines = text.split('\n');
    const narrationLines = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('NARRATION (Hinglish):')) {
        narrationLines.push(trimmed.replace('NARRATION (Hinglish):', '').trim());
      } else if (trimmed.startsWith('NARRATION:')) {
        narrationLines.push(trimmed.replace('NARRATION:', '').trim());
      }
    });
    return narrationLines.join('\n\n');
  }

  const shortsTableBody = document.getElementById('shorts-table-body');
  const shortsDetailsList = document.getElementById('shorts-details-list');

  // Checkbox references for script filter
  const toggleNarration = document.getElementById('toggle-narration');
  const toggleVisual = document.getElementById('toggle-visual');
  const toggleAudio = document.getElementById('toggle-audio');

  function updateScriptVisibility() {
    if (!shortsDetailsList) return;
    
    if (toggleNarration && toggleNarration.checked) {
      shortsDetailsList.classList.add('show-narration');
    } else {
      shortsDetailsList.classList.remove('show-narration');
    }

    if (toggleVisual && toggleVisual.checked) {
      shortsDetailsList.classList.add('show-visual');
    } else {
      shortsDetailsList.classList.remove('show-visual');
    }

    if (toggleAudio && toggleAudio.checked) {
      shortsDetailsList.classList.add('show-audio');
    } else {
      shortsDetailsList.classList.remove('show-audio');
    }
  }

  if (toggleNarration) toggleNarration.addEventListener('change', updateScriptVisibility);
  if (toggleVisual) toggleVisual.addEventListener('change', updateScriptVisibility);
  if (toggleAudio) toggleAudio.addEventListener('change', updateScriptVisibility);

  // Synchronize on load
  updateScriptVisibility();

  function renderShorts() {
    if (!shortsTableBody || !shortsDetailsList) return;
    shortsTableBody.innerHTML = '';
    shortsDetailsList.innerHTML = '';

    SHORTS_DATA.forEach((item, idx) => {
      const tr = document.createElement('tr');

      const tdIndex = document.createElement('td');
      tdIndex.textContent = idx + 1;
      tr.appendChild(tdIndex);

      const tdTitle = document.createElement('td');
      tdTitle.className = 'shorts-topic-title';
      tdTitle.textContent = item.title;
      tr.appendChild(tdTitle);

      const tdAction = document.createElement('td');
      tdAction.style.textAlign = 'center';
      const jumpBtn = document.createElement('button');
      jumpBtn.className = 'jump-btn';
      jumpBtn.innerHTML = `
        <span>Jump To</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      `;
      jumpBtn.addEventListener('click', () => {
        const targetCard = document.getElementById(item.id);
        if (targetCard) {
          targetCard.classList.add('open');
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.style.borderColor = 'var(--color-primary-red)';
          setTimeout(() => {
            targetCard.style.borderColor = '';
          }, 1500);
        }
      });
      tdAction.appendChild(jumpBtn);
      tr.appendChild(tdAction);

      shortsTableBody.appendChild(tr);

      const card = document.createElement('div');
      card.className = 'short-detail-card';
      card.id = item.id;

      const header = document.createElement('div');
      header.className = 'short-detail-header';

      const titleWrapper = document.createElement('div');
      titleWrapper.className = 'short-detail-title-wrapper';

      const metaSpan = document.createElement('span');
      metaSpan.className = 'short-detail-meta';
      metaSpan.textContent = item.meta;

      const h1Title = document.createElement('h1');
      h1Title.className = 'short-detail-title';
      h1Title.textContent = item.title;

      titleWrapper.appendChild(metaSpan);
      titleWrapper.appendChild(h1Title);
      header.appendChild(titleWrapper);

      const arrow = document.createElement('div');
      arrow.className = 'short-detail-arrow';
      arrow.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      `;
      header.appendChild(arrow);
      card.appendChild(header);

      const body = document.createElement('div');
      body.className = 'short-detail-body';

      const content = document.createElement('div');
      content.className = 'short-detail-content';

      const outlineBox = document.createElement('div');
      outlineBox.className = 'script-outline-container';
      outlineBox.innerHTML = formatScriptOutline(item.scriptOutline);
      content.appendChild(outlineBox);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-script-btn';
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
        </svg>
        <span>Ready to Copy</span>
      `;
      copyBtn.addEventListener('click', () => {
        const narrationText = extractNarration(item.scriptOutline);
        navigator.clipboard.writeText(narrationText).then(() => {
          copyBtn.classList.add('copied');
          const span = copyBtn.querySelector('span');
          const origText = span.textContent;
          span.textContent = 'Copied Narration!';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            span.textContent = origText;
          }, 1500);
        }).catch(err => {
          console.error('Failed to copy script narration: ', err);
        });
      });
      content.appendChild(copyBtn);

      body.appendChild(content);
      card.appendChild(body);

      header.addEventListener('click', () => {
        card.classList.toggle('open');
      });

      shortsDetailsList.appendChild(card);
    });
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
      name: "The Souled Store",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "The absolute market leader in Indian pop-culture and fandom merchandise. Holds official partnerships with major anime franchises (Naruto, Jujutsu Kaisen, One Piece, etc.). Highly rated by millions of customers. Acquired popular competitor Redwolf in 2025.",
      outreach: "Direct creator collaborations and styling integrations. They frequently run paid sponsorships and gifting campaigns for content creators across YouTube and Instagram.",
      leadScore: "9.8 / 10",
      googleRating: "4.4 ★ (4,500+ reviews)",
      companySize: "~500-1,000 employees",
      paidAds: "Yes (Meta, Google, YouTube)",
      products: "Licensed anime clothing, bags, accessories, and shoes",
      contacts: [
        { label: "Partnership Email", value: "connect@thesouledstore.com" },
        { label: "Influencer Collab Email", value: "modelling@thesouledstore.com" },
        { label: "Instagram", value: "@thesouledstore" },
        { label: "Website", value: "thesouledstore.com" },
        { label: "Founders", value: "Vedang Patel (Co-founder & CEO), Aditya Sharma, Rohin Samtaney" },
        { label: "Tip", value: "Outreach to their Brand and Influencer Marketing team on LinkedIn is highly recommended." }
      ]
    },
    {
      name: "Bonkers Corner",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Highly rated streetwear and oversized apparel brand with vertical integration (in-house manufacturing). Extremely popular among Gen-Z and widely known for aggressive influencer marketing and creator collections.",
      outreach: "Promotional campaigns, video placements, and streetwear lookbooks. Highly responsive to fashion and lifestyle content creators.",
      leadScore: "9.5 / 10",
      googleRating: "4.5 ★ (650+ reviews)",
      companySize: "~100-200 employees",
      paidAds: "Yes (Meta, Instagram)",
      products: "Oversized anime streetwear, hoodies, t-shirts, sweatpants, and drops",
      contacts: [
        { label: "Business Email", value: "business@bonkerscorner.com" },
        { label: "Instagram", value: "@bonkerscorner" },
        { label: "Website", value: "bonkerscorner.com" },
        { label: "Founder", value: "Shubham Gupta (Founder & CEO)" },
        { label: "Tip", value: "The business email is specifically monitored for creator campaigns and customization/bulk deals." }
      ]
    },
    {
      name: "Bewakoof",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Major pop-culture D2C fashion platform in India, now backed by Aditya Birla TMRW. Highly rated for trendy, affordable official merchandise (Marvel, Disney, Anime). Heavily relies on influencer and creator promotions.",
      outreach: "High-volume influencer campaigns and affiliate commission partnerships. Great for styling integrations and long-form review channels.",
      leadScore: "9.3 / 10",
      googleRating: "4.2 ★ (1,200+ reviews)",
      companySize: "~500-1,000 employees",
      paidAds: "Yes (Meta, Google Performance Max, YouTube)",
      products: "Pop-culture graphic clothing, hoodies, notebooks, and mobile covers",
      contacts: [
        { label: "Partnership Email", value: "care@bewakoof.com" },
        { label: "Instagram", value: "@bewakoofofficial" },
        { label: "Website", value: "bewakoof.com" },
        { label: "Tip", value: "Best results come from directly pitching their Influencer Marketing Managers or PR Team on LinkedIn." }
      ]
    },
    {
      name: "Comic Con India",
      category: "sub",
      priority: "hot",
      status: "Active",
      desc: "The largest pop-culture celebration in India, organizing large-scale conventions featuring cosplay, merchandise, gaming, and celebrity guests across multiple major cities.",
      outreach: "Convention coverage, live event sponsorships, brand activation, and booth promotions. Best for creators targeting gaming and pop-culture audiences.",
      leadScore: "9.2 / 10",
      googleRating: "4.4 ★ (150+ reviews)",
      companySize: "~50-100 employees",
      paidAds: "Yes (Meta, Google Ads)",
      products: "Event tickets, sponsorships, booth rentals, and merchandise",
      contacts: [
        { label: "Business Email", value: "info@comicconindia.com" },
        { label: "Instagram", value: "@comicconindia" },
        { label: "Website", value: "comicconindia.com" },
        { label: "Founder", value: "Jatin Varma (Founder)" },
        { label: "Tip", value: "Contact info@comicconindia.com for sponsorships and stall queries, or message them on LinkedIn." }
      ]
    },
    {
      name: "The Entertainment Store",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "A widely popular retail destination for authentic pop-culture, anime, and comic book collectibles in India, maintaining physical outlets in Bangalore and Pune alongside their e-commerce storefront.",
      outreach: "Figure reviews, unboxing videos, and manga store walk-throughs. Strong potential for localized visual product integrations.",
      leadScore: "8.9 / 10",
      googleRating: "4.3 ★ (3,000+ reviews)",
      companySize: "~20-50 employees",
      paidAds: "Yes (Google Local Map ads, Facebook Retargeting)",
      products: "Authentic anime figures (Bandai, Banpresto), manga, keychains, and licensed clothing",
      contacts: [
        { label: "Founder Email", value: "satish@entertainmentstore.in" },
        { label: "Operations Email", value: "manager@entertainmentstore.in" },
        { label: "Instagram", value: "@theentertainmentstore" },
        { label: "Website", value: "entertainmentstore.in" },
        { label: "Founders", value: "Sunil, Satish" }
      ]
    },
    {
      name: "ComicSense",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "India's premier dedicated anime-only merchandise retailer. Extremely high brand affinity and rating within the Indian anime community. Regularly sponsors gaming channels, anime event coverage, and content creators.",
      outreach: "Endemic sponsorships. Ideal for direct mid-roll placements, video sponsorships, and exclusive affiliate discount codes for your viewers.",
      leadScore: "8.8 / 10",
      googleRating: "4.4 ★ (120+ reviews)",
      companySize: "~10-30 employees",
      paidAds: "Yes (Meta Ads, Creator Sponsorships)",
      products: "Anime graphic tees, hoodies, katanas, and accessories",
      contacts: [
        { label: "Partnership Email", value: "care@comicsense.xyz" },
        { label: "Instagram", value: "@comicsense.store" },
        { label: "Website", value: "comicsense.store" },
        { label: "Founder", value: "Sagar Agarwal (Co-founder & Marketing Lead)" },
        { label: "Tip", value: "Connecting directly with Sagar Agarwal on LinkedIn is the most effective way to pitch visual integrations." }
      ]
    },
    {
      name: "Xenpachi",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Cult-favorite premium anime streetwear brand based out of Jaipur. Known for high GSM cotton and artistic designs. Very active in running promotions and sponsoring pop-culture channels.",
      outreach: "Creative integrations, apparel gifting, and passive background/wall placement. Excellent sponsor for high-production anime review channels.",
      leadScore: "8.5 / 10",
      googleRating: "4.6 ★ (50+ reviews)",
      companySize: "~5-15 employees",
      paidAds: "Yes (Meta Ads, YouTube integrations)",
      products: "High GSM custom-fit anime hoodies, shirts, and streetwear designs",
      contacts: [
        { label: "Founder Direct Email", value: "vinodmittal@hotmail.com" },
        { label: "Partnership Email", value: "care@xenpachi.in" },
        { label: "Instagram", value: "@xenpachi.india" },
        { label: "Website", value: "xenpachi.com" },
        { label: "Founders", value: "Nitin Sajwan, Vinod Mittal" },
        { label: "Tip", value: "The founders are actively involved in operations and can be pitched via the direct email or Instagram DM." }
      ]
    },
    {
      name: "Baka Store",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Specialized anime collectibles store based in Chennai, highly rated for importing katanas, figures, and cosplay props with pan-India distribution.",
      outreach: "Cosplay prop reviews, katana demonstrations, and anime figurine showcases. Great for video integration sponsorships.",
      leadScore: "8.2 / 10",
      googleRating: "4.8 ★ (185+ reviews)",
      companySize: "~5-10 employees",
      paidAds: "Low (Local organic social promotions)",
      products: "Cosplay swords/katanas, anime figures, and collectible accessories",
      contacts: [
        { label: "Business Email", value: "info.baakastore@gmail.com" },
        { label: "Instagram", value: "@ba_ka_store" },
        { label: "Website", value: "baakastore.com" },
        { label: "Tip", value: "They offer shipping across India and often coordinate with local promoters via email or Instagram DM." }
      ]
    },
    {
      name: "Nerd Arena",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Mumbai-based physical and online collector store stocking authentic action figures, anime toys, and superhero merchandise from Bandai and Banpresto.",
      outreach: "Collectible reviews, premium figure unboxings, and direct promotional discount links for collectors.",
      leadScore: "8.0 / 10",
      googleRating: "4.4 ★ (200+ reviews)",
      companySize: "~5-10 employees",
      paidAds: "Low (Search ads, influencer reviews)",
      products: "Authentic import action figures, keychains, and pop culture accessories",
      contacts: [
        { label: "Business Email", value: "sales@nerdarena.in" },
        { label: "Instagram", value: "@nerdarenaindia" },
        { label: "Website", value: "nerdarena.in" },
        { label: "Tip", value: "Outreach for promotions can be made directly via email or their Bandra physical outlet manager." }
      ]
    },
    {
      name: "Macmerise",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Major pop-culture tech accessories and clothing brand based in Mumbai. Highly rated for officially licensed anime merchandise (Naruto, Disney, Marvel phone covers, audio gadgets, and apparel) with massive retail partnerships.",
      outreach: "Apparel styling, tech skin demonstrations, and pop-culture gadget showcases. Excellent budget for social media influencer campaigns.",
      leadScore: "9.1 / 10",
      googleRating: "4.3 ★ (2,500+ reviews)",
      companySize: "~50-100 employees",
      paidAds: "Yes (Meta Ads, Google Search)",
      products: "Anime phone cases, laptop skins, audio gear, and pop-culture apparel",
      contacts: [
        { label: "Business Email", value: "cs@macmerise.com" },
        { label: "Partnership Email", value: "social@macmerise.com" },
        { label: "Instagram", value: "@macmerise" },
        { label: "Website", value: "macmerise.com" }
      ]
    },
    {
      name: "The Comic Book Store",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "India's first licensed retail comic book store, based in Khar, Bandra West, Mumbai. Highly rated by pop-culture collectors and selling comics, manga, action figures, and geek fashion.",
      outreach: "Manga review series, bookstore walkthroughs, and anime collectible unboxings. High engagement with Mumbai otaku community.",
      leadScore: "8.8 / 10",
      googleRating: "4.6 ★ (150+ reviews)",
      companySize: "~5-15 employees",
      paidAds: "Yes (Local search and social ads)",
      products: "Licensed comics, manga, figures, and pop-culture apparel",
      contacts: [
        { label: "Business Email", value: "contact@thecomicbookstore.in" },
        { label: "Instagram", value: "@thecomicbookstore" },
        { label: "Website", value: "thecomicbookstore.in" }
      ]
    },
    {
      name: "PRONK",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Rapidly growing D2C fashion retailer based in Kolkata, West Bengal. They carry a large selection of oversized anime streetwear and graphic tees with nationwide distribution.",
      outreach: "Streetwear lookbooks, styling videos, and seasonal drops. Great fit for fashion vloggers and Instagram aesthetic models.",
      leadScore: "8.6 / 10",
      googleRating: "4.2 ★ (Trustpilot reviews)",
      companySize: "~10-30 employees",
      paidAds: "Yes (Aggressive Meta Ads)",
      products: "Oversized anime graphic tees, hoodies, and streetwear",
      contacts: [
        { label: "Business Email", value: "support@pronk.in" },
        { label: "Instagram", value: "@pronkindia" },
        { label: "Website", value: "pronk.in" }
      ]
    },
    {
      name: "Zams Fashion",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Mumbai-based streetwear label focusing on premium cotton apparel infused with anime aesthetics. Very active in launching custom graphics drops.",
      outreach: "Streetwear promotions, styling reels, and custom drop reviews. Active creator outreach.",
      leadScore: "8.2 / 10",
      googleRating: "4.3 ★ (50+ reviews)",
      companySize: "~5-10 employees",
      paidAds: "Yes (Local Meta promotions)",
      products: "Premium cotton anime streetwear and graphic tees",
      contacts: [
        { label: "Business Email", value: "care@zamsfashion.in" },
        { label: "Instagram", value: "@zamsfashion" },
        { label: "Website", value: "zamsfashion.in" }
      ]
    },
    {
      name: "Custom Clans",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Nagpur-based anime specialty store providing action figures, katanas, posters, and collectible anime accessories with a strong grassroots customer base.",
      outreach: "Product showcases, custom prints, and katana unboxings. High relevance for local gaming and comic fan groups.",
      leadScore: "8.1 / 10",
      googleRating: "4.5 ★ (50+ reviews)",
      companySize: "~5-10 employees",
      paidAds: "Low (Organic community building)",
      products: "Action figures, katanas, posters, and anime accessories",
      contacts: [
        { label: "Business Email", value: "info@customclans.in" },
        { label: "Instagram", value: "@customclans" },
        { label: "Website", value: "customclans.com" }
      ]
    },
    {
      name: "Kawaii Kingdom",
      category: "sub",
      priority: "warm",
      status: "Active",
      desc: "Delhi-based e-commerce platform offering cute anime, gaming, and pop-culture themed keychains, mousepads, plushies, and decor.",
      outreach: "Desk setup setup showcases, cute merchandise hauls, and aesthetic unboxing videos.",
      leadScore: "7.9 / 10",
      googleRating: "4.5 ★ (40+ reviews)",
      companySize: "~2-5 employees",
      paidAds: "Yes (Pinterest and Meta ads)",
      products: "Cute keychains, mousepads, plushies, and otaku decor",
      contacts: [
        { label: "Business Email", value: "tanejs01@gmail.com" },
        { label: "Instagram", value: "@kawaiikingdom" },
        { label: "Website", value: "kawaiikingdom.in" }
      ]
    },
    {
      name: "Otakukulture",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Delhi-based D2C apparel startup designing anime streetwear, oversized shirts, and custom-embroidered hoodies for fans across India.",
      outreach: "Visual apparel placements, embroidery reviews, and custom lookbook integrations.",
      leadScore: "8.0 / 10",
      googleRating: "4.4 ★ (30+ reviews)",
      companySize: "~3-5 employees",
      paidAds: "Yes (Meta and Instagram ads)",
      products: "Anime streetwear, oversized shirts, and embroidered hoodies",
      contacts: [
        { label: "Business Email", value: "care@otakukulture.in" },
        { label: "Instagram", value: "@otakukulture" },
        { label: "Website", value: "otakukulture.in" }
      ]
    },
    {
      name: "Animecult",
      category: "apparel",
      priority: "try",
      status: "Active",
      desc: "Jaipur-based fashion label offering graphic oversized t-shirts, hoodies, and accessories focused on major anime series.",
      outreach: "Visual sponsorships, clothing drops, and social media styling campaigns.",
      leadScore: "7.8 / 10",
      googleRating: "4.4 ★ (30+ reviews)",
      companySize: "~3-5 employees",
      paidAds: "Low (Organic and local outreach)",
      products: "Graphic oversized t-shirts, hoodies, and anime clothing",
      contacts: [
        { label: "Business Email", value: "contact@animecult.in" },
        { label: "Instagram", value: "@animecult" },
        { label: "Website", value: "animecult.in" }
      ]
    },
    {
      name: "Redwolf",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "Prominent indie pop-culture and custom-design streetwear brand in India. Offers graphic tees, hoodies, and accessories featuring official anime and gaming designs.",
      outreach: "Highly suited for direct sponsorships and creator lookbooks. They regularly run campaigns and collaborate with fashion or lifestyle creators.",
      leadScore: "9.0 / 10",
      googleRating: "4.5 ★ (500+ reviews)",
      companySize: "~20-50 employees",
      paidAds: "Yes (Meta Ads, Google Search)",
      products: "Anime t-shirts, oversized hoodies, badges, and stickers",
      contacts: [
        { label: "Business Email", value: "contact@redwolf.in" },
        { label: "Instagram", value: "@redwolfindia" },
        { label: "Website", value: "redwolf.in" }
      ]
    },
    {
      name: "Otaku Island",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Chennai-based online retail store specializing in anime action figures, statues, and collectibles. Provides authentic imported products to the growing Indian anime community.",
      outreach: "Ideal sponsor for unboxing videos, figure reviews, and desk setup build videos. Reaches targeted anime collectors.",
      leadScore: "8.4 / 10",
      googleRating: "4.6 ★ (80+ reviews)",
      companySize: "~5-15 employees",
      paidAds: "Yes (Meta Ads)",
      products: "Anime action figures, statues, keychains, and geek collectibles",
      contacts: [
        { label: "Business Email", value: "support@otakuisland.in" },
        { label: "Instagram", value: "@otakuisland.in" },
        { label: "Website", value: "otakuisland.in" }
      ]
    },
    {
      name: "Otaku Stitch",
      category: "apparel",
      priority: "warm",
      status: "Active",
      desc: "Specialty designer brand focusing on custom-embroidered anime apparel. Brings premium embroidered hoodies and aesthetic streetwear to Indian anime fans.",
      outreach: "Excellent for aesthetic styling reels and custom drop reviews. Very active in sending merchandise gifts to otaku creators.",
      leadScore: "8.2 / 10",
      googleRating: "4.4 ★ (30+ reviews)",
      companySize: "~3-8 employees",
      paidAds: "Yes (Instagram Promotions)",
      products: "Premium embroidered anime hoodies, sweatshirts, and graphic tees",
      contacts: [
        { label: "Business Email", value: "info@otakustitch.com" },
        { label: "Instagram", value: "@otaku.stitch.india" },
        { label: "Website", value: "otakustitch.com" }
      ]
    },
    {
      name: "Geekmonkey",
      category: "sub",
      priority: "warm",
      status: "Active",
      desc: "Popular online portal for quirky gifts, novelty products, and gaming accessories in India. Carries a dedicated line of anime lamps, mugs, and action figures.",
      outreach: "Great for gift guides, lifestyle vlogs, and unboxing content. Highly responsive to gaming and pop-culture channels.",
      leadScore: "8.3 / 10",
      googleRating: "4.5 ★ (250+ reviews)",
      companySize: "~10-25 employees",
      paidAds: "Yes (Google and Meta Ads)",
      products: "Anime night lights, coffee mugs, action figures, and quirky desk decor",
      contacts: [
        { label: "Business Email", value: "help@geekmonkey.in" },
        { label: "Instagram", value: "@geekmonkey.in" },
        { label: "Website", value: "geekmonkey.in" }
      ]
    },
    {
      name: "Celio India",
      category: "apparel",
      priority: "hot",
      status: "Active",
      desc: "French menswear brand with a massive presence in India, known for their premium licensed anime drops (including Naruto, Dragon Ball, and Demon Slayer collections).",
      outreach: "High-value styling campaigns and promotional lookbook sponsorships. Best targeted via their local agency partners or direct marketing team.",
      leadScore: "9.2 / 10",
      googleRating: "4.3 ★ (1,500+ reviews)",
      companySize: "~200-500 employees",
      paidAds: "Yes (Meta, Google, and Print Ads)",
      products: "Licensed anime shirts, jackets, caps, and casual wear",
      contacts: [
        { label: "Business Email", value: "customercare@celio.com" },
        { label: "Instagram", value: "@celioindia" },
        { label: "Website", value: "celio.in" }
      ]
    },
    {
      name: "Bookswagon",
      category: "sub",
      priority: "warm",
      status: "Active",
      desc: "One of India's largest online bookstores, offering a massive selection of imported manga volumes, box sets, and light novels at competitive prices.",
      outreach: "Ideal partner for manga reviews, recommendation videos, and book haul vlogs. Sponsoring exclusive reader discount codes.",
      leadScore: "8.6 / 10",
      googleRating: "4.4 ★ (1,200+ reviews)",
      companySize: "~50-100 employees",
      paidAds: "Yes (Google Search and Shopping Ads)",
      products: "Manga books, light novels, comic volumes, and box sets",
      contacts: [
        { label: "Business Email", value: "customerservice@bookswagon.com" },
        { label: "Instagram", value: "@bookswagon" },
        { label: "Website", value: "bookswagon.com" }
      ]
    },
    {
      name: "Crossword",
      category: "sub",
      priority: "hot",
      status: "Active",
      desc: "Iconic bookstore chain in India with dozens of physical outlets. Offers a dedicated and rapidly expanding manga section alongside pop-culture graphic novels.",
      outreach: "Store walkthroughs, manga section tours, and local event tie-ins. Best for lifestyle and book-focused creators.",
      leadScore: "8.9 / 10",
      googleRating: "4.5 ★ (3,500+ reviews)",
      companySize: "~200-500 employees",
      paidAds: "Yes (Local Search and Social Media)",
      products: "Manga volumes, pop-culture novels, collectibles, and stationery",
      contacts: [
        { label: "Business Email", value: "contactus@crossword.in" },
        { label: "Instagram", value: "@crosswordbookstores" },
        { label: "Website", value: "crossword.in" }
      ]
    }
  ];

  // Tab switching logic
  const btnProjects = document.getElementById('btn-projects');
  const btnSponsors = document.getElementById('btn-sponsors');
  const btnShorts = document.getElementById('btn-shorts');
  const tabProjects = document.getElementById('tab-content-projects');
  const tabSponsors = document.getElementById('tab-content-sponsors');
  const tabShorts = document.getElementById('tab-content-shorts');

  if (btnProjects && tabProjects) {
    btnProjects.addEventListener('click', () => {
      btnProjects.classList.add('active');
      if (btnSponsors) btnSponsors.classList.remove('active');
      if (btnShorts) btnShorts.classList.remove('active');
      tabProjects.classList.remove('hidden');
      if (tabSponsors) tabSponsors.classList.add('hidden');
      if (tabShorts) tabShorts.classList.add('hidden');
    });
  }

  if (btnSponsors && tabSponsors) {
    btnSponsors.addEventListener('click', () => {
      btnSponsors.classList.add('active');
      if (btnProjects) btnProjects.classList.remove('active');
      if (btnShorts) btnShorts.classList.remove('active');
      tabSponsors.classList.remove('hidden');
      if (tabProjects) tabProjects.classList.add('hidden');
      if (tabShorts) tabShorts.classList.add('hidden');
      renderSponsors();
    });
  }

  if (btnShorts && tabShorts) {
    btnShorts.addEventListener('click', () => {
      btnShorts.classList.add('active');
      if (btnProjects) btnProjects.classList.remove('active');
      if (btnSponsors) btnSponsors.classList.remove('active');
      tabShorts.classList.remove('hidden');
      if (tabProjects) tabProjects.classList.add('hidden');
      if (tabSponsors) tabSponsors.classList.add('hidden');
      renderShorts();
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
        const productsMatch = (item.products || '').toLowerCase().includes(query);
        const sizeMatch = (item.companySize || '').toLowerCase().includes(query);
        
        let contactsMatch = false;
        for (const c of item.contacts) {
          if (c.value.toLowerCase().includes(query) || c.label.toLowerCase().includes(query)) {
            contactsMatch = true;
            break;
          }
        }
        matchesSearch = nameMatch || descMatch || outreachMatch || contactsMatch || productsMatch || sizeMatch;
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

      tr.appendChild(createCopyableCell(emailVal));
      tr.appendChild(createCopyableCell(instagramVal));
      tr.appendChild(createCopyableCell(websiteVal));

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

      // Render Metadata Grid (Lead Score, Google Rating, Company Size, Paid Ads, Primary Products)
      const metaGrid = document.createElement('div');
      metaGrid.className = 'sponsor-metadata-grid';

      const fields = [
        { label: 'Lead Score', value: item.leadScore },
        { label: 'Google Rating', value: item.googleRating },
        { label: 'Company Size', value: item.companySize },
        { label: 'Paid Ads Status', value: item.paidAds },
        { label: 'Primary Products', value: item.products }
      ];

      fields.forEach(f => {
        if (f.value) {
          const itemEl = document.createElement('div');
          itemEl.className = 'metadata-item';

          const labelEl = document.createElement('span');
          labelEl.className = 'metadata-label';
          labelEl.textContent = f.label;

          const valEl = document.createElement('span');
          valEl.className = 'metadata-value';
          valEl.textContent = f.value;

          itemEl.appendChild(labelEl);
          itemEl.appendChild(valEl);
          metaGrid.appendChild(itemEl);
        }
      });
      detailBlock.appendChild(metaGrid);

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
