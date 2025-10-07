#!/bin/bash

# PDF搜索系统 - 快速部署脚本
# 适用于 macOS/Linux 系统

set -e  # 遇到错误立即退出

echo "🚀 PDF搜索系统 - 快速部署脚本"
echo "=================================="

# 检查必要的工具
check_requirements() {
    echo "📋 检查系统要求..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安装，请先安装 npm"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        echo "❌ PostgreSQL 未安装，请先安装 PostgreSQL 12+"
        exit 1
    fi
    
    echo "✅ 系统要求检查通过"
}

# 设置数据库
setup_database() {
    echo "🗄️  设置数据库..."
    
    # 检查数据库是否存在
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw ecommerce_db; then
        echo "✅ 数据库 ecommerce_db 已存在"
    else
        echo "📝 创建数据库 ecommerce_db..."
        createdb ecommerce_db
        echo "✅ 数据库创建成功"
    fi
    
    # 创建用户（如果不存在）
    if psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='ecommerce_user'" | grep -q 1; then
        echo "✅ 用户 ecommerce_user 已存在"
    else
        echo "👤 创建用户 ecommerce_user..."
        psql -U postgres -c "CREATE USER ecommerce_user WITH PASSWORD 'ecommerce_password';"
        psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;"
        echo "✅ 用户创建成功"
    fi
}

# 设置后端
setup_backend() {
    echo "🔧 设置后端服务..."
    
    cd api
    
    # 安装依赖
    echo "📦 安装后端依赖..."
    npm install
    
    # 配置环境变量
    if [ ! -f .env ]; then
        echo "⚙️  配置环境变量..."
        cp env.example .env
        echo "✅ 环境变量文件已创建，请检查 .env 文件"
    else
        echo "✅ 环境变量文件已存在"
    fi
    
    # 生成Prisma客户端
    echo "🔨 生成Prisma客户端..."
    npm run db:generate
    
    # 运行数据库迁移
    echo "📊 运行数据库迁移..."
    npm run db:migrate
    
    # 填充种子数据
    echo "🌱 填充种子数据..."
    npm run db:seed
    
    echo "✅ 后端设置完成"
    cd ..
}

# 设置前端
setup_frontend() {
    echo "🎨 设置前端应用..."
    
    cd web
    
    # 安装依赖
    echo "📦 安装前端依赖..."
    npm install
    
    echo "✅ 前端设置完成"
    cd ..
}

# 创建启动脚本
create_start_script() {
    echo "📝 创建启动脚本..."
    
    cat > start_services.sh << 'EOF'
#!/bin/bash

echo "🚀 启动PDF搜索系统..."

# 启动后端服务
echo "🔧 启动后端服务 (端口 3001)..."
cd api
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务 (端口 3000)..."
cd ../web
npm run dev &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait

# 清理进程
echo "🛑 停止服务..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "✅ 服务已停止"
EOF

    chmod +x start_services.sh
    echo "✅ 启动脚本已创建: ./start_services.sh"
}

# 创建停止脚本
create_stop_script() {
    echo "📝 创建停止脚本..."
    
    cat > stop_services.sh << 'EOF'
#!/bin/bash

echo "🛑 停止PDF搜索系统..."

# 停止Node.js进程
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "✅ 所有服务已停止"
EOF

    chmod +x stop_services.sh
    echo "✅ 停止脚本已创建: ./stop_services.sh"
}

# 显示使用说明
show_usage() {
    echo ""
    echo "🎉 部署完成！"
    echo "=============="
    echo ""
    echo "📁 项目结构:"
    echo "  ├── api/          # 后端API服务"
    echo "  ├── web/          # 前端Vue应用"
    echo "  ├── start_services.sh  # 启动脚本"
    echo "  └── stop_services.sh   # 停止脚本"
    echo ""
    echo "🚀 启动服务:"
    echo "  ./start_services.sh"
    echo ""
    echo "🛑 停止服务:"
    echo "  ./stop_services.sh"
    echo ""
    echo "🌐 访问地址:"
    echo "  前端: http://localhost:3000"
    echo "  后端: http://localhost:3001"
    echo ""
    echo "📝 使用说明:"
    echo "  1. 打开浏览器访问 http://localhost:3000"
    echo "  2. 注册新用户或使用现有账户登录"
    echo "  3. 进入Dashboard，使用搜索功能"
    echo "  4. 将PDF文件放在 web/public/assets/pdf/ 目录下"
    echo "  5. 运行 'cd api && npm run db:seed' 处理PDF文件"
    echo ""
    echo "🔧 故障排除:"
    echo "  - 检查PostgreSQL服务是否运行"
    echo "  - 确认数据库连接配置正确"
    echo "  - 查看服务器日志获取错误信息"
    echo ""
    echo "📚 详细文档:"
    echo "  - PDF_SEARCH_IMPLEMENTATION_GUIDE.md"
    echo "  - QUICK_START_GUIDE.md"
}

# 主函数
main() {
    check_requirements
    setup_database
    setup_backend
    setup_frontend
    create_start_script
    create_stop_script
    show_usage
}

# 运行主函数
main "$@"