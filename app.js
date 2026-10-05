// Single-file Todo app: HTTP server + JSON API + UI
// No dependencies

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4000;

const DATA_FILE =
  process.env.DATA_FILE || path.join(__dirname, "data", "todos.json");

// Create data directory
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

// Default 10 todos
const initialTodos = [
  {
    id: 1,
    title: "Learn React",
    done: false,
  },
  {
    id: 2,
    title: "Learn Node.js",
    done: false,
  },
  {
    id: 3,
    title: "Learn Docker",
    done: true,
  },
  {
    id: 4,
    title: "Setup Jenkins",
    done: false,
  },
  {
    id: 5,
    title: "Create CI/CD Pipeline",
    done: false,
  },
  {
    id: 6,
    title: "Practice JavaScript",
    done: true,
  },
  {
    id: 7,
    title: "Build Todo App",
    done: false,
  },
  {
    id: 8,
    title: "Deploy Docker Container",
    done: false,
  },
  {
    id: 9,
    title: "Test API",
    done: true,
  },
  {
    id: 10,
    title: "Push Code to GitHub",
    done: false,
  },
];

// Load todos from JSON file
const load = () => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    save(initialTodos);
    return initialTodos;
  } catch {
    save(initialTodos);
    return initialTodos;
  }
};

// Save todos
const save = (todos) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
};

// HTML UI
const PAGE = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <title>Todo App</title>

  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 480px;
      margin: 40px auto;
      padding: 0 16px;
    }

    form {
      display: flex;
      gap: 8px;
    }

    input[type="text"] {
      flex: 1;
      padding: 8px;
    }

    button {
      cursor: pointer;
      padding: 6px 10px;
    }

    li {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 6px 0;
    }

    li.done span {
      text-decoration: line-through;
      color: #888;
    }

    li span {
      flex: 1;
    }

    ul {
      list-style: none;
      padding: 0;
    }
  </style>
</head>

<body>

  <h1>Todo</h1>

  <form id="f">
    <input
      id="t"
      type="text"
      placeholder="What needs doing?"
      required
    >
    <button>Add</button>
  </form>

  <ul id="list"></ul>

  <script>

    const list = document.getElementById("list");

    const api = (method, url, body) => {
      return fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      }).then(response => response.json());
    };

    async function render() {

      const todos = await api("GET", "/api/todos");

      list.innerHTML = "";

      for (const t of todos) {

        const li = document.createElement("li");

        if (t.done) {
          li.className = "done";
        }

        const cb = Object.assign(
          document.createElement("input"),
          {
            type: "checkbox",
            checked: t.done
          }
        );

        cb.onchange = () => {
          api(
            "PATCH",
            "/api/todos/" + t.id,
            {
              done: cb.checked
            }
          ).then(render);
        };

        const sp = document.createElement("span");

        sp.textContent = t.title;

        const del = document.createElement("button");

        del.textContent = "x";

        del.onclick = () => {
          api(
            "DELETE",
            "/api/todos/" + t.id
          ).then(render);
        };

        li.append(cb, sp, del);

        list.append(li);
      }
    }

    document.getElementById("f").onsubmit = async (e) => {

      e.preventDefault();

      const input = document.getElementById("t");

      await api(
        "POST",
        "/api/todos",
        {
          title: input.value
        }
      );

      input.value = "";

      render();
    };

    render();

  </script>

</body>
</html>`;

// Read request body
const readBody = (req) => {
  return new Promise((resolve) => {

    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {

      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }

    });

  });
};

// Send response
const send = (
  res,
  code,
  body,
  type = "application/json"
) => {

  res.writeHead(code, {
    "Content-Type": type
  });

  res.end(
    type === "application/json"
      ? JSON.stringify(body)
      : body
  );
};

// HTTP server
const server = http.createServer(async (req, res) => {

  const url = new URL(
    req.url,
    "http://localhost"
  );

  // API route
  const match = url.pathname.match(
    /^\/api\/todos(?:\/(\d+))?$/
  );

  // Home page
  if (url.pathname === "/") {
    return send(
      res,
      200,
      PAGE,
      "text/html"
    );
  }

  // Health check
  if (url.pathname === "/health") {
    return send(
      res,
      200,
      {
        status: "server is running properly"
      }
    );
  }

  // Invalid route
  if (!match) {
    return send(
      res,
      404,
      {
        error: "not found"
      }
    );
  }

  const todos = load();

  const id = match[1]
    ? Number(match[1])
    : null;

  // GET /api/todos
  if (
    req.method === "GET" &&
    id === null
  ) {

    return send(
      res,
      200,
      todos
    );
  }

  // POST /api/todos
  if (
    req.method === "POST" &&
    id === null
  ) {

    const { title } = await readBody(req);

    if (
      !title ||
      !String(title).trim()
    ) {

      return send(
        res,
        400,
        {
          error: "title required"
        }
      );
    }

    const todo = {
      id: Date.now(),
      title: String(title).trim(),
      done: false
    };

    todos.push(todo);

    save(todos);

    return send(
      res,
      201,
      todo
    );
  }

  // Find todo
  const todo = todos.find(
    (item) => item.id === id
  );

  if (!todo) {

    return send(
      res,
      404,
      {
        error: "not found"
      }
    );
  }

  // PATCH /api/todos/:id
  if (req.method === "PATCH") {

    const {
      title,
      done
    } = await readBody(req);

    if (typeof title === "string") {
      todo.title = title;
    }

    if (typeof done === "boolean") {
      todo.done = done;
    }

    save(todos);

    return send(
      res,
      200,
      todo
    );
  }

  // DELETE /api/todos/:id
  if (req.method === "DELETE") {

    const updatedTodos = todos.filter(
      (item) => item.id !== id
    );

    save(updatedTodos);

    return send(
      res,
      200,
      {
        deleted: id
      }
    );
  }

  // Unsupported method
  return send(
    res,
    405,
    {
      error: "method not allowed"
    }
  );
});

// Start server
server.listen(PORT, () => {

  console.log(
    `Todo app listening on http://localhost:${PORT}`
  );

});