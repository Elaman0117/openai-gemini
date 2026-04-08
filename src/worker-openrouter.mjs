const FORCED_TEMPERATURE = 0;
const FORCED_REASONING_EFFORT = "high";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    try {
      const { pathname } = new URL(request.url);
      if (!pathname.endsWith("/chat/completions")) {
        return new Response("404 Not Found", fixCors({ status: 404 }));
      }
      if (request.method !== "POST") {
        return new Response(
          "The specified HTTP method is not allowed for the requested resource",
          fixCors({ status: 405 }),
        );
      }

      const req = await request.json();
      req.temperature = FORCED_TEMPERATURE;
      req.reasoning_effort = FORCED_REASONING_EFFORT;

      const headers = new Headers(request.headers);
      headers.set("Content-Type", "application/json");
      headers.delete("Content-Length");
      headers.delete("Host");

      if (!env.OPENROUTER_API_KEY) {
        return new Response("Missing OPENROUTER_API_KEY", fixCors({ status: 500 }));
      }
      headers.set("Authorization", `Bearer ${env.OPENROUTER_API_KEY}`);

      if (env.OPENROUTER_HTTP_REFERER && !headers.get("HTTP-Referer")) {
        headers.set("HTTP-Referer", env.OPENROUTER_HTTP_REFERER);
      }
      if (env.OPENROUTER_X_TITLE && !headers.get("X-Title")) {
        headers.set("X-Title", env.OPENROUTER_X_TITLE);
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(req),
      });

      return new Response(response.body, fixCors(response));
    } catch (err) {
      console.error(err);
      return new Response(err.message || "Internal Server Error", fixCors({ status: 500 }));
    }
  },
};

const fixCors = ({ headers, status, statusText }) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "*");
  responseHeaders.set("Access-Control-Allow-Headers", "*");
  return { headers: responseHeaders, status, statusText };
};

const handleOptions = () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
};
