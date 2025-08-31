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
    // 重力
    player.velocityY += 0.5;
    
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

// 生成新平台
function generatePlatforms() {
    const lastPlatform = platforms[platforms.length - 1];
    
    // 当玩家接近屏幕右侧时生成新平台
    // 调整生成条件，确保在移动端也能看到下一个平台
    if (player.x + canvas.width * 0.6 > lastPlatform.x + lastPlatform.width) {
        // 调整平台生成距离，确保下一个平台始终在屏幕可视范围内
        // 在移动端设备上，确保平台不会生成得太远
        const minDistance = 150;  // 最小距离
        const maxDistance = canvas.width * 0.4;  // 最大距离为屏幕宽度的40%
        const distance = Math.min(maxDistance, minDistance + Math.random() * 100);
        
        const newX = lastPlatform.x + distance;
        // 再次增大Y轴变化范围，使平台之间的高度差更加明显
        const newY = lastPlatform.y - 90 + Math.random() * 180;
        
        // 确保平台不会生成在屏幕外
        const minY = 100;  // 最高位置
        const maxY = canvas.height - 150;  // 最低位置
        const clampedY = Math.max(minY, Math.min(maxY, newY));
        
        // 计算新平台的颜色索引
        const colorIndex = (platforms.length) % platformColors.length;
        
        platforms.push({
            x: newX,
            y: clampedY,
            width: 100,
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