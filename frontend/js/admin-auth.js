/**
 * Safar— Hardened Admin Authentication & Security Client Module
 * Production Security: Pure Server-Side Authentication via 15m JWT Access Tokens & 7d HttpOnly Refresh Cookies.
 * Eliminates all client-side authentication logic and browser password hashing.
 */

class AdminAuthService {
  constructor() {
    this.currentUser = null;
    this.accessToken = null;
    this.csrfToken = null;
    this.refreshTimer = null;
    this.initSession();
  }

  async initSession() {
    try {
      // First fetch fresh CSRF token
      await this.fetchCsrfToken();
      // Try background token refresh via HttpOnly cookie
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        await this.checkSession();
      }
    } catch (e) {
      console.warn("[AdminAuth] Session init warning:", e);
    }
  }

  async fetchCsrfToken() {
    try {
      const res = await fetch("/api/v1/auth/csrf-token", {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.csrfToken) {
          this.csrfToken = json.data.csrfToken;
          const metaTag = document.querySelector('meta[name="csrf-token"]');
          if (metaTag) metaTag.setAttribute('content', this.csrfToken);
        }
      }
    } catch (e) { }
  }

  async checkSession() {
    try {
      const headers = { "Accept": "application/json" };
      if (this.accessToken) {
        headers["Authorization"] = `Bearer ${this.accessToken}`;
      }
      const res = await fetch("/api/v1/auth/session", { method: "GET", headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          this.currentUser = json.data.user;
          this.csrfToken = json.data.csrfToken || this.csrfToken;
          this.updateUiRoleIndicator();
          return true;
        }
      }
    } catch (e) { }
    this.currentUser = null;
    return false;
  }

  async refreshToken() {
    try {
      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "X-CSRF-Token": this.csrfToken || ""
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.accessToken) {
          this.accessToken = json.data.accessToken;
          this.currentUser = json.data.user;
          this.updateUiRoleIndicator();
          this.scheduleTokenRefresh(json.data.expiresInSeconds || 900);
          return true;
        }
      }
    } catch (e) { }
    return false;
  }

  scheduleTokenRefresh(expiresInSeconds) {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    // Refresh 1 minute before expiration (840 seconds for 900s token)
    const refreshMs = Math.max((expiresInSeconds - 60) * 1000, 10000);
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshMs);
  }

  updateUiRoleIndicator() {
    const roleBadge = document.getElementById("adminUserRoleBadge");
    if (roleBadge && this.currentUser) {
      roleBadge.textContent = `${this.currentUser.username} (${this.currentUser.role})`;
      roleBadge.style.display = "inline-flex";
    }
  }

  async login(username, password) {
    const u = (username || "").trim();
    const p = (password || "").trim();

    if (!u || !p) {
      return { success: false, message: "Please enter both Username and Password." };
    }

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-Token": this.csrfToken || ""
        },
        body: JSON.stringify({ username: u, password: p })
      });

      const json = await res.json();

      if (res.ok && json.success) {
        this.currentUser = json.data.user;
        this.accessToken = json.data.accessToken;
        this.csrfToken = json.data.csrfToken || this.csrfToken;
        this.updateUiRoleIndicator();
        this.scheduleTokenRefresh(json.data.expiresInSeconds || 900);
        return { success: true, user: this.currentUser };
      } else {
        const msg = json.error ? `${json.error.message}` : "Authentication failed.";
        return { success: false, message: msg };
      }
    } catch (e) {
      console.error("[AdminAuth] Login network error:", e);
      return { success: false, message: "Network connection error. Backend server unavailable." };
    }
  }

  isAuthenticated() {
    return Boolean(this.currentUser && this.accessToken);
  }

  async logout() {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.accessToken ? `Bearer ${this.accessToken}` : "",
          "X-CSRF-Token": this.csrfToken || ""
        }
      });
    } catch (e) { }

    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.currentUser = null;
    this.accessToken = null;
    this.csrfToken = null;
    location.reload();
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.accessToken ? `Bearer ${this.accessToken}` : "",
          "X-CSRF-Token": this.csrfToken || ""
        },
        body: JSON.stringify({
          currentPassword: currentPassword ? currentPassword.trim() : "",
          newPassword: newPassword ? newPassword.trim() : ""
        })
      });

      const json = await res.json();

      if (res.ok && json.success) {
        return { success: true, message: json.data.message };
      } else {
        const msg = json.error ? `${json.error.message}` : "Password update rejected.";
        return { success: false, message: msg };
      }
    } catch (e) {
      return { success: false, message: "Server connection failed during password update." };
    }
  }

  renderAuthModal(onSuccessCallback) {
    if (this.isAuthenticated()) {
      if (onSuccessCallback) onSuccessCallback();
      return;
    }

    let overlay = document.getElementById("adminAuthModalOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "adminAuthModalOverlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(11, 15, 25, 0.94);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: 'Inter', sans-serif;
      `;

      overlay.innerHTML = `
        <div style="
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          color: #f8fafc;
        ">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="
              width: 56px; height: 56px; background: linear-gradient(135deg, #059669, #3b82f6);
              border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;
              font-size: 28px; margin-bottom: 12px;
            ">🛡️</div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #f8fafc;">Admin Authentication</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Enter administrator credentials to access dashboard</p>
          </div>

          <form id="adminLoginForm">
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">Username / Phone</label>
              <input type="text" id="authUsername" required style="
                width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #334155;
                background: #0f172a; color: #fff; font-size: 14px; box-sizing: border-box; outline: none;
              " placeholder="Administrator Username">
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">Password</label>
              <input type="password" id="authPassword" required style="
                width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #334155;
                background: #0f172a; color: #fff; font-size: 14px; box-sizing: border-box; outline: none;
              " placeholder="••••••••">
            </div>

            <div id="authErrorMsg" style="display: none; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; text-align: center;"></div>

            <button type="submit" style="
              width: 100%; padding: 14px; border: none; border-radius: 8px;
              background: linear-gradient(135deg, #10b981, #059669); color: white;
              font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s;
            ">
              🔐 Authenticate Session
            </button>
          </form>
        </div>
      `;

      document.body.appendChild(overlay);

      const form = document.getElementById("adminLoginForm");
      if (form) {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          this.handleFormSubmit();
        });
      }
    } else {
      overlay.style.display = "flex";
    }

    this.onSuccessCallback = onSuccessCallback;
  }

  async handleFormSubmit() {
    const userEl = document.getElementById("authUsername");
    const passEl = document.getElementById("authPassword");
    const errEl = document.getElementById("authErrorMsg");

    if (!userEl || !passEl) return;

    const username = userEl.value;
    const password = passEl.value;

    const res = await this.login(username, password);

    if (res.success) {
      const overlay = document.getElementById("adminAuthModalOverlay");
      if (overlay) overlay.style.display = "none";
      if (this.onSuccessCallback) this.onSuccessCallback();
    } else {
      if (errEl) {
        errEl.innerText = res.message;
        errEl.style.display = "block";
      }
    }
  }
}

window.adminAuthService = new AdminAuthService();
