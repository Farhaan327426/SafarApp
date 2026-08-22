/**
 * SAFAR — Accessible Mind Map Blueprint Engine Module
 */

import { store } from '../../core/state.js';
import { triggerHaptic } from '../../core/haptics.js';
import { showToast } from '../../core/toast.js';
import { switchTab } from '../navigation/tab-navigation.js';

let searchDebounceTimer = null;

export function renderMindMap() {
  const treeContainer = document.getElementById("mindmapTree");
  const svgLayer = document.getElementById("mindmapSvg");
  const canvas = document.getElementById("mindmapCanvas");
  const viewport = document.querySelector(".mindmap-viewport");
  if (!treeContainer || !svgLayer || !canvas) return;

  const mindmapState = store.getState('mindmap');
  const mindmapData = mindmapState.data;
  if (!mindmapData) return;

  const savedScrollTop = viewport ? viewport.scrollTop : 0;
  const savedScrollLeft = viewport ? viewport.scrollLeft : 0;
  const savedFocusId = mindmapState.focusedNodeId;

  treeContainer.textContent = "";
  svgLayer.textContent = "";

  const filter = mindmapState.searchFilter.toLowerCase().trim();

  // 1. Root Node
  const rootBox = document.createElement("div");
  rootBox.id = "node-root";
  rootBox.className = "mindmap-node mindmap-root-box";
  rootBox.setAttribute("role", "treeitem");
  rootBox.setAttribute("aria-level", "1");
  rootBox.setAttribute("aria-expanded", "true");
  rootBox.setAttribute("tabindex", mindmapState.focusedNodeId === "node-root" ? "0" : "-1");
  rootBox.textContent = mindmapData.title;

  if (mindmapState.selectedNodeId === "root") {
    rootBox.classList.add("selected");
  }

  rootBox.addEventListener("click", () => selectMindmapNode(mindmapData, "node-root"));
  treeContainer.appendChild(rootBox);

  // 2. Pillars Column
  const branchesCol = document.createElement("div");
  branchesCol.className = "mindmap-branches-column";
  branchesCol.setAttribute("role", "group");

  if (mindmapData.children) {
    mindmapData.children.forEach(pillar => {
      const pillarMatches = !filter || pillar.title.toLowerCase().includes(filter) || pillar.description.toLowerCase().includes(filter);
      const matchingChildren = (pillar.children || []).filter(c => !filter || c.title.toLowerCase().includes(filter) || c.description.toLowerCase().includes(filter));

      if (!pillarMatches && matchingChildren.length === 0) return;

      const branchGroup = document.createElement("div");
      branchGroup.className = "mindmap-branch-group";

      const pillarId = `node-${pillar.id}`;
      const pillarBox = document.createElement("div");
      pillarBox.id = pillarId;
      pillarBox.className = "mindmap-node mindmap-pillar-box";
      pillarBox.setAttribute("role", "treeitem");
      pillarBox.setAttribute("aria-level", "2");

      const isExpanded = mindmapState.expandedNodes.has(pillar.id) || (filter && matchingChildren.length > 0);
      pillarBox.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      pillarBox.setAttribute("tabindex", mindmapState.focusedNodeId === pillarId ? "0" : "-1");

      if (mindmapState.selectedNodeId === pillar.id) {
        pillarBox.classList.add("selected");
      }

      const titleSpan = document.createElement("span");
      titleSpan.textContent = pillar.title;
      pillarBox.appendChild(titleSpan);

      const toggleBadge = document.createElement("div");
      toggleBadge.className = "mindmap-toggle-badge";
      if (isExpanded) toggleBadge.classList.add("expanded");
      toggleBadge.textContent = ">";
      toggleBadge.setAttribute("aria-hidden", "true");

      toggleBadge.addEventListener("click", e => {
        e.stopPropagation();
        triggerHaptic(30);
        toggleMindmapPillar(pillar.id);
      });

      pillarBox.appendChild(toggleBadge);
      pillarBox.addEventListener("click", () => selectMindmapNode(pillar, pillarId));
      branchGroup.appendChild(pillarBox);

      // Children Sub-Nodes Column
      const childrenCol = document.createElement("div");
      childrenCol.className = "mindmap-children-column";
      childrenCol.setAttribute("role", "group");
      if (!isExpanded) {
        childrenCol.classList.add("collapsed");
      }

      const childrenToRender = filter ? matchingChildren : (pillar.children || []);
      childrenToRender.forEach(child => {
        const childId = `node-${child.id}`;
        const childBox = document.createElement("div");
        childBox.id = childId;
        childBox.className = "mindmap-node mindmap-child-box";
        childBox.setAttribute("role", "treeitem");
        childBox.setAttribute("aria-level", "3");
        childBox.setAttribute("tabindex", mindmapState.focusedNodeId === childId ? "0" : "-1");

        if (mindmapState.selectedNodeId === child.id) {
          childBox.classList.add("selected");
        }

        childBox.textContent = child.title;
        childBox.addEventListener("click", e => {
          e.stopPropagation();
          selectMindmapNode(child, childId);
        });
        childrenCol.appendChild(childBox);
      });

      branchGroup.appendChild(childrenCol);
      branchesCol.appendChild(branchGroup);
    });
  }

  treeContainer.appendChild(branchesCol);

  if (viewport) {
    viewport.scrollTop = savedScrollTop;
    viewport.scrollLeft = savedScrollLeft;
  }

  const restoredNode = document.getElementById(savedFocusId);
  if (restoredNode && restoredNode.offsetParent !== null) {
    restoredNode.setAttribute("tabindex", "0");
    restoredNode.focus();
  } else {
    store.setState('mindmap', { focusedNodeId: "node-root" });
    const rootNode = document.getElementById("node-root");
    if (rootNode) rootNode.setAttribute("tabindex", "0");
  }

  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    window.requestAnimationFrame(() => {
      drawMindmapSvgConnectors();
    });
  }
}

