const BASE_URL = 'https://knot-backend.onrender.com/api';

function getToken() { return localStorage.getItem('token'); }

async function request(method, path, body = null) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.response = { status: res.status, data };
    throw err;
  }
  return { data };
}

const get   = p      => request('GET',    p);
const post  = (p, b) => request('POST',   p, b);
const patch = (p, b) => request('PATCH',  p, b);
const del   = (p, b) => request('DELETE', p, b);

export const authAPI = {
  register:      d            => post('/auth/register', d),
  login:         d            => post('/auth/login', d),
  me:            ()           => get('/auth/me'),
  forgotPassword: id          => post('/auth/forgot-password', { identifier: id }),
  resetPassword: (id, code, pw) => post('/auth/reset-password', { identifier: id, code, newPassword: pw }),
};
export const usersAPI = {
  search:       q     => get(`/users/search?q=${encodeURIComponent(q)}`),
  updateAvatar: color => patch('/users/me/avatar', { avatarColor: color }),
};
export const friendsAPI = {
  list:        ()   => get('/friends'),
  requests:    ()   => get('/friends/pending'),
  search:      q    => get(`/users/search?q=${encodeURIComponent(q)}`),
  sendRequest: id   => post('/friends/request', { addresseeId: id }),
  accept:      id   => patch(`/friends/${id}/accept`),
  remove:      id   => del(`/friends/${id}`),
};
export const groupsAPI = {
  list:     ()         => get('/groups'),
  get:      id         => get(`/groups/${id}`),
  create:   d          => post('/groups', d),
  invite:   (gid, uid) => post(`/groups/${gid}/invite`, { userId: uid }),
  leave:    gid        => del(`/groups/${gid}/leave`),
  activity: gid        => get(`/groups/${gid}/activity`),
};
export const challengesAPI = {
  forGroup:  gid             => get(`/challenges/group/${gid}`),
  create:    d               => post('/challenges', d),
  log:       (id, grams)     => post(`/challenges/${id}/log`, { grams }),
  logWater:  (id, ml)        => post(`/challenges/${id}/log-water`, { ml }),
  addPoint:  (id, uid, note) => post(`/challenges/${id}/add-point`, { targetUserId: uid, note }),
  editScore: (id, uid, score)=> patch(`/challenges/${id}/score`, { userId: uid, score }),
  reset:     id              => post(`/challenges/${id}/reset`),
  delete:    id              => del(`/challenges/${id}`),
};
export const listsAPI = {
  forGroup:   gid              => get(`/lists/group/${gid}`),
  get:        id               => get(`/lists/${id}`),
  create:     d                => post('/lists', d),
  addItem:    (lid, c)         => post(`/lists/${lid}/items`, { content: c }),
  toggleItem: (lid, iid, done) => patch(`/lists/${lid}/items/${iid}`, { isDone: done }),
  deleteItem: (lid, iid)       => del(`/lists/${lid}/items/${iid}`),
};
