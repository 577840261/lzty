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

// 移动端检测
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
}

// 移动端优化的背景粒子系统
function initBackgroundParticles() {
    if (isMobile()) {
        // 移动端：极简背景，仅保留静态装饰
        const containers = [particlesContainer, particlesContainer2, particlesContainer3];
        const particleCount = [5, 8, 12]; // 大幅减少粒子数量
        
        containers.forEach((container, index) => {
            if (!container) return;
            
            const colors = ['rgba(0, 198, 255, 0.4)', 'rgba(157, 0, 255, 0.3)', 'rgba(0, 255, 204, 0.3)'];
            
            for (let i = 0; i < particleCount[index]; i++) {
                const particle = document.createElement('div');
                const size = Math.random() * 2 + 0.5; // 更小粒子
                
                particle.style.position = 'absolute';
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.backgroundColor = colors[index];
                particle.style.borderRadius = '50%';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.opacity = '0.4';
                
                container.appendChild(particle);
            }
        });
    } else {
        // 桌面端：保留完整动画效果
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
}

// 移动端优化的更新频率
let lastUpdateTime = 0;
const MOBILE_FPS = 30;
const DESKTOP_FPS = 60;

function gameLoop(currentTime) {
    const fps = isMobile() ? MOBILE_FPS : DESKTOP_FPS;
    const frameInterval = 1000 / fps;
    
    if (currentTime - lastUpdateTime >= frameInterval) {
        update();
        render();
        lastUpdateTime = currentTime;
    }
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// 更新背景粒子 - 不再需要频繁更新
function updateBackgroundParticles() {
    // CSS动画会自动处理所有效果
}

// 移动端优化的平台生成
function generatePlatforms() {
    if (isMobile() && platforms.length > 15) {
        return; // 移动端限制平台数量
    }
    
    const lastPlatform = platforms[platforms.length - 1];
    
    if (player.x + canvas.width * 0.6 > lastPlatform.x + lastPlatform.width) {
        const minDistance = isMobile() ? 120 : 150;
        const maxDistance = canvas.width * (isMobile() ? 0.35 : 0.4);
        const distance = Math.min(maxDistance, minDistance + Math.random() * 100);
        
        const newX = lastPlatform.x + distance;
        const newY = lastPlatform.y - 90 + Math.random() * 180;
        
        const minY = isMobile() ? 80 : 100;
        const maxY = canvas.height - (isMobile() ? 120 : 150);
        const clampedY = Math.max(minY, Math.min(maxY, newY));
        
        const colorIndex = (platforms.length) % platformColors.length;
        
        platforms.push({
            x: newX,
            y: clampedY,
            width: isMobile() ? 90 : 100, // 移动端稍窄平台
            height: isMobile() ? 15 : 20, // 移动端稍薄平台
            color: platformColors[colorIndex]
        });
    }
}

// 移动端优化的碰撞检测
function checkCollisions() {
    // 移动端简化碰撞检测，减少计算
    const playerBottom = player.y + player.height;
    const playerRight = player.x + player.width;
    
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        
        if (
            player.x < platform.x + platform.width &&
            playerRight > platform.x &&
            playerBottom <= platform.y + 5 &&
            playerBottom + player.velocityY >= platform.y
        ) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isOnGround = true;
            
            // 移动端简化得分逻辑
            if (!hasLanded || lastPlatformIndex !== i) {
                score += isMobile() ? 1 : (Math.random() > 0.8 ? 2 : 1);
                hasLanded = true;
            }
            
            lastPlatformIndex = i;
            
            // 移动端减少颜色变化频率
            if (!isMobile() || platforms.length % 3 === 0) {
                const colorIndex = (i + 1) % playerColors.length;
                player.color = playerColors[colorIndex];
                platform.color = platformColors[colorIndex];
            }
            
            // 移动端减少粒子效果
            if (!isMobile()) {
                generateLandingParticles(platform.x + platform.width / 2, platform.y, platform.color);
            }
            break;
        }
    }
}

