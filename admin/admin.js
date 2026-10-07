const localData = window.portfolioData || { videoCategories: [], videoWorks: [] };
const supabaseConfig = window.supabaseConfig || {};
const BUCKET = "portfolio-media";
const $ = (selector) => document.querySelector(selector);

const authPanel = $("#authPanel");
const dashboardPanel = $("#dashboardPanel");
const loginForm = $("#loginForm");
const loginEmail = $("#loginEmail");
const loginPassword = $("#loginPassword");
const authStatus = $("#authStatus");
const setupMessage = $("#setupMessage");
const videoForm = $("#videoForm");
const videoList = $("#videoList");
const videoCount = $("#videoCount");
const editorPanel = $(".editor-panel");
const formHeading = $("#formHeading");
const editState = $("#editState");
const formStatus = $("#formStatus");
const signedInAs = $("#signedInAs");
const uploadProgressWrap = $("#uploadProgressWrap");
const uploadProgressLabel = $("#uploadProgressLabel");
const uploadProgressValue = $("#uploadProgressValue");
const uploadProgressBar = $("#uploadProgressBar");

let supabaseClient = null;
let currentSession = null;
let videoRecords = [];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

function isConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey && window.supabase?.createClient);
}

function adminMediaUrl(value = "") {
  if (!value) return "";
  return /^(https?:|data:|blob:)/i.test(value) ? value : `../${value.replace(/^\.\//, "")}`;
}

function setStatus(element, message = "", kind = "") {
  element.textContent = message;
  element.dataset.kind = kind;
}

function mapLocalRecord(item, index) {
  return {
    id: item.id,
    title: item.title || "未命名作品",
    category: item.category || "口播",
    videoUrl: item.videoUrl || "",
    coverUrl: item.coverUrl || "",
    aspectRatio: item.aspectRatio || "9:16",
    cardAspectRatio: item.cardAspectRatio || item.aspectRatio || "3:4",
    role: item.role || "",
    result: item.result || "",
    description: item.description || "",
    detailKeywords: Array.isArray(item.detailKeywords) ? item.detailKeywords : [],
    platform: item.platform || "",
    tone: item.tone || "card-blue",
    isPublished: true,
    sortOrder: index,
    isLocalOrigin: true,
  };
}

function mapRemoteRecord(row, localIds) {
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
    isLocalOrigin: localIds.has(row.id),
  };
}

function recordToDb(record) {
  return {
    id: record.id,
    title: record.title,
    category: record.category,
    video_url: record.videoUrl || "",
    cover_url: record.coverUrl || "",
    aspect_ratio: record.aspectRatio || "9:16",
    card_aspect_ratio: record.cardAspectRatio || "3:4",
    role: record.role || "",
    result: record.result || "",
    description: record.description || "",
    detail_keywords: Array.isArray(record.detailKeywords) ? record.detailKeywords : [],
    platform: record.platform || "",
    tone: record.tone || "card-blue",
    is_published: record.isPublished !== false,
    sort_order: Number(record.sortOrder) || 0,
  };
}

function renderCategoryOptions() {
  const categories = localData.videoCategories || ["全部", "口播", "采访", "IG剪辑", "宣传片", "信息流", "探店", "短剧"];
  $("#videoCategory").innerHTML = categories
    .filter((category) => category !== "全部")
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
}

function renderRecords() {
  const sorted = [...videoRecords].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  videoCount.textContent = String(sorted.length);
  if (!sorted.length) {
    videoList.innerHTML = `<p class="empty-list">暂时没有视频作品。点击“新增视频”开始录入。</p>`;
    return;
  }
  videoList.innerHTML = sorted.map((record) => `
    <article class="video-row">
      <div class="video-thumb">
        ${record.coverUrl ? `<img src="${escapeHtml(adminMediaUrl(record.coverUrl))}" alt="" />` : `<span class="video-thumb-placeholder">无封面</span>`}
      </div>
      <div>
        <h3>${escapeHtml(record.title)}</h3>
        <p>${escapeHtml(record.category)}${record.platform ? ` · ${escapeHtml(record.platform)}` : ""}</p>
        <div class="video-row-meta">
          <span class="${record.isPublished ? "" : "is-hidden"}">${record.isPublished ? "已发布" : "已下架"}</span>
          <span>${record.videoUrl ? "有视频" : "待上传视频"}</span>
        </div>
      </div>
      <div class="row-actions">
        <button class="row-action" type="button" data-action="edit" data-id="${escapeHtml(record.id)}">编辑</button>
        <button class="row-action" type="button" data-action="toggle" data-id="${escapeHtml(record.id)}">${record.isPublished ? "下架" : "发布"}</button>
        <button class="row-action" type="button" data-action="delete" data-id="${escapeHtml(record.id)}">删除</button>
      </div>
    </article>
  `).join("");
}

