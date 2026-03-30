// Presentation Data
const slides = [
  { id: 1, title: "Capa", component: "coverSlide" },
  { id: 8, title: "Nossos Valores", component: "valuesSlide" },
  { id: 19, title: "Sobre Nós", component: "valuePropositionSlide" },
  { id: 6, title: "Fluxo de Negócios", component: "businessFlowSlide" },
  { id: 7, title: "Como Vamos Ajudar", component: "howWeHelpSlide" },
  { id: 2, title: "Proposta de Valor", component: "itManagementSlide" },
  {
    id: 18,
    title: "Consultoria de Tecnologia",
    component: "consultoriaTecnologiaSlide",
  },
  { id: 9, title: "Agente de IA", component: "aiAgentSlide" },
  { id: 10, title: "Emissor Fácil", component: "emissorFacilSlide" },
  { id: 11, title: "CloudBox/VDI", component: "cloudBoxSlide" },
  { id: 12, title: "Gestão de TI", component: "itManagementSlide" },
  { id: 13, title: "Software Personalizado", component: "customSoftwareSlide" },
  { id: 14, title: "Clientes", component: "clientsSlide" },
  { id: 15, title: "Diferenciais", component: "differentialsSlide" },
  { id: 16, title: "Processo", component: "processSlide" },
  { id: 17, title: "Contato", component: "contactSlide" },
];

// Global state
let currentSlide = 0;

// Image optimization variables
let imageCache = new Map();
let preloadedImages = new Set();
let lazyLoadObserver = null;

// Mobile navigation variables
let isMobile = false;
let isScrolling = false;
let scrollTimeout = null;
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let lastScrollTime = 0;
let scrollDirection = 0;

// Initialize presentation
document.addEventListener("DOMContentLoaded", function () {
  detectDevice();
  initializePresentation();
  setupEventListeners();
  initializeImageOptimization();
  preloadCriticalImages();
  loadSlide(currentSlide);
});

// Device detection
function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileDevice =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent,
    );
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const screenWidth = window.innerWidth;

  isMobile = isMobileDevice || isTouchDevice || screenWidth <= 1024;

  // Add mobile class to body for CSS targeting
  if (isMobile) {
    document.body.classList.add("mobile-device");
    addMobileNavigationHint();
  }

  console.log("Device detected:", {
    isMobile,
    isMobileDevice,
    isTouchDevice,
    screenWidth,
  });
}

