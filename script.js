let storedThoughts = JSON.parse(localStorage.getItem("thoughts")) || [];

function saveThoughts() {
  localStorage.setItem("thoughts", JSON.stringify(storedThoughts));
}
const floatingThoughts = [];

// Drag and throw variables
let draggedThought = null;
let dragOffset = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };
let lastMouseTime = 0;
let isDragging = false;

// Star field background with mouse distortion
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const stars = [];
const starCount = 200;
const mouse = { x: -1000, y: -1000 };

class Star {
  constructor() {
    this.reset();
    this.y = Math.random() * canvas.height;
    this.baseX = this.x;
    this.baseY = this.y;
  }
  
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = -10;
    this.baseX = this.x;
    this.baseY = this.y;
    this.speed = Math.random() * 0.5 + 0.2;
    this.size = Math.random() * 2 + 0.5;
    this.opacity = Math.random() * 0.8 + 0.2;

    const colorChoice = Math.random();
    if (colorChoice > 0.7) {
      this.color = `rgba(167, 139, 250, ${this.opacity})`;
    } else if (colorChoice > 0.4) {
      this.color = `rgba(236, 72, 153, ${this.opacity})`;
    } else {
      this.color = `rgba(255, 255, 255, ${this.opacity})`;
    }
    
    // Twinkle properties
    this.twinkleSpeed = Math.random() * 0.02 + 0.01;
    this.twinklePhase = Math.random() * Math.PI * 2;
  }
  
  update() {
    this.baseY += this.speed;
    
    if (this.baseY > canvas.height + 10) {
      this.reset();
    }
    
    // Mouse distortion effect
    const dx = mouse.x - this.baseX;
    const dy = mouse.y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 150;
    
    if (distance < maxDistance) {
      const force = (maxDistance - distance) / maxDistance;
      const angle = Math.atan2(dy, dx);
      const distortAmount = force * 50;
      
      this.x = this.baseX - Math.cos(angle) * distortAmount;
      this.y = this.baseY - Math.sin(angle) * distortAmount;

      this.currentOpacity = Math.min(1, this.opacity + force * 0.5);
    } else {

      this.x += (this.baseX - this.x) * 0.1;
      this.y += (this.baseY - this.y) * 0.1;
      this.currentOpacity = this.opacity;
    }

    this.twinklePhase += this.twinkleSpeed;
    this.twinkleOpacity = this.currentOpacity * (0.5 + Math.sin(this.twinklePhase) * 0.5);
  }
  
  draw() {
    ctx.fillStyle = this.color.replace(/[\d.]+\)$/g, `${this.twinkleOpacity})`);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    if (this.size > 1.5) {
      ctx.fillStyle = this.color.replace(/[\d.]+\)$/g, `${this.twinkleOpacity * 0.3})`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

for (let i = 0; i < starCount; i++) {
  stars.push(new Star());
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  stars.forEach(star => {
    star.update();
    star.draw();
  });
  
  requestAnimationFrame(animateStars);
}

animateStars();
document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});


let thoughtCount = 0;

const thoughtInput = document.getElementById('thoughtInput');
const charCount = document.getElementById('charCount');
const charCounter = document.querySelector('.char-counter');

thoughtInput.addEventListener('input', () => {
  const length = thoughtInput.value.length;
  charCount.textContent = length;
  
  charCounter.classList.remove('warning', 'limit');
  if (length > 180) {
    charCounter.classList.add('limit');
  } else if (length > 150) {
    charCounter.classList.add('warning');
  }
});

function setupDragAndThrow(thought) {
  let clickStartTime = 0;
  let hasMoved = false;
  
  thought.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('delete-btn')) return;
    
    e.preventDefault();
    
    clickStartTime = Date.now();
    hasMoved = false;
    
    const floatingData = thought.floatingData;
    if (!floatingData) return;
    floatingData.isDragging = true;
    draggedThought = floatingData;
    const rect = thought.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
    lastMouseTime = Date.now();
    
    isDragging = true;
    thought.style.cursor = 'grabbing';
    thought.style.zIndex = '1000';
    thought.style.transform = 'scale(1.1)';
  });
  
  // Add click to copy functionality
  thought.addEventListener('click', (e) => {
    const clickDuration = Date.now() - clickStartTime;
    if (!hasMoved && clickDuration < 200 && !e.target.classList.contains('delete-btn')) {
      copyToClipboard(thought.innerText.replace('×', '').trim());
      showNotification('Copied to clipboard! ✨');
    }
  });
}

