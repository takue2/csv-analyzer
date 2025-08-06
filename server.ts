import index from "./index.html";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
  },
});

console.log(`CSV Analyzer running at http://localhost:${server.port}`);