function addMobileNavigationHint() {
  // Add navigation hint for mobile users
  const hint = document.createElement("div");
  hint.id = "mobile-navigation-hint";
  hint.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 1000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: fadeInOut 3s ease-in-out;
    ">
      📱 Deslize ou role para navegar
    </div>
  `;

  document.body.appendChild(hint);

  // Remove hint after 3 seconds
  setTimeout(() => {
    if (hint.parentNode) {
      hint.parentNode.removeChild(hint);
    }
  }, 3000);
}

function initializePresentation() {
  const container = document.getElementById("presentation-container");
  if (container) {
    if (isMobile) {
      // Mobile: full width responsive
      container.style.width = "100%";
      container.style.maxWidth = "100%";
      container.style.aspectRatio = "auto";
      container.style.maxHeight = "100vh";
      container.style.margin = "0";
      container.style.overflow = "auto";
      container.style.scrollBehavior = "smooth";
    } else {
      // Desktop: full width responsive
      container.style.width = "100%";
      container.style.maxWidth = "100%";
      container.style.aspectRatio = "auto";
      container.style.maxHeight = "100vh";
      container.style.margin = "0";
      container.style.overflow = "hidden";
    }
  }
}

function setupEventListeners() {
  // Button navigation
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  if (prevBtn) {
    prevBtn.addEventListener("click", prevSlide);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", nextSlide);
  }

  if (isMobile) {
    // Mobile: Touch, swipe and scroll navigation
    setupMobileNavigation();
  } else {
    // Desktop: Keyboard and touch navigation
    document.addEventListener("keydown", handleKeyPress);
    setupDesktopTouchNavigation();
  }
}

// Mobile navigation setup
function setupMobileNavigation() {
  // Scroll navigation with wheel events
  let isScrolling = false;
  let wheelScrollTimeout = null;

  // Handle wheel events for slide navigation
  document.addEventListener(
    "wheel",
    function (e) {
      if (isScrolling) return;

      isScrolling = true;
      e.preventDefault();

      if (e.deltaY > 0) {
        // Scroll down - next slide
        nextSlide();
      } else {
        // Scroll up - previous slide
        prevSlide();
      }

      // Reset scrolling flag after animation
      setTimeout(() => {
        isScrolling = false;
      }, 800);
    },
    { passive: false },
  );

  // Touch scroll navigation
  let lastScrollTop = 0;
  let touchScrollTimeout = null;

  window.addEventListener(
    "scroll",
    function () {
      if (touchScrollTimeout) {
        clearTimeout(touchScrollTimeout);
      }

      touchScrollTimeout = setTimeout(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > lastScrollTop ? "down" : "up";

        // Detect scroll to change slides (only if significant scroll)
        if (Math.abs(scrollTop - lastScrollTop) > 150) {
          if (scrollDirection === "down") {
            nextSlide();
          } else {
            prevSlide();
          }
          lastScrollTop = scrollTop;
        }
      }, 200);
    },
    { passive: true },
  );

  // Touch/swipe navigation
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  document.addEventListener(
    "touchstart",
    function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    function (e) {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const diffX = startX - endX;
      const diffY = startY - endY;
      const diffTime = endTime - startTime;

      // Only trigger if horizontal swipe is more significant than vertical
      // and swipe is fast enough (less than 500ms)
      if (
        Math.abs(diffX) > Math.abs(diffY) &&
        Math.abs(diffX) > 50 &&
        diffTime < 500
      ) {
        if (diffX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }

      startX = 0;
      startY = 0;
      startTime = 0;
    },
    { passive: true },
  );

  // Prevent default scroll behavior on touch devices
  document.addEventListener(
    "touchmove",
    function (e) {
      // Allow vertical scrolling but prevent horizontal
      if (
        Math.abs(e.touches[0].clientX - startX) >
        Math.abs(e.touches[0].clientY - startY)
      ) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
}

// Desktop touch navigation
function setupDesktopTouchNavigation() {
  let startX = 0;
  let startY = 0;

  document.addEventListener(
    "touchstart",
    function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    function (e) {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = startX - endX;
      const diffY = startY - endY;

      // Only trigger if horizontal swipe is more significant than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }

      startX = 0;
      startY = 0;
    },
    { passive: true },
  );
}

function handleKeyPress(event) {
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    nextSlide();
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    prevSlide();
  }
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  loadSlide(currentSlide);
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  loadSlide(currentSlide);
}

function loadSlide(slideIndex) {
  const slideContent = document.getElementById("slide-content");
  const slideCounter = document.getElementById("slide-counter-text");

  if (!slideContent) return;

  const slide = slides[slideIndex];
  const slideHTML = generateSlideHTML(slide.component);

  // Add transition effect for mobile
  if (isMobile) {
    slideContent.style.opacity = "0";
    slideContent.style.transform = "translateY(20px)";
    // Reset scroll position
    slideContent.scrollTop = 0;
  }

  slideContent.innerHTML = slideHTML;

  // Add data attribute for slide identification
  slideContent.setAttribute("data-slide", slideIndex);

  if (slideCounter) {
    slideCounter.textContent = `${slideIndex + 1} / ${slides.length}`;
  }

  // Optimize images in the newly loaded slide
  setTimeout(() => {
    optimizeImagesInSlide();
  }, 10);

  // Trigger animations and transitions
  setTimeout(() => {
    if (isMobile) {
      slideContent.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      slideContent.style.opacity = "1";
      slideContent.style.transform = "translateY(0)";

      // Ensure scroll is properly configured
      configureMobileScroll(slideContent, slideIndex);
    }
    triggerAnimations();
  }, 100);

  // Preload next slide images
  preloadNextSlideImages(slideIndex);
}

function configureMobileScroll(slideContent, slideIndex) {
  // Remove any existing scroll classes
  slideContent.classList.remove("long-content", "allow-scroll");

  // Force reflow to get accurate measurements
  slideContent.offsetHeight;

  // Check if content needs scrolling
  const contentHeight = slideContent.scrollHeight;
  const viewportHeight = window.innerHeight;

  // Specific slides that need scroll (0-indexed)
  const slidesThatNeedScroll = [1, 3, 6, 7, 8, 9, 10, 13, 14, 15]; // Slides 2(Values), 4, 7, 8, 9, 10, 11, 14, 15, 16

  console.log("Configuring scroll for slide", slideIndex, {
    contentHeight,
    viewportHeight,
    needsScroll: contentHeight > viewportHeight,
    isSpecificSlide: slidesThatNeedScroll.includes(slideIndex),
  });

  // Force scroll for specific slides
  if (slidesThatNeedScroll.includes(slideIndex)) {
    slideContent.classList.add("allow-scroll");
    slideContent.style.overflowY = "auto";
    slideContent.style.webkitOverflowScrolling = "touch";
    slideContent.style.maxHeight = "100vh";
    slideContent.style.height = "100vh";
    slideContent.style.minHeight = "100vh";
    slideContent.style.padding = "1rem";
    slideContent.style.paddingBottom = "5rem";
    slideContent.style.boxSizing = "border-box";
    console.log("Forced scroll enabled for slide", slideIndex);
  }
  // Enable scrolling if content exceeds viewport for other slides
  else if (contentHeight > viewportHeight) {
    slideContent.classList.add("long-content");
    slideContent.style.overflowY = "auto";
    slideContent.style.webkitOverflowScrolling = "touch";
    slideContent.style.maxHeight = "100vh";
  } else {
    slideContent.style.overflowY = "visible";
    slideContent.style.maxHeight = "none";
  }

  // Ensure proper padding for slide counter
  slideContent.style.paddingBottom = "5rem";
}

function preloadNextSlideImages(currentIndex) {
  const nextIndex = (currentIndex + 1) % slides.length;
  const prevIndex = (currentIndex - 1 + slides.length) % slides.length;

  // Preload images from next and previous slides for smoother transitions
  [nextIndex, prevIndex].forEach((index) => {
    const slide = slides[index];
    if (slide && slide.component) {
      // This is a lightweight check - just preloading critical images
      const slideImages = getSlideImages(slide.component);
      slideImages.forEach((imgSrc) => {
        if (!preloadedImages.has(imgSrc)) {
          preloadImage(imgSrc).catch(() => {});
        }
      });
    }
  });
}

function getSlideImages(componentName) {
  // Return list of images used in each slide component
  const imageMap = {
    coverSlide: ["./icons/cachina-logoo.png", "cachina-icon.png"],
    aiAgentSlide: [
      "./icons/automafacil.png",
      "./icons/cachina-icon.png",
      "./icons/ai-workflow.png",
    ],
    emissorFacilSlide: ["./icons/logoemissorfacil.png", "cachina-icon.png"],
    cloudBoxSlide: [
      "./icons/cloudbox.png",
      "./icons/cachina-logoo.png",
      "./icons/cachinacloudbox.png",
    ],
    customSoftwareSlide: ["./icons/devfacil.png"],
    clientsSlide: ["./icons/logosdeempresas.png", "cachina-logoo.png"],
    contactSlide: [
      "./icons/qr-code.png",
      "./icons/cachina-logoo.png",
      "./icons/cachina-icon.png",
    ],
  };

  return imageMap[componentName] || [];
}

function triggerAnimations() {
  const animatedElements = document.querySelectorAll('[class*="animate-"]');
  animatedElements.forEach((element, index) => {
    element.style.animationPlayState = "running";
  });
}

// Slide Components
function generateSlideHTML(componentName) {
  switch (componentName) {
    case "coverSlide":
      return coverSlide();
    case "valuesSlide":
      return valuesSlide();
    case "aboutUsSlide":
      return aboutUsSlide();
    case "businessFlowSlide":
      return businessFlowSlide();
    case "howWeHelpSlide":
      return howWeHelpSlide();
    case "valuePropositionSlide":
      return valuePropositionSlide();
    case "consultoriaTecnologiaSlide":
      return consultoriaTecnologiaSlide();
    case "aiAgentSlide":
      return aiAgentSlide();
    case "emissorFacilSlide":
      return emissorFacilSlide();
    case "cloudBoxSlide":
      return cloudBoxSlide();
    case "itManagementSlide":
      return itManagementSlide();
    case "customSoftwareSlide":
      return customSoftwareSlide();
    case "clientsSlide":
      return clientsSlide();
    case "differentialsSlide":
      return differentialsSlide();
    case "processSlide":
      return processSlide();
    case "contactSlide":
      return contactSlide();
    default:
      return '<div class="h-full w-full bg-gradient-cachina-mix flex items-center justify-center"><h1 class="text-4xl font-bold text-white">Slide não encontrado</h1></div>';
  }
}

// Cover Slide
// Image optimization functions
function initializeImageOptimization() {
  // Initialize lazy loading observer
  if ("IntersectionObserver" in window) {
    lazyLoadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            loadImage(img);
            lazyLoadObserver.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      },
    );
  }
}

function preloadCriticalImages() {
  const criticalImages = [
    "./icons/cachina-logoo.png",
    "./icons/cachina-icon.png",
    "./icons/automafacil.png",
    "./icons/devfacil.png",
    "./icons/cloudbox.png",
    "./icons/logosdeemoresas.png",
    "./icons/ai-workflow.png",
    "./icons/qr-code.png",
  ];

  criticalImages.forEach((src) => {
    if (!preloadedImages.has(src)) {
      preloadImage(src).catch((err) => {
        console.warn(`Failed to preload image: ${src}`, err);
      });
    }
  });
}

function optimizeImagesInSlide() {
  // Add loading attribute to all images in the current slide
  const slideContent = document.getElementById("slide-content");
  if (!slideContent) return;

  const images = slideContent.querySelectorAll("img");
  images.forEach((img, index) => {
    // First few images load eagerly, rest lazy
    if (index < 3 && !img.hasAttribute("loading")) {
      img.setAttribute("loading", "eager");
    } else if (!img.hasAttribute("loading")) {
      img.setAttribute("loading", "lazy");
    }

    // Add loaded class when image loads
    if (img.complete) {
      img.classList.add("loaded");
    } else {
      img.addEventListener(
        "load",
        () => {
          img.classList.add("loaded");
        },
        { once: true },
      );
    }

    // Handle errors gracefully
    img.addEventListener(
      "error",
      () => {
        console.warn(`Failed to load image: ${img.src}`);
      },
      { once: true },
    );
  });

  // Apply mobile-specific optimizations
  if (isMobile) {
    optimizeSlideForMobile(slideContent);
  }
}

function optimizeSlideForMobile(slideContent) {
  // Hide decorative elements that might overlap
  const decorativeElements = slideContent.querySelectorAll(
    ".absolute.top-32, .absolute.bottom-32, .absolute.right-32, .absolute.left-32",
  );
  decorativeElements.forEach((el) => {
    el.style.display = "none";
  });

  // Convert absolute positioned elements to relative
  const absoluteElements = slideContent.querySelectorAll(".absolute");
  absoluteElements.forEach((el) => {
    if (
      !el.classList.contains("z-10") &&
      !el.classList.contains("slide-counter")
    ) {
      el.style.position = "relative";
      el.style.top = "auto";
      el.style.bottom = "auto";
      el.style.left = "auto";
      el.style.right = "auto";
      el.style.transform = "none";
    }
  });

  // Ensure grids are stacked vertically
  const grids = slideContent.querySelectorAll(
    ".grid, .lg\\:grid-cols-2, .lg\\:grid-cols-3, .grid-cols-2, .grid-cols-3",
  );
  grids.forEach((grid) => {
    grid.style.display = "flex";
    grid.style.flexDirection = "column";
    grid.style.gap = "1rem";
  });

  // Fix container widths
  const containers = slideContent.querySelectorAll(
    ".max-w-6xl, .max-w-4xl, .max-w-2xl",
  );
  containers.forEach((container) => {
    container.style.maxWidth = "100%";
    container.style.padding = "0 1rem";
  });

  // Ensure images don't overflow
  const images = slideContent.querySelectorAll("img");
  images.forEach((img) => {
    img.style.maxWidth = "100%";
    img.style.height = "auto";
  });

  // Fix logo sizes
  const logos = slideContent.querySelectorAll(".w-75, .h-30");
  logos.forEach((logo) => {
    if (logo.classList.contains("w-75")) {
      logo.style.width = "200px";
      logo.style.maxWidth = "80%";
    }
    if (logo.classList.contains("h-30")) {
      logo.style.height = "auto";
    }
  });

  // Reduce blur effects for performance
  const blurElements = slideContent.querySelectorAll(
    ".blur-3xl, .blur-2xl, .blur-xl",
  );
  blurElements.forEach((el) => {
    if (el.classList.contains("blur-3xl")) {
      el.style.filter = "blur(20px)";
    } else if (el.classList.contains("blur-2xl")) {
      el.style.filter = "blur(15px)";
    } else if (el.classList.contains("blur-xl")) {
      el.style.filter = "blur(10px)";
    }
  });

  // Hide floating animations
  const floatingElements = slideContent.querySelectorAll(".animate-float");
  floatingElements.forEach((el) => {
    el.style.display = "none";
  });

  // Ensure proper spacing
  const spaceElements = slideContent.querySelectorAll(
    ".space-y-8, .space-y-6, .space-y-4",
  );
  spaceElements.forEach((el) => {
    const children = el.children;
    for (let i = 1; i < children.length; i++) {
      if (el.classList.contains("space-y-8")) {
        children[i].style.marginTop = "1.5rem";
      } else if (el.classList.contains("space-y-6")) {
        children[i].style.marginTop = "1rem";
      } else if (el.classList.contains("space-y-4")) {
        children[i].style.marginTop = "0.75rem";
      }
    }
  });

  // Check if slide content needs scrolling
  checkAndEnableScroll(slideContent);
}

function checkAndEnableScroll(slideContent) {
  // Wait for content to be rendered
  setTimeout(() => {
    const contentHeight = slideContent.scrollHeight;
    const viewportHeight = window.innerHeight;

    // If content is taller than viewport, enable scrolling
    if (contentHeight > viewportHeight) {
      slideContent.classList.add("long-content");
      console.log("Slide content exceeds viewport, enabling scroll:", {
        contentHeight,
        viewportHeight,
        slideIndex: currentSlide,
      });
    } else {
      slideContent.classList.remove("long-content");
    }

    // Check for specific slides that need scrolling
    const slideIndex = currentSlide;
    const slidesThatNeedScroll = [1, 3, 6, 7, 8, 9, 10, 13, 14, 15]; // Slides 2(Values), 4, 7, 8, 9, 10, 11, 14, 15, 16 (0-indexed)

    if (slidesThatNeedScroll.includes(slideIndex)) {
      slideContent.classList.add("allow-scroll");
      // Force scroll configuration for these specific slides
      slideContent.style.overflowY = "auto";
      slideContent.style.webkitOverflowScrolling = "touch";
      slideContent.style.maxHeight = "100vh";
      slideContent.style.paddingBottom = "5rem";
    }

    // Ensure scrollable containers work
    const scrollableContainers = slideContent.querySelectorAll(
      ".overflow-y-auto, .overflow-auto",
    );
    scrollableContainers.forEach((container) => {
      container.style.maxHeight = "calc(100vh - 4rem)";
      container.style.overflowY = "auto";
      container.style.webkitOverflowScrolling = "touch";
    });

    // Fix for grids that might need scrolling
    const grids = slideContent.querySelectorAll(".grid");
    grids.forEach((grid) => {
      if (grid.scrollHeight > window.innerHeight * 0.8) {
        grid.classList.add("allow-scroll");
      }
    });
  }, 100);
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src));
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      preloadedImages.add(src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function loadImage(imgElement) {
  const src = imgElement.dataset.src || imgElement.src;
  if (!src) return;

  if (imageCache.has(src)) {
    imgElement.src = src;
    imgElement.classList.remove("loading");
    imgElement.classList.add("loaded");
    return;
  }

  imgElement.classList.add("loading");

  preloadImage(src)
    .then(() => {
      imgElement.src = src;
      imgElement.classList.remove("loading");
      imgElement.classList.add("loaded");
    })
    .catch(() => {
      imgElement.classList.remove("loading");
      imgElement.classList.add("error");
    });
}

function createOptimizedImage(src, alt, className = "", lazy = true) {
  const img = document.createElement("img");
  img.alt = alt;
  img.className = className;

  if (lazy && lazyLoadObserver) {
    img.dataset.src = src;
    img.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=";
    img.classList.add("lazy-load");
    lazyLoadObserver.observe(img);
  } else {
    img.src = src;
  }

  return img;
}

function coverSlide() {
  return `
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">

<div class="slide-01-container">
    <div class="slide-01-left">
        <h1 class="title">
            INSPIRE<br>
            O FUTURO<br>
            DA SUA<br>
            <span>EMPRESA</span>
        </h1>
        <p class="subtitle">Cachina - Soluções em Tecnologia</p>
        
        <div class="experience-box">
            <span class="year">20+</span>
            <span class="label">ANOS<br>DE EXPERIÊNCIA</span>
        </div>
    </div>
    
    <div class="slide-01-center">
        <div class="avatar-gradient-border">
            <img src="./icons/igor.png" alt="Foto do CEO">
        </div>
        
        <div class="person-info">
            <h3>Igor</h3>
            <span>CEO & Founder - Cachina</span>
        </div>
    </div>

    <div class="slide-01-right">
        <img src="./icons/cachina-logoo.png" class="company-logo" />

        <div class="quote-box">
            <img class="quote-bg" src="./icons/fundo.png" alt="">
            <p>
                "A tecnologia não deve apenas resolver problemas, ela deve inspirar novas formas de pensar o futuro dos negócios."
            </p>
        </div>
    </div>

    <div class="slide-01-footer">
        <span>PAGE : 1</span>
        <span>CACHINA PRESENTATION TEMPLATE</span>
        <span>BUSINESS_2026</span>
    </div>
</div>
 `;
}

// Values Slide
// ==========================================
// VALUES SLIDE - MOBILE SCROLL OPTIMIZED
// ==========================================

function valuesSlide() {
  return `
<div class="slide-02-container values-page">
    
    <div class="slide-01-center sidebar-identity">
        <div class="avatar-gradient-border">
            <img src="./icons/igor.png" alt="Foto do CEO">
        </div>
        <div class="person-info">
            <img src="./icons/cachina-logoo.png" class="mini-logo" />
        </div>
    </div>

    <div class="values-content">
    <h3>Nascemos para simplificar a TI, oferecendo soluções inovadoras e suporte especializado. </h3>
        <h2 class="section-title">NOSSOS <span>VALORES</span></h2>
        
        <div class="cards-wrapper">
            <div class="value-card">
                <div class="card-icon">🚀</div>
                <h3> MISSÃO</h3>
                <p>Ajudar empresas a crescerem na era digital com eficiência e inovação.</p>
            </div>

            <div class="value-card">
                <div class="card-icon">🤝</div>
                <h3> VISÃO</h3>
                <p>Ser referência em soluções tecnológicas confiáveis e inovadoras.</p>
            </div>

            <div class="value-card">
                <div class="card-icon">🎯</div>
                <h3> VALORES</h3>
                <p>Ética e transparência empresarial.</p>
                <p>Simplicidade que gera eficiência.</p>
                <p>Compromisso com resultados reais</p>
            </div>
        </div>
    </div>

    <div class="slide-01-footer">
        <span>PAGE : 2</span>
        <span>CACHINA PRESENTATION TEMPLATE</span>
        <span>VALORES_2026</span>
    </div>
</div>
    `;
}

// Value Proposition Slide
function valuePropositionSlide() {
  return ` 
        <div class="slide-03-container">
    <div class="slide-03-content">
        <img src="./icons/cachina-logoo.png" class="company-logo-small" />
        
        <div class="text-group">
            <p class="intro-text">
                Na <span>Cachina Tecnologia</span>, acreditamos que a tecnologia só faz sentido quando gera <strong>resultados reais</strong>.
            </p>
            <p class="description-text">
                Somos uma <strong>holding de inovação</strong> que conecta <span>estratégia, operação</span> e <span>produtos digitais</span> para empresas que buscam crescer com <strong>eficiência, segurança e escalabilidade</strong>.
            </p>
        </div>
    </div>

    <div class="slide-03-pilares">
        <h2 class="pilares-title">Pilares que nos guiam:</h2>
        
        <div class="pilar-card">
            <div class="pilar-icon">⚡</div>
            <h2><span>Inovação contínua</span></h2>
        </div>

        <div class="pilar-card">
            <div class="pilar-icon">✔</div>
            <h2><span>Excelência em execução</span></h2>
        </div>

        <div class="pilar-card">
            <div class="pilar-icon">📈</div>
            <h2><span>Crescimento sustentável para nossos clientes</span></h2>
        </div>
    </div>

    <div class="slide-01-footer">
        <span>PAGE : 3</span>
        <span>CACHINA PRESENTATION TEMPLATE</span>
        <span>BUSINESS_20XX</span>
    </div>
</div>
    `;
}

// AI Agent Slide
// ==========================================
// AI AGENT SLIDE - MOBILE SCROLL OPTIMIZED
// ==========================================

function aiAgentSlide() {
  return `
          <div class="h-full w-full bg-gradient-cachina-mix flex items-center relative ai-agent-slide">
              <div class="absolute top-6 left-6 ai-agent-logo">
                <img src="./icons/automafacil.png" alt="AutomaFácil Logo" class="automafacil-logo" loading="lazy">
              </div>
  
              <div class="absolute bottom-6 right-6 opacity-20 ai-agent-icon">
                  <img src="./icons/cachina-icon.png" alt="Cachina Icon" class="w-20 h-20" loading="lazy">
              </div>
  
              <div class="container mx-auto px-6 ai-agent-container">
                  <div class="grid lg:grid-cols-2 gap-12 items-center ai-agent-grid">
                      <!-- Left Content -->
                      <div class="space-y-8 ai-agent-left">
                          <div class="flex items-center gap-3 animate-slide-left">
                              <svg class="w-12 h-12 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <circle cx="12" cy="16" r="1"></circle>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                              <h1 class="text-4xl font-bold">Agente de IA Omnicanal</h1>
                          </div>
  
                          <h2 class="text-3xl font-semibold text-sky-400 animate-slide-left animate-delay-200">
                              Atendimento 24/7 que Vende Enquanto Você Dorme
                          </h2>
  
                          <div class="space-y-4">
                              <div class="flex items-start gap-3 animate-slide-left animate-delay-300">
                                  <svg class="w-5 h-5 text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                  </svg>
                                  <span>
                                      <strong>Resposta instantânea</strong> em WhatsApp, Instagram e
                                      Site
                                  </span>
                              </div>
                              <div class="flex items-start gap-3 animate-slide-left animate-delay-400">
                                  <svg class="w-5 h-5 text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
                                  </svg>
                                  <span>
                                      <strong>+300% conversão</strong> em leads qualificados
                                  </span>
                              </div>
                              <div class="flex items-start gap-3 animate-slide-left animate-delay-500">
                                  <svg class="w-5 h-5 text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polygon points="10,8 16,12 10,16 10,8"></polygon>
                                  </svg>
                                  <span>
                                      <strong>Qualificação automática</strong> de prospects
                                  </span>
                              </div>
                              <div class="flex items-start gap-3 animate-slide-left animate-delay-500">
                                  <svg class="w-5 h-5 text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <line x1="12" y1="1" x2="12" y2="23"></line>
                                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                  </svg>
                                  <span>
                                      <strong>Redução de 70%</strong> no custo de atendimento
                                  </span>
                              </div>
                              <div class="flex items-start gap-3 animate-slide-left animate-delay-500">
                                  <svg class="w-5 h-5 text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path d="M3 3v18h18"></path>
                                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                                  </svg>
                                  <span>
                                      <strong>Relatórios inteligentes</strong> de performance
                                  </span>
                              </div>
                          </div>
                      </div>
  
                      <!-- Right Content - AI Workflow Image -->
                      <div class="space-y-8 ai-agent-right">
                          <div class="bg-white/5 p-6 rounded-lg animate-slide-right animate-delay-300">
                              <h3 class="text-xl font-semibold mb-4 text-emerald-400">
                                  COMO FUNCIONA
                              </h3>
                              <div class="relative">
                                  <img src="./icons/ai-workflow.png" alt="Workflow de Automação com IA" class="rounded-lg w-full h-auto">
                              </div>
                              <p class="text-sm text-gray-300 mt-3">
                                  Fluxo inteligente que conecta múltiplas plataformas e automatiza
                                  processos complexos
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `;
}

// Contact Slide
// ==========================================
// CONTACT SLIDE - MOBILE SCROLL OPTIMIZED
// ==========================================

function contactSlide() {
  return `
  
<div class="slide-contact-container">
  <div class="slide-contact-content">
    <div class="contact-header">
      <img
        src="./icons/cachina-logoo.png"
        class="company-logo-small"
        alt="Cachina Logo"
      />
      <h1 class="contact-title">Vamos <span>Conectar</span>?</h1>
      <p class="contact-subtitle">
        Estamos prontos para transformar sua visão em realidade tecnológica.
      </p>
    </div>

    <div class="contact-grid">
      <div class="contact-left-column">
        <div class="contact-avatar-block">
          <div class="contact-avatar-image">
            <img src="icons/igor.png" alt="Igor - CEO & Founder" />
          </div>
          <div class="contact-avatar-text">
            <h3>Igor</h3>
            <p>CEO & Founder, Cachina</p>
          </div>
        </div>

        <div class="contact-info">
          <div class="info-item">
            <div class="info-icon">📧</div>
            <div class="info-text">
              <label>E-mail</label>
              <span>contato@cachina.com.br</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">📍</div>
            <div class="info-text">
              <label>Localização</label>
              <span>Natal, RN - Brasil</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">🌐</div>
            <div class="info-text">
              <label>Website</label>
              <span>www.cachina.com.br</span>
            </div>
          </div>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-wrapper">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.cachina.com.br"
            alt="QR Code Contato"
          />
        </div>
        <p class="qr-label">Escaneie para salvar o contato</p>
      </div>
    </div>
  </div>

  <div class="slide-01-footer">
    <span>PAGE : 05</span>
    <span>CACHINA PRESENTATION TEMPLATE</span>
    <span>BUSINESS_2026</span>
  </div>
</div>

    `;
}

// Clients Slide
function clientsSlide() {
  return `
<div
  class="h-full w-full relative bg-gradient-cachina-mix flex items-center justify-center"
>
  <!-- Background -->
  <div class="absolute inset-0 opacity-20">
    <div
      class="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full blur-3xl opacity-40"
    ></div>
            <div class="absolute inset-0 flex items-center justify-center">
            <div class="relative animate-fade-in animate-delay-800">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full blur-md opacity-45"></div>
                <img src="./icons/cachina-icon.png" class="relative z-10 opacity-75 w-9 h-9">
            </div>
        </div>
    <div
      class="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full blur-3xl opacity-25"
    ></div>
  </div>
  <!-- GRID 50/50 -->
  <div
    class="relative z-10 grid grid-cols-1 md:grid-cols-2 items-center max-w-7xl mx-auto px-6 gap-12"
  >
    <!-- TEXTO (ESQUERDA) -->
    <div class="text-center md:text-left">
      <h1 class="text-5xl md:text-6xl font-bold mb-4 text-white">
        Nossos <span style="color: #1e3a8a">Clientes</span>
      </h1>
      <p class="text-2xl font-bold text-sky-400 mb-2">Mais de 100 empresas</p>
      <p class="text-lg text-gray-300">
        já transformaram seus negócios com nossas soluções tecnológicas
      </p>
      <div
        class="mt-6 flex items-center gap-4 text-gray-400 justify-center md:justify-start"
      >
        <div
          class="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full flex items-center justify-center"
        >
          <div class="w-4 h-4 bg-white rounded-full"></div>
        </div>
        <span class="text-lg font-medium">
          Confiança construída ao longo de duas décadas
        </span>
      </div>
    </div>
    <!-- CARROSSEL (DIREITA) -->
    <div class="relative w-full overflow-hidden py-10">
      <!-- Glow -->
      <div
        class="absolute -inset-10 bg-gradient-to-r from-blue-500 to-sky-400 rounded-3xl opacity-30 blur-3xl"
      ></div>
      <!-- Container com fade -->
      <div class="overflow-hidden w-full mask-fade">
        <!-- Track -->
        <div class="animate-scroll flex">
                  <img
            src="./icons/logosdeempresas.png"
            class="h-80 md:h-64 px-16 object-contain logos-img"
          />
          <img
            src="./icons/logosempresas01.png"
            class="h-80 md:h-64 px-16 object-contain logos-img"
          />
          <img
            src="./icons/logosempresas02.png"
            class="h-80 md:h-64 px-16 object-contain logos-img"
          />
            <img
            src="./icons/logosempresas03.png"
            class="h-80 md:h-64 px-16 object-contain logos-img"
          />
     
          
        </div>
      </div>
    </div>
  </div>
</div>

    `;
}

// About Us Slide - Cachina Tecnologia
// ==========================================
// ABOUT US SLIDE - MOBILE OPTIMIZED
// ==========================================

function aboutUsSlide() {
  return `
      <div class="h-full w-full relative bg-gradient-cachina-mix flex items-center justify-center about-us-slide">
        <!-- Decorative Elements - Hidden on mobile -->
        <div class="absolute top-6 right-6 w-8 h-8 border-2 border-sky-400/30 rounded-full about-deco"></div>
        <div class="absolute bottom-6 right-6 w-8 h-8 border-2 border-sky-400/30 rounded-full about-deco"></div>
    
        <div class="container mx-auto px-4 about-container">
          <div class="grid lg:grid-cols-2 gap-8 items-center about-grid">
            
            <!-- Left Content - Circular Image -->
            <div class="flex justify-center animate-slide-left about-image-section">
              <div class="relative about-image-wrapper">
                <!-- Outer Circle Border -->
                <div class="absolute -inset-4 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full opacity-50 blur-xl about-glow"></div>
                
                <!-- Main Circular Container -->
                <div class="relative about-circle-main">
                  <!-- Inner Circle Border -->
                  <div class="absolute about-circle-inner">
                    <img 
                      src="./icons/cachina-icon.png" 
                      alt="Escritório Cachina" 
                      class="w-full h-full object-cover about-image"
                      loading="lazy"
                    >
                  </div>
                  
                  <!-- Wave Decoration at Bottom -->
                  <div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-sky-400 to-transparent opacity-30 about-wave"></div>
                </div>
              </div>
            </div>
    
            <!-- Right Content -->
            <div class="space-y-6 animate-slide-right about-content-section">
              <!-- Logo and Title -->
              <div class="space-y-4">
                <div class="flex items-center gap-3 mb-4 about-logo-box">
                  <img src="./icons/cachina-logoo.png" alt="Cachina Logo" class="h-10 w-auto about-logo">
                </div>
    
                <p class="text-base text-gray-200 leading-relaxed about-text">
                  Na <span class="text-sky-400 font-semibold">Cachina Tecnologia</span>, acreditamos que a tecnologia só faz 
                  sentido quando gera <span class="text-sky-300 font-semibold">resultados reais</span>.
                </p>
    
                <p class="text-base text-gray-200 leading-relaxed about-text">
                  Somos uma <span class="text-sky-400 font-semibold">holding de inovação</span> que conecta 
                  <span class="font-semibold text-white">estratégia, operação</span> e 
                  <span class="font-semibold text-white">produtos digitais</span> para empresas que buscam 
                  crescer com <span class="text-emerald-400 font-semibold">eficiência</span>, 
                  <span class="text-emerald-400 font-semibold">segurança</span> e 
                  <span class="text-emerald-400 font-semibold">escalabilidade</span>.
                </p>
              </div>
    
              <!-- Pillars Section -->
              <div class="space-y-4 about-pillars">
                <h2 class="text-xl font-semibold text-sky-300 about-pillars-title">
                  Pilares que nos guiam:
                </h2>
    
                <div class="space-y-3 about-pillars-list">
                  <!-- Pillar 1 -->
                  <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-sky-400/20 hover:border-sky-400/50 transition-all about-pillar-item">
                    <div class="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center flex-shrink-0 about-pillar-icon">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                    <p class="text-base font-medium text-white about-pillar-text">Inovação contínua</p>
                  </div>
    
                  <!-- Pillar 2 -->
                  <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-sky-400/20 hover:border-sky-400/50 transition-all about-pillar-item">
                    <div class="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center flex-shrink-0 about-pillar-icon">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p class="text-base font-medium text-white about-pillar-text">Excelência em execução</p>
                  </div>
    
                  <!-- Pillar 3 -->
                  <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-sky-400/20 hover:border-sky-400/50 transition-all about-pillar-item">
                    <div class="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center flex-shrink-0 about-pillar-icon">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    </div>
                    <p class="text-base font-medium text-white about-pillar-text">Crescimento sustentável para nossos clientes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
}

