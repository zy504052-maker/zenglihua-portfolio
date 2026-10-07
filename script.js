const localPortfolioData = window.portfolioData;
const siteContent = localPortfolioData.siteContent || {};
let videoWorks = [...localPortfolioData.videoWorks];
let scriptWorks = [...localPortfolioData.scriptWorks];
let accountCases = [...(localPortfolioData.accountCases || [])];
const supabaseConfig = window.supabaseConfig || {};
let publicSupabase = null;

const navLinks = [...document.querySelectorAll(".nav-link")];
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#mainNav");
const sections = [...document.querySelectorAll("main section[id]")].filter((section) =>
  ["home", "about", "portfolio", "contact"].includes(section.id)
);
const portfolioTypeButtons = [...document.querySelectorAll("[data-portfolio-type]")];
const videoWorksPanel = document.querySelector("#videoWorksPanel");
const scriptCapability = document.querySelector("#scriptCapability");
const socialMediaPanel = document.querySelector("#socialMediaPanel");
let videoFilters = [...document.querySelectorAll("[data-video-filter]")];
const videoFiltersContainer = document.querySelector("#videoFilters");
const portfolioGrid = document.querySelector("#portfolioGrid");
const accountCasesGrid = document.querySelector("#accountCasesGrid");
const projectDialog = document.querySelector("#projectDialog");
const dialogClose = document.querySelector(".dialog-close");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogCategory = document.querySelector("#dialogCategory");
const dialogDescription = document.querySelector("#dialogDescription");
const dialogTags = document.querySelector("#dialogTags");
const dialogPlaceholder = document.querySelector(".dialog-placeholder");
let activeProjectVideo = null;
const scriptDialog = document.querySelector("#scriptDialog");
const scriptDialogClose = document.querySelector(".script-dialog-close");
const scriptDialogStage = document.querySelector("#scriptDialogStage");
const scriptDialogTitle = document.querySelector("#scriptDialogTitle");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

function safeMediaUrl(value = "") {
  if (!value) return "";
  try {
    const url = new URL(String(value), document.baseURI);
    return ["http:", "https:", "file:"].includes(url.protocol) ? String(value) : "";
  } catch {
    return "";
  }
}

function safeToneClass(value, fallback) {
  const allowed = ["card-blue", "card-red", "card-dark", "card-cream", "script-blue", "script-cream", "script-red"];
  return allowed.includes(value) ? value : fallback;
}

function isSupabaseConfigured() {
  return Boolean(
    supabaseConfig.url
    && supabaseConfig.anonKey
    && window.supabase
    && typeof window.supabase.createClient === "function"
  );
}

function mapRemoteVideoWork(row) {
  return {
    id: row.id,
    title: row.title || "未命名作品",
    category: row.category || "口播",
    videoUrl: row.video_url || "",
    coverUrl: row.cover_url || "",
    aspectRatio: row.aspect_ratio || "9:16",
    cardAspectRatio: row.card_aspect_ratio || row.aspect_ratio || "3:4",
    role: row.role || "",
    result: row.result || "",
    description: row.description || "",
    detailKeywords: Array.isArray(row.detail_keywords) ? row.detail_keywords : [],
    platform: row.platform || "",
    tone: row.tone || "card-blue",
    isPublished: row.is_published !== false,
    sortOrder: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
  };
}

