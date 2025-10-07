# PDF搜索系统

## 🚀 快速开始

### 1. 环境要求
- Node.js 18+
- PostgreSQL 12+
- npm

### 2. 一键部署

**Windows:**
```bash
deploy.bat
```

**Mac/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. 启动服务
```bash
# Windows
start_services.bat

# Mac/Linux  
./start_services.sh
```

### 4. 访问应用
- 前端: http://localhost:3000
- 后端: http://localhost:3001

## 🎯 功能特性

- ✅ **Google风格搜索建议** - 实时下拉建议
- ✅ **智能全文搜索** - 支持部分匹配
- ✅ **PDF文本提取** - 自动处理PDF文件
- ✅ **用户认证** - JWT安全登录
- ✅ **响应式设计** - 桌面+移动端

## 🔧 手动部署

### 数据库设置
```bash
createdb ecommerce_db
psql -U postgres -c "CREATE USER ecommerce_user WITH PASSWORD 'ecommerce_password';"
```

### 后端设置
```bash
cd api
npm install
cp env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 前端设置
```bash
cd web
npm install
```

## 📝 使用说明

1. 注册/登录用户
2. 进入Dashboard
3. 在搜索框输入关键词
4. 查看实时建议下拉框
5. 选择建议或按Enter搜索

## 📁 PDF文件处理

将PDF文件放在 `web/public/assets/pdf/` 目录下，然后运行：
```bash
cd api && npm run db:seed
```

## 🔧 故障排除

**数据库连接失败:**
```bash
pg_ctl status
brew services restart postgresql  # Mac
```

**环境变量问题:**
确保 `.env` 文件中的 `DATABASE_URL` 用双引号包围

**搜索功能异常:**
```bash
psql -U postgres -d ecommerce_db -c "SELECT * FROM pg_indexes WHERE tablename = 'documents';"
```

## 🛠️ 技术栈

- **前端**: Vue.js 3 + Vite
- **后端**: Fastify + Prisma
- **数据库**: PostgreSQL + FTS
- **PDF处理**: pdf-parse

## 📊 核心API

- `GET /api/search/suggestions?q=sa&limit=8` - 搜索建议
- `POST /api/search` - 完整搜索
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

---

**🎉 就这么简单！** 现在你有了一个完整的PDF搜索系统。