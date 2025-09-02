// 移动端性能优化配置
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const FPS = isMobile ? 30 : 60; // 移动端降低帧率
const frameInterval = 1000 / FPS;
let lastFrameTime = 0;

// 游戏变量
let canvas, ctx;
let player;
let platforms = [];
let score = 0;
let gameRunning = false;
let cameraOffset = { x: 0, y: 0 };
let jumpPower = 0;
let isCharging = false;
let particles = [];

// 背景粒子系统
let backgroundParticles = [];
let particlesContainer2, particlesContainer3;

// 得分系统变量
let consecutiveCenterJumps = 0;  // 连续中心位置跳跃次数
let consecutivePlatformCrossings = 0;  // 连续越过平台次数
let lastPlatformIndex = -1;  // 上一个平台索引
let hasLanded = false;  // 玩家是否已经接触过平台

// 颜色数组
const playerColors = [
    '#00c6ff',  // 青色
    '#ff00c8',  // 粉色
    '#00ff9d',  // 绿色
    '#ff6f00',  // 橙色
    '#9d00ff',  // 紫色
    '#00ffcc',  // 青绿色
    '#ff006e'   // 红色
];

const platformColors = [
    'rgba(0, 198, 255, 0.7)',  // 青色
    'rgba(255, 0, 200, 0.7)',  // 粉色
    'rgba(0, 255, 157, 0.7)',  // 绿色
    'rgba(255, 111, 0, 0.7)',  // 橙色
    'rgba(157, 0, 255, 0.7)',  // 紫色
    'rgba(0, 255, 204, 0.7)',  // 青绿色
    'rgba(255, 0, 110, 0.7)'   // 红色
];

// DOM元素
let startScreen, gameOverScreen, startButton, restartButton, finalScore, gameCanvas, particlesContainer;

// 初始化DOM元素
function initDOMElements() {
    startScreen = document.getElementById('startScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    startButton = document.getElementById('startButton');
    restartButton = document.getElementById('restartButton');
    finalScore = document.getElementById('finalScore');
    gameCanvas = document.getElementById('gameCanvas');
    particlesContainer = document.getElementById('particlesContainer');
    particlesContainer2 = document.getElementById('particlesContainer2');
    particlesContainer3 = document.getElementById('particlesContainer3');
    
    // 检查所有元素是否存在
    if (!startScreen || !gameOverScreen || !startButton || !restartButton || !finalScore || !gameCanvas || !particlesContainer) {
        console.error('Some DOM elements are missing');
        return false;
    }
    
    return true;
}

// 初始化游戏
function initGame() {
    // 初始化DOM元素
    if (!initDOMElements()) {
        console.error('Failed to initialize DOM elements');
        return;
    }
    
    canvas = gameCanvas;
    if (!canvas) {
        console.error('Game canvas not found');
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context from canvas');
        return;
    }
    
    resizeCanvas();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化玩家
    player = {
        x: 135,  // 居中于第一个平台
        y: canvas.height - 180,  // 位于第一个平台上方
        width: 30,
        height: 30,
        velocityX: 0,
        velocityY: 0,
        isOnGround: true,  // 开始时就在平台上
        color: '#00c6ff',
        colorIndex: 0
    };
    
    // 初始化平台
    platforms = [
        { x: 100, y: canvas.height - 150, width: 100, height: 20, color: platformColors[0] },
        { x: 250, y: canvas.height - 200, width: 100, height: 20, color: platformColors[1] },
        { x: 400, y: canvas.height - 250, width: 100, height: 20, color: platformColors[2] }
    ];
    
    // 重置游戏状态
    score = 0;
    gameRunning = true;
    cameraOffset = { x: 0, y: 0 };
    particles = [];
    
    // 初始化背景粒子
    initBackgroundParticles();
    
    // 重置得分系统变量
    consecutiveCenterJumps = 0;
    consecutivePlatformCrossings = 0;
    lastPlatformIndex = -1;
    hasLanded = false;
    
    // 隐藏屏幕
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // 显示粒子背景
    showParticles();
    
    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}

// 移动端优化的背景粒子系统
function initBackgroundParticles() {
    const containers = [particlesContainer, particlesContainer2, particlesContainer3];
    const mobileParticleCount = isMobile ? [6, 10, 15] : [12, 20, 30];
    
    containers.forEach((container, index) => {
        if (!container) return;
        
        const count = mobileParticleCount[index] || (isMobile ? 8 : 15);
        const colors = ['rgba(0, 198, 255, 0.7)', 'rgba(157, 0, 255, 0.5)', 'rgba(0, 255, 204, 0.6)'];
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = isMobile ? Math.random() * 2 + 0.5 : Math.random() * 3 + 1;
            
            particle.style.position = 'absolute';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = colors[index] || colors[0];
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.pointerEvents = 'none';
            particle.style.willChange = 'transform'; // 启用硬件加速
            
            // 移动端使用更简单的动画
            const duration = isMobile ? (2.5 + Math.random() * 1.5) : (4 + Math.random() * 3);
            particle.style.animation = `float${index + 1} ${duration}s ease-in-out infinite`;
            particle.style.animationDelay = Math.random() * 1 + 's';
            
            container.appendChild(particle);
        }
    });
    
    // 简化的CSS动画
    const style = document.createElement('style');
    style.textContent = isMobile ? `
        @keyframes float1 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-8px) translateX(4px); }
        }
        @keyframes float2 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-6px) translateX(-3px); }
        }
        @keyframes float3 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-5px) translateX(2px); }
        }
    ` : `
        @keyframes float1 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-15px) translateX(8px); }
        }
        @keyframes float2 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-10px) translateX(-5px); }
        }
        @keyframes float3 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-8px) translateX(3px); }
        }
    `;
    document.head.appendChild(style);
}

