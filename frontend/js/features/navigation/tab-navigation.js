/**
 * SAFAR — Decoupled 4-Tab Navigation Module
 */

import { store } from '../../core/state.js';
import { triggerHaptic } from '../../core/haptics.js';

export function switchTab(tabName, updateUrl = true) {
  triggerHaptic(25);
  const tabs = {
    commuter: document.getElementById("tabCommuter"),
    driver: document.getElementById("tabDriver"),
    ai: document.getElementById("tabAi"),
    mindmap: document.getElementById("tabMindmap")
  };

  const views = {
    commuter: document.getElementById("viewCommuter"),
    driver: document.getElementById("viewDriver"),
    ai: document.getElementById("viewAi"),
    mindmap: document.getElementById("viewMindmap")
  };

  Object.keys(tabs).forEach(key => {
    const tab = tabs[key];
    if (tab) {
      const isSelected = key === tabName;
      tab.setAttribute("aria-selected", isSelected ? "true" : "false");
      tab.setAttribute("tabindex", isSelected ? "0" : "-1");
      if (isSelected) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    }
  });

  const masterNavCommuter = document.getElementById("masterNavCommuter");
  const masterNavDriver = document.getElementById("masterNavDriver");
  if (masterNavCommuter && masterNavDriver) {
    if (tabName === "driver") {
      masterNavDriver.classList.add("active-portal");
      masterNavCommuter.classList.remove("active-portal");
    } else {
      masterNavCommuter.classList.add("active-portal");
      masterNavDriver.classList.remove("active-portal");
    }
  }

  if (updateUrl && typeof window !== "undefined" && window.history && window.history.pushState) {
    const targetPath = tabName === "driver" ? "/driver" : "/commuter";
    if (window.location.pathname !== targetPath && (window.location.pathname === "/commuter" || window.location.pathname === "/driver" || window.location.pathname === "/" || window.location.pathname === "/index.html")) {
      window.history.pushState({ tab: tabName }, "", targetPath);
    }
  }

  Object.keys(views).forEach(key => {
    const view = views[key];
    if (view) {
      const isActive = key === tabName;
      if (isActive) {
        view.classList.remove("hidden");
        view.setAttribute("aria-hidden", "false");
      } else {
        view.classList.add("hidden");
        view.setAttribute("aria-hidden", "true");
      }
    }
  });

  // Publish tab update to StateStore so subscribers (map, AI, mindmap) handle view activation cleanly
  store.setState('navigation', { activeTab: tabName });
}

export function initTabNavigation() {
  const tabCommuter = document.getElementById("tabCommuter");
  if (tabCommuter) tabCommuter.addEventListener("click", () => switchTab("commuter"));

  const tabDriver = document.getElementById("tabDriver");
  if (tabDriver) tabDriver.addEventListener("click", () => switchTab("driver"));

  const tabAi = document.getElementById("tabAi");
  if (tabAi) tabAi.addEventListener("click", () => switchTab("ai"));

  const tabMindmap = document.getElementById("tabMindmap");
  if (tabMindmap) tabMindmap.addEventListener("click", () => switchTab("mindmap"));

  const masterNavCommuter = document.getElementById("masterNavCommuter");
  if (masterNavCommuter) {
    masterNavCommuter.addEventListener("click", e => {
      e.preventDefault();
      switchTab("commuter");
    });
  }

  const masterNavDriver = document.getElementById("masterNavDriver");
  if (masterNavDriver) {
    masterNavDriver.addEventListener("click", e => {
      e.preventDefault();
      switchTab("driver");
    });
  }

  window.addEventListener("popstate", () => {
    const path = window.location.pathname;
    if (path === "/driver") {
      switchTab("driver", false);
    } else if (path === "/commuter" || path === "/" || path === "/index.html") {
      switchTab("commuter", false);
    }
  });

  const bottomNav = document.querySelector(".bottom-nav");
  if (bottomNav) {
    const tabOrder = ["tabCommuter", "tabDriver", "tabAi", "tabMindmap"];
    const tabNames = ["commuter", "driver", "ai", "mindmap"];
    bottomNav.addEventListener("keydown", e => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const active = document.activeElement;
      const currentIdx = tabOrder.indexOf(active?.id);
      if (currentIdx === -1) return;
      const nextIdx = e.key === "ArrowRight"
        ? (currentIdx + 1) % tabOrder.length
        : (currentIdx - 1 + tabOrder.length) % tabOrder.length;
      switchTab(tabNames[nextIdx]);
      const nextBtn = document.getElementById(tabOrder[nextIdx]);
      if (nextBtn) nextBtn.focus();
    });
  }
}
