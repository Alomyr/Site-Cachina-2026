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
  { id: 9, title: "Agente de IA", component: "customSoftwareSlide" },
  { id: 11, title: "CloudBox/VDI", component: "cloudBoxSlide" },
  { id: 12, title: "Gestão de TI", component: "aiAgentSlide" },
  { id: 9, title: "Agente de IA", component: "aboutUsSlide" },
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
//slide 01
function coverSlide() {
  return `
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">

<div class="slide-01-container">
    <div class="slide-01-left">

        
        <div class="experience-box">
            <span class="year">20+</span>
        </div>
        <div class=slide-01-left>
        <span class="subtitle">ANOS DE EXPERIÊNCIA</span>
        </div>
    </div>
    
    <div class="slide-01-center">
         <h1 class="title">
            INSPIRE O FUTURO DA SUA 
            <span>EMPRESA</span>

        </h1>
        <p class="subtitle">Cachina - Soluções em Tecnologia</p>

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
<div class="test-area">
    <a href="linknabio.html" class="btn-test-link" target="_blank">
        <i class="fas fa-external-link-alt"></i>
        Contatos
    </a>
</div>
    <div class="slide-01-footer">
        <span>PAGE : 1</span>
        <span>CACHINA PRESENTATION TEMPLATE</span>
        <span>BUSINESS_2026</span>
    </div>
</div>
 `;
}

//slide 02
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

// slide 03
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
                Somos uma <strong>holding de inovação</strong> que conecta <span>estratégia, operação</span> e 
                <span>produtos digitais</span> para empresas que buscam crescer com <strong>eficiência, segurança e escalabilidade</strong>.
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
// slide 04
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
            eficiência Gestão e TI que aumentam vendas e reduzem custos.
          </p>
        </div>
        <div class="eco-tag">OPERAÇÃO</div>
      </div>

      <div class="eco-card">
        <img src="./icons/automafacil.png" class="company-logo-small" />
      <div class="eco-body">
          <h3>Cachina Automações</h3>
          <p>
            Estratégia e inovação para novos modelos de negócios e holdings.
          </p>
        </div>
        <div class="eco-tag">ESTRATÉGIA</div>
      </div>

      <div class="eco-card">
        <img src="./icons/devfacil.png" class="company-logo-small" />
      <div class="eco-body">
          <h3>Cachina System</h3>
          <p>
          "Software Sob Medida para Operações"
          Transformamos Sua Ideia em Sistema Real 
          </p>
        </div>
        <div class="eco-tag">SISTEMA</div>
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

