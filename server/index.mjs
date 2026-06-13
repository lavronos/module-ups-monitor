export async function handleRequest(request, context) {
  if (context.path !== "status") {
    return Response.json({ ok: false, error: { message: "UPS module route not found." } }, { status: 404 });
  }

  return fetch(new URL("/api/synology/ups", request.url), {
    method: request.method,
    headers: request.headers,
    redirect: "manual"
  });
}
