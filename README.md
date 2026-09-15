# blueroaring.github.io

个人主页。纯静态（HTML + CSS + 原生 JS，零依赖、零构建），由 GitHub Pages 直接发布。

访问地址：<https://blueroaring.github.io/>

## 我该改哪里

| 想改什么 | 改哪个文件 |
|---|---|
| 名字、头衔、自我介绍、邮箱、链接 | `data.js` 里的 `profile` |
| 研究兴趣标签 | `data.js` 里的 `interests` |
| 项目（增 / 删 / 改） | `data.js` 里的 `projects`（手动）和 `github`（自动） |
| 论文与成果 | `data.js` 里的 `publications` |
| 页面底部那句话 | `data.js` 里的 `footer` |
| 配色、字体、页面宽度 | `style.css` 顶部的 `:root` 变量 |
| 页面结构 / 渲染逻辑 | `index.html` / `app.js`（一般**不需要**动） |

**日常只需要改 `data.js` 一个文件。**

## 最常做的三件事

### 1. 改自我介绍

打开 `data.js` → 找到 `profile` → 改 `name`、`title`、`bio`。

`bio` 是数组，**一段 = 一个字符串**：

```js
bio: [
  '第一段……',
  '第二段……',
],
```

想加一段就在后面加一行；想删一段就删掉那一行。

### 2. 加 / 删项目

- **GitHub 上的仓库是自动显示的**，不用手动登记。页面按 `data.js` 里 `github.order` 指定的方式排序（默认 `'stars'`，即 star 多的排前面），并自动隐藏 fork 和已归档的仓库。
- 不想让某个仓库出现 → 把仓库名加进 `github.exclude`。
- 想改写某个仓库的显示描述 → 在 `github.overrides` 里加一条（`data.js` 里有注释好的示例）。
- 项目**不在 GitHub 上**，或者想让它排在前面并写更长的介绍 → 在 `projects` 数组里加一条（模板同样在 `data.js` 的注释里，去掉行首 `//` 即可）。
- 想让项目列表整个消失 → 把 `projects` 写成 `[]`，并把 `github.enabled` 设为 `false`。

### 3. 加论文

在 `publications` 数组里按注释里的模板加一条；`links` 里可以放 PDF、代码等链接。

## 改完怎么发布

```bash
git add -A
git commit -m "update homepage"
git push
```

推送后 GitHub Actions 会在 **1 分钟左右**自动重新发布，刷新 <https://blueroaring.github.io/> 即可看到。

## 本地预览（可选）

直接双击 `index.html` 就能看。不过浏览器对 `file://` 页面的 `fetch` 有限制，**GitHub 仓库列表可能拉不出来**；想完整预览就起个本地服务器：

```bash
python -m http.server 8000
# 或： npx serve
```

然后打开 <http://localhost:8000>。

## 部署说明（一般不用管）

- 发布方式是 GitHub Actions：`.github/workflows/static.yml` 把**仓库根目录整体**作为静态站点上传到 Pages。
- 仓库里原本还有一个 `jekyll-gh-pages.yml`；本页不需要 Jekyll 构建（两者会互抢部署），已经删除。
- 所以：**新增文件直接放仓库根目录即可**，不需要任何构建步骤，样式和脚本都用相对路径引用。

## 其它

- 仓库列表通过 GitHub **公开 API** 拉取，不需要 token。匿名调用有频率限制，偶尔拉不到时页面会显示一行提示，刷新即可。
- 页面无第三方依赖、无统计脚本、无 cookie。