// Business Flow Slide
// Business Flow Slide
// ==========================================
// BUSINESS FLOW SLIDE - MOBILE OPTIMIZED
// ==========================================

// ==========================================
// BUSINESS FLOW SLIDE - MOBILE SCROLL OPTIMIZED
// ==========================================

function businessFlowSlide() {
  return `
<div class="slide-04-container">
  <div class="slide-ecosystem-content">
    <div class="ecosystem-header">
      <img
        src="./icons/cachina-logoo.png"
        class="company-logo-small"
        alt="Cachina Logo"
      />
      <h1 class="ecosystem-title">Nosso <span>Ecossistema</span></h1>
      <p class="ecosystem-subtitle">
        Uma estrutura completa de soluções que se potencializam para gerar valor
        escalável.
      </p>
    </div>

    <div class="ecosystem-grid">
      <div class="eco-card">
        <div class="eco-icon">🚀</div>
        <div class="eco-body">
          <h3>Cachina Consultoria</h3>
          <p>
            Desenvolvimento de produtos, apps e plataformas de alta performance
            personalizados.
          </p>
        </div>
        <div class="eco-tag">PRODUTOS</div>
      </div>

      
      <div class="eco-card">
        <div class="eco-icon">⚙️</div>
        <div class="eco-body">
          <h3>Cachina Gestão TI</h3>
          <p>
            Operação e infraestrutura escalável com foco em segurança e
            eficiência suporte e Tercerização.
          </p>
        </div>
        <div class="eco-tag">OPERAÇÃO</div>
      </div>

      <div class="eco-card">
        <div class="eco-icon">💡</div>
        <div class="eco-body">
          <h3>Cachina Ventures</h3>
          <p>
            Estratégia e inovação para novos modelos de negócios e holdings.
          </p>
        </div>
        <div class="eco-tag">ESTRATÉGIA</div>
      </div>

      <div class="eco-card">
        <div class="eco-icon">🛡️</div>
        <div class="eco-body">
          <h3>Cachina Security</h3>
          <p>
            Proteção de dados e conformidade para ambientes corporativos
            críticos.
          </p>
        </div>
        <div class="eco-tag">SEGURANÇA</div>
      </div>
    </div>

    <div class="ecosystem-footer-text">
      <p>Conectando tecnologia, pessoas e processos para o próximo nível.</p>
    </div>
  </div>

  <div class="slide-01-footer">
    <span>PAGE : 04</span>
    <span>CACHINA PRESENTATION TEMPLATE</span>
    <span>BUSINESS_2026</span>
  </div>
</div>
    `;
}

