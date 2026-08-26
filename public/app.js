(function () {
  "use strict";

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function editDistance(left, right) {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = [leftIndex];
      for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
        const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
        current[rightIndex] = Math.min(
          current[rightIndex - 1] + 1,
          previous[rightIndex] + 1,
          previous[rightIndex - 1] + cost
        );
      }
      previous.splice(0, previous.length, ...current);
    }

    return previous[right.length];
  }

  function isSubsequence(needle, value) {
    let index = 0;
    for (const character of value) {
      if (character === needle[index]) index += 1;
      if (index === needle.length) return true;
    }
    return false;
  }

  function fuzzyTokenMatch(token, text) {
    if (text.includes(token)) return true;

    return text.split(/[^a-z0-9]+/).some((word) => {
      if (!word) return false;
      if (token.length > 2 && isSubsequence(token, word)) return true;
      const tolerance = token.length < 4 ? 0 : Math.max(1, Math.floor(token.length / 3));
      return Math.abs(token.length - word.length) <= tolerance &&
        editDistance(token, word) <= tolerance;
    });
  }

  function fuzzyMatch(query, text) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return true;

    const normalizedText = normalize(text);
    return normalizedQuery.split(/\s+/).every((token) => fuzzyTokenMatch(token, normalizedText));
  }

  function htmlToText(html) {
    if (typeof document === "undefined") {
      return String(html).replace(/<[^>]*>/g, " ");
    }
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.textContent || "";
  }

  function ideaMatches(idea, filters) {
    const selectedTags = Array.from(filters.tags || []);
    const searchable = [idea.title, htmlToText(idea.body), idea.tags.join(" ")].join(" ");
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some((tag) => idea.tags.includes(tag));
    const matchesFrom = !filters.from || idea.date >= filters.from;
    const matchesTo = !filters.to || idea.date <= filters.to;

    return fuzzyMatch(filters.query, searchable) && matchesTags && matchesFrom && matchesTo;
  }

  function validateContent(tags, ideas) {
    if (!Array.isArray(tags) || !Array.isArray(ideas)) {
      throw new Error("Tags and ideas must be arrays.");
    }

    const allowedTags = new Set(tags);
    for (const idea of ideas) {
      if (!idea || typeof idea.title !== "string" || typeof idea.body !== "string" ||
          !Array.isArray(idea.tags) || !/^\d{4}-\d{2}-\d{2}$/.test(idea.date)) {
        throw new Error("Every idea needs a title, HTML body, tags, and ISO date.");
      }
      if (idea.tags.some((tag) => !allowedTags.has(tag))) {
        throw new Error(`Unknown tag on idea: ${idea.title}`);
      }
    }
  }

  const api = { editDistance, fuzzyMatch, ideaMatches, validateContent };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  const elements = {
    form: document.querySelector("#filters"),
    search: document.querySelector("#search"),
    tags: document.querySelector("#tags"),
    from: document.querySelector("#from"),
    to: document.querySelector("#to"),
    status: document.querySelector("#status"),
    ideas: document.querySelector("#ideas"),
    expand: document.querySelector("#expand"),
    collapse: document.querySelector("#collapse")
  };
  const state = { ideas: [], selectedTags: new Set() };

  function renderTagButton(tag) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.tag = tag;
    button.setAttribute("aria-pressed", "false");
    button.textContent = tag;
    button.addEventListener("click", () => {
      if (state.selectedTags.has(tag)) {
        state.selectedTags.delete(tag);
      } else {
        state.selectedTags.add(tag);
      }
      const selected = state.selectedTags.has(tag);
      button.setAttribute("aria-pressed", String(selected));
      button.textContent = selected ? `[${tag}]` : tag;
      renderIdeas();
    });
    elements.tags.append(button, " ");
  }

  function renderIdea(idea) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const title = document.createElement("strong");
    const body = document.createElement("div");

    title.textContent = idea.title;
    summary.append(title, ` - ${idea.date} - ${idea.tags.join(", ")}`);
    body.innerHTML = idea.body;
    details.append(summary, body);
    return details;
  }

  function renderIdeas() {
    const filters = {
      query: elements.search.value,
      tags: state.selectedTags,
      from: elements.from.value,
      to: elements.to.value
    };
    const visible = state.ideas.filter((idea) => ideaMatches(idea, filters));

    elements.ideas.replaceChildren(...visible.map(renderIdea));
    elements.status.textContent = `${visible.length} of ${state.ideas.length} ideas shown.`;
    if (visible.length === 0) {
      const message = document.createElement("p");
      message.textContent = "No ideas match these filters.";
      elements.ideas.append(message);
    }
  }

  function setAllOpen(open) {
    elements.ideas.querySelectorAll("details").forEach((details) => {
      details.open = open;
    });
  }

  async function initialize() {
    try {
      const [tagsResponse, ideasResponse] = await Promise.all([
        fetch("tags.json"),
        fetch("ideas.json")
      ]);
      if (!tagsResponse.ok || !ideasResponse.ok) throw new Error("Content request failed.");

      const [tags, ideas] = await Promise.all([tagsResponse.json(), ideasResponse.json()]);
      validateContent(tags, ideas);
      state.ideas = ideas.slice().sort((left, right) => right.date.localeCompare(left.date));
      tags.forEach(renderTagButton);
      renderIdeas();
    } catch (error) {
      console.error(error);
      elements.status.textContent = "503 - ideas unavailable.";
    }
  }

  elements.search.addEventListener("input", renderIdeas);
  elements.from.addEventListener("input", () => {
    elements.to.min = elements.from.value;
    renderIdeas();
  });
  elements.to.addEventListener("input", () => {
    elements.from.max = elements.to.value;
    renderIdeas();
  });
  elements.form.addEventListener("reset", () => {
    state.selectedTags.clear();
    elements.tags.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.textContent = button.dataset.tag;
    });
    elements.from.removeAttribute("max");
    elements.to.removeAttribute("min");
    setTimeout(renderIdeas);
  });
  elements.expand.addEventListener("click", () => setAllOpen(true));
  elements.collapse.addEventListener("click", () => setAllOpen(false));

  initialize();
}());