// slide 05
function howWeHelpSlide() {
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
//slide 06
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

// slide 07
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

//slide08
function customSoftwareSlide() {
  return `<div class="slide-assessment-container">
    <div class="assessment-header">
        <h1 class="assessment-title"><span>Consultoria</span> e  <span>Assessment</span> <br>struturado</h1>
        <p class="assessment-subtitle">
            Analisamos os principais pilares que sustentam a operação, segurança e eficiência do seu ambiente tecnológico.
        </p>
    </div>

    <div class="assessment-grid">
        <div class="assessment-card">
            <div class="card-icon">⚖️</div>
            <h3>Governança de TI</h3>
            <p>Avaliação da organização, papéis, responsabilidades e alinhamento com os objetivos do negócio.</p>
        </div>

        <div class="assessment-card">
            <div class="card-icon">🚀</div>
            <h3>Projetos e Demandas</h3>
            <p>Análise de como as demandas são priorizadas e a maturidade na condução de projetos.</p>
        </div>

        <div class="assessment-card">
            <div class="card-icon">⚙️</div>
            <h3>Suporte a Sistemas</h3>
            <p>Avaliação da sustentação, fluxos de atendimento e tratamento de incidentes.</p>
        </div>

        <div class="assessment-card">
            <div class="card-icon">💻</div>
            <h3>Endpoints</h3>
            <p>Verificação de equipamentos de ponta, padronização, performance e segurança.</p>
        </div>

        <div class="assessment-card">
            <div class="card-icon">☁️</div>
            <h3>Backup</h3>
            <p>Análise das rotinas de backup, retenção e capacidade de recuperação em desastres.</p>
        </div>

        <div class="assessment-card">
            <div class="card-icon">💾</div>
            <h3>Servidores e Storage</h3>
            <p>Avaliação de processamento, armazenamento e disponibilidade do ambiente atual.</p>
        </div>

        <div class="assessment-card">
            <div class="card-icon">🌐</div>
            <h3>Redes</h3>
            <p>Mapeamento de infraestrutura, conectividade e pontos de vulnerabilidade.</p>
        </div>

        <div class="assessment-card">
            <div class="card-icon">📊</div>
            <h3>Inteligência de Dados</h3>
            <p>Uso estratégico das informações para apoio à operação e tomada de decisão.</p>
        </div>

        <div class="assessment-card">
            <div class="card-icon">📜</div>
            <h3>Contratos e Compliance</h3>
            <p>Análise de contratos vigentes, fornecedores e aderência às boas práticas.</p>
        </div>
    </div>

    <div class="slide-01-footer">
        <span>PAGE : 4</span>
        <span>CACHINA CONSULTORIA</span>
        <span>BUSINESS_2026</span>
    </div>
</div>
`;
}
//slide09
function cloudBoxSlide() {
  return `
<div class="slide-cloudbox-container">
    <div class="cloudbox-header">
        <div class="cloudbox-logo-top">☁️ CloudBox</div>
        <h1 class="cloudbox-title">CloudBox <span>Cachina</span></h1>
        <p class="cloudbox-tagline">Inovação é o nosso DNA</p>
    </div>

    <div class="cloudbox-grid">
        
        <div class="cloudbox-card">
            <div class="card-img-placeholder">
                <img src="./icons/cloudbox.png" alt="Dispositivo CloudBox">
            </div>
            <h3>O que é a CloudBox?</h3>
            <p>Solução de virtualização que substitui computadores convencionais, conectando usuários a ambientes em nuvem com alto desempenho.</p>
        </div>

        <div class="cloudbox-card">
            <div class="icon-header">⚙️</div>
            <h3>Problemas que Resolvemos</h3>
            <ul class="cloud-list">
                <li><span>✓</span> Baixo desempenho</li>
                <li><span>✓</span> Obsolescência</li>
                <li><span>✓</span> Segurança (Ransomware)</li>
                <li><span>✓</span> Alto consumo de energia</li>
            </ul>
        </div>

        <div class="cloudbox-card">
            <div class="icon-header">⚡</div>
            <h3>Benefícios</h3>
            <div class="benefits-mini-grid">
                <div class="benefit-tag">Dados Protegidos</div>
                <div class="benefit-tag">Economia</div>
                <div class="benefit-tag">Alta Disponibilidade</div>
                <div class="benefit-tag">Sustentável</div>
            </div>
        </div>

        <div class="cloudbox-card">
            <div class="icon-header">👥</div>
            <h3>Público-Alvo</h3>
            <div class="target-list">
                <div class="target-item">Escritórios</div>
                <div class="target-item">Lojas e Comércios</div>
                <div class="target-item">Home Offices</div>
                <div class="target-item">Escolas e Call Centers</div>
            </div>
        </div>
    </div>

    <div class="economy-badge">
        🌐 Até 90% de economia energética
    </div>

    <div class="economys-badge">
                <img src="./icons/cachinacloudbox.png" alt="Dispositivo CloudBox">
    </div>



    <div class="slide-01-footer">
        <span>PAGE : 10</span>
        <span>CACHINA CLOUD SOLUTIONS</span>
        <span>BUSINESS_2026</span>
    </div>
</div>
    `;
}
function aboutUsSlide() {
  return `
     <div class="slide-devfacil-container">
    <div class="dev-content-wrapper">
        
        <div class="dev-info-section">
            <div class="dev-header">
                <span class="dev-badge"><img src="./icons/devfacil.png" alt="Logo devfacil"></span>
                <h1 class="dev-main-title">Software Sob <span>Medida</span></h1>
                <p class="dev-tagline">Transformamos sua ideia em sistemas reais de alta performance.</p>
            </div>

            <div class="dev-services-list">
                <div class="service-item"><span>🌐</span> Sites & Landing Pages Responsivas</div>
                <div class="service-item"><span>📱</span> Apps Mobile Nativos e Híbridos</div>
                <div class="service-item"><span>🛡️</span> Sistemas Web Seguros e Escaláveis</div>
                <div class="service-item"><span>⚙️</span> Integrações com ERPs e APIs</div>
                <div class="service-item"><span>🤖</span> Automação de Processos Únicos</div>
            </div>
        </div>

        <div class="dev-methodology-section">
            <div class="methodology-card-v2">
                <span class="method-label">NOSSA METODOLOGIA</span>
                
                <div class="steps-container">
                    <div class="method-step">
                        <div class="step-num">1</div>
                        <div class="step-text"><strong>DIAGNÓSTICO</strong><p>Entendemos sua dor real</p></div>
                    </div>
                    <div class="method-step">
                        <div class="step-num">2</div>
                        <div class="step-text"><strong>PROTOTIPAGEM</strong><p>Validamos a solução</p></div>
                    </div>
                    <div class="method-step">
                        <div class="step-num">3</div>
                        <div class="step-text"><strong>DESENVOLVIMENTO</strong><p>Ágil e transparente</p></div>
                    </div>
                    <div class="method-step">
                        <div class="step-num">4</div>
                        <div class="step-text"><strong>DEPLOY</strong><p>Implementação sem estresse</p></div>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <div class="slide-01-footer">
        <span>PAGE : 12</span>
        <span>CACHINA DEV SOLUTIONS</span>
        <span>BUSINESS_2026</span>
    </div>
</div>
    `;
}
//slide10
function aiAgentSlide() {
  return `
<div class="slide-ia-v3-container">

    <div class="economys-badge">
                <img src="./icons/automafacil.png" alt="Dispositivo CloudBox">
    </div>
    <div class="ia-header-v3">
        <h1 class="ia-title-v3">Agente de IA <span>Omnicanal</span></h1>
        <p class="ia-subtitle-v3">Atendimento 24/7 que qualifica e vende enquanto você dorme.</p>
    </div>

    <div class="ia-workflow-v3">
        <div class="workflow-card-v3">
                <span class="ia-badge-v3">🤖 Automação Inteligente, COMO FUNCIONA:</span>
            <div class="workflow-view">
                <img src="./icons/ai-workflow.png" alt="Fluxo de IA">
            </div>
            <p class="workflow-footer-text">Fluxo inteligente que conecta múltiplas plataformas e automatiza processos complexos.</p>
        </div>
    </div>

    <div class="ia-benefits-grid-v3">
        <div class="b-card">
            <span class="b-icon">💬</span>
            <h4>Resposta Instantânea</h4>
            <p>WhatsApp, Instagram e Site.</p>
        </div>
        <div class="b-card">
            <span class="b-icon">📈</span>
            <h4>+300% Conversão</h4>
            <p>Leads qualificados.</p>
        </div>
        <div class="b-card">
            <span class="b-icon">🎯</span>
            <h4>Qualificação</h4>
            <p>Filtra para o comercial.</p>
        </div>
        <div class="b-card">
            <span class="b-icon">💰</span>
            <h4>Redução de 70%</h4>
            <p>No custo de atendimento.</p>
        </div>
    </div>

    <div class="slide-01-footer">
        <span>PAGE : 10</span>
        <span>CACHINA AGENTE IA</span>
        <span>BUSINESS_2026</span>
    </div>
</div>      `;
}

// slide 13
function clientsSlide() {
  return `
<div class="slide-13-container active">
  
  <div class="slide-13-left">
    <h1 class="title">Alguns de nossos <span>Clientes</span></h1>
    <p class="subtitle">
      Empresas que confiam na nossa expertise para evoluir digitalmente.
    </p>

    <div class="experience-box">
      <div class="year">100+</div>
      <p class="desc-text">
        Projetos entregues com sucesso em diversos setores.
      </p>
    </div>
  </div>

<div class="slide-13-center">
  <div class="logo-slider-s13"> <div class="logo-track-s13"> <div class="logo-item-s13"><img src="icons/logos/Dropped Image (2).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image.png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (3).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (4).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (5).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (6).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (7).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (8).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (9).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (10).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (11).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (12).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (13).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (14).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/202007170114_GQUy_.avif" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/WhatsApp Image 2026-03-25 at 10.21.33 AM.jpeg" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/WhatsApp_Image_2026-03-24_at_7.55.22_AM-removebg-preview.png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/logoviva.png" alt=""></div>


      <div class="logo-item-s13"><img src="icons/logos/Dropped Image.png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (3).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (4).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (5).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (6).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (7).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (8).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (9).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (10).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (11).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (12).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (13).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/Dropped Image (14).png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/202007170114_GQUy_.avif" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/WhatsApp Image 2026-03-25 at 10.21.33 AM.jpeg" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/WhatsApp_Image_2026-03-24_at_7.55.22_AM-removebg-preview.png" alt=""></div>
      <div class="logo-item-s13"><img src="icons/logos/logoviva.png" alt=""></div>
      
    </div>
  </div>
</div>

  <div class="slide-13-right">
    <div class="branding-wrapper">
      <img src="./icons/cachina-logoo.png" class="company-logo" alt="Cachina Logo" />
      
      <div class="quote-box">
        <p>
          "Parcerias sólidas são construídas com transparência, tecnologia de
          ponta e foco total no resultado do cliente."
        </p>
      </div>
    </div>
  </div>

  <footer class="slide-01-footer">
    <div class="footer-info">
      <span>PAGE : 13</span>
      <span class="separator">|</span>
      <span>CACHINA PRESENTATION TEMPLATE</span>
      <span class="separator">|</span>
      <span>CUSTOMERS_2026</span>
    </div>
  </footer>
</div>
    `;
}

//slide 14
function differentialsSlide() {
  return `
  <div class="slide-14-container">
  <div class="slide-14-left">
    <div class="award-icon">🏆</div>
    <h1 class="title">Nossos <span>Diferenciais</span></h1>
    <p class="subtitle">O que nos torna o parceiro ideal para sua jornada digital.</p>
    
    <div class="highlights-mini">
      <div class="mini-item"><span>👥</span> Qualidade</div>
      <div class="mini-item"><span>⚡</span> Agilidade</div>
      <div class="mini-item"><span>🛡️</span> Segurança</div>
      <div class="mini-item"><span>🌐</span> Suporte</div>
    </div>
  </div>

  <div class="slide-14-center">
    <div class="feature-stack">
      
      <div class="feature-card">
        <div class="card-icon blue">📄</div>
        <div class="card-content">
          <h3>Ecossistema Completo</h3>
          <p>Estratégia + Operação + Produtos com soluções integradas end-to-end.</p>
        </div>
      </div>

      <div class="feature-card">
        <div class="card-icon green">📍</div>
        <div class="card-content">
          <h3>Atendimento Consultivo</h3>
          <p>Análise personalizada por setor com acompanhamento contínuo.</p>
        </div>
      </div>

      <div class="feature-card">
        <div class="card-icon orange">⚖️</div>
        <div class="card-content">
          <h3>Soluções Escaláveis</h3>
          <p>Arquitetura modular com investimento proporcional ao tamanho da empresa.</p>
        </div>
      </div>

    </div>
  </div>

  <div class="slide-14-right">
    <img src="./icons/cachina-logoo.png" class="company-logo" alt="Cachina Logo" />
    
    <div class="quote-box check-list-box">
      <h4 class="list-title">DIFERENCIAIS CACHINA</h4>
      <ul class="check-list">
        <li>✓ Equipe especializada em múltiplas tecnologias</li>
        <li>✓ Metodologia própria validada</li>
        <li>✓ Acompanhamento pós-implementação</li>
        <li>✓ ROI comprovado em todos os projetos</li>
      </ul>
    </div>
  </div>

  <div class="slide-01-footer">
    <span>PAGE : 14</span>
    <span>CACHINA PRESENTATION TEMPLATE</span>
    <span>DIFFERENTIALS_2026</span>
  </div>
</div>
         `;
}

// slide 15
function processSlide() {
  return `
  <div class="slide-15-container">
  <div class="slide-15-left">
    <div class="journey-icon">⚡</div>
    <h1 class="title">Sua <span>Jornada</span> Conosco</h1>
    <p class="subtitle">Um processo transparente e estruturado para transformar sua TI.</p>
    
    <div class="support-badge">
      <span class="badge-icon">♾️</span>
      <div class="badge-text">
        <strong>Suporte Contínuo</strong>
        <p>Parceria de longo prazo com monitoramento 24/7.</p>
      </div>
    </div>
  </div>

  <div class="slide-15-center">
    <div class="timeline-wrapper">
      <div class="timeline-line"></div>
      
      <div class="timeline-grid">
        <div class="step-card">
          <div class="step-number step-1">1</div>
          <div class="step-time">15 min</div>
          <div class="step-icon">📞</div>
          <h3>Primeiro Contato</h3>
          <p>Conversa inicial para entendimento de dores.</p>
        </div>

        <div class="step-card">
          <div class="step-number step-2">2</div>
          <div class="step-time">2-3 dias</div>
          <div class="step-icon">🔍</div>
          <h3>Diagnóstico</h3>
          <p>Assessment completo da sua TI atual.</p>
        </div>

        <div class="step-card">
          <div class="step-number step-3">3</div>
          <div class="step-time">1 dias</div>
          <div class="step-icon">📄</div>
          <h3>Proposta</h3>
          <p>Solução sob medida para o seu negócio.</p>
        </div>

        <div class="step-card">
          <div class="step-number step-4">4</div>
          <div class="step-time">2-8 sem</div>
          <div class="step-icon">🚀</div>
          <h3>Implementação</h3>
          <p>Metodologia ágil e transparente.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="slide-15-right">
    <img src="./icons/cachina-logoo.png" class="company-logo" alt="Cachina Logo" />
    <div class="quote-box">
      <p>"Nosso objetivo é garantir que sua tecnologia esteja pronta para o futuro, enquanto você foca no agora."</p>
    </div>
  </div>

  <div class="slide-01-footer">
    <span>PAGE : 15</span>
    <span>CACHINA PRESENTATION TEMPLATE</span>
    <span>JOURNEY_2026</span>
  </div>
</div>
           `;
}

//slide 16
function contactSlide() {
  return `
  
<div class="slide-contact-container">
  <div class="slide-contact-content">
    <div class="contact-header">
      <img src="./icons/cachina-logoo.png" class="company-logo-small" alt="Cachina Logo" />
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
              <span>comercial@cachina.com.br</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">📍</div>
            <div class="info-text">
              <label>Localização</label>
              <span>R. Jequitinhonha, 2929 - Neópolis, Natal - RN, 59088-210</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon">🌐</div>
            <div class="info-text">
              <label>Website</label>
              <span>www.cachina.com.br</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon"><i class="fa-brands fa-instagram"></i></div>
            <div class="info-text">
              <label>Instagram</label>
              <span>@canhinasolucoes</span>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon"><i class="fa-brands fa-linkedin"></i></div>
            <div class="info-text">
              <label>LinkedIn</label>
              <span>@Grupo Cachina</span>
            </div>
          </div>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-wrapper">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://alomyr.github.io/Apresentra-ao-nova/linknabio.html" alt="QR Code Contato" />
        </div>
        <p class="qr-label">Escaneie para salvar o contato</p>
      </div>
    </div>
  </div>

  <div class="test-area">
    <a href="linknabio.html" class="btn-test-link" target="_blank">
        <i class="fas fa-external-link-alt"></i>
        Contatos
    </a>
</div>

  <div class="slide-01-footer">
    <span>PAGE : 16</span> <span>CACHINA PRESENTATION TEMPLATE</span>
    <span>BUSINESS_2026</span>
  </div>
</div>

    `;
}