// 更新背景粒子 - 不再需要频繁更新
function updateBackgroundParticles() {
    // CSS动画会自动处理所有效果
}

// 移动端优化的平台生成
function generatePlatforms() {
    const lastPlatform = platforms[platforms.length - 1];
    
    // 移动端减少平台生成频率
    const generateThreshold = isMobile ? canvas.width * 0.5 : canvas.width * 0.6;
    if (player.x + generateThreshold > lastPlatform.x + lastPlatform.width) {
        const minDistance = isMobile ? 100 : 150;
        const maxDistance = isMobile ? canvas.width * 0.35 : canvas.width * 0.4;
        const distance = Math.min(maxDistance, minDistance + Math.random() * 80);
        
        const newX = lastPlatform.x + distance;
        const newY = lastPlatform.y - 70 + Math.random() * 140;
        
        const minY = isMobile ? 60 : 100;
        const maxY = canvas.height - (isMobile ? 100 : 150);
        const clampedY = Math.max(minY, Math.min(maxY, newY));
        
        const colorIndex = platforms.length % platformColors.length;
        
        platforms.push({
            x: newX,
            y: clampedY,
            width: isMobile ? 85 : 100,
            height: 20,
            color: platformColors[colorIndex]
        });
    }
}

// 检查碰撞
function checkCollisions() {
    // 平台碰撞检测
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height <= platform.y + 10 &&
            player.y + player.height + player.velocityY >= platform.y
        ) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isOnGround = true;
            
            // 计算平台中心位置
            const platformCenter = platform.x + platform.width / 2;
            const playerCenter = player.x + player.width / 2;
            const distanceToCenter = Math.abs(playerCenter - platformCenter);
            
            // 判断是否在中心位置
            const isCenterHit = distanceToCenter < platform.width * 0.2; // 中心20%范围内
            
            // 只有当玩家之前不在平台上时才加分
            if (!hasLanded || lastPlatformIndex !== i) {
                // 计算得分
                let points = 1; // 基础得分
                
                if (isCenterHit) {
                    points = 2; // 中心位置得2分
                    consecutiveCenterJumps++;
                    
                    // 如果连续中心跳跃，得分翻倍
                    if (consecutiveCenterJumps > 1) {
                        points *= Math.pow(2, consecutiveCenterJumps - 1);
                    }
                } else {
                    consecutiveCenterJumps = 0; // 重置连续中心跳跃计数
                }
                
                // 检查是否连续越过平台
                if (lastPlatformIndex !== -1 && i > lastPlatformIndex + 1) {
                    // 连续越过多个平台
                    const platformsCrossed = i - lastPlatformIndex;
                    consecutivePlatformCrossings = platformsCrossed;
                    points = 2 * platformsCrossed; // 第一个平台得2分，按个数翻倍
                } else {
                    consecutivePlatformCrossings = 0; // 重置连续越过平台计数
                }
                
                // 更新总得分
                score += points;
                
                // 标记玩家已经接触过平台
                hasLanded = true;
            }
            
            // 更新最后平台索引
            lastPlatformIndex = i;
            
            // 更换玩家和平台颜色
            const colorIndex = (i + 1) % playerColors.length;
            player.color = playerColors[colorIndex];
            platform.color = platformColors[colorIndex];
            
            // 生成着陆粒子
            generateLandingParticles(platform.x + platform.width / 2, platform.y, platform.color);
        }
    }
}