async function loadRecords() {
  const localRecords = (localData.videoWorks || []).map(mapLocalRecord);
  const localIds = new Set(localRecords.map((record) => record.id));
  const { data, error } = await supabaseClient.from("video_works").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw error;
  let remoteRows = data || [];
  const remoteIds = new Set(remoteRows.map((row) => row.id));
  const missingLocal = localRecords.filter((record) => !remoteIds.has(record.id));
  if (missingLocal.length) {
    const { error: seedError } = await supabaseClient
      .from("video_works")
      .upsert(missingLocal.map(recordToDb), { onConflict: "id" });
    if (seedError) throw seedError;
    remoteRows = [...remoteRows, ...missingLocal.map(recordToDb)];
  }
  const merged = new Map();
  remoteRows.forEach((row) => merged.set(row.id, mapRemoteRecord(row, localIds)));
  videoRecords = [...merged.values()];
  renderRecords();
}

function getRecord(id) {
  return videoRecords.find((record) => record.id === id);
}

function setExistingFile(element, url, label) {
  if (!url) {
    element.textContent = `尚未选择${label}`;
    return;
  }
  element.innerHTML = `<a href="${escapeHtml(adminMediaUrl(url))}" target="_blank" rel="noreferrer">查看当前${label}</a>`;
}

function fillForm(record = null) {
  videoForm.reset();
  $("#videoId").value = record?.id || "";
  $("#videoTitle").value = record?.title || "";
  $("#videoCategory").value = record?.category || "口播";
  $("#videoSortOrder").value = String(record?.sortOrder ?? videoRecords.length);
  $("#videoAspectRatio").value = record?.aspectRatio || "9:16";
  $("#videoCardAspectRatio").value = record?.cardAspectRatio || "3:4";
  $("#videoPlatform").value = record?.platform || "";
  $("#videoRole").value = record?.role || "";
  $("#videoResult").value = record?.result || "";
  $("#videoDescription").value = record?.description || "";
  $("#videoKeywords").value = (record?.detailKeywords || []).join("、");
  $("#videoPublished").checked = record?.isPublished !== false;
  setExistingFile($("#currentVideoFile"), record?.videoUrl, "视频");
  setExistingFile($("#currentCoverFile"), record?.coverUrl, "封面");
  formHeading.textContent = record ? "编辑视频作品" : "新增视频作品";
  editState.textContent = record ? "EDIT" : "NEW";
  setStatus(formStatus);
}

function focusEditor(record = null) {
  fillForm(record);
  editorPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function safeFileName(fileName) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  return extension || ".bin";
}

function getTusEndpoint() {
  return `${supabaseConfig.url.replace(/\/$/, "")}/storage/v1/upload/resumable`;
}

function updateUploadProgress(label, ratio) {
  const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  uploadProgressWrap.hidden = false;
  uploadProgressLabel.textContent = label;
  uploadProgressValue.textContent = `${percent}%`;
  uploadProgressBar.style.width = `${percent}%`;
}

async function uploadMedia(file, folder, label) {
  const path = `${folder}/${crypto.randomUUID()}${safeFileName(file.name)}`;
  updateUploadProgress(`${label}：准备上传`, 0);

  if (window.tus?.Upload) {
    await new Promise((resolve, reject) => {
      const upload = new window.tus.Upload(file, {
        endpoint: getTusEndpoint(),
        retryDelays: [0, 1000, 3000, 5000, 10000],
        headers: {
          authorization: `Bearer ${currentSession.access_token}`,
          apikey: supabaseConfig.anonKey,
          "x-upsert": "true",
        },
        metadata: {
          bucketName: BUCKET,
          objectName: path,
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: 6 * 1024 * 1024,
        onError: reject,
        onProgress: (uploaded, total) => updateUploadProgress(`${label}：上传中`, uploaded / total),
        onSuccess: resolve,
      });
      upload.start();
    });
  } else {
    const { error } = await supabaseClient.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });
    if (error) throw error;
  }

  updateUploadProgress(`${label}：上传完成`, 1);
  return supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function saveRecord(record) {
  const { error } = await supabaseClient.from("video_works").upsert(recordToDb(record), { onConflict: "id" });
  if (error) throw error;
}

function storagePathFromUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    return markerIndex < 0 ? "" : decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return "";
  }
}

