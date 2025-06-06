export function cors(response: Response) {
  const requestOrigin = '*';  // In production, you might want to validate against a list of allowed origins

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', requestOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
} 