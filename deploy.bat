@echo off
REM PDF搜索系统 - Windows快速部署脚本

echo 🚀 PDF搜索系统 - Windows快速部署脚本
echo ==================================

REM 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js 18+
    pause
    exit /b 1
)

REM 检查npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

REM 检查PostgreSQL
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL 未安装，请先安装 PostgreSQL 12+
    pause
    exit /b 1
)

echo ✅ 系统要求检查通过

REM 设置数据库
echo 🗄️  设置数据库...
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='ecommerce_db'" | findstr "1" >nul
if %errorlevel% neq 0 (
    echo 📝 创建数据库 ecommerce_db...
    createdb ecommerce_db
    echo ✅ 数据库创建成功
) else (
    echo ✅ 数据库 ecommerce_db 已存在
)

REM 创建用户
psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='ecommerce_user'" | findstr "1" >nul
if %errorlevel% neq 0 (
    echo 👤 创建用户 ecommerce_user...
    psql -U postgres -c "CREATE USER ecommerce_user WITH PASSWORD 'ecommerce_password';"
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;"
    echo ✅ 用户创建成功
) else (
    echo ✅ 用户 ecommerce_user 已存在
)

REM 设置后端
echo 🔧 设置后端服务...
cd api

echo 📦 安装后端依赖...
npm install

REM 配置环境变量
if not exist .env (
    echo ⚙️  配置环境变量...
    copy env.example .env
    echo ✅ 环境变量文件已创建，请检查 .env 文件
) else (
    echo ✅ 环境变量文件已存在
)

echo 🔨 生成Prisma客户端...
npm run db:generate

echo 📊 运行数据库迁移...
npm run db:migrate

echo 🌱 填充种子数据...
npm run db:seed

echo ✅ 后端设置完成
cd ..

REM 设置前端
echo 🎨 设置前端应用...
cd web

echo 📦 安装前端依赖...
npm install

echo ✅ 前端设置完成
cd ..

REM 创建启动脚本
echo 📝 创建启动脚本...

echo @echo off > start_services.bat
echo echo 🚀 启动PDF搜索系统... >> start_services.bat
echo echo. >> start_services.bat
echo echo 🔧 启动后端服务 (端口 3001)... >> start_services.bat
echo start "Backend" cmd /k "cd api && npm run dev" >> start_services.bat
echo echo. >> start_services.bat
echo echo 🎨 启动前端服务 (端口 3000)... >> start_services.bat
echo start "Frontend" cmd /k "cd web && npm run dev" >> start_services.bat
echo echo. >> start_services.bat
echo echo ✅ 服务启动完成！ >> start_services.bat
echo echo 📱 前端地址: http://localhost:3000 >> start_services.bat
echo echo 🔧 后端地址: http://localhost:3001 >> start_services.bat
echo echo. >> start_services.bat
echo echo 按任意键退出... >> start_services.bat
echo pause >> start_services.bat

echo ✅ 启动脚本已创建: start_services.bat

REM 创建停止脚本
echo 📝 创建停止脚本...

echo @echo off > stop_services.bat
echo echo 🛑 停止PDF搜索系统... >> stop_services.bat
echo taskkill /F /IM node.exe 2^>nul >> stop_services.bat
echo taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Backend*" 2^>nul >> stop_services.bat
echo taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Frontend*" 2^>nul >> stop_services.bat
echo echo ✅ 所有服务已停止 >> stop_services.bat
echo pause >> stop_services.bat

echo ✅ 停止脚本已创建: stop_services.bat

REM 显示使用说明
echo.
echo 🎉 部署完成！
echo ==============
echo.
echo 📁 项目结构:
echo   ├── api/          # 后端API服务
echo   ├── web/          # 前端Vue应用
echo   ├── start_services.bat  # 启动脚本
echo   └── stop_services.bat   # 停止脚本
echo.
echo 🚀 启动服务:
echo   start_services.bat
echo.
echo 🛑 停止服务:
echo   stop_services.bat
echo.
echo 🌐 访问地址:
echo   前端: http://localhost:3000
echo   后端: http://localhost:3001
echo.
echo 📝 使用说明:
echo   1. 打开浏览器访问 http://localhost:3000
echo   2. 注册新用户或使用现有账户登录
echo   3. 进入Dashboard，使用搜索功能
echo   4. 将PDF文件放在 web\public\assets\pdf\ 目录下
echo   5. 运行 'cd api && npm run db:seed' 处理PDF文件
echo.
echo 🔧 故障排除:
echo   - 检查PostgreSQL服务是否运行
echo   - 确认数据库连接配置正确
echo   - 查看服务器日志获取错误信息
echo.
echo 📚 详细文档:
echo   - PDF_SEARCH_IMPLEMENTATION_GUIDE.md
echo   - QUICK_START_GUIDE.md
echo.

pause