// 移动端优化的渲染
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 移动端减少绘制细节
    if (isMobile()) {
        // 简化玩家绘制
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // 简化平台绘制
        for (const platform of platforms) {
            if (platform.x + platform.width < camera.x || platform.x > camera.x + canvas.width) {
                continue; // 跳过屏幕外平台
            }
            
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    } else {
        // 桌面端完整渲染
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        for (const platform of platforms) {
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    }
    
    // 绘制分数
    ctx.fillStyle = '#fff';
    ctx.font = isMobile() ? 'bold 20px Arial' : 'bold 24px Arial';
    ctx.fillText(`分数: ${score}`, 20, 40);
}

// 移动端优化的玩家控制
function updatePlayer() {
    if (keys.left || keys.a) {
        player.velocityX = isMobile() ? -4 : -5; // 移动端稍慢速度
    } else if (keys.right || keys.d) {
        player.velocityX = isMobile() ? 4 : 5;
    } else {
        player.velocityX *= isMobile() ? 0.85 : 0.8; // 移动端更快停止
    }
    
    player.velocityY += isMobile() ? 0.4 : 0.5; // 移动端重力稍小
    
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    if (keys.space && player.isOnGround) {
        player.velocityY = isMobile() ? -10 : -12; // 移动端跳跃稍低
        player.isOnGround = false;
    }
}

// 检查游戏结束
function checkGameOver() {
    // 如果玩家掉出屏幕
    if (player.y > canvas.height) {
        endGame();
    }
}

// 移动端优化的渲染
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 移动端减少绘制细节
    if (isMobile()) {
        // 简化玩家绘制
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // 简化平台绘制
        for (const platform of platforms) {
            if (platform.x + platform.width < cameraOffset.x || platform.x > cameraOffset.x + canvas.width) {
                continue; // 跳过屏幕外平台
            }
            
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    } else {
        // 桌面端完整渲染
        ctx.save();
        ctx.translate(-cameraOffset.x, 0);
        
        for (let platform of platforms) {
            drawPlatform(platform);
        }
        
        drawPlayer();
        
        for (let particle of particles) {
            particle.draw(ctx);
        }
        
        ctx.restore();
    }
    
    // 绘制分数
    ctx.fillStyle = '#fff';
    ctx.font = isMobile() ? 'bold 20px Arial' : 'bold 24px Arial';
    ctx.fillText(`分数: ${score}`, 20, 40);
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

// 粒子类
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.color = color;
        this.life = 30; // 粒子生命周期
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        this.size *= 0.95; // 逐渐变小
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 30; // 透明度随生命周期减少
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; // 重置透明度
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

// 绑定事件监听器
function bindEventListeners() {
    if (!startButton || !restartButton || !gameCanvas) {
        console.error('Cannot bind event listeners: some elements are missing');
        return;
    }
    
    // 按钮事件
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // 触摸事件
    gameCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        chargeJump();
    });
    
    gameCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        jump();
    });
    
    // 鼠标事件
    gameCanvas.addEventListener('mousedown', chargeJump);
    
    gameCanvas.addEventListener('mouseup', jump);
    
    // 窗口大小调整
    window.addEventListener('resize', resizeCanvas);
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

// 调整画布大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 游戏主循环
function gameLoop() {
    if (!gameRunning) return;
    
    update();
    render();
    
    // 更新背景粒子
    updateBackgroundParticles();
    
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

// 移动端优化的玩家控制
function updatePlayer() {
    player.velocityY += isMobile() ? 0.4 : 0.5; // 移动端重力稍小
    
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    player.isOnGround = false;
}

// 更新相机
function updateCamera() {
    // 相机跟随玩家
    cameraOffset.x = player.x - canvas.width / 3;
}

// 更新粒子
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        
        // 移除过期粒子
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}