export function drawMindmapSvgConnectors() {
  const svgLayer = document.getElementById("mindmapSvg");
  const canvas = document.getElementById("mindmapCanvas");
  const rootEl = document.getElementById("node-root");
  if (!svgLayer || !canvas || !rootEl) return;

  const mindmapState = store.getState('mindmap');
  const mindmapData = mindmapState.data;
  if (!mindmapData || !mindmapData.children) return;

  svgLayer.textContent = "";

  const canvasRect = canvas.getBoundingClientRect();
  const rootRect = rootEl.getBoundingClientRect();

  const rootX = rootRect.right - canvasRect.left;
  const rootY = rootRect.top + rootRect.height / 2 - canvasRect.top;

  mindmapData.children.forEach(pillar => {
    const pillarEl = document.getElementById(`node-${pillar.id}`);
    if (!pillarEl) return;

    const pillarRect = pillarEl.getBoundingClientRect();
    const pLeftX = pillarRect.left - canvasRect.left;
    const pLeftY = pillarRect.top + pillarRect.height / 2 - canvasRect.top;
    const pRightX = pillarRect.right - canvasRect.left;
    const pRightY = pLeftY;

    drawCubicBezier(svgLayer, rootX, rootY, pLeftX, pLeftY, "mindmap-link-line");

    const isExpanded = mindmapState.expandedNodes.has(pillar.id) || mindmapState.searchFilter;
    if (isExpanded && pillar.children) {
      pillar.children.forEach(child => {
        const childEl = document.getElementById(`node-${child.id}`);
        if (!childEl) return;
        const childRect = childEl.getBoundingClientRect();
        const cLeftX = childRect.left - canvasRect.left;
        const cLeftY = childRect.top + childRect.height / 2 - canvasRect.top;

        drawCubicBezier(svgLayer, pRightX, pRightY, cLeftX, cLeftY, "mindmap-link-line-sub");
      });
    }
  });
}

function drawCubicBezier(svg, x1, y1, x2, y2, className = "mindmap-link-line") {
  const dx = Math.abs(x2 - x1);
  const cx1 = x1 + dx * 0.45;
  const cy1 = y1;
  const cx2 = x2 - dx * 0.45;
  const cy2 = y2;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
  path.setAttribute("class", className);
  svg.appendChild(path);
}