// How We Help Slide - Cachina Tecnologia
function howWeHelpSlide() {
  //TODO:
  return `
  <div class="slide-05-container">
    <div class="slide-help-content">
        <div class="help-header">
            <img src="./icons/cachina-logoo.png" class="company-logo-small" alt="Cachina Logo" />
            <h1 class="help-title">Como Vamos <span>Ajudar Você</span></h1>
        </div>

        <div class="comparison-grid">
            <div class="comparison-column problems">
                <h2 class="column-title"><span class="icon">✕</span> Problemas que Identificamos</h2>
                
                <div class="comparison-item">
                    <h3>Empresas gastando tempo e dinheiro</h3>
                    <p>com processos manuais ineficientes</p>
                </div>

                <div class="comparison-item">
                    <h3>TI sobrecarregada e sem governança</h3>
                    <p>falta de estrutura e planejamento estratégico</p>
                </div>

                <div class="comparison-item">
                    <h3>Falta de segurança em informações críticas</h3>
                    <p>vulnerabilidades que colocam o negócio em risco</p>
                </div>
            </div>

            <div class="comparison-column solutions">
                <h2 class="column-title"><span class="icon">✓</span> Nossas Soluções</h2>
                
                <div class="comparison-item">
                    <h3>Desenhamos planos sob medida</h3>
                    <p>estratégias personalizadas para seu negócio</p>
                </div>

                <div class="comparison-item">
                    <h3>Redução de custos e aumento de produtividade</h3>
                    <p>resultados mensuráveis e ROI comprovado</p>
                </div>

                <div class="comparison-item">
                    <h3>Tecnologia como motor de crescimento</h3>
                    <p>inovação que impulsiona o futuro do seu negócio</p>
                </div>
            </div>
        </div>

        <div class="help-promise">
            <p class="promise-tag">💡 Nossa Promessa</p>
            <h3>"Enquanto você foca no futuro, nós garantimos que sua tecnologia esteja pronta para ele."</h3>
            <div class="promise-badges">
                <span>📈 Crescimento</span>
                <span>🛡️ Segurança</span>
                <span>✨ Inovação</span>
            </div>
        </div>
    </div>

    <div class="slide-01-footer">
        <span>PAGE : 5</span>
        <span>CACHINA PRESENTATION TEMPLATE</span>
        <span>BUSINESS_2026</span>
    </div>
</div>

`;
}

