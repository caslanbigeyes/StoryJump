import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 4173);
const apiBase = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
const useMockApi = process.env.MOCK_API !== 'false';

const users = new Map();
const tokens = new Map();
const tasks = new Map();
const audioSamples = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
];

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : '{}';
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function getUserFromAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const userId = tokens.get(token);
  return userId ? users.get(userId) : null;
}

function buildShots(taskId, topic) {
  return [
    {
      id: createId('shot'),
      taskId,
      shotIndex: 0,
      sceneText: `${topic}，主角在雨夜街头起步奔跑`,
      cameraAngle: 'wide, eye-level, tracking',
      characterAction: '主角穿过霓虹灯下的街道',
      imagePrompt: `cinematic rainy night city chase, neon reflections, protagonist running, ${topic}`,
      imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      audioUrl: null,
      status: 'image_done',
    },
    {
      id: createId('shot'),
      taskId,
      shotIndex: 1,
      sceneText: '镜头切近景，水花溅起，追逐节奏加快',
      cameraAngle: 'close-up, low-angle, handheld',
      characterAction: '镜头跟随脚步与回头张望',
      imagePrompt: 'close-up rainy street sprint, dramatic reflections, tense chase scene',
      imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=900&q=80',
      audioUrl: null,
      status: 'image_done',
    },
  ];
}

function buildStoryboardResult(task) {
  const shots = buildShots(task.id, task.topic);
  return {
    meta: {
      title: task.title,
      genre: 'general',
      duration: 120,
      shot_count: shots.length,
      aspect_ratio: '9:16',
      visual_style: 'cinematic realism',
    },
    character_bible: [],
    script: {
      title: task.title,
      logline: `${task.topic} 的短片故事`,
      theme: task.topic,
      structure: {
        beginning: `${task.topic} 的故事在雨夜开始。`,
        development: '主角不断向前推进，冲突逐步升级。',
        turning_point: '追逐和抉择同时到来，节奏陡然加快。',
        ending: '人物做出决定，故事落在一个带余味的结尾。',
      },
      narration: `${task.topic}，从一个夜晚开始，逐步逼近人物真正的选择。`,
    },
    shots: shots.map((shot) => ({
      shot_id: shot.shotIndex,
      duration: 4,
      scene: shot.sceneText,
      time: 'night',
      location: 'city street',
      character: ['主角'],
      action: shot.characterAction,
      emotion: 'tense',
      camera: {
        shot_size: shot.cameraAngle?.split(',')[0]?.trim() || 'medium shot',
        angle: shot.cameraAngle?.split(',')[1]?.trim() || 'eye-level',
        movement: shot.cameraAngle?.split(',')[2]?.trim() || 'tracking',
      },
      visual: {
        lighting: 'neon rain light',
        color_palette: 'blue and amber',
        composition: 'cinematic centered framing',
      },
      narration: shot.sceneText,
      image_prompt: shot.imagePrompt,
      negative_prompt: 'blur, low quality',
    })),
    validation: {
      shot_count_match: true,
      character_consistency: true,
      era_consistency: true,
      all_actions_visualizable: true,
      no_abstract_only_shots: true,
      all_prompts_ready: true,
    },
  };
}

function rebuildShotsFromScript(task) {
  const script = task.result?.script;
  const parts = [
    script?.structure?.beginning,
    script?.structure?.development,
    script?.structure?.turning_point,
    script?.structure?.ending,
  ].filter(Boolean);

  const baseParts = parts.length > 0 ? parts : [`${task.topic} 的故事推进`, `${task.topic} 的人物转折`];

  return baseParts.slice(0, 4).map((part, index) => ({
    id: createId('shot'),
    taskId: task.id,
    shotIndex: index,
    sceneText: part,
    cameraAngle: index % 2 === 0 ? 'wide, eye-level, tracking' : 'close-up, low-angle, handheld',
    characterAction: `围绕“${task.topic}”展开的第 ${index + 1} 段动作`,
    imagePrompt: `cinematic storyboard frame ${index + 1}, ${part}, ${task.topic}`,
    imageUrl: null,
    audioUrl: null,
    status: 'pending',
  }));
}