async function loadRemoteVideoWorks() {
  if (!isSupabaseConfigured()) return;
  publicSupabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
  const { data, error } = await publicSupabase
    .from("video_works")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) return;

  videoWorks = data.map(mapRemoteVideoWork)
    .filter((item) => item.isPublished !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

function applySiteContent(content) {
  const profileName = document.querySelector("#profileName");
  const profileMajor = document.querySelector("#profileMajor");
  const profileMbti = document.querySelector("#profileMbti");
  const profileExperience = document.querySelector("#profileExperience");
  const contactEmail = document.querySelector("#contactEmail");
  const contactPhone = document.querySelector("#contactPhone");
  const contactWechat = document.querySelector("#contactWechat");
  const contactEmailLink = document.querySelector("#contactEmailLink");
  const contactPhoneLink = document.querySelector("#contactPhoneLink");

  if (profileName) profileName.textContent = content.profileName || "";
  if (profileMajor) profileMajor.textContent = content.profileMajor || "";
  if (profileMbti) profileMbti.textContent = content.profileMbti || "";
  if (profileExperience) profileExperience.textContent = content.profileExperience || "";
  if (contactEmail && content.contactEmail) contactEmail.textContent = content.contactEmail;
  if (contactPhone && content.contactPhone) contactPhone.textContent = content.contactPhone;
  if (contactWechat && content.contactWechat) contactWechat.textContent = content.contactWechat;
  if (contactEmailLink && content.contactEmail) contactEmailLink.href = `mailto:${content.contactEmail}`;
  if (contactPhoneLink && content.contactPhone) contactPhoneLink.href = `tel:${content.contactPhone}`;

  const capabilityGrid = document.querySelector("#capabilityGrid");
  if (capabilityGrid && Array.isArray(content.capabilities)) {
    capabilityGrid.innerHTML = content.capabilities
      .filter((capability) => capability && capability.title && capability.description)
      .map((capability) => `<article class="capability-item"><h4>${escapeHtml(capability.title)}</h4><p>${escapeHtml(capability.description)}</p></article>`)
      .join("");
  }

  const photo = document.querySelector("#profilePhoto");
  const photoPlaceholder = document.querySelector("#photoPlaceholderCopy");
  const photoUrl = safeMediaUrl(content.profilePhotoUrl);
  if (photo && photoUrl) {
    photo.src = photoUrl;
    photo.alt = content.profilePhotoAlt || "個人照片";
    photo.hidden = false;
    if (photoPlaceholder) photoPlaceholder.hidden = true;
  }
}

function renderVideoFilters() {
  const categories = localPortfolioData.videoCategories || ["全部", "口播", "采访", "IG剪辑", "宣传片", "信息流", "探店", "短剧"];
  videoFiltersContainer.innerHTML = categories.map((category, index) => `
    <button class="filter-button${index === 0 ? " is-active" : ""}" type="button" data-video-filter="${escapeHtml(category)}" aria-pressed="${index === 0}">${escapeHtml(category)}</button>
  `).join("");
  videoFilters = [...videoFiltersContainer.querySelectorAll("[data-video-filter]")];
}

function renderVideoWorks(filter = "全部") {
  const items = filter === "全部"
    ? videoWorks
    : videoWorks.filter((item) => item.category === filter);

  portfolioGrid.innerHTML = items.map((item) => {
    const title = escapeHtml(item.title || "未命名作品");
    const category = escapeHtml(item.category || "作品");
    const coverUrl = safeMediaUrl(item.coverUrl);
    const tone = safeToneClass(item.tone, "card-blue");
    const displayRatio = item.cardAspectRatio || item.aspectRatio;
    const ratioClass = displayRatio === "9:16" || displayRatio === "3:4" ? "portrait" : "landscape";
    const cardRatioClass = displayRatio === "3:4" ? "card-ratio-3x4" : "";
    return `
    <article class="video-work-card ${ratioClass} ${cardRatioClass}" data-project-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="播放${category}作品">
      <div class="video-cover ${tone}">
        ${coverUrl
          ? `<img src="${escapeHtml(coverUrl)}" alt="${title}视频封面" />`
          : `<span class="video-cover-placeholder" aria-hidden="true"></span>`}
        ${filter === "全部" ? `<span class="video-category-tag">${category}</span>` : ""}
        <span class="video-play-indicator" aria-hidden="true"><i></i></span>
      </div>
    </article>
  `;
  }).join("");

  portfolioGrid.querySelectorAll(".video-work-card").forEach((card) => {
    card.addEventListener("click", () => openVideoProject(card.dataset.projectId));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openVideoProject(card.dataset.projectId);
      }
    });
  });
}

