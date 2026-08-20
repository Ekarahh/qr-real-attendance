// api.js
// Small helpers so every page does not repeat the same fetch code.

// GET something from the server and give back the JSON.
export async function getJson(url) {
  const res = await fetch(url);

  // If the login cookie has expired the server says 401. Send the teacher back
  // to the login page instead of showing a broken screen.
  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }

  return res.json();
}

// POST some JSON and give back the JSON that comes out.
export async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });

  if (res.status === 401 && !url.includes('/api/login')) {
    window.location.href = '/login';
    return null;
  }

  return res.json();
}

// Turn a date from the database into something a person can read.
export function readableDate(text) {
  return new Date(text).toLocaleString();
}

export function readableTime(text) {
  return new Date(text).toLocaleTimeString();
}
