# #歆闻站点 生日纪念页

静态生日网页，适配电脑和手机。

入口：`index.html`。

- `assets/styles.css`：页面样式。
- `assets/main.js`：时钟、折信、许愿、留言和音乐交互。
- `assets/optimized/`：WebP 图片，按屏幕选择尺寸；大图链接指向完整分辨率版本。
- `assets/celebrate.mp3`：唯一的发布音频文件。

原始 JPG 已保留在本地项目的 `../birthday-editorial/assets/`，不在发布目录重复存储。旧 ZIP 与源文件完全相同，已清理。不要将 `.DS_Store` 或旧打包文件添加到仓库。

## 修改后检查

在仓库目录运行：

```bash
python3 scripts/prepare.py
node --check assets/main.js
```

第一条命令校验本地资源链接，并按 CSS、JS 内容更新版本号，避免浏览器继续使用旧代码。提交更新后的 `index.html` 和相关资源即可。

## GitHub Pages

在仓库 Settings → Pages 中将来源设为 Deploy from a branch，选择 `main` 和根目录 `/`。

留言仅保存在访客当前浏览器，不在设备间同步。右下角只有一个圆形音乐按钮：点击播放，再点暂停，整首循环；加载中再次点击可取消。音频在点击前不预加载。