export function toggleMindmapPillar(pillarId) {
  const mindmapState = store.getState('mindmap');
  const expanded = new Set(mindmapState.expandedNodes);
  if (expanded.has(pillarId)) {
    expanded.delete(pillarId);
  } else {
    expanded.add(pillarId);
  }
  store.setState('mindmap', { expandedNodes: expanded });
  renderMindMap();
}

export function selectMindmapNode(nodeData, elementId = null) {
  triggerHaptic(20);
  const mindmapState = store.getState('mindmap');
  store.setState('mindmap', { selectedNodeId: nodeData.id });

  if (elementId) {
    store.setState('mindmap', { focusedNodeId: elementId });
    const el = document.getElementById(elementId);
    if (el) {
      document.querySelectorAll(".mindmap-node").forEach(n => {
        n.classList.remove("selected");
        n.setAttribute("tabindex", "-1");
      });
      el.classList.add("selected");
      el.setAttribute("tabindex", "0");
      el.focus();
    }
  }

  const inspectorTitle = document.getElementById("inspectorTitle");
  const inspectorCategory = document.getElementById("inspectorCategory");
  const inspectorBody = document.getElementById("inspectorBody");
  const inspectorActionBar = document.getElementById("inspectorActionBar");

  if (inspectorTitle) inspectorTitle.textContent = nodeData.title;
  if (inspectorCategory) inspectorCategory.textContent = nodeData.category || "Blueprint Node";
  if (inspectorBody) inspectorBody.textContent = nodeData.description || "Operational specification node.";

  if (inspectorActionBar) {
    inspectorActionBar.textContent = "";
    if (nodeData.actionText && nodeData.actionTab) {
      const actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "btn-primary";
      actionBtn.textContent = `⚡ ${nodeData.actionText}`;
      actionBtn.addEventListener("click", () => executeMindmapAction(nodeData));
      inspectorActionBar.appendChild(actionBtn);
    }
  }
}

export function executeMindmapAction(nodeData) {
  try {
    if (!nodeData || !nodeData.actionTab) {
      showToast("Action is not configured for this node.", "warning");
      return;
    }

    if (nodeData.actionTab === "sos") {
      const sosBtn = document.getElementById("sosBtn");
      if (sosBtn) {
        sosBtn.click();
      } else {
        showToast("Emergency SOS is not available in this build.", "warning");
      }
    } else {
      switchTab(nodeData.actionTab);
      showToast(`Switched to ${nodeData.actionTab.toUpperCase()} view for "${nodeData.title}".`, "info");
    }
  } catch (err) {
    console.warn("Mindmap action handler error:", err);
    showToast("Unable to execute action in this build.", "warning");
  }
}

export function setMindmapZoom(newZoom) {
  triggerHaptic(20);
  const zoom = Math.max(0.6, Math.min(1.8, newZoom));
  store.setState('mindmap', { zoom });
  const canvas = document.getElementById("mindmapCanvas");
  if (canvas) {
    canvas.style.transform = `scale(${zoom})`;
  }
  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    window.requestAnimationFrame(() => {
      drawMindmapSvgConnectors();
    });
  }
}

