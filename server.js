const PORT = process.env.PORT || 3000;

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(`.${path}`);
    return file.exists().then((exists) =>
      exists ? new Response(file) : new Response("Not found", { status: 404 })
    );
  },
});

console.log(`Flip rodando em http://localhost:${PORT}`);
