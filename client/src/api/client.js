async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const apiGet = (path) => request('GET', path);
export const apiPost = (path, body) => request('POST', path, body ?? {});
export const apiPatch = (path, body) => request('PATCH', path, body ?? {});
export const apiPut = (path, body) => request('PUT', path, body ?? {});
export const apiDelete = (path) => request('DELETE', path);