// Global mouse move handler
document.addEventListener('mousemove', (e) => {
  if (!isDragging || !draggedThought) return;
  
  e.preventDefault();
  
  const currentTime = Date.now();
  const timeDelta = currentTime - lastMouseTime;
  
  // Update position based on mouse
  const newX = e.clientX - dragOffset.x;
  const newY = e.clientY - dragOffset.y;
  
  draggedThought.x = newX;
  draggedThought.y = newY;
  
  // Calculate velocity for throwing
  if (timeDelta > 0) {
    const velocityX = (e.clientX - lastMousePos.x) / timeDelta * 16;
    const velocityY = (e.clientY - lastMousePos.y) / timeDelta * 16;
    
    // Store velocity for throw
    draggedThought.vx = velocityX * 0.5;
    draggedThought.vy = velocityY * 0.5;
  }
  
  // Update mouse tracking
  lastMousePos.x = e.clientX;
  lastMousePos.y = e.clientY;
  lastMouseTime = currentTime;
  draggedThought.element.style.left = newX + 'px';
  draggedThought.element.style.top = newY + 'px';
});

// Global mouse up handler
document.addEventListener('mouseup', (e) => {
  if (!isDragging || !draggedThought) return;
  
  // Release the thought
  draggedThought.isDragging = false;
  draggedThought.element.style.cursor = 'pointer';
  draggedThought.element.style.zIndex = '10';
  draggedThought.element.style.transform = 'scale(1)';
  draggedThought.vx += (Math.random() - 0.5) * 0.2;
  draggedThought.vy += (Math.random() - 0.5) * 0.2;
  const maxVelocity = 10;
  draggedThought.vx = Math.max(-maxVelocity, Math.min(maxVelocity, draggedThought.vx));
  draggedThought.vy = Math.max(-maxVelocity, Math.min(maxVelocity, draggedThought.vy));
  if (Math.abs(draggedThought.vx) < 0.1 && Math.abs(draggedThought.vy) < 0.1) {
    draggedThought.vx = (Math.random() - 0.5) * 0.5;
    draggedThought.vy = (Math.random() - 0.5) * 0.5;
  }
  
  draggedThought = null;
  isDragging = false;
});

// Add thought with enhanced effects
function addThought() {
  const input = document.getElementById('thoughtInput');
  const wall = document.getElementById('wall');

  if (input.value.trim() === "") {
    input.style.animation = 'none';
    setTimeout(() => {
      input.style.animation = 'shake 0.5s';
    }, 10);
    return;
  }

  const thoughtText = input.value.trim();

  const thought = document.createElement('div');
  thought.className = 'thought floating-thought';
  thought.innerText = thoughtText;
  
  // Random colors for variety
  const hue1 = Math.random() * 60 + 240;
  const hue2 = Math.random() * 60 + 300;
  thought.style.background = `linear-gradient(135deg, hsla(${hue1}, 70%, 65%, 0.1), hsla(${hue2}, 70%, 65%, 0.1))`;
  thought.style.borderColor = `hsla(${hue1}, 70%, 65%, 0.3)`;
  
  // Random starting position
  thought.style.position = 'fixed';
  const startX = Math.random() * (window.innerWidth - 250);
  const startY = Math.random() * (window.innerHeight - 150);
  thought.style.left = startX + 'px';
  thought.style.top = startY + 'px';
  thought.style.zIndex = '10';
  
  // Add delete button
  const deleteBtn = document.createElement('div');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    removeStoredThought(thoughtText);
    removeThought(thought);
    const index = floatingThoughts.findIndex(ft => ft.element === thought);
    if (index > -1) floatingThoughts.splice(index, 1);
  };
  thought.appendChild(deleteBtn);
  
  wall.appendChild(thought);
  input.value = '';
  charCount.textContent = '0';
  charCounter.classList.remove('warning', 'limit');

  storedThoughts.push(thoughtText);
  saveThoughts();

  thoughtCount++;
  updateStats();
  
  // Celebration effect
  createCelebration(thought);
  const floatingData = {
    element: thought,
    x: startX,
    y: startY,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    rotation: 0,
    rotationSpeed: 0,
    isDragging: false,
    baseSpeed: 0.5
  };
  floatingThoughts.push(floatingData);

  thought.floatingData = floatingData;
  setupDragAndThrow(thought);
}