// 检查游戏结束
function checkGameOver() {
    // 如果玩家掉出屏幕
    if (player.y > canvas.height) {
        endGame();
    }
}

// 渲染游戏
function render() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 保存上下文
    ctx.save();
    
    // 应用相机变换
    ctx.translate(-cameraOffset.x, 0);
    
    // 绘制平台
    for (let platform of platforms) {
        drawPlatform(platform);
    }
    
    // 绘制玩家
    drawPlayer();
    
    // 绘制粒子
    for (let particle of particles) {
        particle.draw(ctx);
    }
    
    // 恢复上下文
    ctx.restore();
    
    // 绘制分数
    drawScore();
}

// 绘制玩家
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制发光效果
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// 绘制平台
function drawPlatform(platform) {
    ctx.fillStyle = platform.color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // 绘制平台边框
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // 绘制平台发光效果
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    ctx.shadowBlur = 0;
}

// 绘制分数
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'right';  // 右对齐
    ctx.textBaseline = 'bottom';  // 底部对齐
    ctx.fillText(`得分: ${score}`, canvas.width - 20, canvas.height - 20);  // 右下角位置
}

// 生成着陆粒子
function generateLandingParticles(x, y, color) {
    // 如果没有提供颜色，则使用默认颜色
    const particleColor = color || 'rgba(0, 198, 255, 0.8)';
    
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, particleColor));
    }
}

// 移动端优化的粒子类
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = isMobile ? Math.random() * 3 + 1 : Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * (isMobile ? 4 : 6);
        this.speedY = (Math.random() - 0.5) * (isMobile ? 4 : 6) - (isMobile ? 2 : 3);
        this.color = color;
        this.life = isMobile ? 20 : 30;
        this.maxLife = this.life;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.1;
        this.life--;
        this.size *= 0.95;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 开始游戏
function startGame() {
    initGame();
}

// 结束游戏
function endGame() {
    gameRunning = false;
    finalScore.textContent = score;
    gameOverScreen.classList.remove('hidden');
    
    // 隐藏粒子背景
    particlesContainer.style.display = 'none';
}

// 显示粒子背景
function showParticles() {
    particlesContainer.style.display = 'block';
}

// 跳跃充电
function chargeJump() {
    if (!gameRunning || !player.isOnGround) return;
    
    isCharging = true;
    jumpPower = 0;
}

