# Zeng Lihua Portfolio

这是曾丽华的视频内容创作、视频剪辑和短视频运营作品集。公开页面可以继续使用 GitHub Pages；视频作品的增改由 Supabase 登录后台管理。

## 本地预览

电脑安装 Node.js 后，在项目根目录启动本地服务器：

```powershell
node server.js
```

然后打开 [http://localhost:4173](http://localhost:4173)。服务器只监听本机，不会发布网站或开放给其他访客。

## 内容文件结构

```text
作品集/
├─ server.js            本地预览服务器
├─ data/
│  └─ portfolio-data.js   作品、脚本、账号和网站文字
├─ public/
│  ├─ videos/             视频文件
│  ├─ images/works/       视频封面
│  └─ scripts/            脚本截图
└─ assets/                个人照片等站点素材
```

正式内容集中维护在 [data/portfolio-data.js](data/portfolio-data.js)。页面结构在 [index.html](index.html)，视觉样式在 [styles.css](styles.css)。配置了 Supabase 后，视频作品可以从 [admin/](admin/) 登录管理，不需要再修改代码。

## 视频管理后台配置

后台使用 Supabase 提供登录、数据库和文件存储。首次配置时：

1. 在 Supabase Dashboard 创建项目，并在 Authentication > Users 中手动创建你的管理员邮箱和密码（密码只由你自己保管）。
2. 在 SQL Editor 运行 [supabase/schema.sql](supabase/schema.sql)。随后将管理员用户 UUID 填入并单独运行：`insert into public.admin_users (id) values ('管理员UUID');`。
3. 在 Project Settings > API 复制 Project URL 和 anon public key，填入 [data/supabase-config.js](data/supabase-config.js)。这里只能填写 anon key，不能填写 service_role key。
4. 在 Authentication 设置里关闭公开注册（Allow new users to sign up），只通过 Dashboard 手动创建管理员用户。
5. 在 Authentication > URL Configuration 中加入本地地址 `http://localhost:4173/admin/` 和 GitHub Pages 地址 `https://zy504052-maker.github.io/zenglihua-portfolio/admin/`。
6. 打开 `http://localhost:4173/admin/` 或公开网站右上角的“管理登录”，使用管理员邮箱登录。首次打开管理后台会把已有作品初始化到数据库。

登录后可以新增、编辑、替换封面和视频、修改分类与文字、发布、下架和删除作品。视频会上传到 Supabase Storage，公开页面只读取已发布作品；GitHub 不保存后台密码，也不保存后来上传的视频。

Supabase Storage 有项目套餐的单文件上传上限和总容量限制。当前后台采用可续传上传，但续传不能突破项目本身的大小上限；上传较大的原始视频前，请在 Supabase 的 Storage 配置中核对套餐限制和可用容量。

## 新增、修改和下架视频

打开网站右上角的“管理登录”，使用管理员账号进入后台：

- 新增：点“新增视频”，上传视频与封面，填写作品信息后保存。
- 修改：在作品列表选择“编辑”，可调整文字、分类、比例、排序，也可替换视频或封面。
- 发布/下架：点击作品右侧对应操作；下架作品不会出现在访客页面。
- 删除：新建上传的云端作品会删除数据库记录和对应云端素材。初始导入的本地作品会下架保留原始文件，不会从仓库中删除。

视频上传走 Supabase Storage，GitHub 不需要重新上传媒体文件。修改网站代码或 Supabase 公共配置后，仍需提交并推送 GitHub，才能更新公开网站。

## 脚本能力

作品集页面的三个入口是并列关系：视频作品、运营账号、脚本能力。脚本能力不会混入视频分类中。

脚本截图放入：

```text
public/scripts/
```

然后在 `scriptWorks` 数组中修改 `imageUrl`：

```js
{
  id: "script-01",
  title: "脚本 01",
  imageUrl: "public/scripts/script-01.jpg",
  tone: "script-blue",
},
```

脚本卡片支持点击放大。`scriptWorks` 数组的顺序就是页面显示顺序。

## 运营账号

在 `socialAccounts` 数组中维护小红书和抖音案例。账号图片可以放在 `public/images/works/` 或其他 `public/` 子目录中，然后填写：

```js
{
  id: "xiaohongshu-01",
  platform: "小红书",
  index: 1,
  name: "账号名称",
  accountScreenshotUrl: "public/images/works/xhs-account-01.jpg",
  contentScreenshotUrl: "public/images/works/xhs-content-01.jpg",
  representativeWork: "代表作品",
  metrics: "运营数据待补充",
  role: "选题 · 发布 · 复盘",
},
```

平台只能填写 `小红书` 或 `抖音`。页面会自动按平台分组并统计账号数量。

## 修改网站文字

打开 `data/portfolio-data.js` 顶部的 `siteContent`：

- `profileName`：姓名
- `profileMajor`：专业
- `profileMbti`：MBTI
- `profileExperience`：工作年限
- `capabilities`：能力列表，每项包含 `title` 和 `description`
- `contactEmail`：邮箱
- `contactPhone`：电话
- `contactWechat`：微信
- `profilePhotoUrl`：个人照片路径，当前为 `public/images/profile.jpg`

核心成果字段 `resultPlay`、`resultExposure`、`resultRoi` 已预留，当前页面按照已确定版本保留，不需要修改页面结构。

## 需要你提供的真实素材

目前页面仍使用占位内容，后续可以提供：

- 个人照片
- 视频文件
- 每个视频对应的封面
- 三张真实脚本截图
- 小红书账号截图和内容截图
- 抖音账号截图和内容截图
- 作品名称、分类、职责和项目成果文字

