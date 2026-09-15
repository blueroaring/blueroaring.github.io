/* ============================================================================
 *  app.js —— 渲染逻辑。通常**不需要改这个文件**。
 *  想改内容请编辑 data.js；想改配色/字体请编辑 style.css。
 *
 *  设计取舍：只读取 window.SITE，缺字段就跳过，任何一段出错都不影响其它部分。
 *  所有文本都用 textContent 写入，不用 innerHTML，避免外部数据（如 GitHub 返回的
 *  仓库描述）把页面结构搞坏。
 * ==========================================================================*/

(function () {
  'use strict';

  var SITE = window.SITE || {};

  /* ---------------------------------------------------------------- 小工具 */

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function reveal(id, visible) {
    var node = document.getElementById(id);
    if (node && visible) node.removeAttribute('hidden');
  }

  function link(url, text) {
    var a = document.createElement('a');
    a.href = url;
    a.textContent = text;
    if (/^https?:/i.test(url)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    return a;
  }

  /** 往一行里依次放若干片段，中间用分隔点隔开。 */
  function factsLine(bits) {
    var line = make('p', 'facts');
    bits.filter(Boolean).forEach(function (bit, index) {
      if (index > 0) line.appendChild(make('span', 'sep', '·'));
      if (bit instanceof Node) line.appendChild(bit);
      else line.appendChild(document.createTextNode(String(bit)));
    });
    return line;
  }

  function formatMonth(iso) {
    if (!iso) return '';
    return iso.slice(0, 7).replace('-', ' 年 ') + ' 月';
  }

  /* ------------------------------------------------------- 1. 自我介绍区块 */

  function renderProfile() {
    var data = SITE.profile || {};
    var root = document.getElementById('profile');
    if (!root) return;
    clear(root);

    var headline = make('div', 'headline');

    if (data.avatar) {
      var avatar = document.createElement('img');
      avatar.className = 'avatar';
      avatar.src = data.avatar;
      avatar.alt = '';
      avatar.loading = 'lazy';
      headline.appendChild(avatar);
    }

    var nameBox = make('div');
    nameBox.appendChild(make('h1', null, data.name || ''));
    if (data.title) nameBox.appendChild(make('p', 'title', data.title));
    headline.appendChild(nameBox);
    root.appendChild(headline);

    var contacts = [];
    if (data.email) contacts.push({ text: data.email, url: 'mailto:' + data.email });
    (data.links || []).forEach(function (item) {
      if (item && item.label && item.url) contacts.push({ text: item.label, url: item.url });
    });
    if (contacts.length) {
      var line = make('p', 'contact');
      contacts.forEach(function (item, index) {
        if (index > 0) line.appendChild(make('span', 'sep', '·'));
        line.appendChild(link(item.url, item.text));
      });
      root.appendChild(line);
    }

    var bio = (data.bio || []).filter(Boolean);
    if (bio.length) {
      var box = make('div', 'bio');
      bio.forEach(function (paragraph) { box.appendChild(make('p', null, paragraph)); });
      root.appendChild(box);
    }

    if (data.name) {
      document.title = data.name + (data.title ? ' · ' + data.title : '');
    }
  }

  /* ------------------------------------------------------------ 2. 兴趣标签 */

  function renderInterests() {
    var list = (SITE.interests || []).filter(Boolean);
    if (!list.length) return;
    var root = document.getElementById('interests');
    if (!root) return;
    clear(root);
    list.forEach(function (item) { root.appendChild(make('li', null, item)); });
    reveal('interests-section', true);
  }

  /* -------------------------------------------------- 3. 一条项目/仓库条目 */

  function entryNode(options) {
    var box = make('div', 'entry');

    var title = make('h3');
    if (options.url) title.appendChild(link(options.url, options.title));
    else title.textContent = options.title || '';
    box.appendChild(title);

    if (options.description) box.appendChild(make('p', 'desc', options.description));

    var bits = [];
    (options.tags || []).filter(Boolean).forEach(function (tag) { bits.push(tag); });
    bits = bits.concat(options.facts || []);
    if (bits.length) box.appendChild(factsLine(bits));

    return box;
  }

  /* ------------------------------------------------------- 4. 手动项目列表 */

  function renderManualProjects() {
    var list = (SITE.projects || []).filter(function (item) { return item && item.title; });
    if (!list.length) return 0;

    var root = document.getElementById('projects');
    if (!root) return 0;
    clear(root);

    list.forEach(function (item) {
      var facts = [];
      if (item.year) facts.push(item.year);
      root.appendChild(entryNode({
        title: item.title,
        description: item.description,
        url: item.url,
        tags: item.tags,
        facts: facts,
      }));
    });
    return list.length;
  }

  /* --------------------------------------------------- 5. 自动拉取 GitHub */

  function sortRepos(list, order) {
    var byDate = function (a, b) {
      return new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0);
    };
    if (order === 'updated') return list.sort(byDate);
    if (order === 'name') {
      return list.sort(function (a, b) {
        return String(a.name).toLowerCase() < String(b.name).toLowerCase() ? -1 : 1;
      });
    }
    return list.sort(function (a, b) {
      var diff = (b.stargazers_count || 0) - (a.stargazers_count || 0);
      return diff !== 0 ? diff : byDate(a, b);
    });
  }

  function repoEntry(repo, override) {
    var facts = [];
    if (repo.language) facts.push(repo.language);
    if (repo.stargazers_count > 0) facts.push('★ ' + repo.stargazers_count);
    if (repo.pushed_at) facts.push('更新于 ' + formatMonth(repo.pushed_at));
    if (repo.fork) facts.push('fork');

    return entryNode({
      title: (override && override.title) || repo.name,
      description: (override && override.description) || repo.description || '',
      url: (override && override.url) || repo.html_url,
      tags: (override && override.tags) || [],
      facts: facts,
    });
  }

  function renderGithubRepos() {
    var cfg = SITE.github || {};
    var note = document.getElementById('repos-note');
    if (!cfg.enabled || !cfg.user) return Promise.resolve(0);

    var url = 'https://api.github.com/users/' + encodeURIComponent(cfg.user) +
      '/repos?per_page=100&sort=pushed';

    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (repos) {
        if (!Array.isArray(repos)) throw new Error('unexpected payload');

        var excluded = (cfg.exclude || []).map(function (name) { return String(name).toLowerCase(); });
        var overrides = cfg.overrides || {};

        var kept = repos.filter(function (repo) {
          if (!repo || repo.name === undefined) return false;
          if (cfg.excludeForks !== false && repo.fork) return false;
          if (cfg.excludeArchived !== false && repo.archived) return false;
          if (excluded.indexOf(String(repo.name).toLowerCase()) >= 0) return false;
          return true;
        });

        kept = sortRepos(kept, cfg.order);
        if (cfg.max > 0) kept = kept.slice(0, cfg.max);

        var root = document.getElementById('repos');
        if (!root) return 0;
        clear(root);
        kept.forEach(function (repo) {
          root.appendChild(repoEntry(repo, overrides[repo.name]));
        });
        return kept.length;
      })
      .catch(function (error) {
        if (note) {
          note.textContent = '（GitHub 仓库列表暂时拉取失败：' + error.message +
            '。稍后刷新即可；也有可能是对方接口的访问频率限制。）';
          note.removeAttribute('hidden');
        }
        return 0;
      });
  }

  /* --------------------------------------------------------- 6. 论文与成果 */

  function renderPublications() {
    var list = (SITE.publications || []).filter(function (item) { return item && item.title; });
    if (!list.length) return;
    var root = document.getElementById('publications');
    if (!root) return;
    clear(root);

    list.forEach(function (item) {
      var li = make('li');
      if (item.authors) li.appendChild(make('div', null, item.authors));
      li.appendChild(make('div', null, item.title));
      if (item.venue) li.appendChild(make('div', 'facts', item.venue));
      if (item.links && item.links.length) {
        var line = make('p', 'facts');
        item.links.forEach(function (pair, index) {
          if (!pair || !pair.label || !pair.url) return;
          if (index > 0) line.appendChild(make('span', 'sep', '·'));
          line.appendChild(link(pair.url, pair.label));
        });
        li.appendChild(line);
      }
      root.appendChild(li);
    });
    reveal('publications-section', true);
  }

  /* ------------------------------------------------------------- 7. 页脚 */

  function renderFooter() {
    var data = SITE.footer || {};
    var root = document.getElementById('footer');
    if (!root || !data.note) return;
    root.appendChild(make('span', null, data.note));
  }

  /* ------------------------------------------------------------- 启动 */

  function boot() {
    var runners = [renderProfile, renderInterests, renderPublications, renderFooter];
    runners.forEach(function (run) {
      try { run(); } catch (error) { console.error('[homepage]', error); }
    });

    var manualCount = 0;
    try { manualCount = renderManualProjects(); } catch (error) { console.error('[homepage]', error); }

    if (manualCount > 0) reveal('projects-section', true);

    renderGithubRepos().then(function (repoCount) {
      if (manualCount + repoCount > 0) reveal('projects-section', true);
    }).catch(function () { /* 已在内部处理 */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