// 执行跳跃
function jump() {
    if (!gameRunning || !isCharging) return;
    
    isCharging = false;
    
    // 计算跳跃速度
    const jumpSpeed = Math.min(15, jumpPower / 3);
    
    // 设置玩家速度
    player.velocityX = jumpSpeed;
    player.velocityY = -15;
    player.isOnGround = false;
    
    // 生成跳跃粒子
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(
            player.x + player.width / 2, 
            player.y + player.height, 
            player.color.replace(')', ', 0.8)').replace('rgb', 'rgba')
        ));
    }
}

// 移动端优化的事件处理
function bindEventListeners() {
    if (!startButton || !restartButton || !gameCanvas) {
        console.error('Cannot bind event listeners: some elements are missing');
        return;
    }
    
    // 按钮事件
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // 触摸事件 - 优化移动端响应
    gameCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        chargeJump();
    }, { passive: false });
    
    gameCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        jump();
    }, { passive: false });
    
    // 鼠标事件
    gameCanvas.addEventListener('mousedown', chargeJump);
    gameCanvas.addEventListener('mouseup', jump);
    
    // 优化窗口调整事件 - 防抖处理
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
        }, 250);
    });
}

// 确保DOM加载完成后初始化游戏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// 持续充电跳跃力量
setInterval(() => {
    if (isCharging) {
        jumpPower += 1;
    }
}, 20);

// 移动端优化的画布调整
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    
    if (isMobile) {
        // 移动端：降低分辨率提升性能
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr * 0.75;
        canvas.height = rect.height * dpr * 0.75;
        ctx.scale(dpr * 0.75, dpr * 0.75);
        
        // 设置CSS尺寸
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    } else {
        // 桌面端：高分辨率
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
}

// 移动端优化的游戏主循环
function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    // 帧率限制 - 移动端30fps，桌面60fps
    if (currentTime - lastFrameTime < frameInterval) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastFrameTime = currentTime;
    
    update();
    render();
    
    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    // 更新玩家
    updatePlayer();
    
    // 更新相机
    updateCamera();
    
    // 更新粒子
    updateParticles();
    
    // 生成新平台
    generatePlatforms();
    
    // 检查碰撞
    checkCollisions();
    
    // 检查游戏结束
    checkGameOver();
}

// 更新玩家
function updatePlayer() {
    // 重力 - 增强下落速度
    player.velocityY += 0.8;
    
    // 更新位置
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // 重置地面状态
    player.isOnGround = false;
}

// 更新相机
function updateCamera() {
    // 相机跟随玩家
    cameraOffset.x = player.x - canvas.width / 3;
}

// 移动端优化的粒子系统
function updateParticles() {
    const maxParticles = isMobile ? 20 : 50;
    
    // 限制粒子数量
    if (particles.length > maxParticles) {
        particles.splice(0, particles.length - maxParticles);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 背景粒子系统 - 超简化版
function initBackgroundParticles() {
    const containers = [particlesContainer, particlesContainer2, particlesContainer3];
    
    containers.forEach((container, index) => {
        if (!container) return;
        
        const particleCount = [12, 20, 30][index] || 10;
        const colors = ['rgba(0, 198, 255, 0.7)', 'rgba(157, 0, 255, 0.5)', 'rgba(0, 255, 204, 0.6)'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 3 + 1;
            
            particle.style.position = 'absolute';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = colors[index] || colors[0];
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.pointerEvents = 'none';
            particle.style.animation = `float${index + 1} ${4 + Math.random() * 3}s ease-in-out infinite`;
            particle.style.animationDelay = Math.random() * 2 + 's';
            
            container.appendChild(particle);
        }
    });
    
    // 添加浮动动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float1 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-15px) translateX(8px); }
        }
        @keyframes float2 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-10px) translateX(-5px); }
        }
        @keyframes float3 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-8px) translateX(3px); }
        }
    `;
    document.head.appendChild(style);
}

// 更新背景粒子 - 不再需要频繁更新
function updateBackgroundParticles() {
    // CSS动画会自动处理所有效果
}