// ==========================================
// CONSULTORIA TECNOLOGIA SLIDE - MOBILE SCROLL OPTIMIZED
// ==========================================

function consultoriaTecnologiaSlide() {
  return `<div class="slide-07-container">
  <div class="slide-07-left">
    <div class="header-box">
      <div class="pulse-icon"></div>
      <img
        src="./icons/cachina-logoo.png"
        class="company-logo"
        alt="Cachina Logo"
      />
      <h1 class="title">Consultoria de <span>Tecnologia & Inovação</span></h1>
    </div>
    <p class="subtitle">"Assessment & Estratégia Digital"</p>

    <div class="experience-box">
      <p class="desc-text">
        Transformamos sua empresa com inteligência tecnológica aplicada ao
        negócio.
      </p>
    </div>
  </div>

  <div class="slide-07-center">
    <div class="methodology-card">
      <h2 class="card-title">NOSSA METODOLOGIA</h2>

      <div class="step-item">
        <span class="step-number">1</span>
        <div class="step-info">
          <h3>ANÁLISE</h3>
          <p>Diagnóstico completo do cenário atual.</p>
        </div>
      </div>

      <div class="step-item">
        <span class="step-number">2</span>
        <div class="step-info">
          <h3>ESTRATÉGIA</h3>
          <p>Definição do plano de ação personalizado.</p>
        </div>
      </div>

      <div class="step-item">
        <span class="step-number">3</span>
        <div class="step-info">
          <h3>IMPLEMENTAÇÃO</h3>
          <p>Execução com acompanhamento técnico.</p>
        </div>
      </div>

      <div class="step-item">
        <span class="step-number">4</span>
        <div class="step-info">
          <h3>MONITORAMENTO</h3>
          <p>Avaliação contínua de resultados e ROI.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="slide-07-right">
    <div class="quote-box business-box">
      <div class="business-item">
        <span>📊</span>
        <p>
          <strong>Consultoria de Negócios:</strong> Otimização de processos e
          operações.
        </p>
      </div>
      <div class="business-item">
        <span>💡</span>
        <p>
          <strong>Inovação Estratégica:</strong> Identificação de oportunidades.
        </p>
      </div>
      <div class="business-item">
        <span>🚀</span>
        <p><strong>Transformação Digital:</strong> Modernização completa.</p>
      </div>
    </div>
  </div>

  <div class="slide-01-footer">
    <span>PAGE : 7</span>
    <span>CACHINA PRESENTATION TEMPLATE</span>
    <span>METHODOLOGY_2026</span>
  </div>
</div>


    `;
}

// Emissor Fácil Slide
// Emissor Fácil Slide
function emissorFacilSlide() {
  return `
        <div class="h-full w-full bg-gradient-cachina-mix flex items-center relative">
    <div class="emissor-logo-container">
        <img src="./icons/logoemissorfacil.png" alt="Emissor Fácil Logo" class="emissor-logo">
    </div>

    <div class="emissor-icon-container">
        <img src="./icons/cachina-icon.png" alt="Cachina Icon" class="emissor-icon">
    </div>

    <div class="emissor-container">
        <div class="emissor-grid">
            <!-- Left Content -->
            <div class="emissor-left">
                <div class="emissor-header animate-slide-left">
                    <svg class="emissor-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h1 class="emissor-title">Emissor Fácil</h1>
                </div>

                <h2 class="emissor-subtitle animate-slide-left animate-delay-200">
                    Emissão de Notas Fiscais Simplificada
                </h2>

                <div class="emissor-features">
                    <div class="emissor-feature animate-slide-left animate-delay-300">
                        <svg class="emissor-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                            <strong>Emissão automática</strong> de notas fiscais eletrônicas
                        </span>
                    </div>
                    <div class="emissor-feature animate-slide-left animate-delay-400">
                        <svg class="emissor-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                            <strong>Integração completa</strong> com sistemas de gestão
                        </span>
                    </div>
                    <div class="emissor-feature animate-slide-left animate-delay-500">
                        <svg class="emissor-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                            <strong>Conformidade total</strong> com a legislação fiscal
                        </span>
                    </div>
                    <div class="emissor-feature animate-slide-left animate-delay-500">
                        <svg class="emissor-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                            <strong>Relatórios detalhados</strong> para controle fiscal
                        </span>
                    </div>
                </div>

                <!-- Stats Box -->
                <div class="emissor-stats animate-slide-left animate-delay-600">
                    <h3 class="emissor-stats-title">NÚMEROS IMPRESSIONANTES</h3>
                    <div class="emissor-stats-list">
                        <div class="emissor-stat-item">
                            <svg class="emissor-stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span><strong>+50.000 documentos</strong> emitidos/mês</span>
                        </div>
                        <div class="emissor-stat-item">
                            <svg class="emissor-stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span><strong>99.9% uptime</strong> garantido</span>
                        </div>
                        <div class="emissor-stat-item">
                            <svg class="emissor-stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span><strong>Suporte</strong> humanizado</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Content - Video -->
            <div class="emissor-right">
                <div class="emissor-video-box animate-slide-right animate-delay-300">
                    <h3 class="emissor-video-title">Veja o Sistema em Ação</h3>
                    <div class="emissor-video-wrapper">
                        <video class="emissor-video" controls preload="metadata">
                            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202025-09-04%20at%2013.09.22%20%281%29-jxAj4xYQVnzjPW3ylkU0kx8trRe739.mp4" type="video/mp4">
                            Seu navegador não suporta o elemento de vídeo.
                        </video>
                    </div>
                </div>

                <!-- CTA Box -->
                <div class="emissor-cta animate-slide-right animate-delay-500">
                    <h4 class="emissor-cta-title">Demonstração Gratuita</h4>
                    <p class="emissor-cta-text">
                        Teste todas as funcionalidades por 7 dias sem compromisso
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
`;
}