function renderScriptWorks() {
  const scriptGrid = document.querySelector("#scriptGrid");
  scriptGrid.innerHTML = scriptWorks.map((item) => {
    const title = escapeHtml(item.title || "脚本");
    const imageUrl = safeMediaUrl(item.imageUrl);
    const tone = safeToneClass(item.tone, "script-blue");
    return `
    <button class="script-work-card ${tone}" type="button" data-script-id="${escapeHtml(item.id)}" aria-label="放大查看${title}">
      <span class="script-shot">
        ${imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${title}脚本截图" />`
          : `<span class="script-shot-placeholder"><b>${title}</b><small>真实脚本截图待补充</small><i>内容结构 / 文字页面 / 策划记录</i></span>`}
      </span>
      <span class="script-card-label">${title}<b>↗</b></span>
    </button>
  `;
  }).join("");

  scriptGrid.querySelectorAll("[data-script-id]").forEach((card) => {
    card.addEventListener("click", () => openScriptPreview(card.dataset.scriptId));
  });
}

function accountImageMarkup(url, alt, kind, placeholder) {
  const safeUrl = safeMediaUrl(url);
  if (!safeUrl) {
    return `<div class="account-case-image ${kind} account-case-placeholder"><span>${placeholder}</span></div>`;
  }
  return `
    <button class="account-case-image ${kind}" type="button" data-account-image="${escapeHtml(safeUrl)}" data-account-image-alt="${escapeHtml(alt)}" aria-label="放大查看${escapeHtml(alt)}">
      <img src="${escapeHtml(safeUrl)}" alt="${escapeHtml(alt)}" />
    </button>
  `;
}

function renderAccountCases() {
  accountCasesGrid.innerHTML = accountCases.map((item, index) => {
    const title = escapeHtml(item.title || "账号案例");
    const description = String(item.description || "").trim();
    const descriptionLabel = item.descriptionLabel === undefined ? "" : String(item.descriptionLabel);
    const role = String(item.role || "").trim();
    const images = Array.isArray(item.images) ? item.images : [];
    const descriptionMarkup = `
      <div class="account-case-description${description ? "" : " account-case-description-empty"}${role ? " account-case-description-with-role" : ""}">
        ${descriptionLabel ? `<span>${escapeHtml(descriptionLabel)}${description ? "：" : ""}</span>` : ""}
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      </div>
    `;
    const roleMarkup = role ? `
      <div class="account-case-role">
        <span>我的工作：</span>
        <p>${escapeHtml(role)}</p>
      </div>
    ` : "";
    return `
      <article class="account-case reveal">
        <div class="account-case-heading">
          <span class="account-case-index">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
        </div>
        ${descriptionMarkup}
        ${roleMarkup}
        <div class="account-case-media">
          ${images.map((image, imageIndex) => {
            const label = image.type === "account" ? "账号截图" : "内容截图";
            const ratioClass = image.ratio === "3:4"
              ? "ratio-3x4"
              : image.ratio === "1536:902"
                ? "ratio-1536x902"
                : "ratio-4x3";
            return accountImageMarkup(image.src, `${title}${label}${imageIndex + 1}`, ratioClass, `${label}待补充`);
          }).join("")}
        </div>
      </article>
    `;
  }).join("");

  accountCasesGrid.querySelectorAll("[data-account-image]").forEach((button) => {
    button.addEventListener("click", () => openAccountImagePreview(button.dataset.accountImage, button.dataset.accountImageAlt));
  });
}

function setPortfolioType(type) {
  const showVideo = type === "video";
  const showSocial = type === "social";
  const showScript = type === "script";
  videoWorksPanel.hidden = !showVideo;
  socialMediaPanel.hidden = !showSocial;
  scriptCapability.hidden = !showScript;

  portfolioTypeButtons.forEach((button) => {
    const active = button.dataset.portfolioType === type;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (showVideo) {
    videoFilters.forEach((button, index) => button.classList.toggle("is-active", index === 0));
    renderVideoWorks();
  }

  requestAnimationFrame(() => {
    const activePanel = showVideo ? videoWorksPanel : showSocial ? socialMediaPanel : scriptCapability;
    activePanel.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
  });
}

function openScriptPreview(scriptId) {
  const item = scriptWorks.find((script) => script.id === scriptId);
  if (!item) return;
  scriptDialogTitle.textContent = item.title;
  const imageUrl = safeMediaUrl(item.imageUrl);
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = `${item.title}脚本截图`;
    scriptDialogStage.replaceChildren(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "script-dialog-placeholder";
    placeholder.innerHTML = "<b></b><small>真实脚本截图待补充</small>";
    placeholder.querySelector("b").textContent = item.title;
    scriptDialogStage.replaceChildren(placeholder);
  }
  scriptDialog.showModal();
  document.body.classList.add("dialog-open");
}

function closeScriptPreview() {
  scriptDialog.close();
  document.body.classList.remove("dialog-open");
}

function openAccountImagePreview(imageUrl, alt) {
  const safeUrl = safeMediaUrl(imageUrl);
  if (!safeUrl) return;
  scriptDialogTitle.textContent = alt;
  const image = document.createElement("img");
  image.src = safeUrl;
  image.alt = alt;
  scriptDialogStage.replaceChildren(image);
  scriptDialog.showModal();
  document.body.classList.add("dialog-open");
}

function formatVideoTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function openVideoProject(projectId) {
  const item = videoWorks.find((project) => project.id === projectId);
  if (!item) return;
  stopProjectMedia();
  dialogTitle.textContent = item.title;
  dialogCategory.textContent = item.platform ? `${item.category} / ${item.platform}` : item.category;
  dialogDescription.className = Array.isArray(item.detailKeywords) && item.detailKeywords.length
    ? "dialog-description-tags"
    : "";
  dialogDescription.replaceChildren(...(Array.isArray(item.detailKeywords) && item.detailKeywords.length
    ? item.detailKeywords.map((keyword) => {
      const tag = document.createElement("span");
      tag.textContent = keyword;
      return tag;
    })
    : [document.createTextNode(item.description || "项目描述待补充。")]));
  const videoUrl = safeMediaUrl(item.videoUrl);
  const coverUrl = safeMediaUrl(item.coverUrl);
  if (videoUrl) {
    const player = document.createElement("div");
    player.className = "dialog-media-player";
    const video = document.createElement("video");
    video.preload = "metadata";
    video.tabIndex = 0;
    video.setAttribute("aria-label", `${item.title}视频播放器`);
    if (coverUrl) video.poster = coverUrl;

    const controls = document.createElement("div");
    controls.className = "video-controls";

    const playButton = document.createElement("button");
    playButton.className = "video-control-button";
    playButton.type = "button";
    playButton.setAttribute("aria-label", "播放");
    playButton.title = "播放 / 暂停";

    const timeLabel = document.createElement("span");
    timeLabel.className = "video-time";
    timeLabel.textContent = "00:00 / 00:00";
    timeLabel.setAttribute("aria-live", "off");

    const progress = document.createElement("input");
    progress.className = "video-progress";
    progress.type = "range";
    progress.min = "0";
    progress.max = "100";
    progress.step = "0.1";
    progress.value = "0";
    progress.disabled = true;
    progress.setAttribute("aria-label", "调整播放进度");

    const muteButton = document.createElement("button");
    muteButton.className = "video-control-button video-mute-button";
    muteButton.type = "button";
    muteButton.setAttribute("aria-label", "静音");
    muteButton.title = "静音 / 取消静音";

    const volume = document.createElement("input");
    volume.className = "video-volume";
    volume.type = "range";
    volume.min = "0";
    volume.max = "1";
    volume.step = "0.05";
    volume.value = "1";
    volume.setAttribute("aria-label", "调整音量");

    const fullscreenButton = document.createElement("button");
    fullscreenButton.className = "video-control-button video-fullscreen-button";
    fullscreenButton.type = "button";
    fullscreenButton.setAttribute("aria-label", "全屏播放");
    fullscreenButton.title = "全屏播放";
    fullscreenButton.textContent = "⛶";
    let isSeeking = false;

    const syncPlayButton = () => {
      playButton.textContent = video.paused ? "▶" : "❚❚";
      playButton.setAttribute("aria-label", video.paused ? "播放" : "暂停");
    };

    const syncMuteButton = () => {
      const isMuted = video.muted || video.volume === 0;
      muteButton.textContent = isMuted ? "🔇" : "🔊";
      muteButton.setAttribute("aria-label", isMuted ? "取消静音" : "静音");
    };

    const syncTimeline = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
      if (!isSeeking) {
        progress.value = String(percent);
        progress.style.setProperty("--video-progress", `${percent}%`);
      }
      progress.disabled = duration <= 0;
      timeLabel.textContent = `${formatVideoTime(currentTime)} / ${formatVideoTime(duration)}`;
    };

    const seekVideo = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      const percent = Math.min(100, Math.max(0, Number(progress.value) || 0));
      video.currentTime = (percent / 100) * video.duration;
      progress.style.setProperty("--video-progress", `${percent}%`);
    };

    const seekFromPointer = (event) => {
      if (progress.disabled) return;
      const bounds = progress.getBoundingClientRect();
      if (!bounds.width) return;
      const percent = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      progress.value = String(percent);
      seekVideo();
      syncTimeline();
    };

    const togglePlayback = () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    playButton.addEventListener("click", togglePlayback);
    video.addEventListener("click", togglePlayback);
    video.addEventListener("play", syncPlayButton);
    video.addEventListener("pause", syncPlayButton);
    video.addEventListener("loadedmetadata", syncTimeline);
    video.addEventListener("durationchange", syncTimeline);
    video.addEventListener("timeupdate", syncTimeline);
    video.addEventListener("volumechange", syncMuteButton);
    video.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        togglePlayback();
      }
    });
    progress.addEventListener("input", () => {
      seekVideo();
      syncTimeline();
    });
    progress.addEventListener("change", () => {
      seekVideo();
      syncTimeline();
    });
    progress.addEventListener("pointerdown", (event) => {
      if (progress.disabled) return;
      event.preventDefault();
      isSeeking = true;
      progress.focus({ preventScroll: true });
      progress.setPointerCapture?.(event.pointerId);
      seekFromPointer(event);
    });
    progress.addEventListener("pointermove", (event) => {
      if (isSeeking) seekFromPointer(event);
    });
    const finishSeeking = (event) => {
      if (!isSeeking) return;
      seekFromPointer(event);
      isSeeking = false;
      syncTimeline();
      if (progress.hasPointerCapture?.(event.pointerId)) {
        progress.releasePointerCapture(event.pointerId);
      }
    };
    progress.addEventListener("pointerup", finishSeeking);
    progress.addEventListener("pointercancel", finishSeeking);
    progress.addEventListener("blur", () => {
      if (!isSeeking) return;
      isSeeking = false;
      syncTimeline();
    });
    muteButton.addEventListener("click", () => {
      video.muted = !video.muted;
      syncMuteButton();
    });
    volume.addEventListener("input", () => {
      video.volume = Number(volume.value);
      video.muted = video.volume === 0;
      syncMuteButton();
    });
    fullscreenButton.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        player.requestFullscreen?.().catch?.(() => {});
      }
    });

    controls.append(playButton, timeLabel, progress, muteButton, volume, fullscreenButton);
    player.append(video, controls);
    dialogPlaceholder.replaceChildren(player);
    video.src = videoUrl;
    syncPlayButton();
    syncMuteButton();
    syncTimeline();
    activeProjectVideo = video;
  } else {
    dialogPlaceholder.innerHTML = "<span class=\"placeholder-kicker\">项目详情</span><span class=\"placeholder-play\">▶</span><span>真实视频 / 视频链接待替换</span>";
  }
  const workBlock = document.createElement("section");
  workBlock.className = "dialog-work-block";
  const workHeading = document.createElement("h3");
  workHeading.textContent = "我的工作";
  const workCopy = document.createElement("p");
  workCopy.textContent = item.role || "待补充";
  workBlock.append(workHeading, workCopy);

  const detailBlocks = [workBlock];
  if (item.result) {
    const resultsBlock = document.createElement("section");
    resultsBlock.className = "dialog-results-block";
    const resultsHeading = document.createElement("h3");
    resultsHeading.textContent = "项目成果";
    const resultRow = document.createElement("div");
    resultRow.className = "dialog-result-row";
    item.result.split(" · ").forEach((result) => {
      const resultValue = document.createElement("span");
      resultValue.className = "dialog-result-value";
      resultValue.textContent = result;
      resultRow.appendChild(resultValue);
    });
    resultsBlock.append(resultsHeading, resultRow);
    detailBlocks.push(resultsBlock);
  }
  dialogTags.replaceChildren(...detailBlocks);
  if (!projectDialog.open) projectDialog.showModal();
  document.body.classList.add("dialog-open");
}

function stopProjectMedia() {
  const projectMedia = new Set(projectDialog.querySelectorAll("video, audio"));
  if (activeProjectVideo) projectMedia.add(activeProjectVideo);

  document.querySelectorAll("video, audio").forEach((media) => {
    try {
      media.pause();
      media.muted = true;
    } catch {
      // Continue cleanup for the remaining media elements.
    }
  });

  projectMedia.forEach((media) => {
    try {
      media.removeAttribute("autoplay");
      media.removeAttribute("src");
      media.querySelectorAll("source").forEach((source) => source.remove());
      if (typeof media.load === "function") media.load();
      media.remove();
    } catch {
      // Media cleanup should not prevent the dialog from closing.
    }
  });
  activeProjectVideo = null;
}

function closeProject() {
  stopProjectMedia();
  projectDialog.close();
  document.body.classList.remove("dialog-open");
}

function updateActiveNav() {
  const current = sections.reduce((activeId, section) => {
    const distance = Math.abs(section.getBoundingClientRect().top - 120);
    return distance < activeId.distance ? { id: section.id, distance } : activeId;
  }, { id: "home", distance: Number.POSITIVE_INFINITY });

  navLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.nav === current.id));
}

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

portfolioTypeButtons.forEach((button) => {
  button.addEventListener("click", () => setPortfolioType(button.dataset.portfolioType));
});

videoFiltersContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-video-filter]");
  if (!button) return;
  videoFilters.forEach((item) => {
    const active = item === button;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderVideoWorks(button.dataset.videoFilter);
});

dialogClose.addEventListener("click", closeProject);
projectDialog.addEventListener("click", (event) => {
  if (event.target === projectDialog) closeProject();
});
projectDialog.addEventListener("cancel", stopProjectMedia);
projectDialog.addEventListener("close", () => {
  stopProjectMedia();
  document.body.classList.remove("dialog-open");
});
scriptDialogClose.addEventListener("click", closeScriptPreview);
scriptDialog.addEventListener("click", (event) => {
  if (event.target === scriptDialog) closeScriptPreview();
});
scriptDialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("resize", updateActiveNav);
window.addEventListener("pagehide", stopProjectMedia);

async function initializePortfolio() {
  applySiteContent(siteContent);
  await loadRemoteVideoWorks().catch(() => {});
  renderVideoFilters();
  renderAccountCases();
  renderScriptWorks();
  updateActiveNav();
}

initializePortfolio();
