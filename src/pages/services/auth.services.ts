const baseUrl = "http://localhost:5001/api/auth";

export const AuthService = {
  // REGISTER
  register: async (user: any) => {
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    return res.json();
  },

  // LOGIN
  login: async (user: any) => {
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    return res.json();
  },
};