// CloudBox Slide
// CloudBox Slide
function cloudBoxSlide() {
  return `
    <div class="h-full w-full bg-gradient-cachina-mix flex items-center relative">
        <!-- Logo Cachina -->
        <div class="cloudbox-logo">
          <img src="./icons/cachina-logoo.png" alt="Cachina Logo">
        </div>
  
        <!-- Background Effects -->
        <div class="cloudbox-bg-effects">
          <div class="cloudbox-blur cloudbox-blur-1"></div>
          <div class="cloudbox-blur cloudbox-blur-2"></div>
        </div>
  
        <div class="cloudbox-container">
          <!-- Header -->
          <div class="cloudbox-header">
            <div class="cloudbox-header-logo">
              <img src="./icons/cloudbox.png" alt="CloudBox Logo">
            </div>
            <h1 class="cloudbox-title">
              CloudBox <span class="cloudbox-title-highlight">Cachina</span>
            </h1>
            <p class="cloudbox-subtitle">Inovação é o nosso DNA</p>
          </div>
  
          <!-- Grid Content -->
          <div class="cloudbox-grid">
            <!-- Card 1: O que é -->
            <div class="cloudbox-card cloudbox-card-animate-1">
              <img src="./icons/cachinacloudbox.png" alt="CloudBox Cachina" class="cloudbox-product-img">
              <h3 class="cloudbox-card-title cloudbox-card-title-blue">
                O que é a CloudBox?
              </h3>
              <p class="cloudbox-card-text">
                Solução de virtualização que substitui computadores convencionais, 
                conectando usuários a ambientes em nuvem com alto desempenho.
              </p>
            </div>
  
            <!-- Card 2: Problemas -->
            <div class="cloudbox-card cloudbox-card-animate-2">
              <h3 class="cloudbox-card-title cloudbox-card-title-green">
                <svg class="cloudbox-icon" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
                Problemas que Resolvemos
              </h3>
              <div class="cloudbox-list">
                <div class="cloudbox-list-item">
                  <svg class="cloudbox-check-icon" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div>
                    <span class="cloudbox-list-title">Baixo desempenho</span>
                    <p class="cloudbox-list-desc">Processamento em nuvem</p>
                  </div>
                </div>
                <div class="cloudbox-list-item">
                  <svg class="cloudbox-check-icon" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div>
                    <span class="cloudbox-list-title">Obsolescência</span>
                    <p class="cloudbox-list-desc">Evita troca de máquinas</p>
                  </div>
                </div>
                <div class="cloudbox-list-item">
                  <svg class="cloudbox-check-icon" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div>
                    <span class="cloudbox-list-title">Segurança</span>
                    <p class="cloudbox-list-desc">Proteção contra ransomware</p>
                  </div>
                </div>
                <div class="cloudbox-list-item">
                  <svg class="cloudbox-check-icon" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div>
                    <span class="cloudbox-list-title">Alto consumo</span>
                    <p class="cloudbox-list-desc">90% economia energética</p>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Card 3: Benefícios -->
            <div class="cloudbox-card cloudbox-card-animate-3">
              <h3 class="cloudbox-card-title cloudbox-card-title-blue">
                <svg class="cloudbox-icon" viewBox="0 0 24 24">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Benefícios da CloudBox
              </h3>
              <div class="cloudbox-benefits-grid">
                <div class="cloudbox-benefit cloudbox-benefit-blue">
                  <svg class="cloudbox-benefit-icon" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <p>Dados protegidos</p>
                </div>
                <div class="cloudbox-benefit cloudbox-benefit-green">
                  <svg class="cloudbox-benefit-icon" viewBox="0 0 24 24">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <p>Economia</p>
                </div>
                <div class="cloudbox-benefit cloudbox-benefit-orange">
                  <svg class="cloudbox-benefit-icon" viewBox="0 0 24 24">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  <p>Alta disponibilidade</p>
                </div>
                <div class="cloudbox-benefit cloudbox-benefit-purple">
                  <svg class="cloudbox-benefit-icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <p>Sustentável</p>
                </div>
              </div>
            </div>
  
            <!-- Card 4: Público-Alvo -->
            <div class="cloudbox-card cloudbox-card-animate-4">
              <h3 class="cloudbox-card-title cloudbox-card-title-orange">
                <svg class="cloudbox-icon" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Público-Alvo
              </h3>
              <div class="cloudbox-audience-list">
                <div class="cloudbox-audience-item">
                  <svg class="cloudbox-building-icon" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <path d="M9 22v-4h6v4"></path>
                    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"></path>
                  </svg>
                  <span>Escritórios de contabilidade</span>
                </div>
                <div class="cloudbox-audience-item">
                  <svg class="cloudbox-building-icon" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <path d="M9 22v-4h6v4"></path>
                    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"></path>
                  </svg>
                  <span>Lojas e comércios</span>
                </div>
                <div class="cloudbox-audience-item">
                  <svg class="cloudbox-building-icon" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <path d="M9 22v-4h6v4"></path>
                    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"></path>
                  </svg>
                  <span>Home offices</span>
                </div>
                <div class="cloudbox-audience-item">
                  <svg class="cloudbox-building-icon" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <path d="M9 22v-4h6v4"></path>
                    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"></path>
                  </svg>
                  <span>Escolas e call centers</span>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Bottom Highlight -->
          <div class="cloudbox-footer">
            <div class="cloudbox-highlight">
              <svg class="cloudbox-footer-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>Até 90% de economia energética</span>
            </div>
          </div>
        </div>
      </div>
    `;
}

// IT Management Slide
// ==========================================
// IT MANAGEMENT SLIDE - MOBILE SCROLL OPTIMIZED
// ==========================================

function itManagementSlide() {
  return `
<div class="slide-06-container">
  <div class="slide-mgmt-content">
    <div class="mgmt-header">
      <img src="./icons/cachina-logoo.png" class="company-logo-small" alt="Cachina Logo" />
    </div>

    <div class="mgmt-grid">
      <div class="mgmt-text-box">
        <h1 class="mgmt-title">
          Gestão e TI que <br>
          <span>aumentam vendas</span> e <br>
          <span class="highlight-green">reduzem custos</span>
        </h1>
        <p class="mgmt-description">
          Há mais de 20 anos, transformamos processos complexos em soluções simples para empresas que querem crescer na era digital.
        </p>
      </div>

      <div class="mgmt-features">
        <div class="feature-item">
          <div class="feature-indicator"></div>
          <div class="feature-content">
            <h3>GESTÃO ESTRATÉGICA</h3>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-indicator"></div>
          <div class="feature-content">
            <h3>INFRAESTRUTURA ROBUSTA</h3>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-indicator"></div>
          <div class="feature-content">
            <h3>AUTOMAÇÃO INTELIGENTE</h3>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="slide-01-footer">
    <span>PAGE : 6</span>
    <span>CACHINA PRESENTATION TEMPLATE</span>
    <span>BUSINESS_2026</span>
  </div>
</div>
    `;
}