export function handleMindmapKeyboardNav(e) {
  const visibleNodes = Array.from(document.querySelectorAll("#mindmapTree .mindmap-node")).filter(n => n.offsetParent !== null);
  if (visibleNodes.length === 0) return;

  const mindmapState = store.getState('mindmap');
  const currentFocused = document.activeElement && document.activeElement.classList.contains("mindmap-node")
    ? document.activeElement
    : document.getElementById(mindmapState.focusedNodeId) || visibleNodes[0];

  const currentIndex = visibleNodes.indexOf(currentFocused);

  switch (e.key) {
    case "ArrowDown": {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % visibleNodes.length;
      focusAndSelectNode(visibleNodes[nextIndex]);
      break;
    }
    case "ArrowUp": {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + visibleNodes.length) % visibleNodes.length;
      focusAndSelectNode(visibleNodes[prevIndex]);
      break;
    }
    case "ArrowRight": {
      e.preventDefault();
      if (currentFocused.classList.contains("mindmap-pillar-box")) {
        const pillarId = currentFocused.id.replace("node-", "");
        if (!mindmapState.expandedNodes.has(pillarId)) {
          toggleMindmapPillar(pillarId);
        } else if (currentIndex + 1 < visibleNodes.length) {
          focusAndSelectNode(visibleNodes[currentIndex + 1]);
        }
      }
      break;
    }
    case "ArrowLeft": {
      e.preventDefault();
      if (currentFocused.classList.contains("mindmap-pillar-box")) {
        const pillarId = currentFocused.id.replace("node-", "");
        if (mindmapState.expandedNodes.has(pillarId)) {
          toggleMindmapPillar(pillarId);
        } else {
          const rootEl = document.getElementById("node-root");
          if (rootEl) focusAndSelectNode(rootEl);
        }
      } else if (currentFocused.classList.contains("mindmap-child-box")) {
        const parentGroup = currentFocused.closest(".mindmap-branch-group");
        if (parentGroup) {
          const pillar = parentGroup.querySelector(".mindmap-pillar-box");
          if (pillar) focusAndSelectNode(pillar);
        }
      }
      break;
    }
    case "Home": {
      e.preventDefault();
      if (visibleNodes.length > 0) focusAndSelectNode(visibleNodes[0]);
      break;
    }
    case "End": {
      e.preventDefault();
      if (visibleNodes.length > 0) focusAndSelectNode(visibleNodes[visibleNodes.length - 1]);
      break;
    }
    case "Enter":
    case " ": {
      e.preventDefault();
      currentFocused.click();
      break;
    }
  }
}

function focusAndSelectNode(nodeEl) {
  if (!nodeEl) return;
  visibleNodesRovingTabindex(nodeEl);
  nodeEl.focus();
  nodeEl.click();
}

function visibleNodesRovingTabindex(activeNodeEl) {
  document.querySelectorAll(".mindmap-node").forEach(n => {
    n.setAttribute("tabindex", n === activeNodeEl ? "0" : "-1");
  });
}

export function initMindMap() {
  renderMindMap();

  const mindmapSearch = document.getElementById("mindmapSearchInput");
  if (mindmapSearch) {
    mindmapSearch.addEventListener("input", e => {
      clearTimeout(searchDebounceTimer);
      const term = e.target.value;
      searchDebounceTimer = setTimeout(() => {
        store.setState('mindmap', { searchFilter: term });
        renderMindMap();
      }, 200);
    });
  }

  const btnExpandAll = document.getElementById("btnMindmapExpandAll");
  if (btnExpandAll) {
    btnExpandAll.addEventListener("click", () => {
      triggerHaptic(25);
      const mindmapState = store.getState('mindmap');
      const expanded = new Set();
      if (mindmapState.data && mindmapState.data.children) {
        mindmapState.data.children.forEach(p => expanded.add(p.id));
      }
      store.setState('mindmap', { expandedNodes: expanded });
      renderMindMap();
    });
  }

  const btnCollapseAll = document.getElementById("btnMindmapCollapseAll");
  if (btnCollapseAll) {
    btnCollapseAll.addEventListener("click", () => {
      triggerHaptic(25);
      const expanded = new Set(["root"]);
      store.setState('mindmap', { expandedNodes: expanded });
      renderMindMap();
    });
  }

  const btnZoomIn = document.getElementById("btnMindmapZoomIn");
  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      const zoom = store.getState('mindmap').zoom;
      setMindmapZoom(zoom + 0.15);
    });
  }

  const btnZoomOut = document.getElementById("btnMindmapZoomOut");
  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      const zoom = store.getState('mindmap').zoom;
      setMindmapZoom(zoom - 0.15);
    });
  }

  const btnZoomReset = document.getElementById("btnMindmapZoomReset");
  if (btnZoomReset) {
    btnZoomReset.addEventListener("click", () => setMindmapZoom(1.0));
  }

  const mindmapTree = document.getElementById("mindmapTree");
  if (mindmapTree) {
    mindmapTree.addEventListener("keydown", handleMindmapKeyboardNav);
  }

  store.subscribe('navigation', state => {
    if (state.activeTab === 'mindmap') {
      renderMindMap();
    }
  });
}