function scheduleTaskProgress(task) {
  setTimeout(() => {
    const current = tasks.get(task.id);
    if (!current) return;
    current.status = 'running';
    current.currentStep = 'create_script';
    current.progress = 5;
    current.updatedAt = nowIso();
  }, 1500);

  setTimeout(() => {
    const current = tasks.get(task.id);
    if (!current) return;
    current.status = 'running';
    current.currentStep = 'generate_images';
    current.progress = 65;
    current.updatedAt = nowIso();
  }, 4500);

  setTimeout(() => {
    const current = tasks.get(task.id);
    if (!current) return;
    current.status = 'success';
    current.currentStep = 'done';
    current.progress = 100;
    current.updatedAt = nowIso();
    current.shots = buildShots(task.id, current.topic);
    current.result = buildStoryboardResult(current);
  }, 8500);
}

async function handleMockApi(req, res) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const { pathname } = requestUrl;

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await readJsonBody(req);
    if (!body.email || !body.password) {
      sendJson(res, 400, { message: 'Missing email or password' });
      return true;
    }
    const exists = Array.from(users.values()).find((user) => user.email === body.email);
    if (exists) {
      sendJson(res, 401, { message: 'Email already registered' });
      return true;
    }

    const user = {
      id: createId('user'),
      email: body.email,
      password: body.password,
      credits: 100,
      createdAt: nowIso(),
    };
    const token = createId('token');
    users.set(user.id, user);
    tokens.set(token, user.id);
    sendJson(res, 201, { token });
    return true;
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const user = Array.from(users.values()).find(
      (item) => item.email === body.email && item.password === body.password,
    );
    if (!user) {
      sendJson(res, 401, { message: 'Invalid credentials' });
      return true;
    }
    const token = createId('token');
    tokens.set(token, user.id);
    sendJson(res, 201, { token });
    return true;
  }

  const user = getUserFromAuth(req);
  if (!user) {
    sendJson(res, 401, { message: 'Unauthorized' });
    return true;
  }

  if (pathname === '/api/tasks' && req.method === 'GET') {
    const data = Array.from(tasks.values())
      .filter((task) => task.userId === user.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(({ topic, shots, ...task }) => task);
    sendJson(res, 200, {
      data,
      total: data.length,
      page: Number(requestUrl.searchParams.get('page') || 1),
      limit: Number(requestUrl.searchParams.get('limit') || 20),
    });
    return true;
  }

  if (pathname === '/api/tasks' && req.method === 'POST') {
    const body = await readJsonBody(req);
    if (!body.title || !body.topic) {
      sendJson(res, 400, { message: 'Missing title or topic' });
      return true;
    }

    const task = {
      id: createId('task'),
      userId: user.id,
      title: body.title,
      topic: body.topic,
      status: 'pending',
      currentStep: 'create_script',
      progress: 0,
      errorMessage: null,
      shots: [],
      result: null,
      video: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    tasks.set(task.id, task);
    scheduleTaskProgress(task);
    sendJson(res, 201, {
      taskId: task.id,
      status: task.status,
      currentStep: task.currentStep,
    });
    return true;
  }

  const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (taskMatch && req.method === 'GET') {
    const task = tasks.get(taskMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    sendJson(res, 200, {
      id: task.id,
      userId: task.userId,
      title: task.title,
      status: task.status,
      currentStep: task.currentStep,
      progress: task.progress,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      shots: task.shots,
    });
    return true;
  }

  const statusMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/status$/);
  if (statusMatch && req.method === 'GET') {
    const task = tasks.get(statusMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    sendJson(res, 200, {
      status: task.status,
      currentStep: task.currentStep,
      progress: task.progress,
      errorMessage: task.errorMessage,
    });
    return true;
  }

  const shotsMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/shots$/);
  if (shotsMatch && req.method === 'GET') {
    const task = tasks.get(shotsMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    sendJson(res, 200, task.shots);
    return true;
  }

  const resultMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/result$/);
  if (resultMatch && req.method === 'GET') {
    const task = tasks.get(resultMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    sendJson(res, 200, task.result);
    return true;
  }

  const taskVideoMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/video$/);
  if (taskVideoMatch && req.method === 'GET') {
    const task = tasks.get(taskVideoMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    sendJson(res, 200, task.video ?? { status: 'idle', videoUrl: null });
    return true;
  }

  const exportVideoMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/video\/export$/);
  if (exportVideoMatch && req.method === 'POST') {
    const body = await readJsonBody(req);
    const task = tasks.get(exportVideoMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    const audioCount = task.shots.filter((shot) => shot.audioUrl).length;
    const shotCount = task.shots.filter((shot) => shot.imageUrl).length;
    if (shotCount === 0) {
      sendJson(res, 400, { message: 'No generated images found for this task' });
      return true;
    }
    task.video = {
      status: 'processing',
      videoUrl: null,
      progress: 10,
      resolution: body.resolution || '1080x1920',
      format: body.format || 'MP4',
    };
    task.updatedAt = nowIso();
    setTimeout(() => {
      const current = tasks.get(task.id);
      if (!current?.video) return;
      current.video = {
        status: 'ready',
        assetId: createId('asset'),
        videoUrl: `https://samplelib.com/lib/preview/mp4/sample-5s.mp4?taskId=${current.id}&ts=${Date.now()}`,
        resolution: body.resolution || '1080x1920',
        format: body.format || 'MP4',
        audioMode: audioCount > 0 ? 'with-audio' : 'mute',
        provider: 'storyjump-mvp-preview',
      };
      current.updatedAt = nowIso();
    }, 2500);
    sendJson(res, 200, {
      ...task.video,
      shotCount,
      audioCount,
    });
    return true;
  }

  const updateScriptMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/script$/);
  if (updateScriptMatch && req.method === 'PATCH') {
    const body = await readJsonBody(req);
    const task = tasks.get(updateScriptMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    if (!task.result) {
      task.result = buildStoryboardResult(task);
    }
    task.result.script = body;
    task.updatedAt = nowIso();
    sendJson(res, 200, task.result);
    return true;
  }

  const rewriteScriptMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/script\/rewrite$/);
  if (rewriteScriptMatch && req.method === 'POST') {
    const body = await readJsonBody(req);
    const task = tasks.get(rewriteScriptMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    if (!task.result) {
      task.result = buildStoryboardResult(task);
    }
    const instructions = body.instructions || '优化节奏与表达';
    task.result.script = {
      ...task.result.script,
      narration: `${task.result.script.narration}\n\n改写要求：${instructions}`,
    };
    task.updatedAt = nowIso();
    sendJson(res, 200, task.result);
    return true;
  }

  const resplitStoryboardMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/storyboard\/resplit$/);
  if (resplitStoryboardMatch && req.method === 'POST') {
    const task = tasks.get(resplitStoryboardMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    if (!task.result) {
      task.result = buildStoryboardResult(task);
    }
    task.shots = rebuildShotsFromScript(task);
    task.result.shots = task.shots.map((shot) => ({
      shot_id: shot.shotIndex,
      duration: 4,
      scene: shot.sceneText,
      time: 'night',
      location: 'city street',
      character: ['主角'],
      action: shot.characterAction,
      emotion: 'focused',
      camera: {
        shot_size: shot.cameraAngle?.split(',')[0]?.trim() || 'medium shot',
        angle: shot.cameraAngle?.split(',')[1]?.trim() || 'eye-level',
        movement: shot.cameraAngle?.split(',')[2]?.trim() || 'tracking',
      },
      visual: {
        lighting: 'cinematic rim light',
        color_palette: 'teal and warm gray',
        composition: 'layered foreground background',
      },
      narration: shot.sceneText,
      image_prompt: shot.imagePrompt,
      negative_prompt: 'blur, distortion',
    }));
    task.result.meta.shot_count = task.shots.length;
    task.updatedAt = nowIso();
    sendJson(res, 200, task.result);
    return true;
  }

  const updateShotMatch = pathname.match(/^\/api\/tasks\/shots\/([^/]+)$/);
  if (updateShotMatch && req.method === 'PATCH') {
    const body = await readJsonBody(req);
    const shotId = updateShotMatch[1];
    const task = Array.from(tasks.values()).find((item) => item.userId === user.id && item.shots.some((shot) => shot.id === shotId));
    if (!task) {
      sendJson(res, 404, { message: 'Shot not found' });
      return true;
    }
    const shot = task.shots.find((item) => item.id === shotId);
    Object.assign(shot, body);
    task.updatedAt = nowIso();
    sendJson(res, 200, shot);
    return true;
  }

  const regenerateImageMatch = pathname.match(/^\/api\/tasks\/shots\/([^/]+)\/regenerate-image$/);
  if (regenerateImageMatch && req.method === 'POST') {
    const shotId = regenerateImageMatch[1];
    const task = Array.from(tasks.values()).find((item) => item.userId === user.id && item.shots.some((shot) => shot.id === shotId));
    if (!task) {
      sendJson(res, 404, { message: 'Shot not found' });
      return true;
    }
    const shot = task.shots.find((item) => item.id === shotId);
    shot.imageUrl = `https://picsum.photos/seed/${shotId}-${Date.now()}/900/600`;
    shot.status = 'image_done';
    task.updatedAt = nowIso();
    sendJson(res, 200, { imageUrl: shot.imageUrl });
    return true;
  }

  const regenerateTaskImagesMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/images\/regenerate$/);
  if (regenerateTaskImagesMatch && req.method === 'POST') {
    const task = tasks.get(regenerateTaskImagesMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    let successCount = 0;
    let failedCount = 0;
    for (const shot of task.shots) {
      if (!shot.imagePrompt) {
        shot.status = 'image_failed';
        failedCount++;
        continue;
      }
      shot.imageUrl = `https://picsum.photos/seed/${shot.id}-${Date.now()}-${successCount}/900/600`;
      shot.status = 'image_done';
      successCount++;
    }
    task.updatedAt = nowIso();
    sendJson(res, 200, {
      total: task.shots.length,
      successCount,
      failedCount,
    });
    return true;
  }

  const regenerateTaskAudioMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/audio\/regenerate$/);
  if (regenerateTaskAudioMatch && req.method === 'POST') {
    const task = tasks.get(regenerateTaskAudioMatch[1]);
    if (!task || task.userId !== user.id) {
      sendJson(res, 404, { message: 'Task not found' });
      return true;
    }
    let successCount = 0;
    let failedCount = 0;
    for (const shot of task.shots) {
      if (!shot.sceneText) {
        shot.status = 'tts_failed';
        failedCount++;
        continue;
      }
      shot.audioUrl = audioSamples[Math.floor(Math.random() * audioSamples.length)];
      shot.status = 'tts_done';
      successCount++;
    }
    task.updatedAt = nowIso();
    sendJson(res, 200, {
      total: task.shots.length,
      successCount,
      failedCount,
    });
    return true;
  }

  const regenerateAudioMatch = pathname.match(/^\/api\/tasks\/shots\/([^/]+)\/regenerate-audio$/);
  if (regenerateAudioMatch && req.method === 'POST') {
    const shotId = regenerateAudioMatch[1];
    const task = Array.from(tasks.values()).find((item) => item.userId === user.id && item.shots.some((shot) => shot.id === shotId));
    if (!task) {
      sendJson(res, 404, { message: 'Shot not found' });
      return true;
    }
    const shot = task.shots.find((item) => item.id === shotId);
    shot.audioUrl = audioSamples[Math.floor(Math.random() * audioSamples.length)];
    shot.status = 'tts_done';
    task.updatedAt = nowIso();
    sendJson(res, 200, { audioUrl: shot.audioUrl });
    return true;
  }

  sendJson(res, 404, { message: 'Not found' });
  return true;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function proxyApi(req, res) {
  const url = new URL(req.url || '/', apiBase);
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
      },
      body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
    });

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    });
    res.end(responseBody);
  } catch (error) {
    sendJson(res, 502, {
      error: 'upstream_unreachable',
      message: error instanceof Error ? error.message : 'API proxy failed',
    });
  }
}

async function serveStatic(req, res) {
  const requestPath = req.url?.split('?')[0] || '/';
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
  let filePath = path.join(distDir, normalizedPath);

  if (!filePath.startsWith(distDir)) {
    sendJson(res, 403, { error: 'forbidden' });
    return;
  }

  if (!existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  if (filePath.endsWith('index.html')) {
    const html = await readFile(filePath, 'utf8');
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(html);
    return;
  }

  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'missing_url' });
    return;
  }

  if (req.url.startsWith('/api/')) {
    if (useMockApi) {
      await handleMockApi(req, res);
      return;
    }
    await proxyApi(req, res);
    return;
  }

  await serveStatic(req, res);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`StoryJump preview server listening on http://127.0.0.1:${port}`);
  console.log(`Proxying /api -> ${apiBase}`);
  console.log(`Mock API: ${useMockApi ? 'enabled' : 'disabled'}`);
});