// Custom Software Slide
// Custom Software Slide - DevFácil
function customSoftwareSlide() {
  return `
        <div class="h-full w-full bg-gradient-cachina-mix flex items-center justify-center relative overflow-hidden">
    <!-- Logo DevFácil -->
    <div class="css-logo-box">
        <img src="./icons/devfacil.png" alt="DevFácil Logo" class="css-logo-img">
    </div>

    <!-- Imagem de fundo característica - código/desenvolvimento -->
    <div class="css-bg-code">
        <div class="css-bg-code-inner">
            <svg class="css-code-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
        </div>
    </div>

    <div class="css-container">
        <div class="css-grid-main">
            <!-- Left Content -->
            <div class="css-col-left">
                <div class="css-header-box css-anim-left">
                    <svg class="css-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                    <div>
                        <h1 class="css-header-h1">DevFácil</h1>
                        <p class="css-header-p">"Software Sob Medida para Operações"</p>
                    </div>
                </div>

                <h2 class="css-subtitle css-anim-left css-delay-200">
                    Transformamos Sua Ideia em Sistema Real
                </h2>

                <div class="css-features-list">
                    <!-- Feature 1 -->
                    <div class="css-feature-item css-anim-left css-delay-300">
                        <svg class="css-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="css-feature-txt">
                            <strong class="css-feature-strong">Sites & Landing Pages</strong> → Responsivos e otimizados
                        </span>
                    </div>

                    <!-- Feature 2 -->
                    <div class="css-feature-item css-anim-left css-delay-400">
                        <svg class="css-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                        <span class="css-feature-txt">
                            <strong class="css-feature-strong">Apps Mobile</strong> → Nativos e híbridos
                        </span>
                    </div>

                    <!-- Feature 3 -->
                    <div class="css-feature-item css-anim-left css-delay-500">
                        <svg class="css-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span class="css-feature-txt">
                            <strong class="css-feature-strong">Sistemas Web</strong> → Seguros e escaláveis
                        </span>
                    </div>

                    <!-- Feature 4 -->
                    <div class="css-feature-item css-anim-left css-delay-600">
                        <svg class="css-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                        </svg>
                        <span class="css-feature-txt">
                            <strong class="css-feature-strong">Sistemas Personalizados</strong> → Sob medida para seu negócio
                        </span>
                    </div>

                    <!-- Feature 5 -->
                    <div class="css-feature-item css-anim-left css-delay-700">
                        <svg class="css-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                        </svg>
                        <span class="css-feature-txt">
                            <strong class="css-feature-strong">Integrações</strong> → ERPs e APIs externas
                        </span>
                    </div>

                    <!-- Feature 6 -->
                    <div class="css-feature-item css-anim-left css-delay-800">
                        <svg class="css-feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span class="css-feature-txt">
                            <strong class="css-feature-strong">Automação</strong> → Processos únicos otimizados
                        </span>
                    </div>
                </div>
            </div>

            <!-- Right Content - Methodology -->
            <div class="css-col-right">
                <!-- Metodologia Card -->
                <div class="css-method-card">
                    <h3 class="css-method-title css-anim-right">
                        NOSSA METODOLOGIA
                    </h3>
                    <div class="css-steps-list">
                        <!-- Step 1 -->
                        <div class="css-step-item css-anim-right css-delay-300">
                            <div class="css-step-number">1</div>
                            <div>
                                <div class="css-step-title">DIAGNÓSTICO</div>
                                <div class="css-step-desc">Entendemos sua dor real</div>
                            </div>
                        </div>

                        <!-- Step 2 -->
                        <div class="css-step-item css-anim-right css-delay-400">
                            <div class="css-step-number">2</div>
                            <div>
                                <div class="css-step-title">PROTOTIPAGEM</div>
                                <div class="css-step-desc">Validamos a solução</div>
                            </div>
                        </div>

                        <!-- Step 3 -->
                        <div class="css-step-item css-anim-right css-delay-500">
                            <div class="css-step-number">3</div>
                            <div>
                                <div class="css-step-title">DESENVOLVIMENTO</div>
                                <div class="css-step-desc">Ágil e transparente</div>
                            </div>
                        </div>

                        <!-- Step 4 -->
                        <div class="css-step-item css-anim-right css-delay-600">
                            <div class="css-step-number">4</div>
                            <div>
                                <div class="css-step-title">DEPLOY</div>
                                <div class="css-step-desc">Implementação sem stress</div>
                            </div>
                        </div>

                        <!-- Step 5 -->
                        <div class="css-step-item css-anim-right css-delay-700">
                            <div class="css-step-number">5</div>
                            <div>
                                <div class="css-step-title">SUPORTE</div>
                                <div class="css-step-desc">Evolução contínua</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
}

// Differentials Slide
function differentialsSlide() {
  return `
        <style>
            .cachina-diff-slide {
                height: 100%;
                width: 100%;
                background: linear-gradient(135deg, #1e4a7a 0%, #2d6ba8 50%, #1e4a7a 100%);
                display: flex;
                align-items: center;
                position: relative;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 80px 48px 100px 48px;
                box-sizing: border-box;
            }

            .cachina-diff-logo {
                position: absolute;
                top: 24px;
                right: 32px;
                height: 36px;
            }

            .cachina-diff-container {
                max-width: 1300px;
                margin: 0 auto;
                width: 100%;
            }

            .cachina-diff-header {
                text-align: center;
                margin-bottom: 36px;
            }

            .cachina-diff-title {
                font-size: 48px;
                font-weight: 700;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 14px;
            }

            .cachina-diff-icon-medal {
                width: 44px;
                height: 44px;
                color: #fbbf24;
            }

            .cachina-diff-title-highlight {
                color: #38bdf8;
            }

            .cachina-diff-main-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 28px;
                margin-bottom: 32px;
            }

            .cachina-diff-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 14px;
                padding: 28px 20px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .cachina-diff-icon-wrapper {
                width: 72px;
                height: 72px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
            }

            .cachina-diff-icon-wrapper.blue {
                background: #3b82f6;
            }

            .cachina-diff-icon-wrapper.green {
                background: #10b981;
            }

            .cachina-diff-icon-wrapper.orange {
                background: #f97316;
            }

            .cachina-diff-icon-wrapper svg {
                width: 36px;
                height: 36px;
                color: white;
            }

            .cachina-diff-card-title {
                font-size: 18px;
                font-weight: 700;
                margin: 0 0 12px 0;
                color: white;
            }

            .cachina-diff-card-subtitle {
                font-size: 14px;
                font-weight: 500;
                margin: 0 0 14px 0;
                color: #d1d5db;
                line-height: 1.4;
            }

            .cachina-diff-features {
                display: flex;
                flex-direction: column;
                gap: 8px;
                text-align: left;
            }

            .cachina-diff-feature-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: #e5e7eb;
                line-height: 1.3;
            }

            .cachina-diff-check-icon {
                width: 16px;
                height: 16px;
                color: #10b981;
                flex-shrink: 0;
            }

            .cachina-diff-bottom-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 0;
                margin-top: 32px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 28px;
            }

            .cachina-diff-bottom-item {
                text-align: center;
                padding: 16px;
                border-right: 1px solid rgba(255, 255, 255, 0.1);
            }

            .cachina-diff-bottom-item:last-child {
                border-right: none;
            }

            .cachina-diff-bottom-icon {
                width: 44px;
                height: 44px;
                margin: 0 auto 10px;
            }

            .cachina-diff-bottom-icon.cyan {
                color: #06b6d4;
            }

            .cachina-diff-bottom-icon.green {
                color: #10b981;
            }

            .cachina-diff-bottom-icon.orange {
                color: #f97316;
            }

            .cachina-diff-bottom-icon.purple {
                color: #a855f7;
            }

            .cachina-diff-bottom-title {
                font-size: 17px;
                font-weight: 700;
                margin: 0 0 6px 0;
                color: white;
            }

            .cachina-diff-bottom-title.cyan {
                color: #06b6d4;
            }

            .cachina-diff-bottom-title.green {
                color: #10b981;
            }

            .cachina-diff-bottom-title.orange {
                color: #f97316;
            }

            .cachina-diff-bottom-title.purple {
                color: #a855f7;
            }

            .cachina-diff-bottom-text {
                font-size: 13px;
                color: #d1d5db;
                margin: 0;
            }

            .cachina-diff-pagination {
                position: absolute;
                bottom: 24px;
                right: 24px;
                color: #9ca3af;
                font-size: 14px;
                background: rgba(0, 0, 0, 0.3);
                padding: 8px 16px;
                border-radius: 20px;
            }

            @media (max-width: 1024px) {
                .cachina-diff-slide {
                    padding: 60px 32px 80px 32px;
                }
                .cachina-diff-main-grid {
                    grid-template-columns: 1fr;
                }
                .cachina-diff-bottom-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        </style>

        <div class="cachina-diff-slide">
            <img src="./icons/cachina-logoo.png" alt="Cachina Logo" class="cachina-diff-logo">

            <div class="cachina-diff-container">
                <!-- Header -->
                <div class="cachina-diff-header">
                    <h1 class="cachina-diff-title">
                        <svg class="cachina-diff-icon-medal" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                        </svg>
                        Nossos <span class="cachina-diff-title-highlight">Diferenciais</span>
                    </h1>
                </div>

                <!-- Main Cards -->
                <div class="cachina-diff-main-grid">
                    <!-- Card 1: Ecossistema Completo -->
                    <div class="cachina-diff-card">
                        <div class="cachina-diff-icon-wrapper blue">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <h3 class="cachina-diff-card-title">Ecossistema Completo</h3>
                        <p class="cachina-diff-card-subtitle">Estratégia + Operação + Produtos</p>
                        <div class="cachina-diff-features">
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Soluções integradas end-to-end</span>
                            </div>
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Consultoria estratégica + implementação</span>
                            </div>
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Produtos próprios + terceiros</span>
                            </div>
                        </div>
                    </div>

                    <!-- Card 2: Atendimento Consultivo -->
                    <div class="cachina-diff-card">
                        <div class="cachina-diff-icon-wrapper green">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                        </div>
                        <h3 class="cachina-diff-card-title">Atendimento Consultivo</h3>
                        <p class="cachina-diff-card-subtitle">Experiência Comprovada em Diferentes Mercados</p>
                        <div class="cachina-diff-features">
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Análise personalizada de necessidades</span>
                            </div>
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Consultoria especializada por setor</span>
                            </div>
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Acompanhamento contínuo e estratégico</span>
                            </div>
                        </div>
                    </div>

                    <!-- Card 3: Soluções Escaláveis -->
                    <div class="cachina-diff-card">
                        <div class="cachina-diff-icon-wrapper orange">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                            </svg>
                        </div>
                        <h3 class="cachina-diff-card-title">Soluções Escaláveis</h3>
                        <p class="cachina-diff-card-subtitle">Para Pequenas, Médias e Grandes Empresas</p>
                        <div class="cachina-diff-features">
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Arquitetura flexível e modular</span>
                            </div>
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Crescimento orgânico com a empresa</span>
                            </div>
                            <div class="cachina-diff-feature-item">
                                <svg class="cachina-diff-check-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                                </svg>
                                <span>Investimento proporcional ao tamanho</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Row -->
                <div class="cachina-diff-bottom-grid">
                    <div class="cachina-diff-bottom-item">
                        <svg class="cachina-diff-bottom-icon cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <h4 class="cachina-diff-bottom-title cyan">Qualidade</h4>
                        <p class="cachina-diff-bottom-text">Profissionais qualificados</p>
                    </div>

                    <div class="cachina-diff-bottom-item">
                        <svg class="cachina-diff-bottom-icon green" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                        <h4 class="cachina-diff-bottom-title green">Agilidade</h4>
                        <p class="cachina-diff-bottom-text">Implementação rápida</p>
                    </div>

                    <div class="cachina-diff-bottom-item">
                        <svg class="cachina-diff-bottom-icon orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <h4 class="cachina-diff-bottom-title orange">Segurança</h4>
                        <p class="cachina-diff-bottom-text">LGPD</p>
                    </div>

                    <div class="cachina-diff-bottom-item">
                        <svg class="cachina-diff-bottom-icon purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                        <h4 class="cachina-diff-bottom-title purple">Suporte</h4>
                        <p class="cachina-diff-bottom-text">humanizado</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Process Slide
// ==========================================
// PROCESS SLIDE - MOBILE SCROLL OPTIMIZED
// ==========================================

function processSlide() {
  return `
        <style>
            .cachina-process-slide {
                height: 100%;
                width: 100%;
                background: linear-gradient(135deg, #1e4a7a 0%, #2d6ba8 50%, #1e4a7a 100%);
                display: flex;
                align-items: center;
                position: relative;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 80px 48px 100px 48px;
                box-sizing: border-box;
            }

            .cachina-process-logo {
                position: absolute;
                top: 20px;
                left: 20px;
                height: 32px;
                z-index: 20;
            }

            .cachina-process-check-icon {
                position: absolute;
                top: 60px;
                right: 60px;
                width: 24px;
                height: 24px;
                color: #10b981;
                opacity: 0.2;
            }

            .cachina-process-clock-icon {
                position: absolute;
                bottom: 140px;
                left: 40px;
                width: 32px;
                height: 32px;
                color: #3b82f6;
                opacity: 0.15;
            }

            .cachina-process-container {
                max-width: 1200px;
                margin: 0 auto;
                width: 100%;
            }

            .cachina-process-header {
                text-align: center;
                margin-bottom: 40px;
            }

            .cachina-process-header-line {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 12px;
            }

            .cachina-process-line-left,
            .cachina-process-line-right {
                width: 24px;
                height: 3px;
                background: linear-gradient(to right, transparent, #38bdf8);
                border-radius: 2px;
            }

            .cachina-process-line-right {
                background: linear-gradient(to left, transparent, #38bdf8);
            }

            .cachina-process-zap-icon {
                width: 20px;
                height: 20px;
                color: #38bdf8;
            }

            .cachina-process-title {
                font-size: 42px;
                font-weight: 700;
                margin: 0 0 12px 0;
                color: white;
            }

            .cachina-process-title-highlight {
                background: linear-gradient(90deg,rgb(37, 13, 94),rgb(37, 13, 94));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .cachina-process-subtitle {
                font-size: 16px;
                color: #d1d5db;
                margin: 0;
            }

            .cachina-process-timeline {
                position: relative;
                margin-bottom: 40px;
            }

            .cachina-process-timeline-line {
                position: absolute;
                top: 40px;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(to right, #3b82f6, #8b5cf6, #f97316, #10b981);
                opacity: 0.3;
                border-radius: 2px;
            }

            .cachina-process-steps {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 24px;
                position: relative;
            }

            .cachina-process-step {
                position: relative;
            }

            .cachina-process-step-number {
                position: absolute;
                top: 24px;
                left: 50%;
                transform: translateX(-50%);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 14px;
                color: white;
                z-index: 10;
                border: 3px solid #1a2332;
            }

            .cachina-process-step-number.blue {
                background: linear-gradient(135deg, #3b82f6, #38bdf8);
            }

            .cachina-process-step-number.purple {
                background: linear-gradient(135deg, #8b5cf6, #6366f1);
            }

            .cachina-process-step-number.orange {
                background: linear-gradient(135deg, #f97316, #fb923c);
            }

            .cachina-process-step-number.green {
                background: linear-gradient(135deg, #10b981, #14b8a6);
            }

            .cachina-process-card {
                margin-top: 64px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 24px 16px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                min-height: 180px;
            }

            .cachina-process-badge {
                position: absolute;
                top: -8px;
                right: 12px;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
                color: white;
            }

            .cachina-process-badge.blue {
                background: linear-gradient(90deg, #3b82f6, #38bdf8);
            }

            .cachina-process-badge.purple {
                background: linear-gradient(90deg, #8b5cf6, #6366f1);
            }

            .cachina-process-badge.orange {
                background: linear-gradient(90deg, #f97316, #fb923c);
            }

            .cachina-process-badge.green {
                background: linear-gradient(90deg, #10b981, #14b8a6);
            }

            .cachina-process-icon-wrapper {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 12px;
            }

            .cachina-process-icon-wrapper.blue {
                background: linear-gradient(135deg, #3b82f6, #38bdf8);
            }

            .cachina-process-icon-wrapper.purple {
                background: linear-gradient(135deg, #8b5cf6, #6366f1);
            }

            .cachina-process-icon-wrapper.orange {
                background: linear-gradient(135deg, #f97316, #fb923c);
            }

            .cachina-process-icon-wrapper.green {
                background: linear-gradient(135deg, #10b981, #14b8a6);
            }

            .cachina-process-icon-wrapper svg {
                width: 20px;
                height: 20px;
                color: white;
            }

            .cachina-process-card-title {
                font-size: 13px;
                font-weight: 700;
                margin: 0 0 8px 0;
                color: white;
                letter-spacing: 0.5px;
            }

            .cachina-process-card-text {
                font-size: 12px;
                color: #d1d5db;
                margin: 0 0 6px 0;
                line-height: 1.4;
            }

            .cachina-process-card-subtext {
                font-size: 11px;
                color: #9ca3af;
                margin: 0;
                line-height: 1.3;
            }

            .cachina-process-arrow {
                position: absolute;
                right: -12px;
                top: 50%;
                transform: translateY(-50%);
                width: 24px;
                height: 24px;
                background: #1f2937;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #374151;
                z-index: 5;
            }

            .cachina-process-arrow svg {
                width: 12px;
                height: 12px;
                color: #6b7280;
            }

            .cachina-process-support {
                max-width: 500px;
                margin: 0 auto;
                position: relative;
            }

            .cachina-process-support-card {
                background: rgba(16, 185, 129, 0.15);
                border-radius: 12px;
                padding: 28px 24px;
                text-align: center;
                border: 1px solid rgba(16, 185, 129, 0.3);
                position: relative;
            }

            .cachina-process-support-icons {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .cachina-process-infinity {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #10b981, #14b8a6);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: 700;
                color: white;
            }

            .cachina-process-target-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #10b981, #14b8a6);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .cachina-process-target-icon svg {
                width: 20px;
                height: 20px;
                color: white;
            }

            .cachina-process-support-badge {
                display: inline-block;
                background: linear-gradient(90deg, #10b981, #14b8a6);
                padding: 6px 16px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 700;
                color: white;
                margin-bottom: 12px;
            }

            .cachina-process-support-title {
                font-size: 18px;
                font-weight: 700;
                color: #10b981;
                margin: 0 0 10px 0;
            }

            .cachina-process-support-text {
                font-size: 12px;
                color: #d1d5db;
                margin: 0 0 6px 0;
            }

            .cachina-process-support-subtext {
                font-size: 11px;
                color: #9ca3af;
                margin: 0;
            }

            .cachina-process-pagination {
                position: absolute;
                bottom: 24px;
                right: 24px;
                color: #9ca3af;
                font-size: 14px;
                background: rgba(0, 0, 0, 0.3);
                padding: 8px 16px;
                border-radius: 20px;
            }

            @media (max-width: 1024px) {
                .cachina-process-steps {
                    grid-template-columns: 1fr;
                }
                .cachina-process-timeline-line {
                    display: none;
                }
                .cachina-process-arrow {
                    display: none;
                }
                
                .cachina-process-slide {
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    height: 100vh;
                    max-height: 100vh;
                    padding: 60px 24px 80px 24px;
                }
            }
        </style>

        <div class="cachina-process-slide process-slide">
            <img src="./icons/cachina-logoo.png" alt="Cachina Logo" class="cachina-process-logo">

            <!-- Decorative Icons -->
            <svg class="cachina-process-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>

            <svg class="cachina-process-clock-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>

            <div class="cachina-process-container">
                <!-- Header -->
                <div class="cachina-process-header">
                    <div class="cachina-process-header-line">
                        <div class="cachina-process-line-left"></div>
                        <svg class="cachina-process-zap-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                        </svg>
                        <div class="cachina-process-line-right"></div>
                    </div>
                    <h1 class="cachina-process-title">Sua <span class="cachina-process-title-highlight">Jornada</span> Conosco</h1>
                    <p class="cachina-process-subtitle">Um processo transparente e estruturado para transformar sua TI</p>
                </div>

                <!-- Timeline -->
                <div class="cachina-process-timeline">
                    <div class="cachina-process-timeline-line"></div>
                    
                    <div class="cachina-process-steps">
                        <!-- Step 1 -->
                        <div class="cachina-process-step">
                            <div class="cachina-process-step-number blue">1</div>
                            <div class="cachina-process-card">
                                <div class="cachina-process-badge blue">15 min</div>
                                <div class="cachina-process-icon-wrapper blue">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                </div>
                                <h3 class="cachina-process-card-title">PRIMEIRO CONTATO</h3>
                                <p class="cachina-process-card-text">Conversa inicial via WhatsApp ou telefone</p>
                                <p class="cachina-process-card-subtext">Entendimento da dor e necessidades</p>
                                <div class="cachina-process-arrow">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Step 2 -->
                        <div class="cachina-process-step">
                            <div class="cachina-process-step-number purple">2</div>
                            <div class="cachina-process-card">
                                <div class="cachina-process-badge purple">2-3 dias</div>
                                <div class="cachina-process-icon-wrapper purple">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.3-4.3"></path>
                                    </svg>
                                </div>
                                <h3 class="cachina-process-card-title">DIAGNÓSTICO GRATUITO</h3>
                                <p class="cachina-process-card-text">Assessment completo da sua TI atual</p>
                                <p class="cachina-process-card-subtext">Mapeamento de oportunidades</p>
                                <div class="cachina-process-arrow">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3 -->
                        <div class="cachina-process-step">
                            <div class="cachina-process-step-number orange">3</div>
                            <div class="cachina-process-card">
                                <div class="cachina-process-badge orange">1-2 dias</div>
                                <div class="cachina-process-icon-wrapper orange">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>
                                    </svg>
                                </div>
                                <h3 class="cachina-process-card-title">PROPOSTA PERSONALIZADA</h3>
                                <p class="cachina-process-card-text">Solução sob medida para seu negócio</p>
                                <p class="cachina-process-card-subtext">Cronograma e investimento detalhados</p>
                                <div class="cachina-process-arrow">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Step 4 -->
                        <div class="cachina-process-step">
                            <div class="cachina-process-step-number green">4</div>
                            <div class="cachina-process-card">
                                <div class="cachina-process-badge green">2-8 semanas</div>
                                <div class="cachina-process-icon-wrapper green">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                                    </svg>
                                </div>
                                <h3 class="cachina-process-card-title">IMPLEMENTAÇÃO</h3>
                                <p class="cachina-process-card-text">Metodologia ágil e transparente</p>
                                <p class="cachina-process-card-subtext">Acompanhamento semanal de progresso</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Support Section -->
                <div class="cachina-process-support">
                    <div class="cachina-process-support-card">
                        <div class="cachina-process-support-icons">
                            <div class="cachina-process-infinity">∞</div>
                            <div class="cachina-process-target-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="6"></circle>
                                    <circle cx="12" cy="12" r="2"></circle>
                                </svg>
                            </div>
                        </div>
                        <div class="cachina-process-support-badge">SUPORTE CONTÍNUO</div>
                        <h3 class="cachina-process-support-title">Parceria de Longo Prazo</h3>
                        <p class="cachina-process-support-text">Monitoramento 24/7 e suporte especializado</p>
                        <p class="cachina-process-support-subtext">Evolução constante da sua solução tecnológica</p>
                    </div>
                </div>
            </div>

            <div class="cachina-process-pagination">15 / 16</div>
        </div>
    `;
}
