# 使用官方 Node.js 鏡像
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 yarn.lock
COPY package.json yarn.lock ./

# 安裝所有依賴（包含 devDependencies，建置時需要）
RUN yarn install --frozen-lockfile

# 複製應用程式代碼
COPY . .

# 建置前端
RUN yarn build

# 移除 devDependencies 以減少 image 大小（可選）
# RUN yarn install --frozen-lockfile --production && yarn cache clean

# 暴露端口（Cloud Run 會自動設定 PORT 環境變數）
EXPOSE 8080

# 啟動應用程式
CMD ["node", "server.js"]