function removeThought(thought) {
  thought.classList.add('removing');
  setTimeout(() => {
    thought.remove();
    thoughtCount--;
    updateStats();
  }, 600);
}

function updateStats() {
  const statNumber = document.getElementById('totalThoughts');
  statNumber.style.animation = 'none';
  setTimeout(() => {
    statNumber.textContent = thoughtCount;
    statNumber.style.animation = 'pulse 0.5s';
  }, 10);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #a78bfa, #ec4899);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(167, 139, 250, 0.4);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function createCelebration(element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.textContent = ['✨', '💭', '🌟', '💫'][Math.floor(Math.random() * 4)];
    particle.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${centerY}px;
      font-size: 20px;
      pointer-events: none;
      z-index: 1000;
      animation: celebrateParticle 1s ease-out forwards;
    `;
    
    const angle = (Math.PI * 2 * i) / 12;
    const distance = 80 + Math.random() * 40;
    particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
    
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  @keyframes celebrateParticle {
    0% {
      transform: translate(0, 0) scale(0);
      opacity: 1;
    }
    100% {
      transform: translate(var(--tx), var(--ty)) scale(1);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

function renderThought(text) {
  const wall = document.getElementById("wall");

  const thought = document.createElement("div");
  thought.className = "thought floating-thought";
  thought.innerText = text;

  // Random colors for variety
  const hue1 = Math.random() * 60 + 240;
  const hue2 = Math.random() * 60 + 300;
  thought.style.background = `linear-gradient(135deg, hsla(${hue1}, 70%, 65%, 0.1), hsla(${hue2}, 70%, 65%, 0.1))`;
  thought.style.borderColor = `hsla(${hue1}, 70%, 65%, 0.3)`;
  thought.style.position = 'fixed';
  const startX = Math.random() * (window.innerWidth - 250);
  const startY = Math.random() * (window.innerHeight - 150);
  thought.style.left = startX + 'px';
  thought.style.top = startY + 'px';
  thought.style.zIndex = '10';

  const deleteBtn = document.createElement("div");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = '×';

  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    removeStoredThought(text);
    removeThought(thought);
    const index = floatingThoughts.findIndex(ft => ft.element === thought);
    if (index > -1) floatingThoughts.splice(index, 1);
  };

  thought.appendChild(deleteBtn);
  wall.appendChild(thought);

  const floatingData = {
    element: thought,
    x: startX,
    y: startY,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    rotation: 0,
    rotationSpeed: 0,
    isDragging: false,
    baseSpeed: 0.5
  };
  floatingThoughts.push(floatingData);
  
  thought.floatingData = floatingData;
  
  setupDragAndThrow(thought);
}

function removeStoredThought(text) {
  storedThoughts = storedThoughts.filter(t => t !== text);
  saveThoughts();
}

thoughtInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    addThought();
  }
});

window.addEventListener("load", () => {
  storedThoughts.forEach(text => {
    renderThought(text);
  });
  thoughtCount = storedThoughts.length;
  updateStats();

  animateFloatingThoughts();
});

// Animate floating thoughts
function animateFloatingThoughts() {
  floatingThoughts.forEach(ft => {

    if (ft.isDragging) return;
    const damping = 0.98;
    const currentSpeed = Math.sqrt(ft.vx * ft.vx + ft.vy * ft.vy);
    const targetSpeed = ft.baseSpeed;

    if (currentSpeed > targetSpeed) {
      ft.vx *= damping;
      ft.vy *= damping;

      if (currentSpeed < targetSpeed * 1.2) {
        const angle = Math.atan2(ft.vy, ft.vx);
        ft.vx = Math.cos(angle) * targetSpeed;
        ft.vy = Math.sin(angle) * targetSpeed;
      }
    }
    
    // Update position
    ft.x += ft.vx;
    ft.y += ft.vy;

    const width = 200;
    const height = ft.element.offsetHeight || 100;

    if (ft.x <= 0) {
      ft.x = 0;
      ft.vx *= -1;
    }
    if (ft.x + width >= window.innerWidth) {
      ft.x = window.innerWidth - width;
      ft.vx *= -1;
    }
    if (ft.y <= 0) {
      ft.y = 0;
      ft.vy *= -1;
    }
    if (ft.y + height >= window.innerHeight) {
      ft.y = window.innerHeight - height;
      ft.vy *= -1;
    }

    ft.element.style.left = ft.x + 'px';
    ft.element.style.top = ft.y + 'px';
  });
  
  requestAnimationFrame(animateFloatingThoughts);
}