async function removeManagedMedia(urls) {
  const paths = [...new Set(urls.map(storagePathFromUrl).filter(Boolean))];
  if (!paths.length) return;
  const { error } = await supabaseClient.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

async function handleSave(event) {
  event.preventDefault();
  if (!currentSession) return;
  const existing = getRecord($("#videoId").value.trim());
  const title = $("#videoTitle").value.trim();
  const id = existing?.id || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "video"}-${Date.now()}`;
  const videoFile = $("#videoFile").files[0];
  const coverFile = $("#coverFile").files[0];
  const baseRecord = {
    ...(existing || {}),
    id,
    title,
    category: $("#videoCategory").value,
    aspectRatio: $("#videoAspectRatio").value.trim() || "9:16",
    cardAspectRatio: $("#videoCardAspectRatio").value.trim() || "3:4",
    platform: $("#videoPlatform").value.trim(),
    role: $("#videoRole").value.trim(),
    result: $("#videoResult").value.trim(),
    description: $("#videoDescription").value.trim(),
    detailKeywords: $("#videoKeywords").value.split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean),
    isPublished: $("#videoPublished").checked,
    sortOrder: Number($("#videoSortOrder").value) || 0,
    tone: existing?.tone || "card-blue",
  };

  if (!title) return;
  if (baseRecord.isPublished && !videoFile && !baseRecord.videoUrl) {
    setStatus(formStatus, "发布作品前请先选择视频文件。", "error");
    return;
  }
  $("#saveVideoButton").disabled = true;
  setStatus(formStatus, "正在保存，请稍候…");
  try {
    const oldVideoUrl = existing?.videoUrl || "";
    const oldCoverUrl = existing?.coverUrl || "";
    if (videoFile) baseRecord.videoUrl = await uploadMedia(videoFile, `videos/${id}`, "视频");
    if (coverFile) baseRecord.coverUrl = await uploadMedia(coverFile, `covers/${id}`, "封面");
    await saveRecord(baseRecord);
    const replacedUrls = [];
    if (videoFile && oldVideoUrl !== baseRecord.videoUrl) replacedUrls.push(oldVideoUrl);
    if (coverFile && oldCoverUrl !== baseRecord.coverUrl) replacedUrls.push(oldCoverUrl);
    await removeManagedMedia(replacedUrls);
    await loadRecords();
    fillForm(baseRecord);
    setStatus(formStatus, "保存成功，公开页面会自动读取已发布内容。", "success");
  } catch (error) {
    setStatus(formStatus, `保存失败：${error.message || error}`, "error");
  } finally {
    $("#saveVideoButton").disabled = false;
  }
}

async function togglePublished(record) {
  const next = { ...record, isPublished: !record.isPublished };
  await saveRecord(next);
  await loadRecords();
}

async function deleteRecord(record) {
  if (!window.confirm(`确定要删除“${record.title}”吗？`)) return;
  if (record.isLocalOrigin) {
    await saveRecord({ ...record, isPublished: false });
  } else {
    const { error } = await supabaseClient.from("video_works").delete().eq("id", record.id);
    if (error) throw error;
    await removeManagedMedia([record.videoUrl, record.coverUrl]);
  }
  await loadRecords();
  if ($("#videoId").value === record.id) fillForm();
}

async function ensureAdmin(session) {
  const { data, error } = await supabaseClient.from("admin_users").select("id").eq("id", session.user.id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function showSession(session) {
  currentSession = session;
  if (!session) {
    authPanel.hidden = false;
    dashboardPanel.hidden = true;
    return;
  }
  try {
    if (!await ensureAdmin(session)) {
      setStatus(authStatus, "这个账号还没有后台权限，请把它的用户 UUID 加入 Supabase 的 admin_users 表。", "error");
      await supabaseClient.auth.signOut();
      return;
    }
    authPanel.hidden = true;
    dashboardPanel.hidden = false;
    signedInAs.textContent = session.user.email || "已登录";
    await loadRecords();
  } catch (error) {
    authPanel.hidden = false;
    dashboardPanel.hidden = true;
    setStatus(authStatus, `后台初始化失败：${error.message || error}`, "error");
  }
}

async function initialize() {
  renderCategoryOptions();
  fillForm();
  if (!isConfigured()) {
    setupMessage.hidden = false;
    setupMessage.textContent = "请先在 data/supabase-config.js 填入 Supabase Project URL 和 anon key，再运行数据库 SQL。不要填写 service_role key。";
    loginForm.querySelectorAll("input, button").forEach((element) => { element.disabled = true; });
    return;
  }

  supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
  const { data } = await supabaseClient.auth.getSession();
  await showSession(data.session);
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    showSession(session);
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(authStatus, "正在登录…");
  const { error } = await supabaseClient.auth.signInWithPassword({ email: loginEmail.value.trim(), password: loginPassword.value });
  if (error) setStatus(authStatus, `登录失败：${error.message}`, "error");
});

videoForm.addEventListener("submit", handleSave);
$("#newVideoButton").addEventListener("click", () => focusEditor());
$("#resetFormButton").addEventListener("click", () => fillForm());
$("#logoutButton").addEventListener("click", () => supabaseClient.auth.signOut());
videoList.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const record = getRecord(actionButton.dataset.id);
  if (!record) return;
  try {
    if (actionButton.dataset.action === "edit") focusEditor(record);
    if (actionButton.dataset.action === "toggle") await togglePublished(record);
    if (actionButton.dataset.action === "delete") await deleteRecord(record);
  } catch (error) {
    setStatus(formStatus, `操作失败：${error.message || error}`, "error");
  }
});

initialize().catch((error) => setStatus(authStatus, `后台初始化失败：${error.message || error}`, "error"));
