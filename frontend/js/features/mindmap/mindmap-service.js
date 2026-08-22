/**
 * SAFAR — Mind Map Data Loader Service
 */

import { store } from '../../core/state.js';
import { MINIMAL_FALLBACK_MINDMAP } from '../../core/constants.js';

export async function loadMindmapData() {
  try {
    const res = await fetch("js/mindmap-data.json");
    if (res.ok) {
      const data = await res.json();
      if (data && data.children && data.children.length > 0) {
        if (typeof window !== "undefined") {
          window.MINDMAP_DATA = data;
        }
        store.setState('mindmap', { data });
        return data;
      }
    }
  } catch (err) {
    console.warn("Using fallback mindmap blueprint:", err);
  }

  const fallback = MINIMAL_FALLBACK_MINDMAP;
  store.setState('mindmap', { data: fallback });
  return fallback;
}
