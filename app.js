// Single-file Todo app: Express server + JSON API + UI
const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4000;
const DATA_FILE =
  process.env.DATA_FILE || path.join(__dirname, "data", "todos.json");

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

const load = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
};
const save = (todos) => fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Todo</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;padding:0 16px}
  form{display:flex;gap:8px}input[type=text]{flex:1;padding:8px}
  li{display:flex;gap:8px;align-items:center;padding:6px 0}
  li.done span{text-decoration:line-through;color:#888}
  li span{flex:1}ul{list-style:none;padding:0}
</style></head>
<body>
<h1>Todo</h1>
<form id="f"><input id="t" type="text" placeholder="What needs doing?" required><button>Add</button></form>
<ul id="list"></ul>
<script>
const list = document.getElementById("list");
const api = (m, u, b) => fetch(u, {method:m, headers:{"Content-Type":"application/json"}, body: b && JSON.stringify(b)}).then(r => r.json());
async function render() {
  const todos = await api("GET", "/api/todos");
  list.innerHTML = "";
  for (const t of todos) {
    const li = document.createElement("li");
    if (t.done) li.className = "done";
    const cb = Object.assign(document.createElement("input"), {type:"checkbox", checked:t.done});
    cb.onchange = () => api("PATCH", "/api/todos/" + t.id, {done: cb.checked}).then(render);
    const sp = document.createElement("span"); sp.textContent = t.title;
    const del = document.createElement("button"); del.textContent = "x";
    del.onclick = () => api("DELETE", "/api/todos/" + t.id).then(render);
    li.append(cb, sp, del); list.append(li);
  }
}
document.getElementById("f").onsubmit = async (e) => {
  e.preventDefault();
  const i = document.getElementById("t");
  await api("POST", "/api/todos", {title: i.value}); i.value = ""; render();
};
render();
</script></body></html>`;

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.type("html").send(PAGE));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/todos", (req, res) => res.json(load()));

app.post("/api/todos", (req, res) => {
  const title = String(req.body.title || "").trim();
  if (!title) return res.status(400).json({ error: "title required" });
  const todos = load();
  const todo = { id: Date.now(), title, done: false };
  todos.push(todo);
  save(todos);
  res.status(201).json(todo);
});

app.patch("/api/todos/:id", (req, res) => {
  const todos = load();
  const todo = todos.find((t) => t.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ error: "not found" });
  if (typeof req.body.title === "string") todo.title = req.body.title;
  if (typeof req.body.done === "boolean") todo.done = req.body.done;
  save(todos);
  res.json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  save(load().filter((t) => t.id !== id));
  res.json({ deleted: id });
});

app.listen(PORT, () => console.log(`Todo app listening on http://localhost:${PORT}`));
