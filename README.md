# Zeng Lihua Portfolio

这是曾丽华的视频内容创作、视频剪辑和短视频运营作品集。当前阶段使用本地文件和配置文件维护内容，不部署 GitHub，也不需要后台系统。

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

正式内容集中维护在 [data/portfolio-data.js](data/portfolio-data.js)。页面结构在 [index.html](index.html)，视觉样式在 [styles.css](styles.css)，一般不需要修改它们。

## 新增一个视频作品

### 1. 放入文件

把视频放入：

```text
public/videos/
```

把对应封面放入：

```text
public/images/works/
```

例如：

```text
public/videos/cat-food.mp4
public/images/works/cat-food.jpg
```

### 2. 修改配置

打开 [data/portfolio-data.js](data/portfolio-data.js)，在 `videoWorks` 数组中增加一个对象：

```js
{
  id: "cat-food",
  title: "科学养宠｜猫咪饮食误区",
  category: "口播",
  videoUrl: "public/videos/cat-food.mp4",
  aspectRatio: "16:9",
  role: "选题策划 · 脚本 · 拍摄 · 剪辑",
  result: "项目成果待补充",
  description: "项目描述待补充。",
  coverUrl: "public/images/works/cat-food.jpg",
  platform: "小红书",
  tone: "card-blue",
},
```

`category` 只能使用：`口播`、`商业活动`、`宣传片`、`信息流`、`探店`、`短剧`。

横屏视频填写 `16:9`。宣传片和商业活动的竖屏视频填写 `9:16`。作品墙会按照这个字段展示原始比例，不会强制裁切视频封面。

### 3. 刷新页面

保存配置文件后刷新本地网页即可看到作品。点击卡片可以打开详情并播放已填写的视频。

## 修改、替换和删除作品

- 修改名称、分类、工作内容、项目成果：编辑对应对象的 `title`、`category`、`role`、`result`。
- 替换视频：将新文件放入 `public/videos/`，然后修改 `videoUrl`。
- 替换封面：将新图片放入 `public/images/works/`，然后修改 `coverUrl`。
- 删除作品：从 `videoWorks` 数组中删除整个作品对象；不再使用的媒体文件也可以从对应文件夹删除。
- `id` 请保持每个作品唯一，建议使用英文短横线命名。

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

