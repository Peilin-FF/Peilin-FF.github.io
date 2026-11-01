/* Blog pages: reading progress, copy buttons, table of contents, index view tabs. */
(function () {
  // Reading progress bar
  var bar = document.getElementById("progress");
  if (bar) {
    var updateBar = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, 100 * window.scrollY / h) : 0) + "%";
    };
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);
    updateBar();
  }

  // Copy buttons on code blocks
  var blocks = document.querySelectorAll(".note-body pre");
  for (var i = 0; i < blocks.length; i++) {
    (function (pre) {
      var wrap = document.createElement("div");
      wrap.className = "copy-wrap";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      wrap.appendChild(btn);
      function done(ok) {
        btn.textContent = ok ? "Copied" : "Selected: press Ctrl/Cmd+C";
        setTimeout(function () { btn.textContent = "Copy"; }, 1800);
      }
      function selectAndCopy() {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        done(ok);
      }
      btn.addEventListener("click", function () {
        var text = pre.innerText.replace(/\s+$/, "") + "\n";
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, selectAndCopy);
        } else {
          selectAndCopy();
        }
      });
    })(blocks[i]);
  }

  // Table of contents from the post's h2/h3; h3 entries open under the current h2
  var toc = document.querySelector(".toc-rail");
  var heads = document.querySelectorAll(".note-body h2[id], .note-body h3[id]");
  if (toc && heads.length >= 2) {
    var list = toc.querySelector("ol");
    var links = [];
    var section = -1;
    for (var j = 0; j < heads.length; j++) {
      var h = heads[j];
      var isSub = h.tagName === "H3";
      if (!isSub) section++;
      var li = document.createElement("li");
      if (isSub) li.className = "sub";
      li.setAttribute("data-section", section);
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
      links.push({ head: h, link: a, item: li, section: section });
    }
    toc.hidden = false;

    var current = -2;
    var updateToc = function () {
      var active = 0;
      for (var k = 0; k < links.length; k++) {
        if (links[k].head.getBoundingClientRect().top < 120) active = k;
        else break;
      }
      if (active === current) return;
      current = active;
      var openSection = links[active].section;
      for (var m = 0; m < links.length; m++) {
        links[m].link.classList.toggle("active", m === active);
        if (links[m].item.className.indexOf("sub") === 0) {
          links[m].item.classList.toggle("open", links[m].section === openSection);
        }
      }
    };
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; updateToc(); });
    }, { passive: true });
    updateToc();
  }

  // Blog index: "By topic" / "By date" tabs; #archive opens the date view
  var tabs = document.querySelector(".view-tabs");
  if (tabs) {
    var buttons = tabs.querySelectorAll("button");
    var panels = document.querySelectorAll("[data-view-panel]");
    var show = function (view) {
      for (var n = 0; n < buttons.length; n++) {
        buttons[n].setAttribute("aria-selected", buttons[n].getAttribute("data-view") === view ? "true" : "false");
      }
      for (var p = 0; p < panels.length; p++) {
        panels[p].hidden = panels[p].getAttribute("data-view-panel") !== view;
      }
    };
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener("click", function () {
        var view = this.getAttribute("data-view");
        show(view);
        history.replaceState(null, "", view === "archive" ? "#archive" : location.pathname);
      });
    }
    tabs.hidden = false;
    show(location.hash === "#archive" ? "archive" : "topics");
    window.addEventListener("hashchange", function () {
      show(location.hash === "#archive" ? "archive" : "topics");
    });
  }
})();
