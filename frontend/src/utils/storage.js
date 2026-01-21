const USER_KEY = 'timetable_user';
const USERS_KEY = 'timetable_users';

// 현재 로그인된 유저 저장, 불러오기 및 전체 유저 목록 관리

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // 모든 사용자 목록에도 저장
  const users = getAllUsers();
  const existingIndex = users.findIndex((u) => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  return JSON.parse(userStr);
}

export function getAllUsers() {
  const usersStr = localStorage.getItem(USERS_KEY);
  if (!usersStr) return [];
  return JSON.parse(usersStr);
}

export function findUserByEmail(email) {
  const users = getAllUsers();
  return users.find((u) => u.email === email) || null;
}

export function logout() {
  localStorage.removeItem(USER_KEY);
}
